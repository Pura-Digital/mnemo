# ArchivEye ↔ mnemo integration contract

mnemo pushes enhanced notes into ArchivEye as markdown documents. Authentication uses **Keycloak OIDC** authorization code with PKCE (public client `archiveye-mnemo`, no client secret).

## OAuth (Keycloak)

| Variable | Description |
| -------- | ----------- |
| `ARCHIVEYE_CLIENT_ID` | OAuth client id (`archiveye-mnemo`) |
| `ARCHIVEYE_OIDC_ISSUER` | Realm issuer (dev: `http://localhost:8081/realms/archiveye-dev`; prod: your Keycloak realm URL) |
| `ARCHIVEYE_TOKEN_URL` | Optional override; default `{issuer}/protocol/openid-connect/token` |
| `ARCHIVEYE_API_BASE_URL` | REST API base (default `https://data.archiveye.ai/api`) |

### Authorize

`GET {issuer}/protocol/openid-connect/auth`

Query parameters:

- `response_type=code`
- `client_id`
- `redirect_uri` — loopback on desktop (`http://127.0.0.1:{port}`), custom scheme on mobile (`mnemo://archiveye/oauth`)
- `scope` — `openid profile email documents:write`
- `state`
- `code_challenge` / `code_challenge_method=S256`

### Token

`POST {issuer}/protocol/openid-connect/token` (`application/x-www-form-urlencoded`)

- `grant_type=authorization_code`
- `code`, `redirect_uri`, `client_id`, `code_verifier`

Refresh:

- `grant_type=refresh_token`
- `refresh_token`, `client_id`

Access tokens must include ArchivEye employee claims and audience `archiveye-data-fe` (configured on the Keycloak client).

### Profile

`GET {API_BASE_URL}/v1/me` — `Authorization: Bearer {access_token}`

Response: `{ "email": string, "name"?: string | null, "sub": string }`

## Document ingest

`POST {API_BASE_URL}/v1/documents`

Headers: `Authorization: Bearer {access_token}`, `Content-Type: application/json`

Body:

```json
{
  "title": "Meeting notes",
  "content": "# Title\n\nMarkdown body…",
  "contentType": "text/markdown",
  "source": "mnemo",
  "externalId": "mnemo:note:42"
}
```

- `externalId` is stable per mnemo note id for idempotent upsert on re-send.

Response `200`:

```json
{
  "id": 123,
  "url": "https://data.archiveye.ai/dashboard"
}
```

## mnemo storage

- OAuth tokens: SQLite `archiveye_tokens` (desktop), SecureStore (mobile).
- Per note: `notes.archiveye_document_id` after first successful push.

## Pura LLM (separate from ArchivEye)

Personal **Connect Pura LLM** uses the Pura integration OAuth client (`VITE_PURA_CONNECT_CLIENT_ID`), not Keycloak or `archiveye-mnemo`. Tokens stay on the device (Electron secure storage or browser `sessionStorage`).

Default desktop redirect URI: **`mnemo://pura-oauth`** (dev: **`mnemo-dev://pura-oauth`**). Register that exact URI on the Pura integration app. Pura LLM also accepts `http://127.0.0.1` / `http://localhost` callbacks for local web dev. Legacy **`mnemo://`** deep links remain handled for upgrades.

## Manual test checklist (mnemo)

1. Set `ARCHIVEYE_CLIENT_ID=archiveye-mnemo` and `ARCHIVEYE_OIDC_ISSUER` for local or staging Keycloak.
2. Set `ARCHIVEYE_API_BASE_URL=http://localhost:3000/api` when using local BFF.
3. Desktop: Integrations → Connect ArchivEye → complete browser login.
4. Desktop: open a note → Share/export menu → **Send to ArchivEye** → success toast; row gets `archiveye_document_id`.
5. Re-send the same note; ArchivEye upserts by `externalId` (`mnemo:note:{id}`).
6. Disconnect ArchivEye; export menu no longer shows Send; tokens cleared.
7. Mobile: Settings → Integrations → ArchivEye → connect; note menu → Send to ArchivEye.
