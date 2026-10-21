import { ConnectPuraLLM, UsagePanel } from "@pura-ai/react";
import { useTranslation } from "react-i18next";
import puraLogo from "../../assets/pura_logo.svg";
import {
  getPuraConnectClientOptions,
  getPuraBrowserConnectionOptions,
  isPuraConnectConfigured,
} from "../../config/puraConnect";
import { usePuraLlm } from "../../hooks/usePuraLlm";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Loader2 } from "../icons";
import { SettingsPanel, SettingsPanelRow, SettingsRow, SectionHeader } from "../ui/SettingsSection";
import { useToast } from "../ui/useToast";

function DesktopConnectButton({
  busy,
  disabled,
  onConnect,
}: {
  busy: boolean;
  disabled?: boolean;
  onConnect: () => void;
}) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      disabled={disabled || busy}
      aria-busy={busy}
      onClick={onConnect}
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-medium text-[#111] shadow-sm transition-opacity disabled:opacity-60 dark:bg-white"
    >
      {busy ? (
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
      ) : (
        <img src={puraLogo} width={24} height={24} alt="" aria-hidden="true" decoding="async" draggable={false} />
      )}
      {t("settingsPage.puraLlm.connectButton")}
    </button>
  );
}

export default function PuraLlmSettings() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const locale = i18n.language?.startsWith("en") ? "en" : "it";
  const connectOptions = getPuraConnectClientOptions();
  const browserOptions = getPuraBrowserConnectionOptions(locale);
  const { connection, client, busy, error, connect, disconnect, usageRefreshKey } = usePuraLlm();
  const isDesktop = Boolean(window.electronAPI?.puraStartConnection);
  const puraConnectUiReady = isPuraConnectConfigured();

  if (!puraConnectUiReady) {
    return (
      <div className="space-y-5">
        <SectionHeader
          title={t("settingsPage.puraLlm.title")}
          description={t("settingsPage.puraLlm.notConfiguredDescription")}
        />
        <SettingsPanel>
          <SettingsPanelRow>
            <SettingsRow
              label={t("settingsPage.puraLlm.notConfiguredTitle")}
              description={t("settingsPage.puraLlm.notConfiguredHint")}
            >
              <Badge variant="warning">{t("settingsPage.puraLlm.notConfiguredBadge")}</Badge>
            </SettingsRow>
          </SettingsPanelRow>
        </SettingsPanel>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title={t("settingsPage.puraLlm.title")}
        description={t("settingsPage.puraLlm.description")}
      />
      <SettingsPanel>
        <SettingsPanelRow>
          <SettingsRow
            label={t("settingsPage.puraLlm.connectionLabel")}
            description={
              connection.connected
                ? t("settingsPage.puraLlm.connectedDescription", {
                    id: connection.puraUserId ?? "—",
                  })
                : t("settingsPage.puraLlm.disconnectedDescription")
            }
          >
            <Badge variant={connection.connected ? "default" : "outline"}>
              {connection.connected
                ? t("settingsPage.puraLlm.connectedBadge")
                : t("settingsPage.puraLlm.disconnectedBadge")}
            </Badge>
          </SettingsRow>
        </SettingsPanelRow>

        {connection.connected ? (
          <SettingsPanelRow>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="outline" size="sm" disabled={busy} onClick={() => void disconnect()}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : t("settingsPage.puraLlm.disconnect")}
              </Button>
            </div>
            {error && (
              <p className="text-xs text-destructive" role="alert">
                {error}
              </p>
            )}
          </SettingsPanelRow>
        ) : (
          <SettingsPanelRow>
            <div className="rounded-lg border border-border/80 p-4 space-y-3">
              <div>
                <h4 className="font-medium text-sm">{t("settingsPage.puraLlm.puraConnectTitle")}</h4>
                <p className="text-sm text-muted-foreground">{t("settingsPage.puraLlm.puraConnectHint")}</p>
              </div>
              <div id="pura-connect-mount">
                {isDesktop ? (
                  <DesktopConnectButton busy={busy} onConnect={() => void connect()} />
                ) : (
                  <ConnectPuraLLM
                    options={{
                      apiBase: connectOptions.apiBase,
                      clientId: connectOptions.clientId,
                      redirectUri: browserOptions.redirectUri,
                      locale,
                    }}
                    onError={(err) => {
                      const message = err instanceof Error ? err.message : String(err);
                      toast({ title: message, variant: "destructive" });
                    }}
                    disabled={busy}
                  />
                )}
              </div>
            </div>
            {error && (
              <p className="text-xs text-destructive mt-2" role="alert">
                {error}
              </p>
            )}
          </SettingsPanelRow>
        )}
      </SettingsPanel>

      {connection.connected && client && (
        <SettingsPanel>
          <SettingsPanelRow>
            <div className="space-y-3 text-sm">
              <h3 className="font-medium text-foreground">{t("settingsPage.puraLlm.usageTitle")}</h3>
              <UsagePanel client={client} refreshKey={usageRefreshKey} className="space-y-2" />
            </div>
          </SettingsPanelRow>
        </SettingsPanel>
      )}
    </div>
  );
}
