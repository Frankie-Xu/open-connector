import type { CredentialValidationResult } from "../../core/types.ts";
import type { ProviderActionHandlers } from "../provider-runtime.ts";
import type { ApiKeyProviderContext, ProviderFetch } from "../provider-runtime.ts";

import { CastError, optionalInteger, optionalString, positiveInteger, requiredString } from "../../core/cast.ts";
import { encodePathSegment } from "../../core/request.ts";
import { objectPayload, requestJson } from "../http-json-runtime.ts";
import { ProviderRequestError } from "../provider-runtime.ts";

const discogsApiBaseUrl = "https://api.discogs.com";
const discogsIdentityPath = "/oauth/identity";
const discogsUserAgent = "oomol-connect-discogs/0.1 +https://github.com/oomol-lab/open-connector";

const searchTypes = ["release", "master", "artist", "label"];
const currencies = ["USD", "GBP", "EUR", "CAD", "AUD", "JPY", "CHF", "MXN", "BRL", "NZD", "SEK", "ZAR"];
const artistReleaseSorts = ["year", "title", "format"];
const sortOrders = ["asc", "desc"];

type DiscogsActionHandler = (input: Record<string, unknown>, context: ApiKeyProviderContext) => Promise<unknown>;
type DiscogsRequestContext = Pick<ApiKeyProviderContext, "apiKey" | "fetcher" | "signal">;

export const discogsActionHandlers: ProviderActionHandlers<"discogs", DiscogsActionHandler> = {
  search_database(input, context) {
    return discogsGet("/database/search", context, {
      q: requiredString(input.query, "query"),
      type: optionalAllowedString(input.type, "type", searchTypes),
      artist: optionalString(input.artist),
      year: optionalString(input.year),
      page: optionalInteger(input.page),
      per_page: optionalInteger(input.perPage),
    });
  },
  get_release(input, context) {
    return discogsGet(`/releases/${encodePathSegment(positiveInteger(input.releaseId, "releaseId"))}`, context, {
      curr_abbr: optionalAllowedString(input.currency, "currency", currencies),
    });
  },
  get_master(input, context) {
    return discogsGet(`/masters/${encodePathSegment(positiveInteger(input.masterId, "masterId"))}`, context);
  },
  get_master_versions(input, context) {
    return discogsGet(`/masters/${encodePathSegment(positiveInteger(input.masterId, "masterId"))}/versions`, context, {
      page: optionalInteger(input.page),
      per_page: optionalInteger(input.perPage),
      format: optionalString(input.format),
      country: optionalString(input.country),
    });
  },
  get_artist(input, context) {
    return discogsGet(`/artists/${encodePathSegment(positiveInteger(input.artistId, "artistId"))}`, context);
  },
  get_artist_releases(input, context) {
    return discogsGet(`/artists/${encodePathSegment(positiveInteger(input.artistId, "artistId"))}/releases`, context, {
      page: optionalInteger(input.page),
      per_page: optionalInteger(input.perPage),
      sort: optionalAllowedString(input.sort, "sort", artistReleaseSorts),
      sort_order: optionalAllowedString(input.sortOrder, "sortOrder", sortOrders),
    });
  },
  get_label(input, context) {
    return discogsGet(`/labels/${encodePathSegment(positiveInteger(input.labelId, "labelId"))}`, context);
  },
};

export async function validateDiscogsCredential(
  apiKey: string,
  fetcher: ProviderFetch,
  signal?: AbortSignal,
): Promise<CredentialValidationResult> {
  const payload = await discogsGet(discogsIdentityPath, { apiKey, fetcher, signal }, undefined, "validate");
  const record = objectPayload(payload, "Discogs identity");
  const accountId = optionalInteger(record.id);
  const displayName = optionalString(record.username);
  if (accountId === undefined || displayName === undefined) {
    throw new ProviderRequestError(502, "Discogs identity did not include id and username", payload);
  }

  return {
    profile: {
      accountId: String(accountId),
      displayName,
    },
    grantedScopes: [],
    metadata: {
      apiBaseUrl: discogsApiBaseUrl,
      validationEndpoint: discogsIdentityPath,
      resourceUrl: optionalString(record.resource_url),
    },
  };
}

async function discogsGet(
  path: string,
  context: DiscogsRequestContext,
  query?: Record<string, string | number | boolean | undefined>,
  phase: "validate" | "execute" = "execute",
): Promise<unknown> {
  return requestJson({
    providerName: "Discogs",
    baseUrl: discogsApiBaseUrl,
    path,
    fetcher: context.fetcher,
    signal: context.signal,
    query,
    phase,
    headers: {
      authorization: `Discogs token=${context.apiKey}`,
      "user-agent": discogsUserAgent,
    },
  });
}

function optionalAllowedString(value: unknown, fieldName: string, allowed: readonly string[]): string | undefined {
  const raw = optionalString(value);
  if (raw === undefined) {
    return undefined;
  }
  if (allowed.includes(raw)) {
    return raw;
  }

  throw new CastError(`${fieldName} must be one of: ${allowed.join(", ")}`);
}
