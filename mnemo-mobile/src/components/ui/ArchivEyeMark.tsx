import { Image } from 'react-native';

/** ArchivEye wordmark from `src/assets/logo-ae.svg` (PNG synced by generate-brand-assets.py). */
export function ArchivEyeMark({ height = 18 }: { height?: number }) {
  const width = Math.round((height * 36) / 23);
  return (
    <Image
      source={require('../../../assets/logo-ae.png')}
      style={{ width, height }}
      resizeMode="contain"
      accessible={false}
    />
  );
}
