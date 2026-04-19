/**
 * Deterministic demo data used when X credentials aren't configured,
 * so the app is still beautifully browsable out-of-the-box.
 *
 * Everything here is clearly fictional and watermarked with an "[DEMO]"
 * prefix in the briefing so no one mistakes it for real reporting.
 */

import { uniqueBy } from "./utils";
import {
  ALL_SECTIONS_MAP,
  CORE_SECTIONS,
  timeframeToHours,
  type Timeframe,
} from "./sections";
import type { PulsePost, PulseSummary, SectionFeed } from "./types";

interface SeedPost {
  author_handle: string;
  author_name: string;
  author_verified?: boolean;
  text: string;
  hoursAgo: number;
  url?: string | null;
  likes: number;
  replies: number;
  retweets: number;
  quotes: number;
  image?: string | null;
  why?: string;
}

const PHOTOS = [
  "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&q=80",
  "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&q=80",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80",
  "https://images.unsplash.com/photo-1581090700227-1e37b190418e?w=1200&q=80",
  "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&q=80",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=80",
  "https://images.unsplash.com/photo-1526666923127-b2970f64b422?w=1200&q=80",
];

const SEEDS: Record<string, SeedPost[]> = {
  international: [
    { author_handle: "Reuters", author_name: "Reuters", author_verified: true, text: "BREAKING: European leaders agree on coordinated package of new measures following emergency summit in Brussels, diplomats say the agreement covers energy, trade and defense.", hoursAgo: 1.5, url: "https://www.reuters.com/world/europe/", likes: 12400, replies: 890, retweets: 5600, quotes: 420, image: PHOTOS[0], why: "Sets the tone for EU policy for the rest of the week." },
    { author_handle: "AP", author_name: "The Associated Press", author_verified: true, text: "Japan's parliament approves sweeping economic stimulus aimed at easing inflation pressure on households. The package is the largest since the pandemic.", hoursAgo: 3, url: "https://apnews.com/", likes: 5230, replies: 212, retweets: 1800, quotes: 180, image: PHOTOS[1], why: "Biggest fiscal move in Asia this quarter." },
    { author_handle: "BBCWorld", author_name: "BBC News (World)", author_verified: true, text: "UN agencies warn of worsening food insecurity in the Horn of Africa as consecutive failed rainy seasons push millions into acute hunger, officials said.", hoursAgo: 5, url: "https://www.bbc.com/news/world", likes: 3100, replies: 190, retweets: 1500, quotes: 95, image: PHOTOS[2], why: "Humanitarian spotlight ahead of donor talks." },
    { author_handle: "AJEnglish", author_name: "Al Jazeera English", author_verified: true, text: "South Korea and Japan agree to expand intelligence sharing framework, signaling a thaw in relations as both countries face similar regional pressures.", hoursAgo: 7, url: null, likes: 2100, replies: 140, retweets: 980, quotes: 62, why: "Rare bilateral thaw in East Asia." },
    { author_handle: "FT", author_name: "Financial Times", author_verified: true, text: "Global shipping rates rise for fifth consecutive week as carriers continue to reroute around key chokepoints, adding fresh pressure to consumer prices.", hoursAgo: 10, url: "https://www.ft.com/", likes: 1800, replies: 75, retweets: 620, quotes: 40, image: PHOTOS[3], why: "Direct read on inflation risk." },
    { author_handle: "guardian", author_name: "The Guardian", author_verified: true, text: "Record heatwave grips parts of South America with temperatures 10C above seasonal averages; authorities activate emergency plans for vulnerable populations.", hoursAgo: 12, url: "https://www.theguardian.com/world", likes: 2800, replies: 160, retweets: 900, quotes: 55, image: PHOTOS[4], why: "Climate impact hitting South America now." },
    { author_handle: "WSJ", author_name: "The Wall Street Journal", author_verified: true, text: "Saudi Arabia and India announce expanded strategic partnership covering critical minerals, AI, and defense technology transfer.", hoursAgo: 14, url: "https://www.wsj.com/", likes: 1600, replies: 90, retweets: 520, quotes: 33, why: "Reshapes Indo-Gulf supply chain alignment." },
    { author_handle: "NYTimes", author_name: "The New York Times", author_verified: true, text: "Analysis: Why this week's central bank signals matter for emerging markets — and the three countries most likely to move policy in response.", hoursAgo: 16, url: "https://www.nytimes.com/", likes: 2400, replies: 140, retweets: 700, quotes: 80, why: "Framework for reading central-bank surprises." },
    { author_handle: "business", author_name: "Bloomberg", author_verified: true, text: "Oil edges higher after OPEC+ signals it will keep current production cuts in place through next quarter, citing uncertain demand.", hoursAgo: 26, url: null, likes: 2200, replies: 120, retweets: 800, quotes: 50, why: "Oil market posture set through next quarter." },
    { author_handle: "Reuters", author_name: "Reuters", author_verified: true, text: "African Union brokers ceasefire framework for eastern DRC; observers welcome step while warning implementation is fragile.", hoursAgo: 54, url: null, likes: 1200, replies: 80, retweets: 400, quotes: 28, image: PHOTOS[5], why: "Potentially stabilising move for Central Africa." },
    { author_handle: "AFP", author_name: "Agence France-Presse", author_verified: true, text: "EU regulators advance landmark draft rules on AI transparency, with final text expected before year-end.", hoursAgo: 96, url: null, likes: 2600, replies: 140, retweets: 700, quotes: 60, why: "Biggest AI policy action globally this month." },
    { author_handle: "FT", author_name: "Financial Times", author_verified: true, text: "China's latest export data surprises to the upside; analysts parse whether it signals real demand or inventory restocking.", hoursAgo: 150, url: null, likes: 1800, replies: 100, retweets: 500, quotes: 40, why: "Key macro data point for the week." },
    { author_handle: "NYTimes", author_name: "The New York Times", author_verified: true, text: "Long read: Inside the quiet diplomacy that reshaped Gulf-Asia energy relationships over the past three months.", hoursAgo: 240, url: null, likes: 2900, replies: 220, retweets: 1100, quotes: 120, image: PHOTOS[6], why: "Defining feature piece of the month." },
    { author_handle: "guardian", author_name: "The Guardian", author_verified: true, text: "COP secretariat releases early draft of this year's negotiating text, setting the table for year-end climate talks.", hoursAgo: 360, url: null, likes: 1500, replies: 90, retweets: 520, quotes: 44, why: "Sets baseline for year-end climate talks." },
    { author_handle: "Bloomberg", author_name: "Bloomberg", author_verified: true, text: "Emerging-market currencies post best month in over a year as dollar softens on softer US data.", hoursAgo: 500, url: null, likes: 1400, replies: 80, retweets: 420, quotes: 30, why: "Notable macro turn for EMs this month." },
  ],
  "foreign-policy": [
    { author_handle: "StateDept", author_name: "U.S. Department of State", author_verified: true, text: "Secretary concludes G7 meetings; joint statement reaffirms coordinated response on sanctions enforcement and maritime security.", hoursAgo: 2, url: "https://www.state.gov/", likes: 3400, replies: 220, retweets: 900, quotes: 110, why: "Top diplomatic move of the day." },
    { author_handle: "ForeignPolicy", author_name: "Foreign Policy", author_verified: true, text: "Analysis: The quiet rewiring of middle-power alliances — how Ankara, Abu Dhabi, and New Delhi are reshaping the global security architecture.", hoursAgo: 5, url: "https://foreignpolicy.com/", likes: 1800, replies: 130, retweets: 520, quotes: 60, image: PHOTOS[0], why: "Framing piece for multi-polar diplomacy." },
    { author_handle: "CFR_org", author_name: "Council on Foreign Relations", author_verified: true, text: "New report: Five scenarios for the next 24 months of Indo-Pacific security competition, and the one policymakers are still underestimating.", hoursAgo: 9, url: "https://www.cfr.org/", likes: 1100, replies: 80, retweets: 400, quotes: 32, why: "Contrarian Indo-Pacific scenario planning." },
    { author_handle: "ChathamHouse", author_name: "Chatham House", author_verified: true, text: "Our latest briefing examines the shifting dynamics of European defense spending and what it means for transatlantic burden-sharing.", hoursAgo: 14, url: null, likes: 620, replies: 40, retweets: 200, quotes: 15, why: "Useful for the NATO spending debate." },
    { author_handle: "DefenseOne", author_name: "Defense One", author_verified: true, text: "Pentagon issues new guidance streamlining foreign military sales; officials hope changes cut average approval time by a third.", hoursAgo: 18, url: "https://www.defenseone.com/", likes: 900, replies: 55, retweets: 310, quotes: 22, why: "Operational shift in FMS pipeline." },
    { author_handle: "WarOnTheRocks", author_name: "War on the Rocks", author_verified: true, text: "New essay: The return of industrial policy in defense — lessons from Cold War-era mobilization for today's procurement backlog.", hoursAgo: 21, url: null, likes: 740, replies: 60, retweets: 230, quotes: 18, image: PHOTOS[2], why: "Useful historical frame for procurement." },
    { author_handle: "Atlantic_Council", author_name: "Atlantic Council", author_verified: true, text: "Transatlantic task force releases plan for coordinated economic security, targeting export controls and critical-mineral supply.", hoursAgo: 60, url: null, likes: 900, replies: 60, retweets: 320, quotes: 28, why: "Important think-tank blueprint this week." },
    { author_handle: "BrookingsFP", author_name: "Brookings Foreign Policy", author_verified: true, text: "Paper: Why the next decade of arms control will be fought over space assets — and where Washington is already behind.", hoursAgo: 200, url: null, likes: 700, replies: 48, retweets: 220, quotes: 18, why: "Space + arms control is underappreciated." },
  ],
  "us-politics": [
    { author_handle: "politico", author_name: "POLITICO", author_verified: true, text: "Scoop: White House reviewing new executive action on chip manufacturing incentives, sources familiar with the deliberations say. Announcement could come next week.", hoursAgo: 4, url: "https://www.politico.com/", likes: 4100, replies: 380, retweets: 1600, quotes: 140, why: "Imminent exec action on chips." },
    { author_handle: "axios", author_name: "Axios", author_verified: true, text: "House advances bipartisan package on border security and judicial modernization; floor vote expected Thursday.", hoursAgo: 2, url: "https://www.axios.com/", likes: 8200, replies: 1200, retweets: 2900, quotes: 310, image: PHOTOS[5], why: "Rare bipartisan floor move expected." },
    { author_handle: "PunchbowlNews", author_name: "Punchbowl News", author_verified: true, text: "Leaders in both chambers say the text is \"substantially complete\" and staff are finalizing scoring from CBO overnight.", hoursAgo: 6, url: null, likes: 1400, replies: 90, retweets: 500, quotes: 40, why: "Shows whip count readiness." },
    { author_handle: "thehill", author_name: "The Hill", author_verified: true, text: "SCOTUS to hear oral arguments next month in major First Amendment case involving public-official accounts on social media.", hoursAgo: 10, url: null, likes: 2000, replies: 180, retweets: 700, quotes: 60, why: "Upcoming SCOTUS docket is loaded." },
    { author_handle: "JonathanSwan", author_name: "Jonathan Swan", author_verified: true, text: "Campaign memo outlines new battleground strategy focusing on suburban swing voters and late-deciding independents.", hoursAgo: 14, url: null, likes: 2500, replies: 220, retweets: 820, quotes: 80, why: "Tells you where the campaign is really spending." },
    { author_handle: "MaggieNYT", author_name: "Maggie Haberman", author_verified: true, text: "Notebook: The delicate House whip count on this week's supplemental — and the three lawmakers leadership is watching most closely.", hoursAgo: 20, url: null, likes: 1800, replies: 150, retweets: 600, quotes: 60, image: PHOTOS[6], why: "Insider read on whip arithmetic." },
    { author_handle: "bpolitics", author_name: "Bloomberg Politics", author_verified: true, text: "Fed Chair set to testify before Congress next week; members already circulating questions on rate path and bank supervision.", hoursAgo: 46, url: null, likes: 1600, replies: 90, retweets: 500, quotes: 40, why: "Market-moving Congressional hearing ahead." },
    { author_handle: "nprpolitics", author_name: "NPR Politics", author_verified: true, text: "Governors from six states release joint letter urging Congress to act on housing supply, proposing new federal-state matching program.", hoursAgo: 120, url: null, likes: 1100, replies: 92, retweets: 420, quotes: 30, why: "Notable cross-party policy signal." },
  ],
  "us-general": [
    { author_handle: "AP", author_name: "The Associated Press", author_verified: true, text: "Severe storm system moving across the Plains has prompted tornado watches in three states. Residents are urged to follow local alerts.", hoursAgo: 7, url: null, likes: 1400, replies: 110, retweets: 680, quotes: 42, why: "Active weather impacting millions." },
    { author_handle: "NBCNews", author_name: "NBC News", author_verified: true, text: "Exclusive: Internal documents show federal agencies are piloting new AI-assisted fraud detection tools, with early results showing notable accuracy gains.", hoursAgo: 15, url: "https://www.nbcnews.com/", likes: 1900, replies: 140, retweets: 610, quotes: 48, image: PHOTOS[7], why: "Operational AI rollout across agencies." },
    { author_handle: "WSJ", author_name: "The Wall Street Journal", author_verified: true, text: "Labor market remains resilient: job openings tick up modestly while layoffs stay near historic lows, according to latest federal data.", hoursAgo: 19, url: "https://www.wsj.com/", likes: 1700, replies: 88, retweets: 540, quotes: 35, why: "Core labor-market print." },
    { author_handle: "washingtonpost", author_name: "The Washington Post", author_verified: true, text: "Federal Reserve officials signal patience on rate path as latest inflation data comes in slightly below expectations.", hoursAgo: 5, url: "https://www.washingtonpost.com/", likes: 3200, replies: 260, retweets: 1100, quotes: 95, image: PHOTOS[6], why: "Shapes near-term rate expectations." },
    { author_handle: "USATODAY", author_name: "USA TODAY", author_verified: true, text: "Housing market data shows modest cooling in several metros even as prices hold firm nationally, per latest industry report.", hoursAgo: 36, url: null, likes: 1100, replies: 90, retweets: 300, quotes: 22, why: "Tracks the housing cooldown." },
    { author_handle: "CBSNews", author_name: "CBS News", author_verified: true, text: "DOJ files civil complaint against major data broker over alleged mishandling of location data, seeking sweeping behavioral remedies.", hoursAgo: 9, url: null, likes: 2600, replies: 180, retweets: 900, quotes: 58, why: "Largest privacy enforcement action this month." },
    { author_handle: "CNN", author_name: "CNN", author_verified: true, text: "Wildfire smoke prompts air-quality advisories across parts of the Midwest as unusual seasonal pattern continues.", hoursAgo: 80, url: null, likes: 1300, replies: 95, retweets: 400, quotes: 30, why: "Public-health alert for millions." },
    { author_handle: "Reuters", author_name: "Reuters", author_verified: true, text: "Retail sales data comes in slightly stronger than expected, pointing to a resilient consumer heading into the summer season.", hoursAgo: 200, url: null, likes: 900, replies: 50, retweets: 260, quotes: 18, why: "Resilient consumer keeps growth intact." },
  ],
  cybersecurity: [
    { author_handle: "briankrebs", author_name: "briankrebs", author_verified: true, text: "Major cloud provider discloses breach affecting several enterprise tenants; investigators say intrusion was discovered via proactive monitoring.", hoursAgo: 1, url: "https://krebsonsecurity.com/", likes: 5100, replies: 410, retweets: 2100, quotes: 240, why: "Multi-tenant impact worth watching." },
    { author_handle: "TheHackersNews", author_name: "The Hacker News", author_verified: true, text: "New zero-day in widely deployed VPN appliance is being actively exploited in the wild. Vendors have released mitigations; patches expected within 48 hours.", hoursAgo: 3, url: "https://thehackernews.com/", likes: 2900, replies: 180, retweets: 1300, quotes: 110, image: PHOTOS[3], why: "Active in-the-wild exploitation." },
    { author_handle: "CISAgov", author_name: "CISA", author_verified: true, text: "CISA adds two new vulnerabilities to the Known Exploited Vulnerabilities Catalog. Federal agencies have 21 days to remediate.", hoursAgo: 6, url: "https://www.cisa.gov/", likes: 1300, replies: 60, retweets: 520, quotes: 30, why: "Official remediation clock started." },
    { author_handle: "BleepinComputer", author_name: "BleepingComputer", author_verified: true, text: "Ransomware group claims attack on regional healthcare provider; leak site posts alleged samples. Provider confirms \"cybersecurity incident\".", hoursAgo: 10, url: "https://www.bleepingcomputer.com/", likes: 1800, replies: 120, retweets: 720, quotes: 48, why: "Sensitive healthcare impact." },
    { author_handle: "GoogleTAG", author_name: "Google Threat Analysis Group", author_verified: true, text: "We are tracking a new campaign from a state-aligned actor using a clever supply-chain technique; IOCs and mitigations in the post.", hoursAgo: 14, url: null, likes: 2200, replies: 95, retweets: 900, quotes: 60, why: "Novel state-aligned TTPs." },
    { author_handle: "Mandiant", author_name: "Mandiant", author_verified: true, text: "Our latest M-Trends highlights a notable shift in initial access vectors; social engineering remains dominant but cloud misconfig is rising fast.", hoursAgo: 18, url: "https://www.mandiant.com/", likes: 1000, replies: 40, retweets: 330, quotes: 22, image: PHOTOS[4], why: "Strategic threat-landscape shift." },
    { author_handle: "campuscodi", author_name: "Catalin Cimpanu", author_verified: true, text: "New report: Phishing kits are increasingly being sold as a hosted service, lowering the bar for entry-level attackers.", hoursAgo: 55, url: null, likes: 900, replies: 60, retweets: 300, quotes: 20, why: "PhaaS commoditisation trend." },
    { author_handle: "SecurityWeek", author_name: "SecurityWeek", author_verified: true, text: "Analysis: Why cloud misconfigurations keep dominating breach root causes despite years of vendor guidance.", hoursAgo: 200, url: null, likes: 700, replies: 40, retweets: 220, quotes: 15, why: "Persistent systemic weakness." },
  ],
  "tech-news": [
    { author_handle: "verge", author_name: "The Verge", author_verified: true, text: "Major AI lab unveils new small model that outperforms larger predecessors on reasoning benchmarks while using a fraction of the compute.", hoursAgo: 2, url: "https://www.theverge.com/", likes: 6700, replies: 420, retweets: 2400, quotes: 310, image: PHOTOS[5], why: "Efficient-model milestone of the week." },
    { author_handle: "TechCrunch", author_name: "TechCrunch", author_verified: true, text: "Scoop: Robotics startup raises $220M to build warehouse automation hardware; deal values the company at roughly $1.6B post-money.", hoursAgo: 4, url: "https://techcrunch.com/", likes: 2100, replies: 140, retweets: 700, quotes: 55, why: "Largest robotics round this quarter." },
    { author_handle: "WIRED", author_name: "WIRED", author_verified: true, text: "Inside the push to standardize open model evaluations — why benchmark drama is actually about trust.", hoursAgo: 7, url: "https://www.wired.com/", likes: 1600, replies: 110, retweets: 480, quotes: 42, image: PHOTOS[6], why: "Frames ongoing benchmark debate." },
    { author_handle: "arstechnica", author_name: "Ars Technica", author_verified: true, text: "Deep dive: The hidden cost of \"infinite context\" — how long-context retrieval systems are actually performing in production.", hoursAgo: 12, url: "https://arstechnica.com/", likes: 1200, replies: 85, retweets: 380, quotes: 28, why: "Reality check on long-context claims." },
    { author_handle: "business", author_name: "Bloomberg", author_verified: true, text: "Apple, Google, and Meta are all quietly expanding their on-device AI teams — internal job data suggests the talent war is shifting again.", hoursAgo: 16, url: null, likes: 2400, replies: 160, retweets: 780, quotes: 60, why: "Hiring tea-leaves for on-device AI." },
    { author_handle: "CNBC", author_name: "CNBC", author_verified: true, text: "Chipmaker reports strong quarter driven by data center demand; guidance tops analyst expectations, shares up in after-hours trading.", hoursAgo: 20, url: "https://www.cnbc.com/", likes: 1800, replies: 95, retweets: 560, quotes: 40, why: "Bellwether chip earnings." },
    { author_handle: "theinformation", author_name: "The Information", author_verified: true, text: "Report: Cloud giants are renegotiating compute deals as AI startups consolidate; some deals include equity warrants for the first time.", hoursAgo: 70, url: null, likes: 1300, replies: 85, retweets: 380, quotes: 34, why: "Structural cloud-AI economics shift." },
    { author_handle: "engadget", author_name: "Engadget", author_verified: true, text: "New flagship phone leak points to major camera-system overhaul and updated neural engine.", hoursAgo: 160, url: null, likes: 900, replies: 50, retweets: 260, quotes: 18, why: "Early signal for next phone cycle." },
  ],
  science: [
    { author_handle: "NASA", author_name: "NASA", author_verified: true, text: "Our latest Webb observations reveal surprisingly organized structures in a distant nebula — findings could reshape how we model early star formation.", hoursAgo: 3, url: "https://www.nasa.gov/", likes: 14000, replies: 620, retweets: 5800, quotes: 420, image: PHOTOS[7], why: "Potentially reshapes star-formation models." },
    { author_handle: "sciam", author_name: "Scientific American", author_verified: true, text: "A new peer-reviewed study finds that a common blood test may detect early signs of a neurodegenerative disease years before symptoms appear.", hoursAgo: 6, url: "https://www.scientificamerican.com/", likes: 3200, replies: 210, retweets: 1100, quotes: 88, why: "Big potential for early diagnosis." },
    { author_handle: "QuantaMagazine", author_name: "Quanta Magazine", author_verified: true, text: "Mathematicians announce progress on a decades-old conjecture. The elegant new proof builds on ideas borrowed from an unexpected field.", hoursAgo: 10, url: "https://www.quantamagazine.org/", likes: 1800, replies: 120, retweets: 560, quotes: 45, image: PHOTOS[0], why: "Landmark maths result of the week." },
    { author_handle: "NatureNews", author_name: "Nature News & Comment", author_verified: true, text: "Climate: New high-resolution ocean model captures eddy dynamics that had been invisible to earlier generations of simulations.", hoursAgo: 14, url: null, likes: 1300, replies: 70, retweets: 430, quotes: 26, why: "Important step in ocean modelling." },
    { author_handle: "NIH", author_name: "NIH", author_verified: true, text: "NIH-funded trial shows promising results for a next-generation gene therapy targeting a rare inherited blindness in children.", hoursAgo: 18, url: "https://www.nih.gov/", likes: 2100, replies: 95, retweets: 760, quotes: 52, image: PHOTOS[1], why: "Promising rare-disease gene therapy." },
    { author_handle: "ESA", author_name: "European Space Agency", author_verified: true, text: "Our Mars rover team confirms successful sample cache — a key milestone for the planned joint sample-return mission.", hoursAgo: 22, url: null, likes: 1900, replies: 100, retweets: 620, quotes: 35, why: "Key milestone for Mars sample return." },
    { author_handle: "ScienceMagazine", author_name: "Science Magazine", author_verified: true, text: "New paper: Microplastics detected in cloud samples at multiple altitudes raise fresh questions about atmospheric transport.", hoursAgo: 60, url: null, likes: 1100, replies: 80, retweets: 360, quotes: 28, why: "Opens new environmental-science thread." },
    { author_handle: "CERN", author_name: "CERN", author_verified: true, text: "LHC delivers record luminosity in this run, enabling new precision searches for rare decay processes.", hoursAgo: 240, url: null, likes: 2200, replies: 120, retweets: 700, quotes: 55, why: "Opens new precision-physics searches." },
  ],
  "pop-culture": [
    { author_handle: "Variety", author_name: "Variety", author_verified: true, text: "Box office: Studio tentpole opens to a stronger-than-expected $128M domestic debut, setting the bar for the summer.", hoursAgo: 2, url: "https://variety.com/", likes: 4400, replies: 220, retweets: 1500, quotes: 120, image: PHOTOS[4], why: "Summer box-office tone-setter." },
    { author_handle: "THR", author_name: "The Hollywood Reporter", author_verified: true, text: "First look: A-list director's next project begins principal photography, with early reactions from the set calling it their most ambitious yet.", hoursAgo: 6, url: "https://www.hollywoodreporter.com/", likes: 2000, replies: 140, retweets: 620, quotes: 55, why: "Buzzy production to track." },
    { author_handle: "Billboard", author_name: "Billboard", author_verified: true, text: "Chart update: Debut album holds #1 for a fourth consecutive week, a run not seen in the genre in five years.", hoursAgo: 9, url: null, likes: 3000, replies: 180, retweets: 950, quotes: 70, why: "Historic chart run continues." },
    { author_handle: "Deadline", author_name: "Deadline Hollywood", author_verified: true, text: "Awards race: Critics circles start to align around three likely Best Picture front-runners; festival reactions continue to build momentum.", hoursAgo: 13, url: null, likes: 1500, replies: 120, retweets: 460, quotes: 42, why: "Early awards-race consensus forming." },
    { author_handle: "IGN", author_name: "IGN", author_verified: true, text: "Review: The year's most anticipated open-world game lands to strong reviews, praising ambition while flagging uneven pacing.", hoursAgo: 18, url: "https://www.ign.com/", likes: 2800, replies: 260, retweets: 900, quotes: 140, image: PHOTOS[2], why: "Defining game release of the quarter." },
    { author_handle: "RollingStone", author_name: "Rolling Stone", author_verified: true, text: "Profile: Inside the reinvention of a pop star heading into a sold-out arena tour and a rumored film project.", hoursAgo: 22, url: null, likes: 1700, replies: 130, retweets: 520, quotes: 48, why: "Defining celebrity profile this week." },
    { author_handle: "Pitchfork", author_name: "Pitchfork", author_verified: true, text: "Best new music: Surprise-dropped EP earns rare unanimous praise from critics, with several outlets calling it a career reset.", hoursAgo: 72, url: null, likes: 1200, replies: 95, retweets: 360, quotes: 32, why: "Notable critical consensus moment." },
    { author_handle: "Polygon", author_name: "Polygon", author_verified: true, text: "Streaming wars: A revamped ad tier is driving subscriber growth again, per the latest quarterly disclosures.", hoursAgo: 180, url: null, likes: 900, replies: 70, retweets: 280, quotes: 22, why: "Streaming business model shift." },
  ],
};

