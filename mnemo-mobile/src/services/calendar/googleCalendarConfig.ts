import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';

export const GOOGLE_CALENDAR_SCOPES = [
  'openid',
  'email',
  'https://www.googleapis.com/auth/calendar.events.readonly',
  'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
] as const;

// Only the calendar scopes gate the integration. openid/email are requested for the account
// subject/email, but Google echoes them back in canonical URL form (email ->
// .../userinfo.email), so they can't be matched verbatim and must not be treated as required.
export const GOOGLE_CALENDAR_REQUIRED_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events.readonly',
  'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
] as const;

export const GOOGLE_AUTH_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

type MnemoExtra = {
  scheme?: string;
  googleCalendar?: {
    iosClientId?: string;
    iosClientIdDev?: string;
    iosRedirectScheme?: string;
    iosRedirectUri?: string;
  };
};

const firstNonEmpty = (...values: Array<string | null | undefined>): string | undefined =>
  values
    .find((value): value is string => typeof value === 'string' && value.trim().length > 0)
    ?.trim();

const firstScheme = (value: unknown): string | undefined => {
  if (Array.isArray(value)) {
    return value.find((item): item is string => typeof item === 'string' && item.length > 0);
  }
  return typeof value === 'string' && value.length > 0 ? value : undefined;
};

const deriveGoogleCalendarRedirectScheme = (clientId: string | null | undefined): string | null => {
  const suffix = '.apps.googleusercontent.com';
  const trimmed = clientId?.trim();
  if (!trimmed?.endsWith(suffix)) return null;
  return `com.googleusercontent.apps.${trimmed.slice(0, -suffix.length)}`;
};

function readMnemoExtra(): MnemoExtra | undefined {
  const extra = Constants.expoConfig?.extra as { mnemo?: MnemoExtra; mnemo?: MnemoExtra } | undefined;
  return extra?.mnemo ?? extra?.mnemo;
}

export function getGoogleCalendarClientId(): string | null {
  const mnemo = readMnemoExtra();
  return (
    firstNonEmpty(
      mnemo?.googleCalendar?.iosClientId,
      process.env.EXPO_PUBLIC_GOOGLE_CALENDAR_IOS_CLIENT_ID,
      process.env.EXPO_PUBLIC_GOOGLE_CALENDAR_IOS_CLIENT_ID_DEV,
      mnemo?.googleCalendar?.iosClientIdDev,
    ) ?? null
  );
}

export function getGoogleCalendarRedirectUri(): string {
  const mnemo = readMnemoExtra();
  const configuredRedirectUri = firstNonEmpty(
    mnemo?.googleCalendar?.iosRedirectUri,
    process.env.EXPO_PUBLIC_GOOGLE_CALENDAR_IOS_REDIRECT_URI,
    process.env.EXPO_PUBLIC_GOOGLE_CALENDAR_IOS_REDIRECT_URI_DEV,
  );
  if (configuredRedirectUri) return configuredRedirectUri;

  const googleRedirectScheme = firstNonEmpty(
    mnemo?.googleCalendar?.iosRedirectScheme,
    process.env.EXPO_PUBLIC_GOOGLE_CALENDAR_IOS_REDIRECT_SCHEME,
    process.env.EXPO_PUBLIC_GOOGLE_CALENDAR_IOS_REDIRECT_SCHEME_DEV,
    deriveGoogleCalendarRedirectScheme(getGoogleCalendarClientId()),
  );
  if (googleRedirectScheme) return `${googleRedirectScheme}:/oauth2redirect`;

  const scheme = mnemo?.scheme || firstScheme(Constants.expoConfig?.scheme) || 'mnemo';
  return AuthSession.makeRedirectUri({ scheme, path: 'google-calendar/oauth' });
}

export function getGoogleCalendarRequestScopes(): string[] {
  return [...GOOGLE_CALENDAR_SCOPES];
}

export function getGoogleCalendarRequiredScopes(): string[] {
  return [...GOOGLE_CALENDAR_REQUIRED_SCOPES];
}
