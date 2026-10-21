const test = require("node:test");
const assert = require("node:assert/strict");

const load = () => import("../../src/helpers/agentNameDictionary.js");

// An empty delta means no write at all, which is what stops startup from
// touching the dictionary when the renderer cache is stale (#1295).
test("asks for no changes when the agent name is already present", async () => {
  const { agentNameDictionaryChanges } = await load();
  const result = agentNameDictionaryChanges(["Mnemo", "Alice", "Bob"], "Mnemo");
  assert.deepEqual(result, { add: [], remove: [] });
});

test("asks for no changes for a stale one-word cache that already has the name", async () => {
  const { agentNameDictionaryChanges } = await load();
  assert.deepEqual(agentNameDictionaryChanges(["Mnemo"], "Mnemo"), {
    add: [],
    remove: [],
  });
});

test("adds the agent name when missing, without naming other words", async () => {
  const { agentNameDictionaryChanges } = await load();
  assert.deepEqual(agentNameDictionaryChanges(["Alice"], "Mnemo"), {
    add: ["Mnemo"],
    remove: [],
  });
});

test("swaps the previous agent name for the new one on rename", async () => {
  const { agentNameDictionaryChanges } = await load();
  assert.deepEqual(agentNameDictionaryChanges(["Mnemo", "Alice"], "Jarvis", "Mnemo"), {
    add: ["Jarvis"],
    remove: ["Mnemo"],
  });
});

test("does not ask to remove an old name the dictionary never had", async () => {
  const { agentNameDictionaryChanges } = await load();
  assert.deepEqual(agentNameDictionaryChanges(["Jarvis", "Alice"], "Jarvis", "Mnemo"), {
    add: [],
    remove: [],
  });
});

test("ignores a blank agent name", async () => {
  const { agentNameDictionaryChanges } = await load();
  assert.deepEqual(agentNameDictionaryChanges(["Alice"], "   "), { add: [], remove: [] });
});

test("never names a word outside the agent name itself", async () => {
  const { agentNameDictionaryChanges } = await load();
  const dictionary = ["Mnemo", "Alice", "Bob", "Imported Term"];
  const { add, remove } = agentNameDictionaryChanges(dictionary, "Jarvis", "Mnemo");
  assert.deepEqual([...add, ...remove].sort(), ["Jarvis", "Mnemo"]);
});

test("does not add a case-variant of an agent name already in the dictionary", async () => {
  const { agentNameDictionaryChanges } = await load();
  assert.deepEqual(agentNameDictionaryChanges(["mnemo", "Alice"], "Mnemo"), {
    add: [],
    remove: [],
  });
});

test("removes the stored spelling when renaming away from a case-variant", async () => {
  const { agentNameDictionaryChanges } = await load();
  assert.deepEqual(agentNameDictionaryChanges(["mnemo", "Alice"], "Jarvis", "Mnemo"), {
    add: ["Jarvis"],
    remove: ["mnemo"],
  });
});

test("does not recase an existing agent name when only capitalization changes", async () => {
  const { agentNameDictionaryChanges } = await load();
  assert.deepEqual(agentNameDictionaryChanges(["Mnemo"], "mnemo", "Mnemo"), {
    add: [],
    remove: [],
  });
});

test("does not remove a padded stored agent name when the name is unchanged", async () => {
  const { agentNameDictionaryChanges } = await load();
  assert.deepEqual(agentNameDictionaryChanges([" Mnemo "], "Mnemo", "Mnemo"), {
    add: [],
    remove: [],
  });
});

test("removes the padded stored spelling when renaming away", async () => {
  const { agentNameDictionaryChanges } = await load();
  assert.deepEqual(agentNameDictionaryChanges([" Mnemo ", "Alice"], "Jarvis", "Mnemo"), {
    add: ["Jarvis"],
    remove: [" Mnemo "],
  });
});

test("does not remove agent name when only surrounding whitespace changes", async () => {
  const { agentNameDictionaryChanges } = await load();
  assert.deepEqual(agentNameDictionaryChanges(["Mnemo"], "  Mnemo  ", "Mnemo"), {
    add: [],
    remove: [],
  });
});

test("removes previous agent name when oldName contains surrounding whitespace", async () => {
  const { agentNameDictionaryChanges } = await load();
  assert.deepEqual(
    agentNameDictionaryChanges(["Mnemo", "Alice"], "Jarvis", "  Mnemo  "),
    {
      add: ["Jarvis"],
      remove: ["Mnemo"],
    }
  );
});
