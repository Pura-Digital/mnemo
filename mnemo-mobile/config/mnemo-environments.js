const PRODUCTION_BUNDLE_ID = 'com.pura.mnemo';
const DEVELOPMENT_BUNDLE_ID = 'com.pura.mnemo.dev';

function firstNonEmpty(...values) {
  return values.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim();
}

function normalizeEnvironment(rawValue) {
  const value = String(rawValue || '')
    .trim()
    .toLowerCase();
  if (['dev', 'development', 'local'].includes(value)) return 'development';
  if (['prod', 'production', 'testflight', 'release'].includes(value)) return 'production';
  return 'production';
}

function deriveAppGroupId(bundleIdentifier) {
  return `group.${bundleIdentifier}`;
}

function resolveMnemoEnvironment() {
  const appEnvironment = normalizeEnvironment(
    firstNonEmpty(
      process.env.MNEMO_APP_ENV,
      process.env.APP_ENV,
      process.env.EAS_BUILD_PROFILE,
    ),
  );
  const isDevelopment = appEnvironment === 'development';
  const defaultBundleId = isDevelopment ? DEVELOPMENT_BUNDLE_ID : PRODUCTION_BUNDLE_ID;
  const bundleIdentifier = firstNonEmpty(
    process.env.MNEMO_IOS_BUNDLE_IDENTIFIER,
    process.env.MNEMO_BUNDLE_IDENTIFIER,
    defaultBundleId,
  );
  const androidPackage = firstNonEmpty(
    process.env.MNEMO_ANDROID_PACKAGE,
    process.env.MNEMO_PACKAGE,
    bundleIdentifier,
  );
  const scheme = firstNonEmpty(
    process.env.MNEMO_SCHEME,
    isDevelopment ? 'mnemo-dev' : 'mnemo',
  );
  const displayName = firstNonEmpty(
    process.env.MNEMO_DISPLAY_NAME,
    isDevelopment ? 'mnemo Dev' : 'mnemo',
  );
  const keyboardDisplayName = firstNonEmpty(
    process.env.MNEMO_KEYBOARD_DISPLAY_NAME,
    displayName,
  );
  const appGroupId = firstNonEmpty(
    process.env.MNEMO_APP_GROUP_ID,
    deriveAppGroupId(bundleIdentifier),
  );
  const keyboardBundleIdentifier = firstNonEmpty(
    process.env.MNEMO_KEYBOARD_BUNDLE_IDENTIFIER,
    `${bundleIdentifier}.keyboard`,
  );

  return {
    appEnvironment,
    isDevelopment,
    displayName,
    keyboardDisplayName,
    scheme,
    iosBundleIdentifier: bundleIdentifier,
    androidPackage,
    keyboardBundleIdentifier,
    appGroupId,
    notificationPrefix: bundleIdentifier,
  };
}

module.exports = {
  deriveAppGroupId,
  normalizeEnvironment,
  resolveMnemoEnvironment,
};
