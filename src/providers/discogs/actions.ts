import type { ActionDefinition } from "../../core/types.ts";

import { s } from "../../core/json-schema.ts";
import { defineProviderAction } from "../../core/provider-definition.ts";

const service = "discogs";

const discogsIdSchema = (description: string) => s.positiveInteger(description);
const pageSchema = s.integer("One-based Discogs results page.", { minimum: 1 });
const perPageSchema = s.integer("Number of results per page. Discogs accepts values from 1 to 100.", {
  minimum: 1,
  maximum: 100,
});
const optionalStringField = (description: string) => s.string(description);
const optionalNumberField = (description: string) => s.number(description);
const optionalIntegerField = (description: string) => s.integer(description);

const searchTypeSchema = s.stringEnum("Discogs database record type to search.", [
  "release",
  "master",
  "artist",
  "label",
]);

const currencySchema = s.stringEnum("ISO currency code used for Discogs marketplace prices on a release.", [
  "USD",
  "GBP",
  "EUR",
  "CAD",
  "AUD",
  "JPY",
  "CHF",
  "MXN",
  "BRL",
  "NZD",
  "SEK",
  "ZAR",
]);

const artistReleaseSortSchema = s.stringEnum("Field used to sort an artist's releases.", ["year", "title", "format"]);
const sortOrderSchema = s.stringEnum("Sort direction for paginated Discogs lists.", ["asc", "desc"]);

const paginationSchema = s.looseRequiredObject(
  "Discogs pagination metadata. An empty result list is a valid response.",
  {
    page: optionalIntegerField("Current page number returned by Discogs."),
    pages: optionalIntegerField("Total number of pages returned by Discogs."),
    items: optionalIntegerField("Total number of matching items returned by Discogs."),
    per_page: optionalIntegerField("Page size used for this response."),
    urls: s.looseObject("Pagination URLs for first, prev, next, and last pages when Discogs provides them."),
  },
  { optional: ["page", "pages", "items", "per_page", "urls"] },
);

const namedResourceSchema = s.looseRequiredObject(
  "A Discogs resource with a numeric identifier.",
  {
    id: discogsIdSchema("Discogs numeric identifier."),
    name: optionalStringField("Display name returned by Discogs."),
    resource_url: optionalStringField("Discogs API URL for this resource."),
  },
  { optional: ["name", "resource_url"] },
);

const imageSchema = s.looseObject("An image attached to a Discogs database record.");
const artistCreditSchema = s.looseObject("An artist credit on a Discogs release or master.");
const labelCreditSchema = s.looseObject("A label credit on a Discogs release.");
const trackSchema = s.looseObject("A tracklist entry on a Discogs release or master.");

const searchResultSchema = s.looseRequiredObject(
  "A Discogs database search result. Search may return an empty results array.",
  {
    id: discogsIdSchema("Discogs identifier for this result."),
    type: optionalStringField("Result type, such as release, master, artist, or label."),
    title: optionalStringField("Title or name shown in search results."),
    year: optionalStringField("Release year when Discogs provides one. Search results return this as a string."),
    country: optionalStringField("Country associated with a release result."),
    catno: optionalStringField("Catalog number when Discogs provides one."),
    thumb: optionalStringField("Thumbnail image URL when Discogs provides one."),
    cover_image: optionalStringField("Cover image URL when Discogs provides one."),
    uri: optionalStringField("Site path or URL for this result."),
    resource_url: optionalStringField("Discogs API URL for this result."),
    master_id: optionalIntegerField("Master identifier when this result belongs to a master release."),
    master_url: optionalStringField("Discogs API URL for the related master release."),
    genre: s.stringArray("Genres associated with this result."),
    style: s.stringArray("Styles associated with this result."),
    format: s.stringArray("Formats associated with this result."),
    label: s.stringArray("Label names associated with this result."),
    barcode: s.stringArray("Barcodes associated with this result."),
    community: s.looseObject("Community have/want counts when Discogs provides them."),
  },
  {
    optional: [
      "type",
      "title",
      "year",
      "country",
      "catno",
      "thumb",
      "cover_image",
      "uri",
      "resource_url",
      "master_id",
      "master_url",
      "genre",
      "style",
      "format",
      "label",
      "barcode",
      "community",
    ],
  },
);

const searchOutputSchema = s.looseRequiredObject(
  "A paginated Discogs search response. An empty results array is a valid response.",
  {
    pagination: paginationSchema,
    results: s.array("Search results for this page. An empty array is valid when nothing matches.", searchResultSchema),
  },
  { optional: ["pagination"] },
);

