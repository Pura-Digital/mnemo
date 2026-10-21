const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const helperPath = require.resolve("../../src/helpers/linuxUrlSchemeHandler");
const originalLoad = Module._load;

const MANAGED_ENV = ["XDG_DATA_HOME", "APPIMAGE", "FLATPAK_ID"];
const HANDLER_FILE = "mnemo-url-handler.desktop";

// Assigning undefined to process.env coerces to the string "undefined".
function setEnv(name, value) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

function setProcessPath(name, value) {
  Object.defineProperty(process, name, { value, configurable: true, writable: true });
}

// Every test gets a private XDG data home, a packaged-looking execPath and a
// resources dir with no deb/rpm marker, so each case states only what differs.
function withInstall(fn) {
  return async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "mnemo-url-handler-test-"));
    const saved = Object.fromEntries(MANAGED_ENV.map((name) => [name, process.env[name]]));
    const savedExecPath = process.execPath;
    const savedResourcesPath = process.resourcesPath;
    MANAGED_ENV.forEach((name) => setEnv(name, undefined));
    process.env.XDG_DATA_HOME = path.join(root, "data");
    const resourcesPath = path.join(root, "install", "resources");
    fs.mkdirSync(resourcesPath, { recursive: true });
    setProcessPath("execPath", path.join(root, "install", "mnemo-app"));
    setProcessPath("resourcesPath", resourcesPath);
    try {
      await fn({ root, resourcesPath, applicationsDir: path.join(root, "data", "applications") });
    } finally {
      MANAGED_ENV.forEach((name) => setEnv(name, saved[name]));
      setProcessPath("execPath", savedExecPath);
      setProcessPath("resourcesPath", savedResourcesPath);
      fs.rmSync(root, { recursive: true, force: true });
    }
  };
}

// Stands in for xdg-utils: it keeps the scheme's default handler, so a query
// answers whatever the last `xdg-mime default` set.
function createXdg({ defaultHandler = "", missing = [], ignoresDefault = false } = {}) {
  const xdg = { defaultHandler };
  xdg.execFileSync = (command, args) => {
    if (missing.includes(command)) {
      throw Object.assign(new Error(`spawn ${command} ENOENT`), { code: "ENOENT" });
    }
    if (command === "xdg-mime" && args[0] === "query") return `${xdg.defaultHandler}\n`;
    if (command === "xdg-mime" && args[0] === "default" && !ignoresDefault) {
      xdg.defaultHandler = args[1];
    }
    return "";
  };
  return xdg;
}

function loadHelper(xdg) {
  delete require.cache[helperPath];
  Module._load = function loadWithStubs(request, parent, isMain) {
    if (request === "child_process") return { execFileSync: xdg.execFileSync };
    return originalLoad.call(this, request, parent, isMain);
  };
  try {
    return require(helperPath);
  } finally {
    Module._load = originalLoad;
  }
}

const readHandler = (applicationsDir) =>
  fs.readFileSync(path.join(applicationsDir, HANDLER_FILE), "utf8");

const execLine = (applicationsDir) => readHandler(applicationsDir).match(/^Exec=(.*)$/m)[1];

test(
  "the handler entry is hidden and declares only the scheme",
  withInstall(async ({ applicationsDir }) => {
    const { registerLinuxUrlSchemeHandler } = loadHelper(createXdg());
    process.env.APPIMAGE = "/home/user/Apps/Mnemo.AppImage";

    registerLinuxUrlSchemeHandler("mnemo", []);

    assert.equal(
      readHandler(applicationsDir),
      [
        "[Desktop Entry]",
        "Type=Application",
        "Name=mnemo",
        "Exec=/home/user/Apps/Mnemo.AppImage %U",
        "Terminal=false",
        "NoDisplay=true",
        "MimeType=x-scheme-handler/mnemo;",
        "",
      ].join("\n")
    );
  })
);

