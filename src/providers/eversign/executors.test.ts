import { describe, expect, it } from "vitest";
import { credentialValidators } from "./executors.ts";
import { eversignActionHandlers } from "./runtime.ts";

const primaryBusiness = {
  business_id: 7,
  business_status: 1,
  business_identifier: "acme",
  business_name: "Acme",
  creation_time_stamp: 1_700_000_000,
  is_primary: 1,
};

function apiKeyOptions(fetcher: typeof fetch) {
  return { fetcher };
}

function actionContext(fetcher: typeof fetch) {
  return { apiKey: "eversign-key", fetcher };
}

describe("Eversign credential validation", () => {
  it("accepts a valid API key when the business list is empty", async () => {
    const result = await credentialValidators.apiKey!(
      { apiKey: "eversign-key", values: {} },
      {
        fetcher: async (url) => {
          expect(url.toString()).toContain("https://api.eversign.com/business");
          return Response.json([]);
        },
      },
    );

    expect(result).toEqual({
      profile: { accountId: "eversign", displayName: "Xodo Sign API Key" },
      grantedScopes: [],
      metadata: {
        apiBaseUrl: "https://api.eversign.com",
        validationEndpoint: "/business",
        businessCount: 0,
      },
    });
  });

  it("treats a successful empty body as an empty business list", async () => {
    const result = await credentialValidators.apiKey!(
      { apiKey: "eversign-key", values: {} },
      apiKeyOptions(async () => new Response(null, { status: 200 })),
    );

    expect(result).toMatchObject({
      profile: { accountId: "eversign", displayName: "Xodo Sign API Key" },
      metadata: { businessCount: 0 },
    });
  });

  it("treats no_businesses_found_for_user as an empty business list", async () => {
    const result = await credentialValidators.apiKey!(
      { apiKey: "eversign-key", values: {} },
      apiKeyOptions(async () =>
        Response.json({
          success: false,
          error: {
            type: "no_businesses_found_for_user",
            info: "Listing businesses for the user, but no businesses were found",
          },
        }),
      ),
    );

    expect(result).toMatchObject({
      profile: { accountId: "eversign" },
      metadata: { businessCount: 0 },
    });
  });

  it("still records the primary business when the list is populated", async () => {
    const result = await credentialValidators.apiKey!(
      { apiKey: "eversign-key", values: {} },
      apiKeyOptions(async () => Response.json([primaryBusiness])),
    );

    expect(result).toEqual({
      profile: { accountId: "7", displayName: "Acme" },
      grantedScopes: [],
      metadata: {
        apiBaseUrl: "https://api.eversign.com",
        validationEndpoint: "/business",
        primaryBusinessId: 7,
        primaryBusinessName: "Acme",
        businessCount: 1,
      },
    });
  });

  it("keeps invalid_access_key as a credential error", async () => {
    await expect(
      credentialValidators.apiKey!(
        { apiKey: "bad-key", values: {} },
        apiKeyOptions(async () =>
          Response.json({
            success: false,
            error: { type: "invalid_access_key", info: "Invalid access key" },
          }),
        ),
      ),
    ).rejects.toMatchObject({
      status: 400,
      message: "Invalid access key",
    });
  });

  it("rejects a malformed non-array business list payload", async () => {
    await expect(
      credentialValidators.apiKey!(
        { apiKey: "eversign-key", values: {} },
        apiKeyOptions(async () => Response.json({})),
      ),
    ).rejects.toMatchObject({
      status: 502,
      message: "Xodo Sign returned an invalid business list payload",
    });
  });
});

describe("Eversign list_businesses", () => {
  it("returns an empty list for a successful empty body", async () => {
    await expect(
      eversignActionHandlers.list_businesses(
        {},
        actionContext(async () => new Response(null, { status: 200 })),
      ),
    ).resolves.toEqual({ businesses: [] });
  });

  it("returns an empty list for no_businesses_found_for_user", async () => {
    await expect(
      eversignActionHandlers.list_businesses(
        {},
        actionContext(async () =>
          Response.json({
            success: false,
            error: {
              type: "no_businesses_found_for_user",
              info: "Listing businesses for the user, but no businesses were found",
            },
          }),
        ),
      ),
    ).resolves.toEqual({ businesses: [] });
  });

  it("rejects a malformed non-empty business list payload", async () => {
    await expect(
      eversignActionHandlers.list_businesses(
        {},
        actionContext(async () => Response.json({ businesses: [] })),
      ),
    ).rejects.toMatchObject({
      status: 502,
      message: "Xodo Sign returned an invalid business list payload",
    });
  });
});
