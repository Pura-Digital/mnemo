import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { completeBrowserConnection } from "@pura-ai/sdk";
import { getPuraConnectClientOptions, isPuraConnectConfigured } from "../../config/puraConnect";
import { persistPuraTokens } from "../../services/pura/puraInferenceClient";
import { Loader2 } from "../icons";
import { useToast } from "../ui/useToast";

export default function PuraConnectCallback() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    if (!isPuraConnectConfigured()) {
      setError(t("settingsPage.puraLlm.puraConnectNotConfigured"));
      return;
    }
    const options = getPuraConnectClientOptions();
    void completeBrowserConnection(options)
      .then(async (tokens) => {
        await persistPuraTokens(tokens);
        if (!active) return;
        toast({
          title: t("settingsPage.puraLlm.puraConnectSaved"),
          variant: "default",
        });
        window.location.replace("/");
      })
      .catch((err: unknown) => {
        if (!active) return;
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        toast({ title: message, variant: "destructive" });
      });
    return () => {
      active = false;
    };
  }, [t, toast]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-8">
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {t("settingsPage.puraLlm.puraConnectCompleting")}
          </p>
        </>
      )}
    </div>
  );
}
