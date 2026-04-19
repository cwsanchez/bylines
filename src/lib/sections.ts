/**
 * Section configuration for Pulse.
 *
 * Each section has:
 *  - id: stable slug used in URLs, storage keys, and the DB.
 *  - name / tagline: UI labels.
 *  - group: "core" (always-on) or "state" (lazy-added US state).
 *  - query: an X API v2 recent search query tuned to surface high-signal,
 *    verified-source news. Queries intentionally avoid retweets and replies
 *    and prefer posts that link out or include media.
 *
 * To add a new section, add an entry here and (if it's not core) expose it
 * via the "Add section" modal. No DB migration required - the `posts` table
 * is keyed by the section id.
 */

export type SectionGroup = "core" | "state";

export interface SectionConfig {
  id: string;
  name: string;
  tagline: string;
  group: SectionGroup;
  query: string;
  /** Optional emoji or short symbol for compact UI surfaces. */
  glyph?: string;
}

/**
 * Shared modifiers applied to every query. X search query operators:
 *   -is:retweet -is:reply  => only original posts
 *   lang:en                => English only
 *   (has:links OR has:media) => posts that look like news not banter
 *
 * Keeping this in one place makes it easy to tune surface-level quality.
 */
export const QUERY_MODIFIERS =
  "-is:retweet -is:reply -is:nullcast lang:en (has:links OR has:media)";

function buildQuery(core: string): string {
  return `(${core}) ${QUERY_MODIFIERS}`;
}

/**
 * Curated list of high-signal verified accounts per topic.
 * Using `from:` keeps results clean while keyword fallbacks catch breaking items.
 */
const INTL_SOURCES = [
  "Reuters",
  "AP",
  "BBCWorld",
  "AFP",
  "AJEnglish",
  "FinancialTimes",
  "guardian",
  "WSJ",
  "NYTimes",
  "washingtonpost",
  "business",
  "Bloomberg",
];

const US_SOURCES = [
  "AP",
  "Reuters",
  "NYTimes",
  "washingtonpost",
  "WSJ",
  "CNN",
  "NBCNews",
  "ABC",
  "CBSNews",
  "nprpolitics",
  "politico",
  "axios",
];

const FOREIGN_POLICY_SOURCES = [
  "StateDept",
  "ForeignPolicy",
  "CFR_org",
  "CSIS",
  "BrookingsFP",
  "RANDCorporation",
  "ChathamHouse",
  "Atlantic_Council",
  "WarOnTheRocks",
  "DefenseOne",
];

const CYBER_SOURCES = [
  "campuscodi",
  "briankrebs",
  "TheHackersNews",
  "BleepinComputer",
  "SecurityWeek",
  "DarkReading",
  "CISAgov",
  "NSAGov",
  "Mandiant",
  "Microsoft",
  "GoogleTAG",
];

const TECH_SOURCES = [
  "TechCrunch",
  "verge",
  "arstechnica",
  "WIRED",
  "engadget",
  "business",
  "FT",
  "Reuters",
  "CNBC",
  "mims",
  "waltmossberg",
];

const SCIENCE_SOURCES = [
  "ScienceMagazine",
  "NatureNews",
  "NewScientist",
  "sciam",
  "NASA",
  "NASAJPL",
  "ESA",
  "CERN",
  "NIH",
  "statnews",
  "QuantaMagazine",
];

function fromList(handles: string[]): string {
  return handles.map((h) => `from:${h}`).join(" OR ");
}

export const CORE_SECTIONS: SectionConfig[] = [
  {
    id: "international",
    name: "International",
    tagline: "World-shaping headlines from global outlets",
    group: "core",
    glyph: "🌍",
    query: buildQuery(
      `(${fromList(INTL_SOURCES)}) OR ("breaking" (world OR global OR international))`,
    ),
  },
  {
    id: "national",
    name: "National (US)",
    tagline: "What America is reading right now",
    group: "core",
    glyph: "🇺🇸",
    query: buildQuery(
      `(${fromList(US_SOURCES)}) OR (("breaking" OR "just in") (US OR "United States" OR Congress OR "White House"))`,
    ),
  },
  {
    id: "foreign-policy",
    name: "Foreign Policy",
    tagline: "Diplomacy, defense, geopolitics",
    group: "core",
    glyph: "🕊",
    query: buildQuery(
      `(${fromList(FOREIGN_POLICY_SOURCES)}) OR ("foreign policy" OR diplomacy OR geopolitics OR NATO OR sanctions)`,
    ),
  },
  {
    id: "cybersecurity",
    name: "Cybersecurity",
    tagline: "Breaches, zero-days, threat intel",
    group: "core",
    glyph: "🛡",
    query: buildQuery(
      `(${fromList(CYBER_SOURCES)}) OR (cybersecurity OR "zero day" OR ransomware OR "data breach" OR CVE)`,
    ),
  },
  {
    id: "tech-news",
    name: "Tech News",
    tagline: "Product launches, AI, startups",
    group: "core",
    glyph: "💡",
    query: buildQuery(
      `(${fromList(TECH_SOURCES)}) OR (AI OR "artificial intelligence" OR startup OR "product launch")`,
    ),
  },
  {
    id: "science",
    name: "Science",
    tagline: "Research, space, medicine",
    group: "core",
    glyph: "🔬",
    query: buildQuery(
      `(${fromList(SCIENCE_SOURCES)}) OR ("peer reviewed" OR "new study" OR discovery OR NASA OR "James Webb")`,
    ),
  },
];

