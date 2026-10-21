const { net } = require("electron");
const { runOAuthLoopbackFlow, OAuthFlowError } = require("./oauthLoopbackFlow");
const {
  getAuthorizeUrl,
  getTokenUrl,
  getClientId,
  ARCHIVEYE_SCOPES,
} = require("./archiveyeConfig");

class ArchivEyeOAuth {
  constructor(databaseManager) {
    this.databaseManager = databaseManager;
  }

  assertConfigured() {
    const clientId = getClientId();
    if (!clientId) {
      throw new Error("ARCHIVEYE_CLIENT_ID is not configured");
    }
    return clientId;
  }

  startOAuthFlow() {
    const clientId = this.assertConfigured();

    return runOAuthLoopbackFlow({
      errorParam: "archiveye_error",
      buildAuthUrl: (redirectUri, state, codeChallenge) => {
        const params = new URLSearchParams({
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: "code",
          scope: ARCHIVEYE_SCOPES,
          state,
          code_challenge: codeChallenge,
          code_challenge_method: "S256",
        });
        return `${getAuthorizeUrl()}?${params.toString()}`;
      },
      handleCallback: async (code, redirectUri, codeVerifier) => {
        const tokenData = await this.exchangeCodeForTokens(code, redirectUri, codeVerifier, clientId);

        if (tokenData.error) {
          throw new OAuthFlowError(
            "token_exchange_failed",
            tokenData.error_description || tokenData.error
          );
        }

        if (!tokenData.access_token) {
          throw new OAuthFlowError("no_access_token", "ArchivEye token response missing access_token");
        }

        let email = null;
        let name = null;
        let subject = null;

        if (tokenData.id_token) {
          try {
            const payload = JSON.parse(
              Buffer.from(tokenData.id_token.split(".")[1], "base64url").toString()
            );
            email = payload.email ?? null;
            name = payload.name ?? null;
            subject = payload.sub ?? null;
          } catch {
            /* profile fallback below */
          }
        }

        if (!email && tokenData.access_token) {
          const profile = await this.fetchProfile(tokenData.access_token).catch(() => null);
          if (profile) {
            email = profile.email ?? email;
            name = profile.name ?? name;
            subject = profile.sub ?? subject;
          }
        }

        if (!email) {
          email = subject || "ArchivEye user";
        }

        this.databaseManager.saveArchivEyeTokens({
          account_email: email,
          account_name: name,
          subject: subject || email,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || "",
          expires_at: Date.now() + (tokenData.expires_in || 3600) * 1000,
          scope: tokenData.scope || ARCHIVEYE_SCOPES,
        });

        return { success: true, email, name };
      },
    });
  }

  async exchangeCodeForTokens(code, redirectUri, codeVerifier, clientId) {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: codeVerifier,
    }).toString();
    return this._httpsPost(getTokenUrl(), body);
  }

  async refreshAccessToken(refreshToken) {
    const clientId = this.assertConfigured();
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
    }).toString();
    return this._httpsPost(getTokenUrl(), body);
  }

  async getValidAccessToken() {
    const tokens = this.databaseManager.getArchivEyeTokens();
    if (!tokens) throw new Error("Not connected to ArchivEye");

    const fiveMinutes = 5 * 60 * 1000;
    if (tokens.expires_at - fiveMinutes < Date.now()) {
      if (!tokens.refresh_token) {
        throw new Error("ArchivEye session expired; connect again");
      }
      const refreshed = await this.refreshAccessToken(tokens.refresh_token);
      if (refreshed.error) {
        throw new Error(refreshed.error_description || refreshed.error);
      }
      const newExpiresAt = Date.now() + (refreshed.expires_in || 3600) * 1000;
      this.databaseManager.saveArchivEyeTokens({
        account_email: tokens.account_email,
        account_name: tokens.account_name,
        subject: tokens.subject,
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token || tokens.refresh_token,
        expires_at: newExpiresAt,
        scope: tokens.scope,
      });
      return refreshed.access_token;
    }

    return tokens.access_token;
  }

  async fetchProfile(accessToken) {
    const { getApiBaseUrl } = require("./archiveyeConfig");
    const response = await net.fetch(`${getApiBaseUrl()}/v1/me`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
      useSessionCookies: false,
    });
    if (!response.ok) return null;
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  async _httpsPost(urlString, body) {
    const response = await net.fetch(urlString, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(15000),
      useSessionCookies: false,
    });
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Invalid JSON response: ${text.slice(0, 200)}`);
    }
  }
}

module.exports = ArchivEyeOAuth;
