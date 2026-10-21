const assert = require("node:assert/strict");
const test = require("node:test");
const {
  buildNoteMarkdownExport,
  archiveyeExternalIdForNote,
} = require("../../src/helpers/noteExportContent.js");

test("buildNoteMarkdownExport prefers enhanced content", () => {
  const md = buildNoteMarkdownExport(
    { title: "Meet", content: "raw", enhanced_content: "clean" },
    { preferEnhanced: true }
  );
  assert.match(md, /^# Meet\n\nclean$/);
});

test("archiveyeExternalIdForNote is stable", () => {
  assert.equal(archiveyeExternalIdForNote(42), "mnemo:note:42");
});
