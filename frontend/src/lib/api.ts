const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

function getHeaders(extraHeaders: Record<string, string> = {}) {
  const headers: Record<string, string> = { ...extraHeaders };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

export async function fetchCrimes(params: Record<string, any> = {}) {
  const url = new URL(`${API_BASE}/crimes`);
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      url.searchParams.append(key, String(params[key]));
    }
  });
  const res = await fetch(url.toString(), { cache: 'no-store', headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch crimes');
  return res.json();
}

export async function fetchCrimeSearch(params: Record<string, any> = {}) {
  const url = new URL(`${API_BASE}/crimes/search`);
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      url.searchParams.append(key, String(params[key]));
    }
  });
  const res = await fetch(url.toString(), { cache: 'no-store', headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to search crimes');
  return res.json();
}

export async function fetchCategories() {
  const res = await fetch(`${API_BASE}/crimes/categories`, { cache: 'no-store', headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function fetchCase(id: number | string) {
  const res = await fetch(`${API_BASE}/crimes/${id}`, { cache: 'no-store', headers: getHeaders() });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('Failed to fetch case');
  }
  return res.json();
}

export async function fetchCasePeople(id: number | string) {
  const res = await fetch(`${API_BASE}/crimes/${id}/people`, { cache: 'no-store', headers: getHeaders() });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('Failed to fetch case people');
  }
  return res.json();
}

export async function fetchChat(payload: any) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Chat API failed');
  return res.json();
}

// --- Biometric search / cross-case identity matching ---
export async function fetchBiometricSearch(biometricRefId: string) {
  const url = new URL(`${API_BASE}/biometrics/search`);
  url.searchParams.append('biometric_ref_id', biometricRefId);
  const res = await fetch(url.toString(), { cache: 'no-store', headers: getHeaders() });
  if (!res.ok) throw new Error('Biometric search failed');
  return res.json();
}

export async function fetchAccusedBiometrics(accusedId: number | string) {
  const res = await fetch(`${API_BASE}/biometrics/accused/${accusedId}`, { cache: 'no-store', headers: getHeaders() });
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error('Failed to fetch biometric records');
  }
  return res.json();
}

export async function fetchLinkedCases(accusedId: number | string) {
  const res = await fetch(`${API_BASE}/biometrics/accused/${accusedId}/linked-cases`, { cache: 'no-store', headers: getHeaders() });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('Failed to fetch linked cases');
  }
  return res.json();
}

export async function createBiometricRecord(payload: {
  AccusedMasterID: number;
  BiometricType: string;
  BiometricRefID: string;
  CapturedDate?: string;
  Remarks?: string;
}) {
  const res = await fetch(`${API_BASE}/biometrics`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to register biometric record');
  return res.json();
}

// --- Crime analytics ---
export async function fetchAnalytics(params: Record<string, any> = {}) {
  const url = new URL(`${API_BASE}/crimes/analytics`);
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      url.searchParams.append(key, String(params[key]));
    }
  });
  const res = await fetch(url.toString(), { cache: 'no-store', headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

// --- Case sub-resources ---
export async function fetchChargesheet(caseId: number | string) {
  const res = await fetch(`${API_BASE}/crimes/${caseId}/chargesheet`, { cache: 'no-store', headers: getHeaders() });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchArrests(caseId: number | string) {
  const res = await fetch(`${API_BASE}/crimes/${caseId}/arrests`, { cache: 'no-store', headers: getHeaders() });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchSections(caseId: number | string) {
  const res = await fetch(`${API_BASE}/crimes/${caseId}/sections`, { cache: 'no-store', headers: getHeaders() });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchStatusHistory(caseId: number | string) {
  const res = await fetch(`${API_BASE}/crimes/${caseId}/status-history`, { cache: 'no-store', headers: getHeaders() });
  if (!res.ok) return [];
  return res.json();
}

// --- Personnel directory ---
export async function fetchPersonnelList(params: Record<string, any> = {}) {
  const url = new URL(`${API_BASE}/personnel`);
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      url.searchParams.append(key, String(params[key]));
    }
  });
  const res = await fetch(url.toString(), { cache: 'no-store', headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch personnel');
  return res.json();
}

// --- Catalyst service abstraction layer ---
export async function fetchCatalystStatus() {
  const res = await fetch(`${API_BASE}/catalyst/status`, { cache: 'no-store', headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch Catalyst status');
  return res.json();
}

export async function fetchCatalystHotspots() {
  const res = await fetch(`${API_BASE}/catalyst/hotspots`, { cache: 'no-store', headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch hotspots');
  return res.json();
}

export async function fetchCatalystNotifications() {
  const res = await fetch(`${API_BASE}/catalyst/notifications`, { cache: 'no-store', headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

// --- Crime Network (relationship graph) ---
export async function fetchNetworkOverview(params: Record<string, any> = {}) {
  const url = new URL(`${API_BASE}/network`);
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      url.searchParams.append(key, String(params[key]));
    }
  });
  const res = await fetch(url.toString(), { cache: 'no-store', headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch crime network');
  return res.json();
}

export async function fetchNetworkForCase(caseId: number | string) {
  const res = await fetch(`${API_BASE}/network/case/${caseId}`, { cache: 'no-store', headers: getHeaders() });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('Failed to fetch case network');
  }
  return res.json();
}

export async function fetchPersonnel(employeeId: number | string) {
  const res = await fetch(`${API_BASE}/personnel/${employeeId}`, { cache: 'no-store', headers: getHeaders() });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('Failed to fetch employee');
  }
  return res.json();
}