function seedToPost(
  sectionId: string,
  seed: SeedPost,
  idx: number,
  now: number,
): PulsePost {
  const created = new Date(now - seed.hoursAgo * 60 * 60 * 1000).toISOString();
  const id = `demo-${sectionId}-${idx}-${Math.floor(seed.hoursAgo * 60)}`;
  return {
    id,
    section_id: sectionId,
    author_handle: seed.author_handle,
    author_name: seed.author_name,
    author_verified: seed.author_verified,
    author_avatar: null,
    text: seed.text,
    created_at: created,
    url: seed.url ?? null,
    tweet_url: `https://x.com/${seed.author_handle}/status/${id}`,
    media: seed.image
      ? [
          {
            type: "photo",
            url: seed.image,
            preview_url: seed.image,
            width: 1200,
            height: 800,
            alt_text: null,
          },
        ]
      : [],
    metrics: {
      like_count: seed.likes,
      reply_count: seed.replies,
      retweet_count: seed.retweets,
      quote_count: seed.quotes,
    },
    fetched_at: new Date(now).toISOString(),
    why_it_matters: seed.why ?? null,
  };
}

const PARAGRAPH_TEMPLATES: Record<string, (name: string) => string> = {
  "24h": (name) =>
    `[DEMO] Over the past 24 hours the ${name.toLowerCase()} picture has been shaped by a mix of breaking developments and follow-up analysis. Major outlets are leading with the headline stories highlighted below, while analysts are already framing the downstream implications for policy, markets and public life. Expect follow-through reporting over the next news cycle, and watch the most-engaged stories for signals about which threads will dominate the week ahead. In live Pulse, this paragraph is written by Grok from the actual curated posts.`,
  week: (name) =>
    `[DEMO] Looking across the past week in ${name.toLowerCase()}, a handful of storylines have clearly separated themselves from the noise. Editorial signals — engagement, credibility of source, and distinctness of reporting — point to the curated set below as the most important developments in the window. The week's trajectory suggests sustained coverage of the marquee items, with secondary threads providing useful context. When Pulse runs on live X data, Grok writes this summary from the actual posts above, highlighting how the narrative has evolved.`,
  month: (name) =>
    `[DEMO] Zooming out to the past month of ${name.toLowerCase()}, the curated collection below reflects the most important, most discussed, and most consequential items that a diligent reader would have tracked in this window. Pulse preserves story timelines by archiving each post it curates, so older-but-relevant items remain visible even after X's recent-search horizon. On a live deployment, Grok regenerates this paragraph every time the curated set changes, weaving together the month's throughline in calm, newsroom-style prose.`,
};

