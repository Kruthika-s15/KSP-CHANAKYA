import os
import re
import json
import logging
from datetime import date, datetime
from decimal import Decimal
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.schemas.chat import IntentSchema
from app.models import CaseMaster, CrimeSubHead, CrimeHead, District, Unit
from sqlalchemy.future import select

logger = logging.getLogger(__name__)


# --- JSON serializer for date/datetime/Decimal ---
def safe_json_serializer(obj):
    """Handle date, datetime, Decimal when dumping to JSON for Gemini prompts."""
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")


def safe_json_dumps(data) -> str:
    """json.dumps wrapper that handles date/datetime/Decimal."""
    return json.dumps(data, default=safe_json_serializer, ensure_ascii=False)


# --- Fallback heuristic logic (used when Gemini is unavailable) ---
def fallback_extract_intent(message: str) -> IntentSchema:
    msg_lower = message.lower()

    # Default to GENERAL_CONVERSATION — only promote to crime query on positive match
    intent = IntentSchema(is_crime_query=False, intent_category="GENERAL_CONVERSATION", intent_type="general_chat")

    # --- Biometric match detection (checked first — most specific intent) ---
    biometric_terms_en = ["biometric", "fingerprint", "finger print", "iris scan", "afis", "biometric id", "biometric ref"]
    biometric_terms_kn = ["ಬಯೋಮೆಟ್ರಿಕ್", "ಬೆರಳಚ್ಚು"]
    has_biometric_term = any(kw in msg_lower for kw in biometric_terms_en) or \
                          any(kw in message for kw in biometric_terms_kn)
    # Pull out a plausible reference id: an alphanumeric token near the biometric keyword
    biometric_id_match = re.search(r'(?:biometric|fingerprint|iris|afis|ref)[\w\s]{0,15}?(?:id|ref|no|number)?\s*[:#-]?\s*([A-Za-z0-9\-]{3,})', message, re.IGNORECASE)

    if has_biometric_term:
        intent = IntentSchema(is_crime_query=True, intent_category="BIOMETRIC_SEARCH", intent_type="search_biometric")
        if biometric_id_match:
            intent.biometric_ref_id = biometric_id_match.group(1)
        return intent

    # --- Positive crime-query detection ---
    # Domain nouns: specific enough to the police/crime domain that seeing
    # them at all is a strong signal, regardless of the rest of the sentence.
    crime_domain_terms_en = [
        "crime", "crimes", "case", "cases", "fir", "theft", "murder", "robbery",
        "assault", "vehicle theft", "cybercrime", "cyber crime", "fraud",
        "kidnap", "kidnapping", "arrested", "accused", "complainant", "offence",
        "offense", "hotspot", "bengaluru", "mysuru", "hubli",
    ]
    crime_domain_terms_kn = [
        "ಅಪರಾಧ", "ಪ್ರಕರಣ", "ಕಳ್ಳತನ", "ಕೊಲೆ", "ದರೋಡೆ",
        "ಸೈಬರ್", "ವಂಚನೆ", "ಬಂಧಿತ", "ಆರೋಪಿ", "ಸಂತ್ರಸ್ತ",
        "ಬೆಂಗಳೂರು", "ಮೈಸೂರು",
    ]

    # Follow-up phrases only make sense mid-investigation, so they're
    # treated the same as a domain term rather than a generic verb.
    followup_phrases_en = [
        "tell me more", "more cases", "like this", "second case", "first case",
    ]
    followup_phrases_kn = ["ಇನ್ನಷ್ಟು"]

    # NOTE: generic action words like "show me", "search", "find", "give me",
    # "report", "district", "police" are deliberately excluded from
    # triggering a crime query on their own — they're ordinary conversational
    # language ("find me a recipe", "give me some advice", "can you search
    # the web") and must NOT route to the crime database by themselves.

    has_domain_term = any(kw in msg_lower for kw in crime_domain_terms_en) or \
                       any(kw in message for kw in crime_domain_terms_kn)
    has_followup_phrase = any(kw in msg_lower for kw in followup_phrases_en) or \
                           any(kw in message for kw in followup_phrases_kn)

    has_crime_keyword = has_domain_term or has_followup_phrase

    # Check for specific case IDs
    case_match = re.search(r'(case|FIR|ಪ್ರಕರಣ)\s*(?:no|number)?\s*[:#-]?\s*(\d{7,})', msg_lower, re.IGNORECASE)

    if case_match:
        intent.is_crime_query = True
        intent.intent_category = "CASE_DETAILS"
        intent.intent_type = "get_case_details"
        intent.crime_no = case_match.group(2)
    elif has_crime_keyword:
        intent.is_crime_query = True
        intent.intent_category = "CRIME_SEARCH"
        intent.intent_type = "list_crimes"

        # Extract sub-filters only when we know it's a crime query
        if "vehicle" in msg_lower or "ವಾಹನ" in msg_lower:
            intent.crime_sub_head = "Vehicle Theft"
        if "bengaluru" in msg_lower or "ಬೆಂಗಳೂರು" in msg_lower:
            intent.district = "Bengaluru City"
        if "district" in msg_lower and "most" in msg_lower:
            intent.intent_type = "count_crimes"
            intent.intent_category = "CRIME_ANALYTICS"
            intent.analytics_group_by = "district"
        elif "category" in msg_lower and "most" in msg_lower:
            intent.intent_type = "count_crimes"
            intent.intent_category = "CRIME_ANALYTICS"
            intent.analytics_group_by = "category"
        elif "status" in msg_lower and ("most" in msg_lower or "breakdown" in msg_lower):
            intent.intent_type = "count_crimes"
            intent.intent_category = "CRIME_ANALYTICS"
            intent.analytics_group_by = "status"
    else:
        # No crime keywords — check for HELP, otherwise stays GENERAL_CONVERSATION
        if "help" in msg_lower or "what can you do" in msg_lower or "ಸಹಾಯ" in msg_lower or "ಏನು ಮಾಡಬಹುದು" in msg_lower:
            intent.intent_category = "HELP"

    return intent


