import type { CredentialValidators, ProviderExecutors } from "../../core/types.ts";

import { defineApiKeyProviderExecutors } from "../provider-runtime.ts";
import { discogsActionHandlers, validateDiscogsCredential } from "./runtime.ts";

const service = "discogs";

export const executors: ProviderExecutors = defineApiKeyProviderExecutors(service, discogsActionHandlers, {
  skipDnsValidation: true,
});

export const credentialValidators: CredentialValidators = {
  apiKey(input, { fetcher, signal }) {
    return validateDiscogsCredential(input.apiKey, fetcher, signal);
  },
};
