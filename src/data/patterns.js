/**
 * Pattern Language — Christopher Alexander, Sara Ishikawa, Murray Silverstein,
 * Max Jacobson, Ingrid Fiksdahl-King, and Shlomo Angel.
 * A Pattern Language: Towns, Buildings, Construction (1977)
 *
 * 253 patterns organized by scale: Towns → Buildings → Construction.
 * Each pattern can be contextualized against practice work via `appliedIn` and `notes`.
 */

export const SCALES = [
  { key: "towns", label: "Towns", range: "1–94", count: 94 },
  { key: "buildings", label: "Buildings", range: "95–204", count: 110 },
  { key: "construction", label: "Construction", range: "205–253", count: 49 },
];

export const GROUPS = [
  // Towns
  { key: "network-of-lattices", label: "Network of Lattices", scale: "towns" },
  { key: "regional-policies", label: "Regional Policies", scale: "towns" },
  { key: "city-policies", label: "City Policies", scale: "towns" },
  { key: "communities", label: "Communities", scale: "towns" },
  { key: "community-networking", label: "Community Networking", scale: "towns" },
  { key: "community-policies", label: "Community Policies", scale: "towns" },
  { key: "local-centers", label: "Local Centers", scale: "towns" },
  { key: "housing-clusters", label: "Housing Clusters", scale: "towns" },
  { key: "work-communities", label: "Work Communities", scale: "towns" },
  { key: "local-networking", label: "Local Networking", scale: "towns" },
  { key: "community-recreation", label: "Community Recreation", scale: "towns" },
  { key: "local-recreation", label: "Local Recreation", scale: "towns" },
  { key: "families", label: "Families", scale: "towns" },
  { key: "workgroups", label: "Workgroups", scale: "towns" },
  { key: "local-gathering", label: "Local Gathering", scale: "towns" },
  // Buildings
  { key: "group-of-buildings", label: "Group of Buildings", scale: "buildings" },
  { key: "siting", label: "Siting the Buildings", scale: "buildings" },
  { key: "building-layout", label: "Building Layout", scale: "buildings" },
  { key: "between-buildings", label: "Between the Buildings", scale: "buildings" },
  { key: "light-and-space", label: "Light and Space", scale: "buildings" },
  { key: "private-rooms", label: "Private Rooms", scale: "buildings" },
  { key: "public-rooms", label: "Public Rooms", scale: "buildings" },
  { key: "outbuildings", label: "Outbuildings", scale: "buildings" },
  { key: "liminal-space", label: "Liminal Space", scale: "buildings" },
  { key: "gardens", label: "Gardens", scale: "buildings" },
  { key: "minor-rooms", label: "Minor Rooms", scale: "buildings" },
  { key: "shaping-rooms", label: "Shaping the Rooms", scale: "buildings" },
  { key: "thick-walls", label: "Thick Walls", scale: "buildings" },
  // Construction
  { key: "emergent-structure", label: "Emergent Structure", scale: "construction" },
  { key: "structural-layout", label: "Structural Layout", scale: "construction" },
  { key: "erecting-frame", label: "Erecting the Frame", scale: "construction" },
  { key: "fenestration", label: "Fenestration", scale: "construction" },
  { key: "frame-adjustments", label: "Frame Adjustments", scale: "construction" },
  { key: "interior-details", label: "Interior Details", scale: "construction" },
  { key: "outdoor-details", label: "Outdoor Details", scale: "construction" },
  { key: "ornamentation", label: "Ornamentation", scale: "construction" },
];