// Newer xdg-mime takes the first space-separated word of Exec as the program,
// quotes included, and refuses the entry if it is not executable. So a plain
// path stays bare and only a path the spec says must be quoted gets quotes.
test(
  "Exec quotes only arguments that need it and escapes percent signs",
  withInstall(async ({ applicationsDir }) => {
    const { registerLinuxUrlSchemeHandler } = loadHelper(createXdg());
    const cases = [
      ["/home/u/My Apps/Mnemo.AppImage", '"/home/u/My Apps/Mnemo.AppImage" %U'],
      ["/home/u/100%/Mnemo", "/home/u/100%%/Mnemo %U"],
      ['/home/u/"$HOME"/x', '"/home/u/\\"\\$HOME\\"/x" %U'],
    ];

    for (const [appImage, expected] of cases) {
      process.env.APPIMAGE = appImage;
      assert.deepEqual(registerLinuxUrlSchemeHandler("mnemo", []), { registered: true });
      assert.equal(execLine(applicationsDir), expected);
    }
  })
);

test(
  "Flatpak and Nix installs are left to their own desktop entry",
  withInstall(async ({ applicationsDir }) => {
    const xdg = createXdg();
    const { registerLinuxUrlSchemeHandler } = loadHelper(xdg);

    process.env.FLATPAK_ID = "com.pura.mnemo";
    assert.deepEqual(registerLinuxUrlSchemeHandler("mnemo", []), { registered: false });
    setEnv("FLATPAK_ID", undefined);

    // The Nix package wraps the AppImage, so APPIMAGE may be set too.
    process.env.APPIMAGE = "/nix/store/abc-mnemo/Mnemo.AppImage";
    setProcessPath("execPath", "/nix/store/abc-mnemo-extracted/mnemo-app");
    assert.deepEqual(registerLinuxUrlSchemeHandler("mnemo", []), { registered: false });

    assert.equal(xdg.defaultHandler, "");
    assert.equal(fs.existsSync(applicationsDir), false);
  })
);

test(
  "an AppImage writes its handler at the stable AppImage path and makes it the default",
  withInstall(async ({ applicationsDir }) => {
    const xdg = createXdg({ defaultHandler: "mnemo.desktop" });
    const { registerLinuxUrlSchemeHandler } = loadHelper(xdg);
    process.env.APPIMAGE = "/home/user/Applications/Mnemo.AppImage";

    assert.deepEqual(registerLinuxUrlSchemeHandler("mnemo", []), { registered: true });

    assert.equal(execLine(applicationsDir), `${process.env.APPIMAGE} %U`);
    assert.equal(xdg.defaultHandler, HANDLER_FILE);
  })
);

test(
  "a tar.gz points its handler at the launcher wrapper beside the binary",
  withInstall(async ({ root, applicationsDir }) => {
    const { registerLinuxUrlSchemeHandler } = loadHelper(createXdg());
    fs.writeFileSync(path.join(root, "install", "mnemo"), "#!/bin/bash\n");

    assert.deepEqual(registerLinuxUrlSchemeHandler("mnemo", []), { registered: true });

    const wrapper = path.join(root, "install", "mnemo");
    assert.equal(execLine(applicationsDir), `${wrapper} %U`);
  })
);

test(
  "development and staging get their own handler for their own scheme",
  withInstall(async ({ applicationsDir }) => {
    const xdg = createXdg();
    const { registerLinuxUrlSchemeHandler } = loadHelper(xdg);
    setProcessPath("execPath", "/repo/node_modules/electron/dist/electron");

    assert.deepEqual(registerLinuxUrlSchemeHandler("mnemo-staging", ["/repo"]), {
      registered: true,
    });

    const entry = fs.readFileSync(
      path.join(applicationsDir, "mnemo-staging-url-handler.desktop"),
      "utf8"
    );
    assert.match(entry, /^Exec=\/repo\/node_modules\/electron\/dist\/electron \/repo %U$/m);
    assert.match(entry, /^MimeType=x-scheme-handler\/mnemo-staging;$/m);
    assert.equal(xdg.defaultHandler, "mnemo-staging-url-handler.desktop");
  })
);

test(
  "a second launch keeps the same entry and default",
  withInstall(async ({ applicationsDir }) => {
    const xdg = createXdg();
    const { registerLinuxUrlSchemeHandler } = loadHelper(xdg);
    process.env.APPIMAGE = "/home/user/Applications/Mnemo.AppImage";
    registerLinuxUrlSchemeHandler("mnemo", []);
    const firstEntry = readHandler(applicationsDir);

    assert.deepEqual(registerLinuxUrlSchemeHandler("mnemo", []), { registered: true });

    assert.equal(readHandler(applicationsDir), firstEntry);
    assert.equal(xdg.defaultHandler, HANDLER_FILE);
  })
);

