import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePolicyStore } from "../stores/policyStore";
import {
  Sliders,
  Mic,
  Brain,
  Sparkles,
  UserCircle,
  Wrench,
  Keyboard,
  CreditCard,
  Shield,
  ShieldCheck,
  Users,
} from "./icons";
import SidebarModal, { type SidebarItem } from "./ui/SidebarModal";
import SettingsPage, { AccountAvatar, SettingsSectionType } from "./SettingsPage";
import {
  isMnemoStandaloneProduct,
  MNEMO_HIDDEN_SETTINGS_SECTIONS,
} from "../config/mnemoProduct";
import { useAuth } from "../hooks/useAuth";

export type { SettingsSectionType };

// Legacy AI settings deep-links collapse into the unified AI page on mnemo.
// Mnemo still maps to speechToText + llms when not standalone.
const SECTION_ALIASES: Record<string, SettingsSectionType> = {
  aiModels: isMnemoStandaloneProduct() ? "ai" : "llms",
  agentConfig: isMnemoStandaloneProduct() ? "ai" : "llms",
  agentMode: isMnemoStandaloneProduct() ? "ai" : "llms",
  dictationAgent: isMnemoStandaloneProduct() ? "ai" : "llms",
  intelligence: isMnemoStandaloneProduct() ? "ai" : "llms",
  meetings: isMnemoStandaloneProduct() ? "ai" : "llms",
  prompts: isMnemoStandaloneProduct() ? "ai" : "llms",
  transcription: isMnemoStandaloneProduct() ? "ai" : "speechToText",
  uploadTranscription: isMnemoStandaloneProduct() ? "ai" : "speechToText",
  speechToText: isMnemoStandaloneProduct() ? "ai" : "speechToText",
  llms: isMnemoStandaloneProduct() ? "ai" : "llms",
  puraLlm: isMnemoStandaloneProduct() ? "ai" : "puraLlm",
  softwareUpdates: "system",
  privacy: "privacyData",
  permissions: "privacyData",
  developer: "system",
};

const LEGACY_SUB_TAB: Record<string, string> = {
  transcription: "dictation",
  uploadTranscription: "upload",
  dictationAgent: "dictationAgent",
  meetings: "noteFormatting",
  intelligence: "dictationCleanup",
  agentMode: "chatIntelligence",
  agentConfig: "chatIntelligence",
  aiModels: "dictationCleanup",
  prompts: "dictationCleanup",
};

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSection?: string;
}

