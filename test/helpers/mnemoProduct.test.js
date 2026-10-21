const assert = require("node:assert/strict");
const test = require("node:test");

test("mnemo standalone product hides cloud upsell and hosted inference mode", async () => {
  const productMod = await import("../../src/config/mnemoProduct.ts");
  const {
    isMnemoStandaloneProduct,
    filterInferenceModeOptions,
    isConversationalAgentEnabled,
    isArchiveyeIntegrationEnabled,
    isSemanticSearchEnabled,
  } = productMod.default ?? productMod;
  const upsellMod = await import("../../src/lib/upsell.ts");
  const { decideUpsell } = upsellMod.default ?? upsellMod;
  const setupMod = await import("../../src/components/onboarding/setupEligibility.ts");
  const { getOnboardingSetupAvailability } = setupMod.default ?? setupMod;

  assert.equal(isMnemoStandaloneProduct(), true);
  assert.equal(isConversationalAgentEnabled(), false);
  assert.equal(isArchiveyeIntegrationEnabled(), true);
  assert.equal(isSemanticSearchEnabled(), false);
  assert.deepEqual(
    filterInferenceModeOptions([{ id: "pura" }, { id: "local" }]),
    [{ id: "local" }]
  );
  assert.equal(
    decideUpsell({
      authLoaded: true,
      isSignedIn: false,
      hasPaidAccess: false,
      isPastDue: false,
    }),
    "hide"
  );
  const availability = getOnboardingSetupAvailability({
    policy: { managed: false, policy: null },
    agentAllowed: true,
    transcriptionProviders: [{ id: "openai" }],
    llmProviders: [{ id: "openai" }],
  });
  assert.equal(availability.cloud, false);
});
