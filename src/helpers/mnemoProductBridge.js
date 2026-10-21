/** Keep in sync with src/config/mnemoProduct.ts (main process cannot import TS). */
function isMnemoStandaloneProduct() {
  return true;
}

function isConversationalAgentEnabled() {
  return !isMnemoStandaloneProduct();
}

function isArchiveyeIntegrationEnabled() {
  return isMnemoStandaloneProduct();
}

function isSemanticSearchEnabled() {
  return isConversationalAgentEnabled();
}

module.exports = {
  isMnemoStandaloneProduct,
  isConversationalAgentEnabled,
  isArchiveyeIntegrationEnabled,
  isSemanticSearchEnabled,
};
