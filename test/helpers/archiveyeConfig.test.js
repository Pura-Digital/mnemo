const { describe, it } = require("node:test");
const assert = require("node:assert");

describe("archiveyeConfig OIDC URLs", () => {
  it("builds Keycloak authorize and token endpoints from issuer", () => {
    process.env.ARCHIVEYE_OIDC_ISSUER = "http://localhost:8081/realms/archiveye-dev";
    delete process.env.ARCHIVEYE_TOKEN_URL;
    delete require.cache[require.resolve("../../src/helpers/archiveyeConfig.js")];
    const config = require("../../src/helpers/archiveyeConfig.js");
    assert.equal(
      config.getAuthorizeUrl(),
      "http://localhost:8081/realms/archiveye-dev/protocol/openid-connect/auth"
    );
    assert.equal(
      config.getTokenUrl(),
      "http://localhost:8081/realms/archiveye-dev/protocol/openid-connect/token"
    );
    assert.equal(config.getApiBaseUrl(), "https://data.archiveye.ai/api");
  });
});
