from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import hashlib
import json
import os
import time
import base64
import hmac

router = APIRouter(tags=["auth"])

USER_STORE_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "catalyst", "users.json")
_DEV_SECRET = b"ksp-catalyst-local-dev-secret-not-for-production"

class SignupRequest(BaseModel):
    fullName: str
    kgid: str
    station: str
    email: str
    password: str

class LoginRequest(BaseModel):
    identifier: str
    password: str

def _get_users() -> dict:
    if not os.path.exists(USER_STORE_PATH):
        return {}
    try:
        with open(USER_STORE_PATH, "r") as f:
            return json.load(f)
    except json.JSONDecodeError:
        return {}

def _save_users(users: dict):
    with open(USER_STORE_PATH, "w") as f:
        json.dump(users, f, indent=4)

def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def _sign(payload: dict) -> str:
    body = base64.urlsafe_b64encode(json.dumps(payload).encode()).rstrip(b"=")
    sig = hmac.new(_DEV_SECRET, body, hashlib.sha256).digest()
    sig_b64 = base64.urlsafe_b64encode(sig).rstrip(b"=")
    return f"{body.decode()}.{sig_b64.decode()}"

@router.post("/signup")
async def signup(payload: SignupRequest):
    users = _get_users()
    if payload.email in users or payload.kgid in users:
        raise HTTPException(status_code=400, detail="User with this email or KGID already exists")
    
    user_record = {
        "fullName": payload.fullName,
        "kgid": payload.kgid,
        "station": payload.station,
        "email": payload.email,
        "password_hash": _hash_password(payload.password)
    }
    
    # Dual lookup: users can login via email or KGID
    users[payload.email] = user_record
    users[payload.kgid] = user_record
    
    _save_users(users)
    return {"status": "success", "message": "User registered successfully."}

@router.post("/login")
async def login(payload: LoginRequest):
    users = _get_users()
    user = users.get(payload.identifier)
    
    if not user or user["password_hash"] != _hash_password(payload.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    token = _sign({
        "sub": user["kgid"],
        "name": user["fullName"],
        "iat": int(time.time()),
        "dev_only": True
    })
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "name": user["fullName"],
            "kgid": user["kgid"]
        }
    }
