// Endpoints confirmed against WHOOP's official developer docs
// (developer.whoop.com/docs/developing/oauth) — not guessed.
export const WHOOP_API_BASE = "https://api.prod.whoop.com";
export const WHOOP_AUTHORIZE_URL = `${WHOOP_API_BASE}/oauth/oauth2/auth`;
export const WHOOP_TOKEN_URL = `${WHOOP_API_BASE}/oauth/oauth2/token`;
export const WHOOP_REVOKE_URL = `${WHOOP_API_BASE}/developer/v2/user/access`;

export const WHOOP_SCOPES = "offline read:recovery read:cycles read:sleep read:workout";
