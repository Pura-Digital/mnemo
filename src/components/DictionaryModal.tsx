import React from "react";
import { useTranslation } from "react-i18next";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "./icons";
import DictionaryView from "./DictionaryView";
import { useDismissGuard } from "./ui/useDismissGuard";

interface DictionaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DictionaryModal({ open, onOpenChange }: DictionaryModalProps) {
  const { t } = useTranslation();
  const { registerContent, shouldBlockDismiss } = useDismissGuard<HTMLDivElement>();

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/20 dark:bg-black/55 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          ref={registerContent}
          onInteractOutside={(e) => {
            if (shouldBlockDismiss(e)) e.preventDefault();
          }}
          className="fixed left-1/2 top-1/2 z-50 flex max-h-[min(720px,90vh)] w-[min(640px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-lg dark:border-white/10 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 dark:border-white/10">
            <DialogPrimitive.Title className="text-sm font-semibold text-foreground">
              {t("sidebar.dictionary")}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              type="button"
              aria-label={t("common.close")}
              className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <X className="size-4" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <DictionaryView />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
