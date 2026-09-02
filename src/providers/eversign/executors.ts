import type { CredentialValidators, ProviderExecutors, ProviderProxyExecutor } from "../../core/types.ts";

import { defineApiKeyProviderExecutors, defineProviderProxy } from "../provider-runtime.ts";
import { eversignActionHandlers, eversignApiBaseUrl, validateEversignCredential } from "./runtime.ts";

const service = "eversign";

export const executors: ProviderExecutors = defineApiKeyProviderExecutors(service, eversignActionHandlers, {
  skipDnsValidation: true,
});

export const proxy: ProviderProxyExecutor = defineProviderProxy({
  service,
  baseUrl: eversignApiBaseUrl,
  auth: { type: "api_key_query", name: "access_key" },
  skipDnsValidation: true,
});

export const credentialValidators: CredentialValidators = {
  apiKey(input, { fetcher, signal }) {
    return validateEversignCredential(input.apiKey, fetcher, signal);
  },
};
