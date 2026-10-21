import Constants from 'expo-constants';

const trimSlash = (value: string) => value.replace(/\/+$/, '');

export const ARCHIVEYE_SCOPES = ['openid', 'profile', 'email', 'documents:write'] as const;

export function getArchivEyeClientId(): string {
  return (
    process.env.EXPO_PUBLIC_ARCHIVEYE_CLIENT_ID?.trim() ||
    (Constants.expoConfig?.extra as { archiveyeClientId?: string } | undefined)?.archiveyeClientId?.trim() ||
    ''
  );
}

export function getArchivEyeOidcIssuer(): string {
  return trimSlash(
    process.env.EXPO_PUBLIC_ARCHIVEYE_OIDC_ISSUER?.trim() ||
      'http://localhost:8081/realms/archiveye-dev',
  );
}

function getOidcConnectBase(): string {
  return `${getArchivEyeOidcIssuer()}/protocol/openid-connect`;
}

export function getArchivEyeAuthBaseUrl(): string {
  return getOidcConnectBase();
}

export function getArchivEyeTokenUrl(): string {
  const override = process.env.EXPO_PUBLIC_ARCHIVEYE_TOKEN_URL?.trim();
  return override || `${getOidcConnectBase()}/token`;
}

export function getArchivEyeApiBaseUrl(): string {
  return trimSlash(
    process.env.EXPO_PUBLIC_ARCHIVEYE_API_BASE_URL?.trim() || 'https://data.archiveye.ai/api',
  );
}

export function getArchivEyeWebUrl(): string {
  return process.env.EXPO_PUBLIC_ARCHIVEYE_WEB_URL?.trim() || 'https://data.archiveye.ai';
}

export const ARCHIVEYE_AUTH_DISCOVERY = {
  authorizationEndpoint: `${getOidcConnectBase()}/auth`,
  tokenEndpoint: getArchivEyeTokenUrl(),
};
