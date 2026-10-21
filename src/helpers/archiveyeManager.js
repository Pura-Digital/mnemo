const { net } = require("electron");
const debugLogger = require("./debugLogger");
const ArchivEyeOAuth = require("./archiveyeOAuth");
const { getApiBaseUrl, getWebAppUrl } = require("./archiveyeConfig");
const {
  buildNoteMarkdownExport,
  archiveyeExternalIdForNote,
} = require("./noteExportContent");
const { broadcastToWindows } = require("./windowBroadcast");

class ArchivEyeManager {
  constructor(databaseManager) {
    this.databaseManager = databaseManager;
    this.oauth = new ArchivEyeOAuth(databaseManager);
  }

  getConnectionStatus() {
    const tokens = this.databaseManager.getArchivEyeTokens();
    if (!tokens) {
      return { connected: false, email: null, name: null, webUrl: getWebAppUrl() };
    }
    return {
      connected: true,
      email: tokens.account_email,
      name: tokens.account_name,
      webUrl: getWebAppUrl(),
    };
  }

  async startOAuth() {
    const result = await this.oauth.startOAuthFlow();
    this._broadcastConnectionChanged();
    return result;
  }

  disconnect() {
    this.databaseManager.deleteArchivEyeTokens();
    this._broadcastConnectionChanged();
    return { success: true };
  }

  _broadcastConnectionChanged() {
    broadcastToWindows("archiveye-connection-changed", this.getConnectionStatus());
  }

  async uploadNote(noteId, { preferEnhanced = true } = {}) {
    const note = this.databaseManager.getNote(noteId);
    if (!note) return { success: false, error: "Note not found" };

    const accessToken = await this.oauth.getValidAccessToken();
    const title = note.title || "Untitled Note";
    const content = buildNoteMarkdownExport(note, { preferEnhanced });
    const externalId = archiveyeExternalIdForNote(noteId);

    const response = await net.fetch(`${getApiBaseUrl()}/v1/documents`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        content,
        contentType: "text/markdown",
        source: "mnemo",
        externalId,
      }),
      signal: AbortSignal.timeout(60000),
      useSessionCookies: false,
    });

    const text = await response.text();
    let payload;
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      debugLogger.error("ArchivEye upload invalid JSON", { status: response.status }, "archiveye");
      return { success: false, error: "Invalid response from ArchivEye" };
    }

    if (!response.ok) {
      const message =
        payload.message || payload.error || payload.detail || `Upload failed (${response.status})`;
      return { success: false, error: String(message) };
    }

    const documentId = payload.id ?? payload.documentId ?? null;
    const url = payload.url ?? null;
    if (documentId) {
      this.databaseManager.updateNoteArchivEyeDocumentId(noteId, String(documentId));
    }

    return { success: true, documentId, url };
  }
}

module.exports = ArchivEyeManager;