const releaseDetailsSchema = s.looseRequiredObject(
  "Top-level Discogs release details.",
  {
    id: discogsIdSchema("Discogs release identifier."),
    title: optionalStringField("Release title."),
    year: optionalIntegerField("Release year."),
    released: optionalStringField("Released date string returned by Discogs."),
    released_formatted: optionalStringField("Formatted released date."),
    country: optionalStringField("Country of release."),
    status: optionalStringField("Release status, such as Accepted."),
    notes: optionalStringField("Release notes."),
    thumb: optionalStringField("Thumbnail image URL."),
    uri: optionalStringField("Discogs site URL for this release."),
    resource_url: optionalStringField("Discogs API URL for this release."),
    master_id: optionalIntegerField("Master identifier when this release belongs to a master."),
    master_url: optionalStringField("Discogs API URL for the related master release."),
    lowest_price: optionalNumberField("Lowest marketplace price in the requested or default currency."),
    num_for_sale: optionalIntegerField("Number of copies currently for sale."),
    estimated_weight: optionalIntegerField("Estimated weight in grams."),
    format_quantity: optionalIntegerField("Number of physical items in the release."),
    data_quality: optionalStringField("Discogs data-quality rating."),
    genres: s.stringArray("Genres associated with the release."),
    styles: s.stringArray("Styles associated with the release."),
    artists: s.array("Artists credited on the release.", artistCreditSchema),
    extraartists: s.array("Additional credited artists.", artistCreditSchema),
    labels: s.array("Labels credited on the release.", labelCreditSchema),
    companies: s.array("Companies associated with the release.", s.looseObject("A company credit.")),
    formats: s.array("Physical or digital formats.", s.looseObject("A format description.")),
    identifiers: s.array("Identifiers such as barcodes.", s.looseObject("A release identifier.")),
    images: s.array("Images attached to the release.", imageSchema),
    tracklist: s.array("Tracks on the release.", trackSchema),
    videos: s.array("Videos associated with the release.", s.looseObject("A related video.")),
    community: s.looseObject("Community rating and have/want counts."),
    series: s.array("Series this release belongs to.", s.looseObject("A series credit.")),
  },
  {
    optional: [
      "title",
      "year",
      "released",
      "released_formatted",
      "country",
      "status",
      "notes",
      "thumb",
      "uri",
      "resource_url",
      "master_id",
      "master_url",
      "lowest_price",
      "num_for_sale",
      "estimated_weight",
      "format_quantity",
      "data_quality",
      "genres",
      "styles",
      "artists",
      "extraartists",
      "labels",
      "companies",
      "formats",
      "identifiers",
      "images",
      "tracklist",
      "videos",
      "community",
      "series",
    ],
  },
);

const masterDetailsSchema = s.looseRequiredObject(
  "Top-level Discogs master release details.",
  {
    id: discogsIdSchema("Discogs master identifier."),
    title: optionalStringField("Master title."),
    year: optionalIntegerField("Year of the main release."),
    uri: optionalStringField("Discogs site URL for this master."),
    resource_url: optionalStringField("Discogs API URL for this master."),
    versions_url: optionalStringField("Discogs API URL for versions of this master."),
    main_release: optionalIntegerField("Discogs identifier of the main release."),
    main_release_url: optionalStringField("Discogs API URL for the main release."),
    lowest_price: optionalNumberField("Lowest marketplace price among versions."),
    num_for_sale: optionalIntegerField("Number of copies currently for sale across versions."),
    data_quality: optionalStringField("Discogs data-quality rating."),
    genres: s.stringArray("Genres associated with the master."),
    styles: s.stringArray("Styles associated with the master."),
    artists: s.array("Artists credited on the master.", artistCreditSchema),
    images: s.array("Images attached to the master.", imageSchema),
    tracklist: s.array("Tracks on the master.", trackSchema),
    videos: s.array("Videos associated with the master.", s.looseObject("A related video.")),
  },
  {
    optional: [
      "title",
      "year",
      "uri",
      "resource_url",
      "versions_url",
      "main_release",
      "main_release_url",
      "lowest_price",
      "num_for_sale",
      "data_quality",
      "genres",
      "styles",
      "artists",
      "images",
      "tracklist",
      "videos",
    ],
  },
);

