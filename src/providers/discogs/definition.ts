import type { ProviderDefinition } from "../../core/types.ts";

import { discogsActions } from "./actions.ts";

const service = "discogs";

export const provider: ProviderDefinition = {
  service,
  displayName: "Discogs",
  description: "Search and look up releases, masters, artists, and labels in the Discogs music database.",
  categories: ["Data"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "Personal Access Token",
      placeholder: "DISCOGS_TOKEN",
      description:
        "Discogs personal access token sent as an Authorization Discogs token header. Create or copy it from Discogs Developer Settings: https://www.discogs.com/settings/developers. Use a personal access token, not an OAuth consumer key.",
    },
  ],
  homepageUrl: "https://www.discogs.com",
  actions: discogsActions,
};
