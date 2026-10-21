const test = require("node:test");
const assert = require("node:assert/strict");
const { appKeyFromExecutablePath } = require("../../src/helpers/processAppIdentity");

test("nested helpers resolve to the outermost app bundle", () => {
  assert.equal(
    appKeyFromExecutablePath(
      "/Applications/Google Chrome.app/Contents/Frameworks/Google Chrome Framework.framework/Versions/155.0.8059.84/Helpers/Google Chrome Helper (Aperitif).app/Contents/MacOS/Google Chrome Helper (Aperitif)\n"
    ),
    "/Applications/Google Chrome.app"
  );
  assert.equal(
    appKeyFromExecutablePath(
      "/Applications/Microsoft Teams.app/Contents/Helpers/Microsoft Teams WebView.app/Contents/MacOS/Microsoft Teams WebView"
    ),
    "/Applications/Microsoft Teams.app"
  );
});

test("executables outside a bundle keep their own path; empty output is unknown", () => {
  assert.equal(appKeyFromExecutablePath("/usr/local/bin/sox"), "/usr/local/bin/sox");
  assert.equal(appKeyFromExecutablePath("  \n"), null);
  assert.equal(appKeyFromExecutablePath(undefined), null);
});