export function buildDemoFeed(
  sectionId: string,
  timeframe: string,
  nowMs: number = Date.now(),
): SectionFeed {
  const section = ALL_SECTIONS_MAP[sectionId];
  const seeds: SeedPost[] = SEEDS[sectionId] ?? [];

  const maxHours =
    timeframe === "24h" || timeframe === "week" || timeframe === "month"
      ? timeframeToHours(timeframe as Timeframe)
      : 24;
  const filtered = seeds.filter((s) => s.hoursAgo <= maxHours);
  const posts = uniqueBy(
    filtered.map((s, i) => seedToPost(sectionId, s, i, nowMs)),
    (p) => p.id,
  );

  const overview =
    posts.length === 0
      ? `[DEMO] No posts for ${section?.name ?? sectionId} in this window yet. Try a wider timeframe.`
      : (PARAGRAPH_TEMPLATES[timeframe] ?? PARAGRAPH_TEMPLATES["24h"])(
          section?.name ?? sectionId,
        );

  const themeSet: Record<string, string[]> = {
    international: ["geopolitics", "markets", "climate", "alliances"],
    "foreign-policy": ["diplomacy", "defense", "sanctions", "alliances"],
    "us-politics": ["legislation", "campaigns", "white house", "courts"],
    "us-general": ["economy", "weather", "public safety", "policy"],
    cybersecurity: ["breaches", "zero-days", "ransomware", "state actors"],
    "tech-news": ["AI", "semiconductors", "platforms", "startups"],
    science: ["space", "medicine", "climate", "research"],
    "pop-culture": ["box office", "music", "streaming", "awards"],
  };
  const themes = themeSet[sectionId] ?? ["policy", "markets", "innovation"];

  const summary: PulseSummary | null =
    posts.length === 0
      ? null
      : {
          section_id: sectionId,
          timeframe,
          overview,
          themes,
          takeaways: Object.fromEntries(
            posts.slice(0, 6).map((p) => [
              p.id,
              [
                "Key development worth following.",
                "Context: this relates to recent trends.",
                "Potential impact on stakeholders noted.",
              ],
            ]),
          ),
          generated_at: new Date(nowMs).toISOString(),
          input_hash: "demo",
        };

  return {
    section_id: sectionId,
    timeframe,
    posts,
    summary,
    updated_at: new Date(nowMs).toISOString(),
    cached: false,
    demo: true,
  };
}

void CORE_SECTIONS;
