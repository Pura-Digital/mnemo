import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { isPuraConnectConfigured } from "../config/puraConnect";
import {
  getPuraInferenceClient,
  persistPuraTokens,
  readPuraConnectionFromStore,
  resetPuraInferenceClient,
} from "../services/pura/puraInferenceClient";

export interface PuraConnectionState {
  configured: boolean;
  connected: boolean;
  puraUserId: number | null;
}

export function usePuraLlm() {
  const { i18n } = useTranslation();
  const [connection, setConnection] = useState<PuraConnectionState>(() => ({
    configured: isPuraConnectConfigured(),
    connected: false,
    puraUserId: null,
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usageRefreshKey, setUsageRefreshKey] = useState(0);

  const refreshConnection = useCallback(async () => {
    const state = await readPuraConnectionFromStore();
    setConnection(state);
    if (!state.connected) resetPuraInferenceClient();
  }, []);

  useEffect(() => {
    void refreshConnection();
    const unsubscribe = window.electronAPI?.onPuraConnectionChanged?.(() => {
      void refreshConnection();
      setUsageRefreshKey((key) => key + 1);
    });
    return () => unsubscribe?.();
  }, [refreshConnection]);

  const client = useMemo(() => {
    if (!connection.connected) return null;
    return getPuraInferenceClient();
  }, [connection.connected, connection.puraUserId]);

  const connect = useCallback(async () => {
    if (!window.electronAPI?.puraStartConnection) {
      setError("App not ready");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const locale = i18n.language?.startsWith("en") ? "en" : "it";
      const result = await window.electronAPI.puraStartConnection(locale);
      if (!result.success) {
        setError(result.error || "Connection failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, [i18n.language]);

  const disconnect = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      if (window.electronAPI?.puraDisconnect) {
        await window.electronAPI.puraDisconnect();
      } else {
        await persistPuraTokens(null);
      }
      resetPuraInferenceClient();
      await refreshConnection();
      setUsageRefreshKey((key) => key + 1);
    } finally {
      setBusy(false);
    }
  }, [refreshConnection]);

  const bumpUsage = useCallback(() => {
    setUsageRefreshKey((key) => key + 1);
  }, []);

  return {
    connection,
    client,
    busy,
    error,
    connect,
    disconnect,
    refreshConnection,
    usageRefreshKey,
    bumpUsage,
  };
}
