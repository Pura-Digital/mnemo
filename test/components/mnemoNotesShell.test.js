const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (relativePath) => fs.readFileSync(path.join(__dirname, "../..", relativePath), "utf8");

test("mnemo note-centric shell uses NotesAppSidebar and shell views", () => {
  const controlPanel = read("src/components/ControlPanel.tsx");
  const notesSidebar = read("src/components/notes/NotesAppSidebar.tsx");
  const personalNotes = read("src/components/notes/PersonalNotesView.tsx");

  assert.ok(controlPanel.includes("NotesAppSidebar"));
  assert.ok(controlPanel.includes('useState<NotesShellView>("notes")'));
  assert.ok(controlPanel.includes("DictionaryModal"));
  assert.ok(controlPanel.includes('shellView === "upload"'));
  assert.ok(controlPanel.includes('shellView === "integrations"'));
  assert.equal(personalNotes.includes("<SpacesTree"), false);
  assert.ok(notesSidebar.includes("<SpacesTree"));
  assert.ok(notesSidebar.includes("onOpenDictionary"));
});
