export {
  getPuraConnectClientOptions,
  getPuraConnectCallbackPathname,
  getPuraBrowserConnectionOptions,
  isPuraConnectCallbackLocation,
  isPuraConnectConfigured,
} from "./puraConnect";

/** @deprecated Use isPuraConnectConfigured */
export { isPuraConnectConfigured as isPuraClientConfigured } from "./puraConnect";

import { getPuraConnectClientOptions } from "./puraConnect";

/** Legacy constants — prefer getPuraConnectClientOptions() */
export const PURA_API_BASE = getPuraConnectClientOptions().apiBase;
export const PURA_CLIENT_ID = getPuraConnectClientOptions().clientId;
export const PURA_REDIRECT_URI = getPuraConnectClientOptions().redirectUri;