export const PATTERNS = [
  // ── Towns: Network of Lattices ──
  { id:"pl-001", num:1, title:"Independent Regions", scale:"towns", group:"network-of-lattices", appliedIn:["Relational Design","Relational Field Model"], notes:"" },

  // ── Towns: Regional Policies ──
  { id:"pl-002", num:2, title:"The Distribution of Towns", scale:"towns", group:"regional-policies", appliedIn:[], notes:"" },
  { id:"pl-003", num:3, title:"City Country Fingers", scale:"towns", group:"regional-policies", appliedIn:[], notes:"" },
  { id:"pl-004", num:4, title:"Agricultural Valleys", scale:"towns", group:"regional-policies", appliedIn:[], notes:"" },
  { id:"pl-005", num:5, title:"Lace of Country Streets", scale:"towns", group:"regional-policies", appliedIn:[], notes:"" },
  { id:"pl-006", num:6, title:"Country Towns", scale:"towns", group:"regional-policies", appliedIn:[], notes:"" },
  { id:"pl-007", num:7, title:"The Countryside", scale:"towns", group:"regional-policies", appliedIn:[], notes:"" },

  // ── Towns: City Policies ──
  { id:"pl-008", num:8, title:"Mosaic of Subcultures", scale:"towns", group:"city-policies", appliedIn:["Apple Music"], notes:"" },
  { id:"pl-009", num:9, title:"Scattered Work", scale:"towns", group:"city-policies", appliedIn:["Hybrid Intelligence"], notes:"" },
  { id:"pl-010", num:10, title:"Magic of the City", scale:"towns", group:"city-policies", appliedIn:["Vevo","Tribeca Festival"], notes:"" },
  { id:"pl-011", num:11, title:"Local Transport Areas", scale:"towns", group:"city-policies", appliedIn:[], notes:"" },

  // ── Towns: Communities ──
  { id:"pl-012", num:12, title:"Community of 7000", scale:"towns", group:"communities", appliedIn:[], notes:"" },
  { id:"pl-013", num:13, title:"Subculture Boundary", scale:"towns", group:"communities", appliedIn:["Apple Music"], notes:"" },
  { id:"pl-014", num:14, title:"Identifiable Neighborhood", scale:"towns", group:"communities", appliedIn:["Apple Music","Google Cloud"], notes:"" },
  { id:"pl-015", num:15, title:"Neighborhood Boundary", scale:"towns", group:"communities", appliedIn:[], notes:"" },

  // ── Towns: Community Networking ──
  { id:"pl-016", num:16, title:"Web of Public Transport", scale:"towns", group:"community-networking", appliedIn:[], notes:"" },
  { id:"pl-017", num:17, title:"Ring Roads", scale:"towns", group:"community-networking", appliedIn:[], notes:"" },
  { id:"pl-018", num:18, title:"Network of Learning", scale:"towns", group:"community-networking", appliedIn:["Hybrid Intelligence","Beyond Age"], notes:"" },
  { id:"pl-019", num:19, title:"Web of Shopping", scale:"towns", group:"community-networking", appliedIn:[], notes:"" },
  { id:"pl-020", num:20, title:"Mini-Buses", scale:"towns", group:"community-networking", appliedIn:[], notes:"" },

  // ── Towns: Community Policies ──
  { id:"pl-021", num:21, title:"Four-Story Limit", scale:"towns", group:"community-policies", appliedIn:[], notes:"" },
  { id:"pl-022", num:22, title:"Nine Per Cent Parking", scale:"towns", group:"community-policies", appliedIn:[], notes:"" },
  { id:"pl-023", num:23, title:"Parallel Roads", scale:"towns", group:"community-policies", appliedIn:[], notes:"" },
  { id:"pl-024", num:24, title:"Sacred Sites", scale:"towns", group:"community-policies", appliedIn:["Art of Tolerance"], notes:"" },
  { id:"pl-025", num:25, title:"Access to Water", scale:"towns", group:"community-policies", appliedIn:["After the Bridge"], notes:"" },
  { id:"pl-026", num:26, title:"Life Cycle", scale:"towns", group:"community-policies", appliedIn:["Beyond Productivity","Beyond Age"], notes:"" },
  { id:"pl-027", num:27, title:"Men and Women", scale:"towns", group:"community-policies", appliedIn:[], notes:"" },

  // ── Towns: Local Centers ──
  { id:"pl-028", num:28, title:"Eccentric Nucleus", scale:"towns", group:"local-centers", appliedIn:["Relational Design","Relational Field Model"], notes:"" },
  { id:"pl-029", num:29, title:"Density Rings", scale:"towns", group:"local-centers", appliedIn:[], notes:"" },
  { id:"pl-030", num:30, title:"Activity Nodes", scale:"towns", group:"local-centers", appliedIn:["Apple Music","Vevo"], notes:"" },
  { id:"pl-031", num:31, title:"Promenade", scale:"towns", group:"local-centers", appliedIn:["Tribeca Festival","Way of the Wave"], notes:"" },
  { id:"pl-032", num:32, title:"Shopping Street", scale:"towns", group:"local-centers", appliedIn:[], notes:"" },
  { id:"pl-033", num:33, title:"Night Life", scale:"towns", group:"local-centers", appliedIn:[], notes:"" },
  { id:"pl-034", num:34, title:"Interchange", scale:"towns", group:"local-centers", appliedIn:[], notes:"" },

  // ── Towns: Housing Clusters ──
  { id:"pl-035", num:35, title:"Household Mix", scale:"towns", group:"housing-clusters", appliedIn:[], notes:"" },
  { id:"pl-036", num:36, title:"Degrees of Publicness", scale:"towns", group:"housing-clusters", appliedIn:["Apple Music","Terms of Visibility","Safety Trap"], notes:"" },
  { id:"pl-037", num:37, title:"House Cluster", scale:"towns", group:"housing-clusters", appliedIn:["Freedom"], notes:"" },
  { id:"pl-038", num:38, title:"Row Houses", scale:"towns", group:"housing-clusters", appliedIn:[], notes:"" },
  { id:"pl-039", num:39, title:"Housing Hill", scale:"towns", group:"housing-clusters", appliedIn:[], notes:"" },
  { id:"pl-040", num:40, title:"Old People Everywhere", scale:"towns", group:"housing-clusters", appliedIn:[], notes:"" },

  // ── Towns: Work Communities ──
  { id:"pl-041", num:41, title:"Work Community", scale:"towns", group:"work-communities", appliedIn:["Hybrid Intelligence"], notes:"" },
  { id:"pl-042", num:42, title:"Industrial Ribbon", scale:"towns", group:"work-communities", appliedIn:[], notes:"" },
  { id:"pl-043", num:43, title:"University as a Marketplace", scale:"towns", group:"work-communities", appliedIn:["What Lies Beyond Next"], notes:"" },
  { id:"pl-044", num:44, title:"Local Town Hall", scale:"towns", group:"work-communities", appliedIn:[], notes:"" },
  { id:"pl-045", num:45, title:"Necklace of Community Projects", scale:"towns", group:"work-communities", appliedIn:["Tribeca Festival"], notes:"" },
  { id:"pl-046", num:46, title:"Market of Many Shops", scale:"towns", group:"work-communities", appliedIn:[], notes:"" },
  { id:"pl-047", num:47, title:"Health Center", scale:"towns", group:"work-communities", appliedIn:[], notes:"" },
  { id:"pl-048", num:48, title:"Housing In Between", scale:"towns", group:"work-communities", appliedIn:[], notes:"" },

  // ── Towns: Local Networking ──
  { id:"pl-049", num:49, title:"Looped Local Roads", scale:"towns", group:"local-networking", appliedIn:[], notes:"" },
  { id:"pl-050", num:50, title:"T Junctions", scale:"towns", group:"local-networking", appliedIn:["The False Step"], notes:"" },
  { id:"pl-051", num:51, title:"Green Streets", scale:"towns", group:"local-networking", appliedIn:[], notes:"" },
  { id:"pl-052", num:52, title:"Network of Paths and Cars", scale:"towns", group:"local-networking", appliedIn:["Apple Music"], notes:"" },
  { id:"pl-053", num:53, title:"Main Gateways", scale:"towns", group:"local-networking", appliedIn:["Apple Music","Google Cloud"], notes:"" },
  { id:"pl-054", num:54, title:"Road Crossing", scale:"towns", group:"local-networking", appliedIn:["After the Bridge","The False Step"], notes:"" },
  { id:"pl-055", num:55, title:"Raised Walk", scale:"towns", group:"local-networking", appliedIn:["After the Bridge"], notes:"" },
  { id:"pl-056", num:56, title:"Bike Paths and Racks", scale:"towns", group:"local-networking", appliedIn:[], notes:"" },
  { id:"pl-057", num:57, title:"Children in the City", scale:"towns", group:"local-networking", appliedIn:[], notes:"" },

  // ── Towns: Community Recreation ──
  { id:"pl-058", num:58, title:"Carnival", scale:"towns", group:"community-recreation", appliedIn:["Tribeca Festival","Reshaping Players"], notes:"" },
  { id:"pl-059", num:59, title:"Quiet Backs", scale:"towns", group:"community-recreation", appliedIn:["Art of Tolerance"], notes:"" },
  { id:"pl-060", num:60, title:"Accessible Green", scale:"towns", group:"community-recreation", appliedIn:[], notes:"" },
  { id:"pl-061", num:61, title:"Small Public Squares", scale:"towns", group:"community-recreation", appliedIn:["Tribeca Festival"], notes:"" },
  { id:"pl-062", num:62, title:"High Places", scale:"towns", group:"community-recreation", appliedIn:[], notes:"" },
  { id:"pl-063", num:63, title:"Dancing in the Street", scale:"towns", group:"community-recreation", appliedIn:["Tribeca Festival"], notes:"" },
  { id:"pl-064", num:64, title:"Pools and Streams", scale:"towns", group:"community-recreation", appliedIn:[], notes:"" },
  { id:"pl-065", num:65, title:"Birth Places", scale:"towns", group:"community-recreation", appliedIn:[], notes:"" },
  { id:"pl-066", num:66, title:"Holy Ground", scale:"towns", group:"community-recreation", appliedIn:["Art of Tolerance"], notes:"" },

  // ── Towns: Local Recreation ──
  { id:"pl-067", num:67, title:"Common Land", scale:"towns", group:"local-recreation", appliedIn:["Freedom"], notes:"" },
  { id:"pl-068", num:68, title:"Connected Play", scale:"towns", group:"local-recreation", appliedIn:["Reshaping Players"], notes:"" },
  { id:"pl-069", num:69, title:"Public Outdoor Room", scale:"towns", group:"local-recreation", appliedIn:["Tribeca Festival"], notes:"" },
  { id:"pl-070", num:70, title:"Grave Sites", scale:"towns", group:"local-recreation", appliedIn:["Loud Goodbye"], notes:"" },
  { id:"pl-071", num:71, title:"Still Water", scale:"towns", group:"local-recreation", appliedIn:[], notes:"" },
  { id:"pl-072", num:72, title:"Local Sports", scale:"towns", group:"local-recreation", appliedIn:[], notes:"" },
  { id:"pl-073", num:73, title:"Adventure Playground", scale:"towns", group:"local-recreation", appliedIn:["Reshaping Players"], notes:"" },
  { id:"pl-074", num:74, title:"Animals", scale:"towns", group:"local-recreation", appliedIn:[], notes:"" },

  // ── Towns: Families ──
  { id:"pl-075", num:75, title:"The Family", scale:"towns", group:"families", appliedIn:["Freedom"], notes:"" },
  { id:"pl-076", num:76, title:"House for a Small Family", scale:"towns", group:"families", appliedIn:[], notes:"" },
  { id:"pl-077", num:77, title:"House for a Couple", scale:"towns", group:"families", appliedIn:[], notes:"" },
  { id:"pl-078", num:78, title:"House for One Person", scale:"towns", group:"families", appliedIn:[], notes:"" },
  { id:"pl-079", num:79, title:"Your Own Home", scale:"towns", group:"families", appliedIn:["Safety Trap"], notes:"" },

  // ── Towns: Workgroups ──
  { id:"pl-080", num:80, title:"Self-Governing Workshops and Offices", scale:"towns", group:"workgroups", appliedIn:["Hybrid Intelligence"], notes:"" },
  { id:"pl-081", num:81, title:"Small Services Without Red Tape", scale:"towns", group:"workgroups", appliedIn:[], notes:"" },
  { id:"pl-082", num:82, title:"Office Connections", scale:"towns", group:"workgroups", appliedIn:[], notes:"" },
  { id:"pl-083", num:83, title:"Master and Apprentices", scale:"towns", group:"workgroups", appliedIn:["Hybrid Intelligence","Beyond Age"], notes:"" },
  { id:"pl-084", num:84, title:"Teenage Society", scale:"towns", group:"workgroups", appliedIn:[], notes:"" },
  { id:"pl-085", num:85, title:"Shopfront Schools", scale:"towns", group:"workgroups", appliedIn:[], notes:"" },
  { id:"pl-086", num:86, title:"Children's Home", scale:"towns", group:"workgroups", appliedIn:[], notes:"" },

  // ── Towns: Local Gathering ──
  { id:"pl-087", num:87, title:"Individually Owned Shops", scale:"towns", group:"local-gathering", appliedIn:["Vevo"], notes:"" },
  { id:"pl-088", num:88, title:"Street Cafe", scale:"towns", group:"local-gathering", appliedIn:[], notes:"" },
  { id:"pl-089", num:89, title:"Corner Grocery", scale:"towns", group:"local-gathering", appliedIn:[], notes:"" },
  { id:"pl-090", num:90, title:"Beer Hall", scale:"towns", group:"local-gathering", appliedIn:[], notes:"" },
  { id:"pl-091", num:91, title:"Traveler's Inn", scale:"towns", group:"local-gathering", appliedIn:[], notes:"" },
  { id:"pl-092", num:92, title:"Bus Stop", scale:"towns", group:"local-gathering", appliedIn:[], notes:"" },
  { id:"pl-093", num:93, title:"Food Stands", scale:"towns", group:"local-gathering", appliedIn:[], notes:"" },
  { id:"pl-094", num:94, title:"Sleeping in Public", scale:"towns", group:"local-gathering", appliedIn:[], notes:"" },

  // ── Buildings: Group of Buildings ──
  { id:"pl-095", num:95, title:"Building Complex", scale:"buildings", group:"group-of-buildings", appliedIn:["Google Cloud","Leveling Game"], notes:"" },
  { id:"pl-096", num:96, title:"Number of Stories", scale:"buildings", group:"group-of-buildings", appliedIn:[], notes:"" },
  { id:"pl-097", num:97, title:"Shielded Parking", scale:"buildings", group:"group-of-buildings", appliedIn:[], notes:"" },
  { id:"pl-098", num:98, title:"Circulation Realms", scale:"buildings", group:"group-of-buildings", appliedIn:["Apple Music","Google Cloud"], notes:"" },
  { id:"pl-099", num:99, title:"Main Building", scale:"buildings", group:"group-of-buildings", appliedIn:["Google Cloud"], notes:"" },
  { id:"pl-100", num:100, title:"Pedestrian Street", scale:"buildings", group:"group-of-buildings", appliedIn:["Vevo","Tribeca Festival"], notes:"" },
  { id:"pl-101", num:101, title:"Building Thoroughfare", scale:"buildings", group:"group-of-buildings", appliedIn:[], notes:"" },
  { id:"pl-102", num:102, title:"Family of Entrances", scale:"buildings", group:"group-of-buildings", appliedIn:["Google Cloud"], notes:"" },
  { id:"pl-103", num:103, title:"Small Parking Lots", scale:"buildings", group:"group-of-buildings", appliedIn:[], notes:"" },

  // ── Buildings: Siting the Buildings ──
  { id:"pl-104", num:104, title:"Site Repair", scale:"buildings", group:"siting", appliedIn:["Foundation","Loud Goodbye"], notes:"" },
  { id:"pl-105", num:105, title:"South Facing Outdoors", scale:"buildings", group:"siting", appliedIn:[], notes:"" },
  { id:"pl-106", num:106, title:"Positive Outdoor Space", scale:"buildings", group:"siting", appliedIn:["Relational Design","Architecture of Coherence","Relational Field Model"], notes:"" },
  { id:"pl-107", num:107, title:"Wings of Light", scale:"buildings", group:"siting", appliedIn:[], notes:"" },
  { id:"pl-108", num:108, title:"Connected Buildings", scale:"buildings", group:"siting", appliedIn:["Freedom"], notes:"" },
  { id:"pl-109", num:109, title:"Long Thin House", scale:"buildings", group:"siting", appliedIn:[], notes:"" },

  // ── Buildings: Building Layout ──
  { id:"pl-110", num:110, title:"Main Entrance", scale:"buildings", group:"building-layout", appliedIn:["Apple Music","Google Cloud"], notes:"" },
  { id:"pl-111", num:111, title:"Half-Hidden Garden", scale:"buildings", group:"building-layout", appliedIn:[], notes:"" },
  { id:"pl-112", num:112, title:"Entrance Transition", scale:"buildings", group:"building-layout", appliedIn:["Apple Music","The Grieving Interface"], notes:"" },
  { id:"pl-113", num:113, title:"Car Connection", scale:"buildings", group:"building-layout", appliedIn:[], notes:"" },
  { id:"pl-114", num:114, title:"Hierarchy of Open Space", scale:"buildings", group:"building-layout", appliedIn:["Apple Music","Google Cloud","Architecture of Coherence"], notes:"" },
  { id:"pl-115", num:115, title:"Courtyards Which Live", scale:"buildings", group:"building-layout", appliedIn:[], notes:"" },
  { id:"pl-116", num:116, title:"Cascade of Roofs", scale:"buildings", group:"building-layout", appliedIn:["Leveling Game"], notes:"" },
  { id:"pl-117", num:117, title:"Sheltering Roof", scale:"buildings", group:"building-layout", appliedIn:[], notes:"" },
  { id:"pl-118", num:118, title:"Roof Garden", scale:"buildings", group:"building-layout", appliedIn:[], notes:"" },

  // ── Buildings: Between the Buildings ──
  { id:"pl-119", num:119, title:"Arcades", scale:"buildings", group:"between-buildings", appliedIn:[], notes:"" },
  { id:"pl-120", num:120, title:"Paths and Goals", scale:"buildings", group:"between-buildings", appliedIn:["Apple Music"], notes:"" },
  { id:"pl-121", num:121, title:"Path Shape", scale:"buildings", group:"between-buildings", appliedIn:["Way of the Wave","The False Step"], notes:"" },
  { id:"pl-122", num:122, title:"Building Fronts", scale:"buildings", group:"between-buildings", appliedIn:["Vevo","Terms of Visibility"], notes:"" },
  { id:"pl-123", num:123, title:"Pedestrian Density", scale:"buildings", group:"between-buildings", appliedIn:[], notes:"" },
  { id:"pl-124", num:124, title:"Activity Pockets", scale:"buildings", group:"between-buildings", appliedIn:["Tribeca Festival","Reshaping Players"], notes:"" },
  { id:"pl-125", num:125, title:"Stair Seats", scale:"buildings", group:"between-buildings", appliedIn:[], notes:"" },
  { id:"pl-126", num:126, title:"Something Roughly in the Middle", scale:"buildings", group:"between-buildings", appliedIn:[], notes:"" },

  // ── Buildings: Light and Space ──
  { id:"pl-127", num:127, title:"Intimacy Gradient", scale:"buildings", group:"light-and-space", appliedIn:["Apple Music","Freedom","Relational Design"], notes:"" },
  { id:"pl-128", num:128, title:"Indoor Sunlight", scale:"buildings", group:"light-and-space", appliedIn:[], notes:"" },
  { id:"pl-129", num:129, title:"Common Areas at the Heart", scale:"buildings", group:"light-and-space", appliedIn:["Vevo","Relational Design"], notes:"" },
  { id:"pl-130", num:130, title:"Entrance Room", scale:"buildings", group:"light-and-space", appliedIn:[], notes:"" },
  { id:"pl-131", num:131, title:"The Flow Through Rooms", scale:"buildings", group:"light-and-space", appliedIn:["Apple Music","Tribeca Festival","Way of the Wave"], notes:"" },
  { id:"pl-132", num:132, title:"Short Passages", scale:"buildings", group:"light-and-space", appliedIn:[], notes:"" },
  { id:"pl-133", num:133, title:"Staircase as a Stage", scale:"buildings", group:"light-and-space", appliedIn:[], notes:"" },
  { id:"pl-134", num:134, title:"Zen View", scale:"buildings", group:"light-and-space", appliedIn:["Compression Sequence"], notes:"" },
  { id:"pl-135", num:135, title:"Tapestry of Light and Dark", scale:"buildings", group:"light-and-space", appliedIn:["Internet and the Age of Emotion","Art of Tolerance"], notes:"" },

  // ── Buildings: Private Rooms ──
  { id:"pl-136", num:136, title:"Couple's Realm", scale:"buildings", group:"private-rooms", appliedIn:[], notes:"" },
  { id:"pl-137", num:137, title:"Children's Realm", scale:"buildings", group:"private-rooms", appliedIn:[], notes:"" },
  { id:"pl-138", num:138, title:"Sleeping to the East", scale:"buildings", group:"private-rooms", appliedIn:[], notes:"" },
  { id:"pl-139", num:139, title:"Farmhouse Kitchen", scale:"buildings", group:"private-rooms", appliedIn:[], notes:"" },
  { id:"pl-140", num:140, title:"Private Terrace on the Street", scale:"buildings", group:"private-rooms", appliedIn:[], notes:"" },
  { id:"pl-141", num:141, title:"A Room of One's Own", scale:"buildings", group:"private-rooms", appliedIn:["Safety Trap"], notes:"" },
  { id:"pl-142", num:142, title:"Sequence of Sitting Spaces", scale:"buildings", group:"private-rooms", appliedIn:[], notes:"" },
  { id:"pl-143", num:143, title:"Bed Cluster", scale:"buildings", group:"private-rooms", appliedIn:[], notes:"" },
  { id:"pl-144", num:144, title:"Bathing Room", scale:"buildings", group:"private-rooms", appliedIn:[], notes:"" },
  { id:"pl-145", num:145, title:"Bulk Storage", scale:"buildings", group:"private-rooms", appliedIn:[], notes:"" },

  // ── Buildings: Public Rooms ──
  { id:"pl-146", num:146, title:"Flexible Office Space", scale:"buildings", group:"public-rooms", appliedIn:[], notes:"" },
  { id:"pl-147", num:147, title:"Communal Eating", scale:"buildings", group:"public-rooms", appliedIn:[], notes:"" },
  { id:"pl-148", num:148, title:"Small Work Groups", scale:"buildings", group:"public-rooms", appliedIn:["Hybrid Intelligence"], notes:"" },
  { id:"pl-149", num:149, title:"Reception Welcomes You", scale:"buildings", group:"public-rooms", appliedIn:[], notes:"" },
  { id:"pl-150", num:150, title:"A Place to Wait", scale:"buildings", group:"public-rooms", appliedIn:[], notes:"" },
  { id:"pl-151", num:151, title:"Small Meeting Rooms", scale:"buildings", group:"public-rooms", appliedIn:[], notes:"" },
  { id:"pl-152", num:152, title:"Half-Private Office", scale:"buildings", group:"public-rooms", appliedIn:[], notes:"" },

  // ── Buildings: Outbuildings ──
  { id:"pl-153", num:153, title:"Rooms to Rent", scale:"buildings", group:"outbuildings", appliedIn:[], notes:"" },
  { id:"pl-154", num:154, title:"Teenager's Cottage", scale:"buildings", group:"outbuildings", appliedIn:[], notes:"" },
  { id:"pl-155", num:155, title:"Old Age Cottage", scale:"buildings", group:"outbuildings", appliedIn:[], notes:"" },
  { id:"pl-156", num:156, title:"Settled Work", scale:"buildings", group:"outbuildings", appliedIn:[], notes:"" },
  { id:"pl-157", num:157, title:"Home Workshop", scale:"buildings", group:"outbuildings", appliedIn:[], notes:"" },
  { id:"pl-158", num:158, title:"Open Stairs", scale:"buildings", group:"outbuildings", appliedIn:[], notes:"" },

  // ── Buildings: Liminal Space ──
  { id:"pl-159", num:159, title:"Light on Two Sides of Every Room", scale:"buildings", group:"liminal-space", appliedIn:["Hybrid Intelligence"], notes:"" },
  { id:"pl-160", num:160, title:"Building Edge", scale:"buildings", group:"liminal-space", appliedIn:[], notes:"" },
  { id:"pl-161", num:161, title:"Sunny Place", scale:"buildings", group:"liminal-space", appliedIn:[], notes:"" },
  { id:"pl-162", num:162, title:"North Face", scale:"buildings", group:"liminal-space", appliedIn:[], notes:"" },
  { id:"pl-163", num:163, title:"Outdoor Room", scale:"buildings", group:"liminal-space", appliedIn:["Relational Design"], notes:"" },
  { id:"pl-164", num:164, title:"Street Windows", scale:"buildings", group:"liminal-space", appliedIn:["Internet and the Age of Emotion","The Grieving Interface"], notes:"" },
  { id:"pl-165", num:165, title:"Opening to the Street", scale:"buildings", group:"liminal-space", appliedIn:["Vevo","Terms of Visibility"], notes:"" },
  { id:"pl-166", num:166, title:"Gallery Surround", scale:"buildings", group:"liminal-space", appliedIn:[], notes:"" },
  { id:"pl-167", num:167, title:"Six-Foot Balcony", scale:"buildings", group:"liminal-space", appliedIn:[], notes:"" },
  { id:"pl-168", num:168, title:"Connection to the Earth", scale:"buildings", group:"liminal-space", appliedIn:["Beyond Productivity","Foundation"], notes:"" },

  // ── Buildings: Gardens ──
  { id:"pl-169", num:169, title:"Terraced Slope", scale:"buildings", group:"gardens", appliedIn:[], notes:"" },
  { id:"pl-170", num:170, title:"Fruit Trees", scale:"buildings", group:"gardens", appliedIn:[], notes:"" },
  { id:"pl-171", num:171, title:"Tree Places", scale:"buildings", group:"gardens", appliedIn:[], notes:"" },
  { id:"pl-172", num:172, title:"Garden Growing Wild", scale:"buildings", group:"gardens", appliedIn:["GSL"], notes:"" },
  { id:"pl-173", num:173, title:"Garden Wall", scale:"buildings", group:"gardens", appliedIn:[], notes:"" },
  { id:"pl-174", num:174, title:"Trellised Walk", scale:"buildings", group:"gardens", appliedIn:[], notes:"" },
  { id:"pl-175", num:175, title:"Greenhouse", scale:"buildings", group:"gardens", appliedIn:[], notes:"" },
  { id:"pl-176", num:176, title:"Garden Seat", scale:"buildings", group:"gardens", appliedIn:[], notes:"" },
  { id:"pl-177", num:177, title:"Vegetable Garden", scale:"buildings", group:"gardens", appliedIn:[], notes:"" },
  { id:"pl-178", num:178, title:"Compost", scale:"buildings", group:"gardens", appliedIn:["Foundation"], notes:"" },

  // ── Buildings: Minor Rooms ──
  { id:"pl-179", num:179, title:"Alcoves", scale:"buildings", group:"minor-rooms", appliedIn:["Safety Trap"], notes:"" },
  { id:"pl-180", num:180, title:"Window Place", scale:"buildings", group:"minor-rooms", appliedIn:["The Grieving Interface"], notes:"" },
  { id:"pl-181", num:181, title:"The Fire", scale:"buildings", group:"minor-rooms", appliedIn:[], notes:"" },
  { id:"pl-182", num:182, title:"Eating Atmosphere", scale:"buildings", group:"minor-rooms", appliedIn:[], notes:"" },
  { id:"pl-183", num:183, title:"Workspace Enclosure", scale:"buildings", group:"minor-rooms", appliedIn:[], notes:"" },
  { id:"pl-184", num:184, title:"Cooking Layout", scale:"buildings", group:"minor-rooms", appliedIn:[], notes:"" },
  { id:"pl-185", num:185, title:"Sitting Circle", scale:"buildings", group:"minor-rooms", appliedIn:[], notes:"" },
  { id:"pl-186", num:186, title:"Communal Sleeping", scale:"buildings", group:"minor-rooms", appliedIn:[], notes:"" },
  { id:"pl-187", num:187, title:"Marriage Bed", scale:"buildings", group:"minor-rooms", appliedIn:[], notes:"" },
  { id:"pl-188", num:188, title:"Bed Alcove", scale:"buildings", group:"minor-rooms", appliedIn:[], notes:"" },
  { id:"pl-189", num:189, title:"Dressing Rooms", scale:"buildings", group:"minor-rooms", appliedIn:[], notes:"" },

  // ── Buildings: Shaping the Rooms ──
  { id:"pl-190", num:190, title:"Ceiling Height Variety", scale:"buildings", group:"shaping-rooms", appliedIn:["Apple Music"], notes:"" },
  { id:"pl-191", num:191, title:"The Shape of Indoor Space", scale:"buildings", group:"shaping-rooms", appliedIn:[], notes:"" },
  { id:"pl-192", num:192, title:"Windows Overlooking Life", scale:"buildings", group:"shaping-rooms", appliedIn:[], notes:"" },
  { id:"pl-193", num:193, title:"Half-Open Wall", scale:"buildings", group:"shaping-rooms", appliedIn:["Terms of Visibility"], notes:"" },
  { id:"pl-194", num:194, title:"Interior Windows", scale:"buildings", group:"shaping-rooms", appliedIn:[], notes:"" },
  { id:"pl-195", num:195, title:"Staircase Volume", scale:"buildings", group:"shaping-rooms", appliedIn:[], notes:"" },
  { id:"pl-196", num:196, title:"Corner Doors", scale:"buildings", group:"shaping-rooms", appliedIn:[], notes:"" },

  // ── Buildings: Thick Walls ──
  { id:"pl-197", num:197, title:"Thick Walls", scale:"buildings", group:"thick-walls", appliedIn:["Architecture of Coherence"], notes:"" },
  { id:"pl-198", num:198, title:"Closets Between Rooms", scale:"buildings", group:"thick-walls", appliedIn:[], notes:"" },
  { id:"pl-199", num:199, title:"Sunny Counter", scale:"buildings", group:"thick-walls", appliedIn:[], notes:"" },
  { id:"pl-200", num:200, title:"Open Shelves", scale:"buildings", group:"thick-walls", appliedIn:[], notes:"" },
  { id:"pl-201", num:201, title:"Waist-High Shelf", scale:"buildings", group:"thick-walls", appliedIn:[], notes:"" },
  { id:"pl-202", num:202, title:"Built-in Seats", scale:"buildings", group:"thick-walls", appliedIn:[], notes:"" },
  { id:"pl-203", num:203, title:"Child Caves", scale:"buildings", group:"thick-walls", appliedIn:[], notes:"" },
  { id:"pl-204", num:204, title:"Secret Place", scale:"buildings", group:"thick-walls", appliedIn:["Safety Trap","Loud Goodbye"], notes:"" },

  // ── Construction: Emergent Structure ──
  { id:"pl-205", num:205, title:"Structure Follows Social Spaces", scale:"construction", group:"emergent-structure", appliedIn:["Relational Design","Google Cloud","GSL","Architecture of Coherence","Relational Field Model"], notes:"" },
  { id:"pl-206", num:206, title:"Efficient Structure", scale:"construction", group:"emergent-structure", appliedIn:["Leveling Game"], notes:"" },
  { id:"pl-207", num:207, title:"Good Materials", scale:"construction", group:"emergent-structure", appliedIn:["Diagram Packs","Compression Sequence"], notes:"" },
  { id:"pl-208", num:208, title:"Gradual Stiffening", scale:"construction", group:"emergent-structure", appliedIn:["Beyond Productivity","Relational Design","GSL"], notes:"" },

  // ── Construction: Structural Layout ──
  { id:"pl-209", num:209, title:"Roof Layout", scale:"construction", group:"structural-layout", appliedIn:[], notes:"" },
  { id:"pl-210", num:210, title:"Floor and Ceiling Layout", scale:"construction", group:"structural-layout", appliedIn:["Leveling Game"], notes:"" },
  { id:"pl-211", num:211, title:"Thickening the Outer Walls", scale:"construction", group:"structural-layout", appliedIn:[], notes:"" },
  { id:"pl-212", num:212, title:"Columns at the Corners", scale:"construction", group:"structural-layout", appliedIn:[], notes:"" },
  { id:"pl-213", num:213, title:"Final Column Distribution", scale:"construction", group:"structural-layout", appliedIn:[], notes:"" },

  // ── Construction: Erecting the Frame ──
  { id:"pl-214", num:214, title:"Root Foundations", scale:"construction", group:"erecting-frame", appliedIn:["Foundation"], notes:"" },
  { id:"pl-215", num:215, title:"Ground Floor Slab", scale:"construction", group:"erecting-frame", appliedIn:[], notes:"" },
  { id:"pl-216", num:216, title:"Box Columns", scale:"construction", group:"erecting-frame", appliedIn:[], notes:"" },
  { id:"pl-217", num:217, title:"Perimeter Beams", scale:"construction", group:"erecting-frame", appliedIn:[], notes:"" },
  { id:"pl-218", num:218, title:"Wall Membranes", scale:"construction", group:"erecting-frame", appliedIn:[], notes:"" },
  { id:"pl-219", num:219, title:"Floor-Ceiling Vaults", scale:"construction", group:"erecting-frame", appliedIn:[], notes:"" },
  { id:"pl-220", num:220, title:"Roof Vaults", scale:"construction", group:"erecting-frame", appliedIn:[], notes:"" },

  // ── Construction: Fenestration ──
  { id:"pl-221", num:221, title:"Natural Doors and Windows", scale:"construction", group:"fenestration", appliedIn:[], notes:"" },
  { id:"pl-222", num:222, title:"Low Sill", scale:"construction", group:"fenestration", appliedIn:[], notes:"" },
  { id:"pl-223", num:223, title:"Deep Reveals", scale:"construction", group:"fenestration", appliedIn:[], notes:"" },
  { id:"pl-224", num:224, title:"Low Doorway", scale:"construction", group:"fenestration", appliedIn:[], notes:"" },
  { id:"pl-225", num:225, title:"Frames as Thickened Edges", scale:"construction", group:"fenestration", appliedIn:[], notes:"" },

  // ── Construction: Frame Adjustments ──
  { id:"pl-226", num:226, title:"Column Place", scale:"construction", group:"frame-adjustments", appliedIn:[], notes:"" },
  { id:"pl-227", num:227, title:"Column Connections", scale:"construction", group:"frame-adjustments", appliedIn:[], notes:"" },
  { id:"pl-228", num:228, title:"Stair Vault", scale:"construction", group:"frame-adjustments", appliedIn:[], notes:"" },
  { id:"pl-229", num:229, title:"Duct Space", scale:"construction", group:"frame-adjustments", appliedIn:[], notes:"" },
  { id:"pl-230", num:230, title:"Radiant Heat", scale:"construction", group:"frame-adjustments", appliedIn:[], notes:"" },
  { id:"pl-231", num:231, title:"Dormer Windows", scale:"construction", group:"frame-adjustments", appliedIn:[], notes:"" },
  { id:"pl-232", num:232, title:"Roof Caps", scale:"construction", group:"frame-adjustments", appliedIn:[], notes:"" },

  // ── Construction: Interior Details ──
  { id:"pl-233", num:233, title:"Floor Surface", scale:"construction", group:"interior-details", appliedIn:[], notes:"" },
  { id:"pl-234", num:234, title:"Lapped Outside Walls", scale:"construction", group:"interior-details", appliedIn:[], notes:"" },
  { id:"pl-235", num:235, title:"Soft Inside Walls", scale:"construction", group:"interior-details", appliedIn:[], notes:"" },
  { id:"pl-236", num:236, title:"Windows Which Open Wide", scale:"construction", group:"interior-details", appliedIn:[], notes:"" },
  { id:"pl-237", num:237, title:"Solid Doors with Glass", scale:"construction", group:"interior-details", appliedIn:[], notes:"" },
  { id:"pl-238", num:238, title:"Filtered Light", scale:"construction", group:"interior-details", appliedIn:["Compression Sequence"], notes:"" },
  { id:"pl-239", num:239, title:"Small Panes", scale:"construction", group:"interior-details", appliedIn:[], notes:"" },
  { id:"pl-240", num:240, title:"Half-Inch Trim", scale:"construction", group:"interior-details", appliedIn:[], notes:"" },

  // ── Construction: Outdoor Details ──
  { id:"pl-241", num:241, title:"Seat Spots", scale:"construction", group:"outdoor-details", appliedIn:[], notes:"" },
  { id:"pl-242", num:242, title:"Front Door Bench", scale:"construction", group:"outdoor-details", appliedIn:[], notes:"" },
  { id:"pl-243", num:243, title:"Sitting Wall", scale:"construction", group:"outdoor-details", appliedIn:[], notes:"" },
  { id:"pl-244", num:244, title:"Canvas Roofs", scale:"construction", group:"outdoor-details", appliedIn:[], notes:"" },
  { id:"pl-245", num:245, title:"Raised Flowers", scale:"construction", group:"outdoor-details", appliedIn:[], notes:"" },
  { id:"pl-246", num:246, title:"Climbing Plants", scale:"construction", group:"outdoor-details", appliedIn:[], notes:"" },
  { id:"pl-247", num:247, title:"Paving With Cracks Between the Stones", scale:"construction", group:"outdoor-details", appliedIn:[], notes:"" },
  { id:"pl-248", num:248, title:"Soft Tile and Brick", scale:"construction", group:"outdoor-details", appliedIn:[], notes:"" },

  // ── Construction: Ornamentation ──
  { id:"pl-249", num:249, title:"Ornament", scale:"construction", group:"ornamentation", appliedIn:["Vevo","Diagram Packs"], notes:"" },
  { id:"pl-250", num:250, title:"Warm Colors", scale:"construction", group:"ornamentation", appliedIn:["The Grieving Interface"], notes:"" },
  { id:"pl-251", num:251, title:"Different Chairs", scale:"construction", group:"ornamentation", appliedIn:[], notes:"" },
  { id:"pl-252", num:252, title:"Pools of Light", scale:"construction", group:"ornamentation", appliedIn:["Compression Sequence","Diagram Packs"], notes:"" },
  { id:"pl-253", num:253, title:"Things From Your Life", scale:"construction", group:"ornamentation", appliedIn:["Beyond Productivity"], notes:"" },
];
