import React from "react";
import { useTranslation } from "react-i18next";
import mnemoLogo from "../../assets/logo.svg";
import { BookOpen, Blocks, Settings, HelpCircle, Sparkles, Upload } from "../icons";
import { cn } from "../lib/utils";
import { useNativeGlass } from "../../hooks/useNativeGlass";
import { resolveWindowChromeSurface } from "../ui/glass";
import SupportDropdown from "../ui/SupportDropdown";
import SpacesTree from "./SpacesTree";
import { useNotesSidebarHandlersStore } from "../../stores/notesSidebarHandlersStore";
import { usePolicyStore } from "../../stores/policyStore";
import { isPolicyActionAllowed } from "../../stores/policyRules";

const rowIconClass =
  "shrink-0 text-foreground/70 group-hover:text-foreground/90 dark:text-foreground/65 dark:group-hover:text-foreground/85 transition-colors duration-150";
const rowLabelClass =
  "text-[13px] text-foreground/90 group-hover:text-foreground dark:text-foreground/85 dark:group-hover:text-foreground transition-colors duration-150";
const rowButtonClass =
  "group flex items-center gap-2.5 w-full h-8 px-2.5 rounded-md text-start outline-none hover:bg-foreground/4 dark:hover:bg-white/4 focus-visible:ring-1 focus-visible:ring-primary/30 transition-colors duration-150";

interface NotesAppSidebarProps {
  onOpenDictionary: () => void;
  onOpenUpload: () => void;
  onOpenIntegrations: () => void;
  onOpenSettings: () => void;
  className?: string;
}

export default function NotesAppSidebar({
  onOpenDictionary,
  onOpenUpload,
  onOpenIntegrations,
  onOpenSettings,
  className,
}: NotesAppSidebarProps) {
  const nativeGlass = useNativeGlass();
  const { t } = useTranslation();
  const handlers = useNotesSidebarHandlersStore((s) => s.handlers);
  const policyActionsAllowed = usePolicyStore((state) => isPolicyActionAllowed(state));

  return (
    <aside
      className={cn(
        "w-52 shrink-0 flex flex-col h-full border-e border-border dark:border-white/10",
        resolveWindowChromeSurface(nativeGlass),
        className
      )}
    >
      <div
        className="w-full h-10 shrink-0"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      />

      <div className="flex items-center gap-2 px-3 pb-2" aria-label="mnemo">
        <img
          src={mnemoLogo}
          alt=""
          width={28}
          height={28}
          decoding="async"
          draggable={false}
          className="size-7 object-contain"
        />
        <span className="onboarding-display-title text-xl font-bold tracking-tight text-foreground">
          mnemo
        </span>
      </div>

      <div className="px-2 pt-1 pb-1 shrink-0 space-y-0.5">
        <button
          type="button"
          onClick={() => handlers?.onOpenActionManager()}
          disabled={!handlers}
          className={cn(
            "flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs",
            "text-foreground/85 hover:text-foreground hover:bg-foreground/5",
            "transition-colors duration-150",
            "focus:outline-none focus-visible:ring-1 focus-visible:ring-ring/30",
            !handlers && "opacity-50 pointer-events-none"
          )}
        >
          <Sparkles size={14} className="shrink-0" />
          {t("notes.sidebar.actions")}
        </button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col px-0">
        {handlers ? (
          <SpacesTree
            onDeleteNote={handlers.onDeleteNote}
            onMoveNote={handlers.onMoveNote}
            onCreateFolderAndMove={handlers.onCreateFolderAndMove}
            onNewNote={handlers.onNewNote}
            onShowStructureIntro={handlers.onShowStructureIntro}
          />
        ) : (
          <div className="flex-1" aria-hidden="true" />
        )}
      </div>

      <div className="px-2 pb-2 pt-1 space-y-0.5 shrink-0">
        <button
          type="button"
          onClick={onOpenDictionary}
          aria-label={t("sidebar.dictionary")}
          className={rowButtonClass}
        >
          <BookOpen size={16} className={rowIconClass} />
          <span className={rowLabelClass}>{t("sidebar.dictionary")}</span>
        </button>

        {policyActionsAllowed && (
          <button
            type="button"
            onClick={onOpenUpload}
            aria-label={t("sidebar.upload")}
            className={rowButtonClass}
          >
            <Upload size={16} className={rowIconClass} />
            <span className={rowLabelClass}>{t("sidebar.upload")}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenIntegrations}
          aria-label={t("sidebar.integrations")}
          className={rowButtonClass}
        >
          <Blocks size={16} className={rowIconClass} />
          <span className={rowLabelClass}>{t("sidebar.integrations")}</span>
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          aria-label={t("sidebar.settings")}
          className={rowButtonClass}
        >
          <Settings size={16} className={rowIconClass} />
          <span className={rowLabelClass}>{t("sidebar.settings")}</span>
        </button>

        <SupportDropdown
          trigger={
            <button type="button" aria-label={t("sidebar.support")} className={rowButtonClass}>
              <HelpCircle size={16} className={rowIconClass} />
              <span className={rowLabelClass}>{t("sidebar.support")}</span>
            </button>
          }
        />
      </div>
    </aside>
  );
}
