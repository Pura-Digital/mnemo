import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import { Buffer } from 'buffer';
import {
  ARCHIVEYE_AUTH_DISCOVERY,
  ARCHIVEYE_SCOPES,
  getArchivEyeClientId,
} from './archiveyeConfig';

const TOKEN_KEY = 'archiveye.tokens';

export interface ArchivEyeTokenBundle {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number;
  email: string;
  name: string | null;
  subject: string;
}

const EXPIRY_SKEW_MS = 60_000;

export function buildArchivEyeAuthRequest(clientId: string): AuthSession.AuthRequest {
  return new AuthSession.AuthRequest({
    clientId,
    redirectUri: AuthSession.makeRedirectUri({ scheme: 'mnemo', path: 'archiveye/oauth' }),
    responseType: AuthSession.ResponseType.Code,
    scopes: [...ARCHIVEYE_SCOPES],
    usePKCE: true,
  });
}

async function exchangeCode(
  clientId: string,
  code: string,
  codeVerifier: string,
  redirectUri: string,
): Promise<Record<string, unknown>> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: codeVerifier,
  });
  const response = await fetch(ARCHIVEYE_AUTH_DISCOVERY.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const text = await response.text();
  const payload = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  if (!response.ok) {
    throw new Error(String(payload.error_description ?? payload.error ?? 'Token exchange failed'));
  }
  return payload;
}

function decodeIdTokenEmail(idToken: string): { email?: string; name?: string; sub?: string } {
  const [, payload] = idToken.split('.');
  if (!payload) return {};
  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
  const claims = JSON.parse(Buffer.from(normalized, 'base64').toString('utf8')) as {
    email?: unknown;
    name?: unknown;
    sub?: unknown;
  };
  return {
    email: typeof claims.email === 'string' ? claims.email : undefined,
    name: typeof claims.name === 'string' ? claims.name : undefined,
    sub: typeof claims.sub === 'string' ? claims.sub : undefined,
  };
}

export async function persistArchivEyeTokens(bundle: ArchivEyeTokenBundle): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(bundle));
}

export async function loadArchivEyeTokens(): Promise<ArchivEyeTokenBundle | null> {
  const raw = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ArchivEyeTokenBundle;
  } catch {
    return null;
  }
}

export async function clearArchivEyeTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function runArchivEyeOAuthFlow(): Promise<ArchivEyeTokenBundle> {
  const clientId = getArchivEyeClientId();
  if (!clientId) {
    throw new Error('EXPO_PUBLIC_ARCHIVEYE_CLIENT_ID is not configured');
  }
  const request = buildArchivEyeAuthRequest(clientId);
  const result = await request.promptAsync(ARCHIVEYE_AUTH_DISCOVERY);
  if (result.type !== 'success' || !result.params.code) {
    throw new Error('ArchivEye sign-in was cancelled');
  }
  const tokenPayload = await exchangeCode(
    clientId,
    result.params.code,
    request.codeVerifier ?? '',
    request.redirectUri,
  );
  const accessToken = String(tokenPayload.access_token ?? '');
  if (!accessToken) throw new Error('Missing access token');
  const idClaims =
    typeof tokenPayload.id_token === 'string'
      ? decodeIdTokenEmail(tokenPayload.id_token)
      : {};
  const expiresIn = Number(tokenPayload.expires_in ?? 3600);
  const bundle: ArchivEyeTokenBundle = {
    accessToken,
    refreshToken:
      typeof tokenPayload.refresh_token === 'string' ? tokenPayload.refresh_token : null,
    expiresAt: Date.now() + expiresIn * 1000,
    email: idClaims.email ?? idClaims.sub ?? 'ArchivEye user',
    name: idClaims.name ?? null,
    subject: idClaims.sub ?? idClaims.email ?? 'archiveye',
  };
  await persistArchivEyeTokens(bundle);
  return bundle;
}

export async function refreshArchivEyeAccessToken(
  bundle: ArchivEyeTokenBundle,
): Promise<ArchivEyeTokenBundle> {
  const clientId = getArchivEyeClientId();
  if (!bundle.refreshToken) throw new Error('ArchivEye session expired; connect again');
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: bundle.refreshToken,
    client_id: clientId,
  });
  const response = await fetch(ARCHIVEYE_AUTH_DISCOVERY.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const text = await response.text();
  const payload = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  if (!response.ok) {
    throw new Error(String(payload.error_description ?? payload.error ?? 'Refresh failed'));
  }
  const next: ArchivEyeTokenBundle = {
    ...bundle,
    accessToken: String(payload.access_token ?? bundle.accessToken),
    refreshToken:
      typeof payload.refresh_token === 'string' ? payload.refresh_token : bundle.refreshToken,
    expiresAt: Date.now() + Number(payload.expires_in ?? 3600) * 1000,
  };
  await persistArchivEyeTokens(next);
  return next;
}

export async function getValidArchivEyeAccessToken(): Promise<string> {
  let bundle = await loadArchivEyeTokens();
  if (!bundle) throw new Error('Not connected to ArchivEye');
  if (bundle.expiresAt - EXPIRY_SKEW_MS < Date.now()) {
    bundle = await refreshArchivEyeAccessToken(bundle);
  }
  return bundle.accessToken;
}
