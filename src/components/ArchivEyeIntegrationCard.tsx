import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ExternalLink, Loader2, Mail, Unlink } from "./icons";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { SettingsPanel, SettingsPanelRow } from "./ui/SettingsSection";
import archiveyeLogo from "../assets/logo-ae.svg";

type ArchivEyeStatus = {
  connected: boolean;
  email: string | null;
  name?: string | null;
  webUrl?: string;
};

export default function ArchivEyeIntegrationCard() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<ArchivEyeStatus>({
    connected: false,
    email: null,
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    const next = await window.electronAPI?.archiveyeGetStatus?.();
    if (next) setStatus(next);
  }, []);

  useEffect(() => {
    void refreshStatus();
    const unsub = window.electronAPI?.onArchiveyeConnectionChanged?.((data) => {
      setStatus(data);
    });
    return () => unsub?.();
  }, [refreshStatus]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const result = await window.electronAPI?.archiveyeStartOAuth?.();
      if (!result?.success) {
        setError(result?.error ?? t("integrations.archiveye.connectFailedDescription"));
      } else {
        await refreshStatus();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("integrations.archiveye.connectFailedDescription"));
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await window.electronAPI?.archiveyeDisconnect?.();
    await refreshStatus();
  };

  const openWeb = () => {
    const url = status.webUrl ?? "https://www.archiveye.ai";
    void window.electronAPI?.openExternal?.(url);
  };

  return (
    <SettingsPanel>
      <SettingsPanelRow>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white dark:bg-surface-raised shadow-[0_0_0_1px_rgba(0,0,0,0.04)] dark:shadow-none dark:border dark:border-white/10 flex items-center justify-center shrink-0">
            <img
              src={archiveyeLogo}
              alt=""
              width={28}
              height={18}
              decoding="async"
              draggable={false}
              className="h-[18px] w-auto"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-foreground">
                {t("integrations.archiveye.title")}
              </p>
            </div>
            <p className="text-xs text-muted-foreground/70 mt-0.5 leading-relaxed">
              {t("integrations.archiveye.description")}
            </p>
            {error && (
              <p className="text-xs text-destructive mt-1 leading-relaxed" role="alert">
                {error}
              </p>
            )}
          </div>
          {status.connected ? (
            <Badge variant="success" className="shrink-0">
              {t("integrations.archiveye.connected")}
            </Badge>
          ) : (
            <Button size="sm" onClick={handleConnect} disabled={isConnecting} className="shrink-0">
              {isConnecting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                t("integrations.archiveye.connect")
              )}
            </Button>
          )}
        </div>
      </SettingsPanelRow>
      {status.connected && status.email && (
        <SettingsPanelRow>
          <div className="group flex items-center gap-3 ps-12">
            <Mail className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
            <span className="text-xs text-muted-foreground truncate flex-1">{status.email}</span>
            <button
              type="button"
              onClick={openWeb}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
              aria-label={t("integrations.archiveye.openWeb")}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => void handleDisconnect()}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
              aria-label={t("integrations.archiveye.disconnect")}
            >
              <Unlink className="h-3.5 w-3.5" />
            </button>
          </div>
        </SettingsPanelRow>
      )}
    </SettingsPanel>
  );
}