/** US state definitions - each gets an optimized, hand-tuned query. */
export interface StateConfig {
  id: string; // "state-<slug>"
  slug: string;
  name: string;
  abbr: string;
  query: string;
}

/**
 * Each state query blends local news outlets + the state's name + gov handles.
 * We keep the list pragmatic rather than exhaustive - a couple of strong local
 * sources is more valuable than dozens of low-signal ones.
 */
const STATE_DEFS: Array<Omit<StateConfig, "id" | "query"> & { outlets: string[]; extra?: string }> = [
  { slug: "alabama", name: "Alabama", abbr: "AL", outlets: ["aldotcom", "Birmingham_News", "WVTM13"], extra: "Alabama OR Birmingham OR Montgomery" },
  { slug: "alaska", name: "Alaska", abbr: "AK", outlets: ["adndotcom", "alaskapublic", "KTUU"], extra: "Alaska OR Anchorage OR Juneau" },
  { slug: "arizona", name: "Arizona", abbr: "AZ", outlets: ["azcentral", "12News", "abc15"], extra: "Arizona OR Phoenix OR Tucson" },
  { slug: "arkansas", name: "Arkansas", abbr: "AR", outlets: ["ArkansasOnline", "KATVNews", "THV11"], extra: "Arkansas OR \"Little Rock\" OR Fayetteville" },
  { slug: "california", name: "California", abbr: "CA", outlets: ["latimes", "sfchronicle", "CalMatters", "sdut"], extra: "California OR \"Los Angeles\" OR \"San Francisco\" OR Sacramento" },
  { slug: "colorado", name: "Colorado", abbr: "CO", outlets: ["denverpost", "9NEWS", "CPRNews"], extra: "Colorado OR Denver OR Boulder" },
  { slug: "connecticut", name: "Connecticut", abbr: "CT", outlets: ["HartfordCourant", "CTMirror", "NBCConnecticut"], extra: "Connecticut OR Hartford OR \"New Haven\"" },
  { slug: "delaware", name: "Delaware", abbr: "DE", outlets: ["delawareonline", "WDEL", "WHYY"], extra: "Delaware OR Wilmington OR Dover" },
  { slug: "florida", name: "Florida", abbr: "FL", outlets: ["MiamiHerald", "orlandosentinel", "TB_Times", "WFLA"], extra: "Florida OR Miami OR Orlando OR Tampa" },
  { slug: "georgia", name: "Georgia", abbr: "GA", outlets: ["ajc", "11AliveNews", "wsbtv"], extra: "Georgia OR Atlanta OR Savannah" },
  { slug: "hawaii", name: "Hawaii", abbr: "HI", outlets: ["staradvertiser", "HawaiiNewsNow", "CivilBeat"], extra: "Hawaii OR Honolulu OR Maui" },
  { slug: "idaho", name: "Idaho", abbr: "ID", outlets: ["IdahoStatesman", "KTVB", "IdahoEdNews"], extra: "Idaho OR Boise OR \"Idaho Falls\"" },
  { slug: "illinois", name: "Illinois", abbr: "IL", outlets: ["chicagotribune", "Suntimes", "WBEZ", "wgnnews"], extra: "Illinois OR Chicago OR Springfield" },
  { slug: "indiana", name: "Indiana", abbr: "IN", outlets: ["indystar", "wishtv", "WFYInews"], extra: "Indiana OR Indianapolis OR \"Fort Wayne\"" },
  { slug: "iowa", name: "Iowa", abbr: "IA", outlets: ["DMRegister", "IowaPublicRadio", "WHO13news"], extra: "Iowa OR \"Des Moines\" OR \"Cedar Rapids\"" },
  { slug: "kansas", name: "Kansas", abbr: "KS", outlets: ["kcstar", "kansasdotcom", "KSHB41"], extra: "Kansas OR Wichita OR Topeka" },
  { slug: "kentucky", name: "Kentucky", abbr: "KY", outlets: ["courierjournal", "LEX18News", "wfpl"], extra: "Kentucky OR Louisville OR Lexington" },
  { slug: "louisiana", name: "Louisiana", abbr: "LA", outlets: ["NOLAnews", "WWLTV", "theadvocatebr"], extra: "Louisiana OR \"New Orleans\" OR \"Baton Rouge\"" },
  { slug: "maine", name: "Maine", abbr: "ME", outlets: ["PressHerald", "BDNmaine", "MainePublic"], extra: "Maine OR Portland OR Bangor" },
  { slug: "maryland", name: "Maryland", abbr: "MD", outlets: ["baltimoresun", "wjz", "wbaltv11"], extra: "Maryland OR Baltimore OR Annapolis" },
  { slug: "massachusetts", name: "Massachusetts", abbr: "MA", outlets: ["BostonGlobe", "WBUR", "nbc10boston"], extra: "Massachusetts OR Boston OR Cambridge" },
  { slug: "michigan", name: "Michigan", abbr: "MI", outlets: ["detroitnews", "freep", "michiganradio"], extra: "Michigan OR Detroit OR \"Grand Rapids\"" },
  { slug: "minnesota", name: "Minnesota", abbr: "MN", outlets: ["StarTribune", "MPRnews", "KSTP"], extra: "Minnesota OR Minneapolis OR \"St. Paul\"" },
  { slug: "mississippi", name: "Mississippi", abbr: "MS", outlets: ["clarionledger", "WLBT", "MSTodayNews"], extra: "Mississippi OR Jackson OR Biloxi" },
  { slug: "missouri", name: "Missouri", abbr: "MO", outlets: ["stltoday", "kcstar", "KSDKnews"], extra: "Missouri OR \"St. Louis\" OR \"Kansas City\"" },
  { slug: "montana", name: "Montana", abbr: "MT", outlets: ["MTFreePress", "MontanaPBS", "406mtnews"], extra: "Montana OR Billings OR Bozeman" },
  { slug: "nebraska", name: "Nebraska", abbr: "NE", outlets: ["OWHnews", "NetNebraska", "KETV"], extra: "Nebraska OR Omaha OR Lincoln" },
  { slug: "nevada", name: "Nevada", abbr: "NV", outlets: ["reviewjournal", "RGJ", "News3LV"], extra: "Nevada OR \"Las Vegas\" OR Reno" },
  { slug: "new-hampshire", name: "New Hampshire", abbr: "NH", outlets: ["unionleader", "NHPR", "WMUR9"], extra: "\"New Hampshire\" OR Manchester OR Concord" },
  { slug: "new-jersey", name: "New Jersey", abbr: "NJ", outlets: ["starledger", "njdotcom", "News12NJ"], extra: "\"New Jersey\" OR Newark OR \"Jersey City\"" },
  { slug: "new-mexico", name: "New Mexico", abbr: "NM", outlets: ["ABQJournal", "SantaFeNewMex", "KOB4"], extra: "\"New Mexico\" OR Albuquerque OR \"Santa Fe\"" },
  { slug: "new-york", name: "New York", abbr: "NY", outlets: ["NYTimes", "nypost", "NY1", "NewsdayNY", "Gothamist"], extra: "\"New York\" OR NYC OR Buffalo OR Albany" },
  { slug: "north-carolina", name: "North Carolina", abbr: "NC", outlets: ["NewsObserver", "CharlotteObs", "WRAL"], extra: "\"North Carolina\" OR Charlotte OR Raleigh" },
  { slug: "north-dakota", name: "North Dakota", abbr: "ND", outlets: ["bismarcktribune", "PrairiePublic", "KFYRTV"], extra: "\"North Dakota\" OR Fargo OR Bismarck" },
  { slug: "ohio", name: "Ohio", abbr: "OH", outlets: ["DispatchAlerts", "cleveland19news", "WCPO"], extra: "Ohio OR Columbus OR Cleveland OR Cincinnati" },
  { slug: "oklahoma", name: "Oklahoma", abbr: "OK", outlets: ["oklahoman", "tulsaworld", "NEWS9"], extra: "Oklahoma OR \"Oklahoma City\" OR Tulsa" },
  { slug: "oregon", name: "Oregon", abbr: "OR", outlets: ["Oregonian", "OPB", "KGWNews"], extra: "Oregon OR Portland OR Eugene" },
  { slug: "pennsylvania", name: "Pennsylvania", abbr: "PA", outlets: ["PhillyInquirer", "PittsburghPG", "WHYYNews"], extra: "Pennsylvania OR Philadelphia OR Pittsburgh" },
  { slug: "rhode-island", name: "Rhode Island", abbr: "RI", outlets: ["projo", "RIPBS", "NBC10"], extra: "\"Rhode Island\" OR Providence OR Newport" },
  { slug: "south-carolina", name: "South Carolina", abbr: "SC", outlets: ["postandcourier", "thestate", "WLTX"], extra: "\"South Carolina\" OR Charleston OR Columbia" },
  { slug: "south-dakota", name: "South Dakota", abbr: "SD", outlets: ["argusleader", "KELOLAND", "SDPB"], extra: "\"South Dakota\" OR \"Sioux Falls\" OR \"Rapid City\"" },
  { slug: "tennessee", name: "Tennessee", abbr: "TN", outlets: ["tennessean", "WSMV", "wkrn"], extra: "Tennessee OR Nashville OR Memphis" },
  { slug: "texas", name: "Texas", abbr: "TX", outlets: ["HoustonChron", "dallasnews", "statesman", "TexasTribune"], extra: "Texas OR Houston OR Dallas OR Austin" },
  { slug: "utah", name: "Utah", abbr: "UT", outlets: ["sltrib", "DeseretNews", "fox13"], extra: "Utah OR \"Salt Lake City\" OR Provo" },
  { slug: "vermont", name: "Vermont", abbr: "VT", outlets: ["BurlingtonFP", "vtdigger", "vermontpublic"], extra: "Vermont OR Burlington OR Montpelier" },
  { slug: "virginia", name: "Virginia", abbr: "VA", outlets: ["virginiamercury", "richmond_com", "WTOP"], extra: "Virginia OR Richmond OR Norfolk" },
  { slug: "washington", name: "Washington", abbr: "WA", outlets: ["seattletimes", "KIRO7Seattle", "KUOW"], extra: "Washington (Seattle OR Spokane OR Tacoma)" },
  { slug: "west-virginia", name: "West Virginia", abbr: "WV", outlets: ["wvgazettemail", "WSAZnews", "wvpublic"], extra: "\"West Virginia\" OR Charleston OR Morgantown" },
  { slug: "wisconsin", name: "Wisconsin", abbr: "WI", outlets: ["journalsentinel", "WPR", "TMJ4"], extra: "Wisconsin OR Milwaukee OR Madison" },
  { slug: "wyoming", name: "Wyoming", abbr: "WY", outlets: ["WyoFile", "CowboyStateNews", "WyomingPublic"], extra: "Wyoming OR Cheyenne OR Jackson" },
];

