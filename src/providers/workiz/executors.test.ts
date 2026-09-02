import { describe, expect, it } from "vitest";
import { credentialValidators } from "./executors.ts";
import { workizActionHandlers } from "./runtime.ts";

function actionContext(fetcher: typeof fetch) {
  return { apiKey: "workiz-token", fetcher };
}

describe("Workiz list actions", () => {
  it("normalizes a successful empty body to an empty job list", async () => {
    await expect(
      workizActionHandlers.list_jobs(
        {},
        actionContext(async () => new Response(null, { status: 200 })),
      ),
    ).resolves.toEqual({ jobs: [] });
  });

  it("normalizes a missing data field to an empty list", async () => {
    await expect(
      workizActionHandlers.list_leads(
        {},
        actionContext(async () => Response.json({ flag: true })),
      ),
    ).resolves.toEqual({ leads: [] });
  });

  it("normalizes an empty data array to an empty team list", async () => {
    await expect(
      workizActionHandlers.list_team_members(
        {},
        actionContext(async () => Response.json({ data: [] })),
      ),
    ).resolves.toEqual({ teamMembers: [] });
  });

  it("rejects a malformed non-empty data field", async () => {
    await expect(
      workizActionHandlers.list_jobs(
        {},
        actionContext(async () => Response.json({ data: { uuid: "job-1" } })),
      ),
    ).rejects.toMatchObject({
      status: 502,
      message: "workiz response did not include a record list",
    });
  });

  it("rejects a non-empty non-object list payload", async () => {
    await expect(
      workizActionHandlers.list_jobs(
        {},
        actionContext(async () => new Response("1", { status: 200 })),
      ),
    ).rejects.toMatchObject({
      status: 502,
      message: "workiz response did not include a record list",
    });
  });
});

describe("Workiz credential validation", () => {
  it("accepts HTTP success without requiring a non-empty team list", async () => {
    const result = await credentialValidators.apiKey!(
      { apiKey: "workiz-token", values: {} },
      {
        fetcher: async () => new Response(null, { status: 200 }),
      },
    );

    expect(result).toEqual({
      profile: { displayName: "Workiz API Token" },
      grantedScopes: [],
      metadata: { apiBaseUrl: "https://api.workiz.com/api/v1" },
    });
  });

  it("keeps unauthorized responses as credential errors", async () => {
    await expect(
      credentialValidators.apiKey!(
        { apiKey: "bad-token", values: {} },
        {
          fetcher: async () => Response.json({ message: "invalid token" }, { status: 401 }),
        },
      ),
    ).rejects.toMatchObject({
      status: 400,
      message: "invalid token",
    });
  });
});