def fallback_generate_reply(message: str, data: list, intent: IntentSchema) -> str:
    is_kannada = any('\u0C80' <= c <= '\u0CFF' for c in message)

    if intent.intent_type == "get_case_details":
        if not data:
            return "ಕ್ಷಮಿಸಿ, ಆ ಪ್ರಕರಣದ ಸಂಖ್ಯೆ ಕಂಡುಬಂದಿಲ್ಲ." if is_kannada else "Sorry, I could not find a case with that number."
        case = data[0]
        if is_kannada:
            return f"ಪ್ರಕರಣ {case.get('CrimeNo')} ({case.get('CrimeHead')}) ಬಗ್ಗೆ ಮಾಹಿತಿ. ಪ್ರಸ್ತುತ ಸ್ಥಿತಿ: {case.get('CaseStatus')}."
        return f"Here are the details for case {case.get('CrimeNo')}. The crime is categorized as {case.get('CrimeHead')}. Status: {case.get('CaseStatus')}."

    if not data:
        return "ಯಾವುದೇ ಮಾಹಿತಿಯಿಲ್ಲ." if is_kannada else "No matching cases found."

    if is_kannada:
        return f"ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ಸಂಬಂಧಿಸಿದ {len(data)} ಪ್ರಕರಣಗಳನ್ನು ನಾನು ಕಂಡುಕೊಂಡಿದ್ದೇನೆ. ಉದಾಹರಣೆಗೆ, {data[0].get('CrimeNo')} ಒಂದು {data[0].get('CrimeHead')} ಪ್ರಕರಣವಾಗಿದೆ."
    return f"I found {len(data)} cases matching your criteria. For example, case {data[0].get('CrimeNo')} is a {data[0].get('CrimeHead')} incident in {data[0].get('DistrictName')}."


