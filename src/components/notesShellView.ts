import { useTranslation } from "react-i18next";

export type NotesShellView = "notes" | "upload" | "integrations";

export function useNotesShellPageTitle(view: NotesShellView): string {
  const { t } = useTranslation();
  switch (view) {
    case "upload":
      return t("sidebar.upload");
    case "integrations":
      return t("sidebar.integrations");
    default:
      return "";
  }
}
