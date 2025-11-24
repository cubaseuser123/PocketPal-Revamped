export const AUTH_CONFIG = {
  API_URL:
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.IONIC_APP_API_URL ||
    "http://localhost:5757/api/auth",
  TOKEN_KEY: "pocketpal_token",
  TOKEN_EXPIRY_KEY: "pocketpal_token_expiry",
} as const;

export const getApiUrl = () => AUTH_CONFIG.API_URL;
export const getTokenKey = () => AUTH_CONFIG.TOKEN_KEY;
