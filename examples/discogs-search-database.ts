import type { ExecutionContext, ResolvedCredential } from "../src/core/types.ts";

import { executors } from "../src/providers/discogs/executors.ts";

const accessToken = process.env.DISCOGS_TOKEN?.trim();

async function main(): Promise<void> {
  if (!accessToken) {
    console.log("Skip Discogs example: missing DISCOGS_TOKEN.");
    return;
  }

  const resolvedCredential: ResolvedCredential = {
    authType: "api_key",
    apiKey: accessToken,
    values: { apiKey: accessToken },
    profile: {
      accountId: "api_key",
      displayName: "Discogs Personal Access Token",
      grantedScopes: [],
    },
    metadata: {},
  };
  const context: ExecutionContext = {
    async getCredential(service) {
      return service === "discogs" ? resolvedCredential : undefined;
    },
  };

  const result = await executors["discogs.search_database"]!(
    {
      query: process.env.DISCOGS_SEARCH_QUERY?.trim() || "Nirvana",
    },
    context,
  );
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) {
    process.exitCode = 1;
  }
}

await main();