const masterVersionSchema = s.looseRequiredObject(
  "One physical or digital version of a Discogs master release. The versions array may be empty.",
  {
    id: discogsIdSchema("Discogs release identifier for this version."),
    title: optionalStringField("Version title."),
    format: optionalStringField("Format summary, such as Vinyl or CD."),
    label: optionalStringField("Label name."),
    catno: optionalStringField("Catalog number."),
    country: optionalStringField("Country of release."),
    released: optionalStringField("Released year or date string."),
    status: optionalStringField("Release status, such as Accepted."),
    thumb: optionalStringField("Thumbnail image URL."),
    resource_url: optionalStringField("Discogs API URL for this version."),
    major_formats: s.stringArray("Major format names, such as Vinyl or CD."),
  },
  {
    optional: [
      "title",
      "format",
      "label",
      "catno",
      "country",
      "released",
      "status",
      "thumb",
      "resource_url",
      "major_formats",
    ],
  },
);

const masterVersionsOutputSchema = s.looseRequiredObject(
  "Paginated versions of a Discogs master release. An empty versions array is a valid response.",
  {
    pagination: paginationSchema,
    versions: s.array("Release versions for this page.", masterVersionSchema),
  },
  { optional: ["pagination"] },
);

const artistDetailsSchema = s.looseRequiredObject(
  "Top-level Discogs artist details.",
  {
    id: discogsIdSchema("Discogs artist identifier."),
    name: optionalStringField("Artist name."),
    realname: optionalStringField("Real name when Discogs provides one."),
    profile: optionalStringField("Artist biography or profile text."),
    uri: optionalStringField("Discogs site URL for this artist."),
    resource_url: optionalStringField("Discogs API URL for this artist."),
    releases_url: optionalStringField("Discogs API URL for this artist's releases."),
    data_quality: optionalStringField("Discogs data-quality rating."),
    namevariations: s.stringArray("Alternate names for this artist."),
    urls: s.stringArray("External URLs associated with the artist."),
    images: s.array("Images attached to the artist.", imageSchema),
    members: s.array("Band members when this artist is a group.", namedResourceSchema),
    aliases: s.array("Alias artist records.", namedResourceSchema),
    groups: s.array("Groups this artist belongs to.", namedResourceSchema),
  },
  {
    optional: [
      "name",
      "realname",
      "profile",
      "uri",
      "resource_url",
      "releases_url",
      "data_quality",
      "namevariations",
      "urls",
      "images",
      "members",
      "aliases",
      "groups",
    ],
  },
);

const artistReleaseSchema = s.looseRequiredObject(
  "A release or master associated with a Discogs artist. The releases array may be empty.",
  {
    id: discogsIdSchema("Discogs identifier for this release or master."),
    title: optionalStringField("Title."),
    artist: optionalStringField("Artist name as credited on this item."),
    year: optionalIntegerField("Release year."),
    type: optionalStringField("Item type, such as release or master."),
    role: optionalStringField("Artist role on this item, such as Main."),
    format: optionalStringField("Format summary when this item is a release."),
    label: optionalStringField("Label name when this item is a release."),
    status: optionalStringField("Release status when this item is a release."),
    thumb: optionalStringField("Thumbnail image URL."),
    resource_url: optionalStringField("Discogs API URL for this item."),
    main_release: optionalIntegerField("Main release identifier when this item is a master."),
  },
  {
    optional: [
      "title",
      "artist",
      "year",
      "type",
      "role",
      "format",
      "label",
      "status",
      "thumb",
      "resource_url",
      "main_release",
    ],
  },
);

const artistReleasesOutputSchema = s.looseRequiredObject(
  "A paginated list of Discogs releases and masters for an artist. An empty releases array is a valid response.",
  {
    pagination: paginationSchema,
    releases: s.array("Releases and masters for this page.", artistReleaseSchema),
  },
  { optional: ["pagination"] },
);

const labelDetailsSchema = s.looseRequiredObject(
  "Top-level Discogs label details.",
  {
    id: discogsIdSchema("Discogs label identifier."),
    name: optionalStringField("Label name."),
    profile: optionalStringField("Label profile text."),
    contact_info: optionalStringField("Public contact information."),
    uri: optionalStringField("Discogs site URL for this label."),
    resource_url: optionalStringField("Discogs API URL for this label."),
    releases_url: optionalStringField("Discogs API URL for this label's releases."),
    data_quality: optionalStringField("Discogs data-quality rating."),
    urls: s.stringArray("External URLs associated with the label."),
    images: s.array("Images attached to the label.", imageSchema),
    sublabels: s.array("Child labels.", namedResourceSchema),
    parent_label: s.looseObject("Parent label when Discogs provides one."),
  },
  {
    optional: [
      "name",
      "profile",
      "contact_info",
      "uri",
      "resource_url",
      "releases_url",
      "data_quality",
      "urls",
      "images",
      "sublabels",
      "parent_label",
    ],
  },
);

