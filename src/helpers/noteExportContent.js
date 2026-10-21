/**
 * Markdown body for note file export and ArchivEye upload (matches export-note IPC).
 */
function buildNoteMarkdownExport(note, { preferEnhanced = true } = {}) {
  const body =
    preferEnhanced && note.enhanced_content
      ? note.enhanced_content
      : note.enhanced_content || note.content || "";
  const title = note.title || "Untitled Note";
  return `# ${title}\n\n${body}`.trim();
}

function buildNotePlainExport(note) {
  const markdown = buildNoteMarkdownExport(note);
  return markdown
    .replace(/#{1,6}\s+/g, "")
    .replace(/[*_~`]+/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/^>\s+/gm, "")
    .trim();
}

function archiveyeExternalIdForNote(noteId) {
  return `mnemo:note:${noteId}`;
}

module.exports = {
  buildNoteMarkdownExport,
  buildNotePlainExport,
  archiveyeExternalIdForNote,
};
