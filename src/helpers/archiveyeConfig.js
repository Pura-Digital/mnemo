function trimSlash(value) {
  return value.replace(/\/+$/, "");
}

function getOidcIssuer() {
  return trimSlash(
    process.env.ARCHIVEYE_OIDC_ISSUER || "http://localhost:8081/realms/archiveye-dev"
  );
}

function getOidcConnectBase() {
  return `${getOidcIssuer()}/protocol/openid-connect`;
}

function getAuthBaseUrl() {
  return getOidcConnectBase();
}

function getAuthorizeUrl() {
  return `${getOidcConnectBase()}/auth`;
}

function getTokenUrl() {
  return process.env.ARCHIVEYE_TOKEN_URL || `${getOidcConnectBase()}/token`;
}

function getApiBaseUrl() {
  return trimSlash(
    process.env.ARCHIVEYE_API_BASE_URL || "https://data.archiveye.ai/api"
  );
}

function getClientId() {
  return process.env.ARCHIVEYE_CLIENT_ID || process.env.VITE_ARCHIVEYE_CLIENT_ID || "";
}

const ARCHIVEYE_SCOPES = "openid profile email documents:write";

function getWebAppUrl() {
  return process.env.ARCHIVEYE_WEB_URL || "https://data.archiveye.ai";
}

module.exports = {
  getOidcIssuer,
  getAuthBaseUrl,
  getAuthorizeUrl,
  getTokenUrl,
  getApiBaseUrl,
  getClientId,
  ARCHIVEYE_SCOPES,
  getWebAppUrl,
};
