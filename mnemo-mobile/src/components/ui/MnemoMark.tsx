import { Image } from 'react-native';

/** mnemo ribbon mark (launcher / splash artwork). */
export function MnemoMark({ size = 32 }: { size?: number; color?: string }) {
  return (
    <Image
      source={require('../../../assets/splash-icon.png')}
      style={{ width: size, height: size }}
      resizeMode="contain"
      accessible={false}
    />
  );
}