export default function SettingsModal({ open, onOpenChange, initialSection }: SettingsModalProps) {
  const { t } = useTranslation();
  const { isSignedIn, user } = useAuth();
  const policyManaged = usePolicyStore((s) => s.managed);
  const sidebarItems: SidebarItem<SettingsSectionType>[] = useMemo(() => {
    const items: SidebarItem<SettingsSectionType>[] = [
      {
        id: "account",
        label: t("settingsModal.sections.account.label"),
        icon: UserCircle,
        description: t("settingsModal.sections.account.description"),
        group: t("settingsModal.groups.account"),
      },
      {
        id: "plansBilling",
        label: t("settingsModal.sections.plansBilling.label"),
        icon: CreditCard,
        description: t("settingsModal.sections.plansBilling.description"),
        group: t("settingsModal.groups.account"),
      },
      {
        id: "workspace" as const,
        label: t("settingsModal.sections.workspace.label"),
        icon: Users,
        description: t("settingsModal.sections.workspace.description"),
        group: t("settingsModal.groups.account"),
      },
      {
        id: "general",
        label: t("settingsModal.sections.general.label"),
        icon: Sliders,
        description: t("settingsModal.sections.general.description"),
        group: t("settingsModal.groups.app"),
      },
      ...(isMnemoStandaloneProduct()
        ? [
            {
              id: "ai" as const,
              label: t("settingsModal.sections.ai.label"),
              icon: Brain,
              description: t("settingsModal.sections.ai.description"),
              group: t("settingsModal.groups.aiModels"),
            },
          ]
        : [
            {
              id: "puraLlm" as const,
              label: t("settingsModal.sections.puraLlm.label"),
              icon: Sparkles,
              description: t("settingsModal.sections.puraLlm.description"),
              group: t("settingsModal.groups.account"),
            },
          ]),
      {
        id: "hotkeys",
        label: t("settingsModal.sections.hotkeys.label"),
        icon: Keyboard,
        description: t("settingsModal.sections.hotkeys.description"),
        group: t("settingsModal.groups.app"),
      },
      ...(isMnemoStandaloneProduct()
        ? []
        : [
            {
              id: "speechToText" as const,
              label: t("settingsModal.sections.speechToText.label"),
              icon: Mic,
              description: t("settingsModal.sections.speechToText.description"),
              group: t("settingsModal.groups.aiModels"),
            },
            {
              id: "llms" as const,
              label: t("settingsModal.sections.llms.label"),
              icon: Brain,
              description: t("settingsModal.sections.llms.description"),
              group: t("settingsModal.groups.aiModels"),
            },
          ]),
      {
        id: "privacyData",
        label: t("settingsModal.sections.privacyData.label"),
        icon: Shield,
        description: t("settingsModal.sections.privacyData.description"),
        group: t("settingsModal.groups.system"),
      },
      {
        id: "system",
        label: t("settingsModal.sections.system.label"),
        icon: Wrench,
        description: t("settingsModal.sections.system.description"),
        group: t("settingsModal.groups.system"),
      },
    ];
    const visible = isMnemoStandaloneProduct()
      ? items.filter((item) => !MNEMO_HIDDEN_SETTINGS_SECTIONS.has(item.id))
      : items;
    let result = isSignedIn ? visible : visible.filter((item) => item.id !== "workspace");
    if (isMnemoStandaloneProduct()) {
      const unifiedGroup = t("settingsModal.groups.all");
      const mnemoOrder: SettingsSectionType[] = [
        "general",
        "ai",
        "hotkeys",
        "privacyData",
        "system",
      ];
      result = mnemoOrder
        .map((id) => result.find((item) => item.id === id))
        .filter((item): item is SidebarItem<SettingsSectionType> => item != null)
        .map((item) => ({ ...item, group: unifiedGroup }));
    }
    return result;
  }, [t, isSignedIn]);

  const resolveSection = (section: string | undefined): SettingsSectionType => {
    if (!section) return isMnemoStandaloneProduct() ? "ai" : "account";
    const resolved = (SECTION_ALIASES[section] ?? section) as SettingsSectionType;
    if (isMnemoStandaloneProduct() && MNEMO_HIDDEN_SETTINGS_SECTIONS.has(resolved)) {
      return "general";
    }
    return resolved;
  };

  const [activeSection, setActiveSection] = React.useState<SettingsSectionType>(() =>
    resolveSection(initialSection)
  );
  const [initialSubTab, setInitialSubTab] = useState<string | undefined>(() =>
    initialSection ? LEGACY_SUB_TAB[initialSection] : undefined
  );
  const [prevOpen, setPrevOpen] = useState(open);

  if (open && !prevOpen && initialSection) {
    setPrevOpen(open);
    setActiveSection(resolveSection(initialSection));
    setInitialSubTab(LEGACY_SUB_TAB[initialSection]);
  } else if (open !== prevOpen) {
    setPrevOpen(open);
    if (!open) setInitialSubTab(undefined);
  }

  const handleSectionChange = (section: SettingsSectionType) => {
    setActiveSection(section);
    setInitialSubTab(undefined);
  };

  return (
    <SidebarModal<SettingsSectionType>
      open={open}
      onOpenChange={onOpenChange}
      title={t("settingsModal.title")}
      sidebarItems={sidebarItems}
      activeSection={activeSection}
      onSectionChange={handleSectionChange}
      header={
        !isMnemoStandaloneProduct() && isSignedIn && user ? (
          <div className="flex flex-col items-center gap-2 pb-2 text-center">
            <AccountAvatar image={user.image} name={user.name || t("settingsPage.account.user")} />
            <div className="min-w-0 w-full">
              <p dir="auto" className="text-[13px] font-semibold text-foreground truncate">
                {user.name || t("settingsPage.account.user")}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                <bdi dir="ltr">{user.email}</bdi>
              </p>
            </div>
          </div>
        ) : undefined
      }
      notice={
        policyManaged ? (
          <>
            <ShieldCheck className="h-4 w-4 shrink-0" />
            {t("settingsModal.managedByOrg")}
          </>
        ) : undefined
      }
    >
      <SettingsPage
        activeSection={activeSection}
        onNavigateToSection={handleSectionChange}
        initialSubTab={initialSubTab}
      />
    </SidebarModal>
  );
}
