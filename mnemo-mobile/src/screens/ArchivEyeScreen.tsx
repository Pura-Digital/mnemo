import { useEffect } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { SettingsRow, SettingsSection } from '@/components/ui/SettingsSection';
import { SettingsScreen } from '@/components/ui/SettingsScreen';
import { useArchiveyeStore } from '@/store/useArchiveyeStore';
import { openExternal } from '@/lib/openExternal';
import { getArchivEyeWebUrl } from '@/services/archiveye/archiveyeConfig';
import { ArchivEyeMark } from '@/components/ui/ArchivEyeMark';

export function ArchivEyeScreen() {
  const connected = useArchiveyeStore((s) => s.connected);
  const email = useArchiveyeStore((s) => s.email);
  const loading = useArchiveyeStore((s) => s.loading);
  const hydrate = useArchiveyeStore((s) => s.hydrate);
  const connect = useArchiveyeStore((s) => s.connect);
  const disconnect = useArchiveyeStore((s) => s.disconnect);

  useEffect(() => {
    hydrate().catch(() => {});
  }, [hydrate]);

  return (
    <SettingsScreen>
      <SettingsSection title="ArchivEye">
        <View className="flex-row items-center gap-3 px-4 pb-3 pt-1">
          <View className="h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-tertiarySystemFill">
            <ArchivEyeMark height={16} />
          </View>
          <Text className="flex-1 text-sm text-secondaryLabel">
            Sign in to send notes from mnemo into your ArchivEye knowledge base.
          </Text>
        </View>
        {connected ? (
          <>
            <SettingsRow
              iconStyle="line"
              icon="person.crop.circle"
              mdIcon="UserCircle"
              title={email ?? 'Connected'}
              subtitle="Signed in"
              showChevron={false}
            />
            <SettingsRow
              iconStyle="line"
              icon="safari"
              mdIcon="ExternalLink"
              title="Open ArchivEye"
              onPress={() => {
                openExternal(getArchivEyeWebUrl()).catch(() => {});
              }}
            />
            <SettingsRow
              iconStyle="line"
              icon="rectangle.portrait.and.arrow.right"
              mdIcon="LogOut"
              title="Disconnect"
              destructive
              onPress={() => {
                Alert.alert('Disconnect ArchivEye?', 'You can sign in again anytime.', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Disconnect',
                    style: 'destructive',
                    onPress: () => {
                      disconnect().catch(() => {});
                    },
                  },
                ]);
              }}
              showChevron={false}
            />
          </>
        ) : (
          <SettingsRow
            iconStyle="line"
            icon="link"
            mdIcon="Link"
            title={loading ? 'Connecting…' : 'Connect ArchivEye'}
            onPress={() => {
              if (loading) return;
              connect().catch((error: unknown) => {
                Alert.alert(
                  'Connection failed',
                  error instanceof Error ? error.message : 'Please try again.',
                );
              });
            }}
            showChevron={false}
            rightElement={loading ? <ActivityIndicator /> : undefined}
          />
        )}
      </SettingsSection>
    </SettingsScreen>
  );
}