export const STATE_SECTIONS: StateConfig[] = STATE_DEFS.map((s) => ({
  id: `state-${s.slug}`,
  slug: s.slug,
  name: s.name,
  abbr: s.abbr,
  query: buildQuery(
    `(${fromList(s.outlets)}) OR (${s.extra ?? s.name})`,
  ),
}));

export const STATE_SECTION_MAP: Record<string, SectionConfig> = Object.fromEntries(
  STATE_SECTIONS.map((s) => [
    s.id,
    {
      id: s.id,
      name: s.name,
      tagline: `${s.name} (${s.abbr}) local news`,
      group: "state" as const,
      query: s.query,
      glyph: s.abbr,
    },
  ]),
);

export const ALL_SECTIONS_MAP: Record<string, SectionConfig> = {
  ...Object.fromEntries(CORE_SECTIONS.map((s) => [s.id, s])),
  ...STATE_SECTION_MAP,
};

export function getSection(id: string): SectionConfig | undefined {
  return ALL_SECTIONS_MAP[id];
}

export const CORE_SECTION_IDS = CORE_SECTIONS.map((s) => s.id);

export type Timeframe = "6h" | "24h" | "72h";

export const TIMEFRAMES: Timeframe[] = ["6h", "24h", "72h"];

export function timeframeToHours(tf: Timeframe): number {
  return tf === "6h" ? 6 : tf === "24h" ? 24 : 72;
}
