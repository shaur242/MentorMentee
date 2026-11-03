// Generic fetch client, one instance per role. Each role's token lives
// under its own localStorage key, so logging into one app never touches
// another's session — matching the "fully separate logins" requirement.
export function createApiClient(role) {
  const tokenKey = `${role}_token`;

  function getToken() {
    return localStorage.getItem(tokenKey);
  }
  function setToken(token) {
    if (token) localStorage.setItem(tokenKey, token);
    else localStorage.removeItem(tokenKey);
  }

  async function api(path, opts = {}) {
    const token = getToken();
    const headers = Object.assign(
      { 'Content-Type': 'application/json' },
      token ? { Authorization: `Bearer ${token}` } : {},
      opts.headers || {}
    );
    const res = await fetch(`/api${path}`, { ...opts, headers });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(body.error || body.message || 'Request failed');
      err.status = res.status;
      err.body = body;
      throw err;
    }
    return body;
  }

  return { api, getToken, setToken, tokenKey };
}