const searchInputSchema = s.object(
  "Input parameters for searching the Discogs database.",
  {
    query: s.nonEmptyString("Free-text search query sent to Discogs database search."),
    type: searchTypeSchema,
    artist: s.nonEmptyString("Optional artist-name filter applied together with the query."),
    year: s.nonEmptyString("Optional release-year filter, such as 1991."),
    page: pageSchema,
    perPage: perPageSchema,
  },
  { optional: ["type", "artist", "year", "page", "perPage"] },
);

const getReleaseInputSchema = s.object(
  "Input parameters for fetching one Discogs release.",
  {
    releaseId: discogsIdSchema("Discogs release identifier."),
    currency: currencySchema,
  },
  { optional: ["currency"] },
);

const getMasterInputSchema = s.requiredObject("Input parameters for fetching one Discogs master release.", {
  masterId: discogsIdSchema("Discogs master identifier."),
});

const getMasterVersionsInputSchema = s.object(
  "Input parameters for listing versions of a Discogs master release.",
  {
    masterId: discogsIdSchema("Discogs master identifier."),
    page: pageSchema,
    perPage: perPageSchema,
    format: s.nonEmptyString("Optional format filter, such as Vinyl."),
    country: s.nonEmptyString("Optional country filter, such as US."),
  },
  { optional: ["page", "perPage", "format", "country"] },
);

const getArtistInputSchema = s.requiredObject("Input parameters for fetching one Discogs artist.", {
  artistId: discogsIdSchema("Discogs artist identifier."),
});

const getArtistReleasesInputSchema = s.object(
  "Input parameters for listing releases associated with a Discogs artist.",
  {
    artistId: discogsIdSchema("Discogs artist identifier."),
    page: pageSchema,
    perPage: perPageSchema,
    sort: artistReleaseSortSchema,
    sortOrder: sortOrderSchema,
  },
  { optional: ["page", "perPage", "sort", "sortOrder"] },
);

const getLabelInputSchema = s.requiredObject("Input parameters for fetching one Discogs label.", {
  labelId: discogsIdSchema("Discogs label identifier."),
});

export const discogsActions: ActionDefinition[] = [
  defineProviderAction(service, {
    name: "search_database",
    description: "Search the Discogs database for releases, masters, artists, or labels.",
    inputSchema: searchInputSchema,
    outputSchema: searchOutputSchema,
    followUpActions: ["discogs.get_release", "discogs.get_master", "discogs.get_artist", "discogs.get_label"],
  }),
  defineProviderAction(service, {
    name: "get_release",
    description: "Get top-level Discogs details for one release by its Discogs identifier.",
    inputSchema: getReleaseInputSchema,
    outputSchema: releaseDetailsSchema,
    followUpActions: ["discogs.get_master", "discogs.get_artist", "discogs.get_label"],
  }),
  defineProviderAction(service, {
    name: "get_master",
    description: "Get top-level Discogs details for one master release by its Discogs identifier.",
    inputSchema: getMasterInputSchema,
    outputSchema: masterDetailsSchema,
    followUpActions: ["discogs.get_master_versions", "discogs.get_release"],
  }),
  defineProviderAction(service, {
    name: "get_master_versions",
    description: "List paginated release versions that belong to one Discogs master.",
    inputSchema: getMasterVersionsInputSchema,
    outputSchema: masterVersionsOutputSchema,
    followUpActions: ["discogs.get_release"],
  }),
  defineProviderAction(service, {
    name: "get_artist",
    description: "Get top-level Discogs details for one artist by their Discogs identifier.",
    inputSchema: getArtistInputSchema,
    outputSchema: artistDetailsSchema,
    followUpActions: ["discogs.get_artist_releases"],
  }),
  defineProviderAction(service, {
    name: "get_artist_releases",
    description: "List paginated releases and masters associated with one Discogs artist.",
    inputSchema: getArtistReleasesInputSchema,
    outputSchema: artistReleasesOutputSchema,
    followUpActions: ["discogs.get_release", "discogs.get_master"],
  }),
  defineProviderAction(service, {
    name: "get_label",
    description: "Get top-level Discogs details for one label by its Discogs identifier.",
    inputSchema: getLabelInputSchema,
    outputSchema: labelDetailsSchema,
  }),
];