test(
  "moving the AppImage re-points the handler",
  withInstall(async ({ applicationsDir }) => {
    const xdg = createXdg();
    const { registerLinuxUrlSchemeHandler } = loadHelper(xdg);
    process.env.APPIMAGE = "/home/user/Downloads/Mnemo.AppImage";
    registerLinuxUrlSchemeHandler("mnemo", []);

    process.env.APPIMAGE = "/home/user/Applications/Mnemo.AppImage";
    assert.deepEqual(registerLinuxUrlSchemeHandler("mnemo", []), { registered: true });

    assert.equal(execLine(applicationsDir), `${process.env.APPIMAGE} %U`);
    assert.equal(xdg.defaultHandler, HANDLER_FILE);
  })
);

test(
  "a deb or rpm install writes no entry and leaves another default alone",
  withInstall(async ({ resourcesPath, applicationsDir }) => {
    const xdg = createXdg({ defaultHandler: "other.desktop" });
    const { registerLinuxUrlSchemeHandler } = loadHelper(xdg);
    fs.writeFileSync(path.join(resourcesPath, "package-type"), "rpm");

    assert.deepEqual(registerLinuxUrlSchemeHandler("mnemo", []), { registered: false });

    assert.equal(xdg.defaultHandler, "other.desktop");
    assert.equal(fs.existsSync(applicationsDir), false);
  })
);

// In xdg-utils' generic mode, xdg-settings would revert to the AppImage's entry,
// which stops working once the AppImage is deleted.
test(
  "a deb or rpm install takes the default back from an AppImage's entry",
  withInstall(async ({ resourcesPath }) => {
    const xdg = createXdg({ defaultHandler: HANDLER_FILE });
    const { registerLinuxUrlSchemeHandler } = loadHelper(xdg);
    fs.writeFileSync(path.join(resourcesPath, "package-type"), "deb");

    assert.deepEqual(registerLinuxUrlSchemeHandler("mnemo", []), { registered: false });

    assert.equal(xdg.defaultHandler, "mnemo.desktop");
  })
);

test(
  "a missing update-desktop-database does not stop registration",
  withInstall(async () => {
    const xdg = createXdg({ missing: ["update-desktop-database"] });
    const { registerLinuxUrlSchemeHandler } = loadHelper(xdg);

    assert.deepEqual(registerLinuxUrlSchemeHandler("mnemo", []), { registered: true });
    assert.equal(xdg.defaultHandler, HANDLER_FILE);
  })
);

test(
  "without xdg-mime it reports not registered with the reason instead of throwing",
  withInstall(async () => {
    const xdg = createXdg({ missing: ["xdg-mime"] });
    const { registerLinuxUrlSchemeHandler } = loadHelper(xdg);

    const result = registerLinuxUrlSchemeHandler("mnemo", []);

    assert.equal(result.registered, false);
    assert.match(result.reason, /ENOENT/);
  })
);

test(
  "an unwritable data directory reports not registered with the reason instead of throwing",
  withInstall(async ({ root }) => {
    const xdg = createXdg();
    const { registerLinuxUrlSchemeHandler } = loadHelper(xdg);
    // A file where the directory should be fails the same way a read-only home does.
    fs.writeFileSync(path.join(root, "data"), "");

    const result = registerLinuxUrlSchemeHandler("mnemo", []);

    assert.equal(result.registered, false);
    assert.ok(result.reason);
    assert.equal(xdg.defaultHandler, "");
  })
);

test(
  "a default that will not stick is reported as not registered",
  withInstall(async () => {
    const xdg = createXdg({ defaultHandler: "other.desktop", ignoresDefault: true });
    const { registerLinuxUrlSchemeHandler } = loadHelper(xdg);

    assert.deepEqual(registerLinuxUrlSchemeHandler("mnemo", []), {
      registered: false,
      reason: "default stayed other.desktop",
    });
  })
);
