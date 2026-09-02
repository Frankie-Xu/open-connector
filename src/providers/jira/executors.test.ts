import type { ResolvedCredential } from "../../core/types.ts";

import { describe, expect, it } from "vitest";
import { credentialValidators } from "./executors.ts";
import { jiraReadUserScope, jiraReadWorkScope, jiraWriteWorkScope } from "./scopes.ts";

const oauthCredential: Extract<ResolvedCredential, { authType: "oauth2" }> = {
  authType: "oauth2",
  accessToken: "jira-oauth-token",
  tokenType: "Bearer",
  profile: { accountId: "oauth2", displayName: "OAuth Credential", grantedScopes: [] },
  metadata: {},
};

describe("Jira OAuth credential validation", () => {
  it("discovers the authorized Jira Cloud site", async () => {
    const calls: string[] = [];
    const result = await credentialValidators.oauth2!(oauthCredential, {
      fetcher: async (input) => {
        calls.push(String(input));
        return Response.json([
          {
            id: "cloud-123",
            name: "Engineering",
            url: "https://eng.atlassian.net",
            scopes: [jiraReadWorkScope, jiraWriteWorkScope],
            avatarUrl: "https://eng.atlassian.net/avatar.png",
          },
        ]);
      },
    });

    expect(calls).toEqual(["https://api.atlassian.com/oauth/token/accessible-resources"]);
    expect(result).toMatchObject({
      profile: { accountId: "jira:cloud-123", displayName: "Engineering" },
      grantedScopes: [jiraReadWorkScope, jiraReadUserScope, jiraWriteWorkScope],
      metadata: {
        cloudId: "cloud-123",
        siteUrl: "https://eng.atlassian.net",
        apiBaseUrl: "https://api.atlassian.com/ex/jira/cloud-123/rest/api/3",
        validationEndpoint: "/oauth/token/accessible-resources",
      },
    });
  });

  it("accepts a token with no accessible Jira site and leaves cloudId unset", async () => {
    const result = await credentialValidators.oauth2!(oauthCredential, {
      fetcher: async () => Response.json([]),
    });

    expect(result).toEqual({
      profile: { accountId: "jira", displayName: "Jira" },
      grantedScopes: [],
      metadata: {
        resourceCount: 0,
        validationEndpoint: "/oauth/token/accessible-resources",
      },
    });
  });

  it("accepts sites that do not include Jira product scopes and leaves cloudId unset", async () => {
    const result = await credentialValidators.oauth2!(oauthCredential, {
      fetcher: async () =>
        Response.json([
          {
            id: "cloud-docs",
            name: "Docs",
            url: "https://docs.atlassian.net",
            scopes: ["read:page:confluence"],
          },
        ]),
    });

    expect(result).toEqual({
      profile: { accountId: "jira", displayName: "Jira" },
      grantedScopes: [],
      metadata: {
        resourceCount: 1,
        validationEndpoint: "/oauth/token/accessible-resources",
      },
    });
  });

  it("requires explicit selection when authorization covers multiple Jira sites", async () => {
    await expect(
      credentialValidators.oauth2!(oauthCredential, {
        fetcher: async () =>
          Response.json([
            { id: "cloud-1", url: "https://one.atlassian.net", scopes: [jiraReadWorkScope] },
            { id: "cloud-2", url: "https://two.atlassian.net", scopes: [jiraReadWorkScope] },
          ]),
      }),
    ).rejects.toMatchObject({ status: 400, message: expect.stringContaining("multiple Jira sites") });
  });

  it("rejects a malformed non-array accessible-resources payload", async () => {
    await expect(
      credentialValidators.oauth2!(oauthCredential, {
        fetcher: async () => Response.json({}),
      }),
    ).rejects.toMatchObject({
      status: 502,
      message: "jira accessible-resources response must be an array",
    });
  });

  it("rejects a successful empty body as a malformed accessible-resources payload", async () => {
    await expect(
      credentialValidators.oauth2!(oauthCredential, {
        fetcher: async () => new Response(null, { status: 200 }),
      }),
    ).rejects.toMatchObject({
      status: 502,
      message: "jira accessible-resources response must be an array",
    });
  });
});