# --- Main AI Service Class ---
class CrimeAIService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.has_llm = bool(self.api_key and self.api_key.strip())

        if self.has_llm:
            try:
                from google import genai
                from google.genai import types
                self.client = genai.Client(api_key=self.api_key)
                self.types = types
            except ImportError:
                logger.warning("google-genai not installed. Falling back to heuristic.")
                self.has_llm = False

    async def extract_intent(self, message: str, history: list = None) -> IntentSchema:
        if not self.has_llm:
            return fallback_extract_intent(message)

        try:
            # Build conversation context summary for follow-up detection
            history_context = ""
            if history:
                recent = history[-6:]  # last 3 exchanges
                history_context = "\n".join(
                    [f"{'User' if m.get('role') == 'user' else 'Assistant'}: {m.get('content', '')[:200]}" for m in recent]
                )
                history_context = f"\nRecent conversation history:\n{history_context}\n"

            prompt = f"""You are an intent classifier for the Karnataka State Police (KSP) Crime Intelligence Assistant.
This is primarily a CRIME INTELLIGENCE tool. Classify the user message into EXACTLY ONE intent_category.

Categories:
- CRIME_SEARCH: user wants to find, show, search, list, or retrieve crime cases/FIRs/police records. This includes requests like "show me recent cases", "give me case files", "find theft cases", etc.
- CRIME_ANALYTICS: user wants trends, statistics, counts, patterns, hotspots, comparisons of crime data. E.g. "which crime category has the most cases?"
- CASE_DETAILS: user asks about a specific FIR number or case number.
- INVESTIGATION_FOLLOWUP: user is asking about previously shown cases. E.g. "tell me more about the second case", "are there more cases like this?", "which one is the most serious?", "show me other cases".
- BIOMETRIC_SEARCH: user wants to match/search by a fingerprint, iris, photo, or other biometric reference ID, or asks whether an accused person is linked to (the same person as) an accused in another case file. E.g. "search fingerprint ID FP-1023", "is this accused linked to any other case?", "match biometric ref AX92".
- GENERAL_CONVERSATION: genuinely casual messages like greetings ("hello", "hi bro", "ನಮಸ್ಕಾರ"), self-introductions ("my name is X", "ನನ್ನ ಹೆಸರು X"), thanks ("thank you", "ಧನ್ಯವಾದಗಳು"), or asking what the bot can do.
- HELP: asking what the assistant can do or requesting guidance.
- SQL_QUERY: message is a raw SQL query.

RULES:
- Crime intelligence is the PRIMARY purpose. When in doubt between CRIME_SEARCH and GENERAL_CONVERSATION, prefer CRIME_SEARCH if the message has any crime/investigation/policing relevance.
- Only classify as GENERAL_CONVERSATION for genuinely casual non-crime messages.
- Set is_crime_query=true for CRIME_SEARCH, CRIME_ANALYTICS, CASE_DETAILS, INVESTIGATION_FOLLOWUP, BIOMETRIC_SEARCH.
- Set is_crime_query=false for GENERAL_CONVERSATION and HELP.
- For INVESTIGATION_FOLLOWUP, set is_crime_query=true.

Examples:
- "hello" -> GENERAL_CONVERSATION
- "hi bro" -> GENERAL_CONVERSATION
- "my name is Ramya" -> GENERAL_CONVERSATION
- "ನಮಸ್ಕಾರ" -> GENERAL_CONVERSATION
- "ಧನ್ಯವಾದಗಳು" -> GENERAL_CONVERSATION
- "what can you do?" -> HELP
- "show me recent cases" -> CRIME_SEARCH
- "give me recent case files" -> CRIME_SEARCH
- "find vehicle theft cases in Bengaluru" -> CRIME_SEARCH
- "ಬೆಂಗಳೂರುದಲ್ಲಿ ಇತ್ತೀಚಿನ ಪ್ರಕರಣಗಳನ್ನು ತೋರಿಸು" -> CRIME_SEARCH
- "which crime category has the most cases?" -> CRIME_ANALYTICS
- "which district has the most cases?" -> CRIME_ANALYTICS
- "tell me more about the second case" -> INVESTIGATION_FOLLOWUP
- "ಈ ಪ್ರಕರಣದ ಬಗ್ಗೆ ಇನ್ನಷ್ಟು ಹೇಳು" -> INVESTIGATION_FOLLOWUP
- "are there more cases like this?" -> INVESTIGATION_FOLLOWUP
- "search fingerprint ID FP-1023" -> BIOMETRIC_SEARCH
- "does this accused match anyone in another case file?" -> BIOMETRIC_SEARCH

If it IS a crime query, also extract search parameters:
- If they mention "vehicle theft" or "ವಾಹನ ಕಳ್ಳತನ", set crime_sub_head to "Vehicle Theft".
- If they mention "Bengaluru" or "ಬೆಂಗಳೂರು", set district to "Bengaluru City".
- For CRIME_ANALYTICS, set analytics_group_by to one of 'district', 'category', 'status', 'crime_head', or 'month' based on what they're asking to break down by (default 'district' if unclear).
- For BIOMETRIC_SEARCH, extract the biometric reference ID/code they mentioned into biometric_ref_id.
{history_context}
User message: "{message}"
"""

            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=self.types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=IntentSchema,
                    temperature=0.1
                ),
            )
            intent = IntentSchema.model_validate_json(response.text)

            # Map INVESTIGATION_FOLLOWUP to CRIME_SEARCH for routing (they both query DB)
            if intent.intent_category == "INVESTIGATION_FOLLOWUP":
                intent.intent_category = "CRIME_SEARCH"
                intent.is_crime_query = True

            return intent

        except Exception as e:
            logger.error(f"LLM Intent extraction failed: {e}")
            return fallback_extract_intent(message)

    async def generate_final_response(self, message: str, data: list, intent: IntentSchema, history: list = None) -> str:
        if not self.has_llm:
            return fallback_generate_reply(message, data, intent)

        try:
            # We only send limited data to avoid context limit
            context_data = [d.copy() for d in data[:5]]
            for d in context_data:
                # Remove large unneeded fields for the prompt
                d.pop("BriefFacts", None)

            # Build history context
            history_context = ""
            if history:
                recent = history[-6:]
                history_context = "\nRecent conversation:\n" + "\n".join(
                    [f"{'User' if m.get('role') == 'user' else 'Assistant'}: {m.get('content', '')[:300]}" for m in recent]
                ) + "\n"

            prompt = f"""You are a helpful and professional AI assistant for the Karnataka State Police (KSP) Crime Intelligence Platform.
The user asked a query (which may be in English or Kannada). You MUST reply in the EXACT SAME LANGUAGE that the user used.

User query: "{message}"
{history_context}
Database results (JSON): {safe_json_dumps(context_data)}
Total results fetched: {len(data)}

Instructions:
1. If the user asked in Kannada, reply fluently in Kannada. If English, use English.
2. Provide a helpful, concise summary of the data.
3. Explicitly reference Case/FIR numbers (CrimeNo) in your response as evidence.
4. If the database results are empty, politely state that no matching records were found.
5. If the user asked a follow-up question about previous cases, use the conversation history and current data to answer.
"""

            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
            )
            return response.text
        except Exception as e:
            logger.error(f"LLM Response generation failed: {e}")
            return fallback_generate_reply(message, data, intent)

    async def get_natural_response(self, message: str, db: AsyncSession, history: list = None) -> dict:
        intent = await self.extract_intent(message, history)

        if intent.intent_category in ["GENERAL_CONVERSATION", "HELP"]:
            if not self.has_llm:
                is_kannada = any('\u0C80' <= c <= '\u0CFF' for c in message)
                if intent.intent_category == "HELP":
                    reply = "ನಾನು KSP AI. ನಾನು ಅಪರಾಧ ಪ್ರಕರಣಗಳನ್ನು ಹುಡುಕಲು, FIR ವಿವರಗಳನ್ನು ನೋಡಲು, ಮತ್ತು ಅಪರಾಧ ವಿಶ್ಲೇಷಣೆ ಮಾಡಲು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ." if is_kannada else "I am KSP AI. I can help you search crime cases, view FIR details, and analyze crime data across Karnataka."
                else:
                    # Try to extract name from introduction
                    name = None
                    name_match_en = re.search(r'(?:my name is|i am|i\'m)\s+([A-Za-z\s]+)', message, re.IGNORECASE)
                    name_match_kn = re.search(r'(?:ನನ್ನ ಹೆಸರು|ನಾನು)\s+(.+?)[\.।\s]*$', message)
                    if name_match_en:
                        name = name_match_en.group(1).strip().rstrip('.')
                    elif name_match_kn:
                        name = name_match_kn.group(1).strip().rstrip('.')

                    if name and is_kannada:
                        reply = f"ನಮಸ್ಕಾರ {name}! ನಾನು KSP AI ಸಹಾಯಕ. ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?"
                    elif name:
                        reply = f"Hello {name}! I am the KSP AI Assistant. How can I help you today?"
                    elif is_kannada:
                        reply = "ನಮಸ್ಕಾರ! ನಾನು KSP AI ಸಹಾಯಕ. ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?"
                    else:
                        reply = "Hello! I am the KSP AI Assistant. How can I help you today?"
            else:
                try:
                    prompt = f"""You are a helpful AI assistant for the Karnataka State Police (KSP).
The user sent the following message: "{message}"
Reply naturally and conversationally. Do not query any database.
If the user introduces themselves, greet them by name.
If they ask for help, explain you can help search crime data, view FIR details, and analyze crime patterns.
If they say thanks, respond warmly.
Reply in the same language the user used (English or Kannada).
"""
                    response = self.client.models.generate_content(
                        model='gemini-2.5-flash',
                        contents=prompt,
                    )
                    reply = response.text
                except Exception as e:
                    logger.error(f"LLM conversational response failed: {e}")
                    reply = "Hello! I am KSP AI."

            return {
                "reply": reply,
                "references": [],
                "mode_used": "natural"
            }

        # --- Biometric match query: cross-case identity matching ---
        if intent.intent_category == "BIOMETRIC_SEARCH":
            return await self._handle_biometric_search(message, intent, db, history)

        # --- Crime analytics query: real aggregation, not a flat case list ---
        if intent.intent_category == "CRIME_ANALYTICS":
            return await self._handle_analytics(message, intent, db, history)

        # --- Crime query: execute against DB using existing models ---
        from app.api.v1.crimes import get_base_crime_query, row_to_dict

        query = get_base_crime_query()

        if intent.crime_no:
            query = query.filter((CaseMaster.CrimeNo == intent.crime_no) | (CaseMaster.CaseNo == intent.crime_no))
        if intent.crime_sub_head:
            query = query.filter(CrimeSubHead.CrimeHeadName.ilike(f"%{intent.crime_sub_head}%"))
        if intent.district:
            query = query.filter(District.DistrictName.ilike(f"%{intent.district}%"))

        query = query.limit(min(intent.limit or 10, 50))

        result = await db.execute(query)
        cases = [row_to_dict(row) for row in result.all()]

        reply = await self.generate_final_response(message, cases, intent, history)

        return {
            "reply": reply,
            "references": cases,
            "mode_used": "natural"
        }

    async def _handle_biometric_search(self, message: str, intent: IntentSchema, db: AsyncSession, history: list = None) -> dict:
        from app.api.v1.biometrics import _match_query, _row_to_hit
        from app.models import BiometricRecord

        is_kannada = any('\u0C80' <= c <= '\u0CFF' for c in message)

        if not intent.biometric_ref_id:
            reply = ("ದಯವಿಟ್ಟು ಹೊಂದಾಣಿಕೆ ಮಾಡಲು ಬಯೋಮೆಟ್ರಿಕ್ ಉಲ್ಲೇಖ ID ನೀಡಿ." if is_kannada
                     else "Please provide the biometric reference ID (e.g. a fingerprint or AFIS ID) you'd like to match.")
            return {"reply": reply, "references": [], "mode_used": "natural"}

        query = _match_query().filter(BiometricRecord.BiometricRefID == intent.biometric_ref_id)
        result = await db.execute(query)
        rows = result.all()
        matches = [_row_to_hit(row).model_dump() for row in rows]
        distinct_cases = len({m["CaseMasterID"] for m in matches})

        if self.has_llm:
            reply = await self.generate_final_response(message, matches, intent, history)
        elif not matches:
            reply = (f"'{intent.biometric_ref_id}' ಗೆ ಯಾವುದೇ ಬಯೋಮೆಟ್ರಿಕ್ ಹೊಂದಾಣಿಕೆ ಕಂಡುಬಂದಿಲ್ಲ." if is_kannada
                     else f"No biometric match found for reference '{intent.biometric_ref_id}'.")
        elif distinct_cases > 1:
            reply = (f"Match found! Biometric reference '{intent.biometric_ref_id}' appears in "
                     f"{distinct_cases} different case files across {len(matches)} accused records — "
                     f"this looks like the same person involved in multiple cases.")
        else:
            m = matches[0]
            reply = (f"Biometric reference '{intent.biometric_ref_id}' matches accused "
                     f"{m.get('AccusedName')} in case {m.get('CrimeNo')} ({m.get('CrimeHead')}). "
                     f"No links to other case files found yet.")

        return {
            "reply": reply,
            "references": matches,
            "mode_used": "biometric",
        }

    async def _handle_analytics(self, message: str, intent: IntentSchema, db: AsyncSession, history: list = None) -> dict:
        from app.api.v1.crimes import get_crime_analytics

        group_by = intent.analytics_group_by or "district"
        analytics = await get_crime_analytics(group_by=group_by, start_date=None, end_date=None, db=db)
        buckets = [b.model_dump() for b in analytics.buckets]

        if self.has_llm:
            reply = await self.generate_final_response(message, buckets, intent, history)
        elif buckets:
            top = buckets[0]
            reply = (f"Breakdown by {group_by}: {top['label']} leads with {top['count']} cases "
                     f"out of {analytics.total_cases} total. Top 5: " +
                     ", ".join(f"{b['label']} ({b['count']})" for b in buckets[:5]))
        else:
            reply = f"No case data available to break down by {group_by}."

        return {
            "reply": reply,
            "references": buckets,
            "mode_used": "analytics",
        }

    async def execute_investigator_sql(self, sql_query: str, db: AsyncSession) -> dict:
        # 1. Security validation
        sql_upper = sql_query.upper().strip()

        # Must start with SELECT or WITH
        if not (sql_upper.startswith("SELECT") or sql_upper.startswith("WITH")):
            raise ValueError("Only SELECT or WITH queries are allowed in Investigator Mode.")

        # Block dangerous keywords
        dangerous = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE", "GRANT", "REVOKE", "EXEC", "CREATE"]
        for word in dangerous:
            if re.search(rf"\b{word}\b", sql_upper):
                raise ValueError(f"Dangerous keyword '{word}' is not allowed.")

        # Block multiple statements (basic check)
        if ";" in sql_query and not sql_query.strip().endswith(";"):
            raise ValueError("Multiple SQL statements are not allowed.")

        # 2. Enforce limits
        if not re.search(r"\bLIMIT\b", sql_upper):
            sql_query = sql_query.rstrip(";") + " LIMIT 100"

        # 3. Execute safely
        try:
            result = await db.execute(text(sql_query))
            # Fetch dictionary representation
            rows = [dict(row._mapping) for row in result.all()]

            # Format simple explanation
            reply = f"Executed SQL query successfully. Returned {len(rows)} rows."
            if self.has_llm:
                prompt = f"The user executed this SQL: {sql_query}. It returned {len(rows)} rows. Give a very brief 1-sentence technical confirmation of what was fetched."
                try:
                    resp = self.client.models.generate_content(model='gemini-2.5-flash', contents=prompt)
                    reply = resp.text
                except:
                    pass

            return {
                "reply": reply,
                "references": rows,
                "mode_used": "sql"
            }
        except Exception as e:
            raise ValueError(f"Database Execution Error: {str(e)}")

ai_service = CrimeAIService()
