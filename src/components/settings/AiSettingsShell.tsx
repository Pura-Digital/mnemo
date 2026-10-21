import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Brain, Cpu, KeyRound, Mic, Plus, Sparkles, Trash2 } from "../icons";
import puraLogo from "../../assets/pura_logo.svg";
import type { AiSetupLane } from "../../helpers/aiSetupStorage";
import { useAiSetupStore } from "../../stores/aiSetupStore";
import { SectionHeader, SettingsPanel, SettingsPanelRow, SettingsRow } from "../ui/SettingsSection";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ProviderTabs } from "../ui/ProviderTabs";
import PuraLlmSettings from "./PuraLlmSettings";
import { cn } from "../lib/utils";
import { AiSetupLaneProvider } from "../../contexts/AiSetupLaneContext";

export type AiSettingsArea = "speech" | "models";

interface AiSettingsShellProps {
  initialArea?: AiSettingsArea;
  renderSpeech: () => React.ReactNode;
  renderModels: () => React.ReactNode;
}

const LANE_OPTIONS: { id: AiSetupLane; icon: typeof KeyRound }[] = [
  { id: "pura", icon: Sparkles },
  { id: "providers", icon: KeyRound },
  { id: "local", icon: Cpu },
];

export default function AiSettingsShell({
  initialArea,
  renderSpeech,
  renderModels,
}: AiSettingsShellProps) {
  const { t } = useTranslation();
  const hydrate = useAiSetupStore((s) => s.hydrate);
  const setups = useAiSetupStore((s) => s.setups);
  const activeId = useAiSetupStore((s) => s.activeId);
  const setActiveSetup = useAiSetupStore((s) => s.setActiveSetup);
  const addSetup = useAiSetupStore((s) => s.addSetup);
  const removeSetup = useAiSetupStore((s) => s.removeSetup);
  const renameSetup = useAiSetupStore((s) => s.renameSetup);
  const setSetupLane = useAiSetupStore((s) => s.setSetupLane);
  const persistActiveSetup = useAiSetupStore((s) => s.persistActiveSetup);

  const activeSetup = setups.find((s) => s.id === activeId) ?? setups[0];

  const [area, setArea] = useState<AiSettingsArea>(initialArea ?? "speech");
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (initialArea) setArea(initialArea);
  }, [initialArea]);

  useEffect(() => {
    const interval = window.setInterval(() => persistActiveSetup(), 5000);
    return () => window.clearInterval(interval);
  }, [persistActiveSetup]);

  const laneModes = useMemo(
    () =>
      LANE_OPTIONS.map((opt) => ({
        id: opt.id,
        label: t(`settingsPage.ai.setups.lanes.${opt.id}.label`),
        description: t(`settingsPage.ai.setups.lanes.${opt.id}.description`),
        icon:
          opt.id === "pura" ? (
            <img
              src={puraLogo}
              width={16}
              height={16}
              alt=""
              aria-hidden="true"
              decoding="async"
              draggable={false}
            />
          ) : (
            <opt.icon className="h-4 w-4" />
          ),
      })),
    [t]
  );

  const areaTabs = [
    { id: "speech", name: t("settingsPage.ai.areas.speech") },
    { id: "models", name: t("settingsPage.ai.areas.models") },
  ];

  if (!activeSetup) return null;

  return (
    <div className="space-y-5">
      <SectionHeader
        title={t("settingsPage.ai.title")}
        description={t("settingsPage.ai.description")}
      />

      <div className="flex flex-wrap items-center gap-2">
        {setups.map((setup) => (
          <button
            key={setup.id}
            type="button"
            onClick={() => setActiveSetup(setup.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              setup.id === activeId
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-border-hover hover:text-foreground"
            )}
          >
            {setup.name}
          </button>
        ))}
        <Button type="button" variant="outline" size="sm" className="h-7 gap-1" onClick={() => addSetup()}>
          <Plus className="h-3.5 w-3.5" />
          {t("settingsPage.ai.setups.add")}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/70 bg-surface-1/50 p-3">
        {editingName ? (
          <Input
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={() => {
              renameSetup(activeSetup.id, nameDraft);
              setEditingName(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                renameSetup(activeSetup.id, nameDraft);
                setEditingName(false);
              }
            }}
            className="h-8 max-w-[200px] text-sm"
            autoFocus
          />
        ) : (
          <button
            type="button"
            className="text-sm font-semibold text-foreground hover:underline"
            onClick={() => {
              setNameDraft(activeSetup.name);
              setEditingName(true);
            }}
          >
            {activeSetup.name}
          </button>
        )}
        {setups.length > 1 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-destructive hover:text-destructive"
            onClick={() => removeSetup(activeSetup.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t("settingsPage.ai.setups.remove")}
          </Button>
        )}
      </div>

      <SettingsPanel>
        <SettingsPanelRow>
          <SettingsRow
            label={t("settingsPage.ai.setups.laneTitle")}
            description={t("settingsPage.ai.setups.laneDescription")}
          >
            <div className="flex flex-wrap gap-2">
              {laneModes.map((lane) => (
                <Button
                  key={lane.id}
                  type="button"
                  size="sm"
                  variant={activeSetup.lane === lane.id ? "default" : "outline"}
                  className="gap-1.5"
                  onClick={() => setSetupLane(activeSetup.id, lane.id as AiSetupLane)}
                >
                  {lane.icon}
                  {lane.label}
                </Button>
              ))}
            </div>
          </SettingsRow>
        </SettingsPanelRow>
      </SettingsPanel>

      {activeSetup.lane === "pura" && (
        <div className="rounded-lg border border-border/70 p-1">
          <PuraLlmSettings />
        </div>
      )}

      <ProviderTabs
        providers={areaTabs}
        selectedId={area}
        onSelect={(id) => setArea(id as AiSettingsArea)}
        renderIcon={(id) =>
          id === "speech" ? <Mic className="w-3.5 h-3.5" /> : <Brain className="w-3.5 h-3.5" />
        }
      />

      <AiSetupLaneProvider lane={activeSetup.lane}>
        {area === "speech" ? renderSpeech() : renderModels()}
      </AiSetupLaneProvider>
    </div>
  );
}
