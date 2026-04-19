/**
 * Section (category) configuration for Pulse.
 *
 * Pulse runs a fixed list of editorial categories. State-level sections have
 * been retired in favour of a tighter, curated set. The goal is that each
 * category yields a robust pool of candidate posts that Grok can then rank
 * and distill into a "best collection" for the current time window.
 *
 * Every category has:
 *  - id: stable slug used in URLs, caches, DB keys.
 *  - name / tagline: UI copy.
 *  - glyph: small icon/emoji for compact UI surfaces.
 *  - query: an X API v2 recent search query tuned to surface high-signal,
 *    verified-source news. Queries intentionally avoid retweets and replies.
 */

export interface SectionConfig {
  id: string;
  name: string;
  tagline: string;
  query: string;
  glyph?: string;
}

/**
 * Shared modifiers applied to every query:
 *   -is:retweet -is:reply   => only original posts
 *   -is:nullcast            => skip promoted / dead-state posts
 *   lang:en                 => English only
 *   (has:links OR has:media) => posts that look like news, not banter
 */
export const QUERY_MODIFIERS =
  "-is:retweet -is:reply -is:nullcast lang:en (has:links OR has:media)";

function buildQuery(core: string): string {
  return `(${core}) ${QUERY_MODIFIERS}`;
}

function fromList(handles: string[]): string {
  return handles.map((h) => `from:${h}`).join(" OR ");
}

/**
 * Curated verified-account rosters per topic. `from:` anchors keep the pool
 * clean; keyword fallbacks catch breaking items from other accounts.
 */
const INTL_SOURCES = [
  "Reuters",
  "AP",
  "BBCWorld",
  "AFP",
  "AJEnglish",
  "FinancialTimes",
  "FT",
  "guardian",
  "WSJ",
  "NYTimes",
  "washingtonpost",
  "business",
  "Bloomberg",
  "dwnews",
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
  "thehill",
  "Reuters",
];

const US_POLITICS_SOURCES = [
  "politico",
  "axios",
  "thehill",
  "nprpolitics",
  "PunchbowlNews",
  "SemaforPolitics",
  "JonathanSwan",
  "MaggieNYT",
  "bpolitics",
  "POTUS",
  "WhiteHouse",
  "SpeakerJohnson",
  "SenateGOP",
  "SenateDems",
  "HouseGOP",
  "HouseDemocrats",
];

const US_GENERAL_SOURCES = [
  "AP",
  "Reuters",
  "NYTimes",
  "washingtonpost",
  "WSJ",
  "CNN",
  "NBCNews",
  "ABC",
  "CBSNews",
  "USATODAY",
  "axios",
  "NPR",
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
  "GossiTheDog",
  "malwrhunterteam",
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
  "theinformation",
  "waltmossberg",
  "nytimesbits",
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
  "sciencealert",
];

const POP_CULTURE_SOURCES = [
  "Variety",
  "THR",
  "EW",
  "Deadline",
  "Billboard",
  "RollingStone",
  "Pitchfork",
  "IGN",
  "Polygon",
  "NYTCulture",
  "nytimesarts",
  "EmpireMagazine",
  "PopCrave",
  "Complex",
];

/**
 * Default category roster. Order here is the default column fill order.
 */
export const CORE_SECTIONS: SectionConfig[] = [
  {
    id: "international",
    name: "International",
    tagline: "World-shaping headlines from global outlets",
    glyph: "🌍",
    query: buildQuery(
      `(${fromList(INTL_SOURCES)}) OR ("breaking" (world OR global OR international))`,
    ),
  },
  {
    id: "foreign-policy",
    name: "Foreign Policy",
    tagline: "Diplomacy, defense, geopolitics",
    glyph: "🕊",
    query: buildQuery(
      `(${fromList(FOREIGN_POLICY_SOURCES)}) OR ("foreign policy" OR diplomacy OR geopolitics OR NATO OR sanctions OR "state department" OR Pentagon)`,
    ),
  },
  {
    id: "us-politics",
    name: "US Politics",
    tagline: "Washington, campaigns, legislation",
    glyph: "🏛",
    query: buildQuery(
      `(${fromList(US_POLITICS_SOURCES)}) OR ("White House" OR Congress OR Senate OR "House GOP" OR "House Dems" OR SCOTUS OR election OR campaign OR "executive order")`,
    ),
  },
  {
    id: "us-general",
    name: "US General",
    tagline: "National headlines across America",
    glyph: "🇺🇸",
    query: buildQuery(
      `(${fromList(US_GENERAL_SOURCES)}) OR (("breaking" OR "just in") (US OR "United States" OR nationwide OR economy OR weather OR crime))`,
    ),
  },
  {
    id: "cybersecurity",
    name: "Cybersecurity",
    tagline: "Breaches, zero-days, threat intel",
    glyph: "🛡",
    query: buildQuery(
      `(${fromList(CYBER_SOURCES)}) OR (cybersecurity OR "zero day" OR ransomware OR "data breach" OR CVE OR "supply chain attack" OR phishing)`,
    ),
  },
  {
    id: "tech-news",
    name: "Tech News",
    tagline: "Product launches, AI, startups",
    glyph: "💡",
    query: buildQuery(
      `(${fromList(TECH_SOURCES)}) OR (AI OR "artificial intelligence" OR startup OR "product launch" OR chips OR semiconductors)`,
    ),
  },
  {
    id: "science",
    name: "Science",
    tagline: "Research, space, medicine",
    glyph: "🔬",
    query: buildQuery(
      `(${fromList(SCIENCE_SOURCES)}) OR ("peer reviewed" OR "new study" OR discovery OR NASA OR "James Webb" OR biomedical OR "clinical trial")`,
    ),
  },
  {
    id: "pop-culture",
    name: "Pop Culture & Entertainment",
    tagline: "Film, TV, music, celebrity, gaming",
    glyph: "🎬",
    query: buildQuery(
      `(${fromList(POP_CULTURE_SOURCES)}) OR ("box office" OR Oscars OR Grammy OR Emmys OR "trailer drop" OR "new album" OR premiere OR celebrity)`,
    ),
  },
];

export const CORE_SECTION_IDS = CORE_SECTIONS.map((s) => s.id);

export const ALL_SECTIONS_MAP: Record<string, SectionConfig> =
  Object.fromEntries(CORE_SECTIONS.map((s) => [s.id, s]));

export function getSection(id: string): SectionConfig | undefined {
  return ALL_SECTIONS_MAP[id];
}

/**
 * Timeframes. The shift from `6h/24h/72h` to `24h/week/month` is intentional:
 * these windows better match how people actually consume news and make the
 * Grok-curated "best of" output more meaningful.
 */
export type Timeframe = "24h" | "week" | "month";

export const TIMEFRAMES: Timeframe[] = ["24h", "week", "month"];

export const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  "24h": "24 Hours",
  week: "Week",
  month: "Month",
};

export function timeframeToHours(tf: Timeframe): number {
  switch (tf) {
    case "24h":
      return 24;
    case "week":
      return 24 * 7;
    case "month":
      return 24 * 30;
  }
}
