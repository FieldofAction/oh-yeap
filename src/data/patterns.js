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
  { id:"pl-001", num:1, title:"Independent Regions", scale:"towns", group:"network-of-lattices", desc:"Regions should be self-governing to preserve cultural identity and prevent overcentralization of power.", appliedIn:["Relational Design","Relational Field Model"], notes:"" },

  // ── Towns: Regional Policies ──
  { id:"pl-002", num:2, title:"The Distribution of Towns", scale:"towns", group:"regional-policies", desc:"Balance urban and rural areas by distributing towns across the landscape at reasonable intervals.", appliedIn:[], notes:"" },
  { id:"pl-003", num:3, title:"City Country Fingers", scale:"towns", group:"regional-policies", desc:"Interleave urban and rural land in long alternating fingers so neither is far from the other.", appliedIn:[], notes:"" },
  { id:"pl-004", num:4, title:"Agricultural Valleys", scale:"towns", group:"regional-policies", desc:"Protect fertile valleys from development so they can sustain agriculture and natural life.", appliedIn:[], notes:"" },
  { id:"pl-005", num:5, title:"Lace of Country Streets", scale:"towns", group:"regional-policies", desc:"Connect rural houses along a network of country roads that preserve the land's character.", appliedIn:[], notes:"" },
  { id:"pl-006", num:6, title:"Country Towns", scale:"towns", group:"regional-policies", desc:"Small towns in the countryside need basic facilities and institutions to sustain community life.", appliedIn:[], notes:"" },
  { id:"pl-007", num:7, title:"The Countryside", scale:"towns", group:"regional-policies", desc:"Preserve open land between towns for agriculture, nature, and the rhythm of rural life.", appliedIn:[], notes:"" },

  // ── Towns: City Policies ──
  { id:"pl-008", num:8, title:"Mosaic of Subcultures", scale:"towns", group:"city-policies", desc:"Cities thrive when diverse subcultures coexist in distinct but accessible areas.", appliedIn:["Apple Music"], notes:"" },
  { id:"pl-009", num:9, title:"Scattered Work", scale:"towns", group:"city-policies", desc:"Distribute workplaces throughout communities rather than concentrating them in isolated zones.", appliedIn:["Hybrid Intelligence"], notes:"" },
  { id:"pl-010", num:10, title:"Magic of the City", scale:"towns", group:"city-policies", desc:"Concentrate unique cultural attractions to create the magnetism that draws people to city life.", appliedIn:["Vevo","Tribeca Festival"], notes:"" },
  { id:"pl-011", num:11, title:"Local Transport Areas", scale:"towns", group:"city-policies", desc:"Organize communities around small local transport areas with minimal car intrusion.", appliedIn:[], notes:"" },

  // ── Towns: Communities ──
  { id:"pl-012", num:12, title:"Community of 7000", scale:"towns", group:"communities", desc:"Communities function best at roughly 5,000 to 10,000 people, large enough for diversity, small enough for connection.", appliedIn:[], notes:"" },
  { id:"pl-013", num:13, title:"Subculture Boundary", scale:"towns", group:"communities", desc:"Mark distinct boundaries between different cultural neighborhoods to strengthen each one's identity.", appliedIn:["Apple Music"], notes:"" },
  { id:"pl-014", num:14, title:"Identifiable Neighborhood", scale:"towns", group:"communities", desc:"Neighborhoods need clear identity through natural boundaries, names, and recognizable centers.", appliedIn:["Apple Music","Google Cloud"], notes:"" },
  { id:"pl-015", num:15, title:"Neighborhood Boundary", scale:"towns", group:"communities", desc:"Define neighborhood edges with gateways, natural features, or changes in street character.", appliedIn:[], notes:"" },

  // ── Towns: Community Networking ──
  { id:"pl-016", num:16, title:"Web of Public Transport", scale:"towns", group:"community-networking", desc:"Connect all communities with a web of public transit routes that serve as the backbone of movement.", appliedIn:[], notes:"" },
  { id:"pl-017", num:17, title:"Ring Roads", scale:"towns", group:"community-networking", desc:"Route through-traffic around neighborhoods rather than through their centers.", appliedIn:[], notes:"" },
  { id:"pl-018", num:18, title:"Network of Learning", scale:"towns", group:"community-networking", desc:"Distribute learning across the community in many small settings rather than concentrating it in large institutions.", appliedIn:["Hybrid Intelligence","Beyond Age"], notes:"" },
  { id:"pl-019", num:19, title:"Web of Shopping", scale:"towns", group:"community-networking", desc:"Provide shops of different sizes distributed throughout the community within walking distance.", appliedIn:[], notes:"" },
  { id:"pl-020", num:20, title:"Mini-Buses", scale:"towns", group:"community-networking", desc:"Small, flexible buses serving local routes within and between neighborhoods supplement the main transit web.", appliedIn:[], notes:"" },

  // ── Towns: Community Policies ──
  { id:"pl-021", num:21, title:"Four-Story Limit", scale:"towns", group:"community-policies", desc:"Keep buildings under four stories to maintain a human-scale environment connected to the ground.", appliedIn:[], notes:"" },
  { id:"pl-022", num:22, title:"Nine Per Cent Parking", scale:"towns", group:"community-policies", desc:"Limit surface parking to no more than nine percent of built-up areas to preserve community fabric.", appliedIn:[], notes:"" },
  { id:"pl-023", num:23, title:"Parallel Roads", scale:"towns", group:"community-policies", desc:"Separate local access roads from through-traffic with parallel route systems.", appliedIn:[], notes:"" },
  { id:"pl-024", num:24, title:"Sacred Sites", scale:"towns", group:"community-policies", desc:"Protect places that hold special historical, spiritual, or emotional significance for the community.", appliedIn:["Art of Tolerance"], notes:"" },
  { id:"pl-025", num:25, title:"Access to Water", scale:"towns", group:"community-policies", desc:"Give all communities access to rivers, lakes, or the sea for recreation and renewal.", appliedIn:["After the Bridge"], notes:"" },
  { id:"pl-026", num:26, title:"Life Cycle", scale:"towns", group:"community-policies", desc:"Provide settings for all stages of life, birth, growth, maturity, and aging, within each community.", appliedIn:["Beyond Productivity","Beyond Age"], notes:"" },
  { id:"pl-027", num:27, title:"Men and Women", scale:"towns", group:"community-policies", desc:"Create spaces where people can find the social balance and autonomy they need.", appliedIn:[], notes:"" },

  // ── Towns: Local Centers ──
  { id:"pl-028", num:28, title:"Eccentric Nucleus", scale:"towns", group:"local-centers", desc:"Place community centers off-center to create varied districts and avoid rigid symmetry.", appliedIn:["Relational Design","Relational Field Model"], notes:"" },
  { id:"pl-029", num:29, title:"Density Rings", scale:"towns", group:"local-centers", desc:"Vary density from high at community centers to low at neighborhood edges.", appliedIn:[], notes:"" },
  { id:"pl-030", num:30, title:"Activity Nodes", scale:"towns", group:"local-centers", desc:"Create concentrations of activity at key intersections and gathering points where paths converge.", appliedIn:["Apple Music","Vevo"], notes:"" },
  { id:"pl-031", num:31, title:"Promenade", scale:"towns", group:"local-centers", desc:"Provide a central path where people naturally walk, linger, and encounter one another.", appliedIn:["Tribeca Festival","Way of the Wave"], notes:"" },
  { id:"pl-032", num:32, title:"Shopping Street", scale:"towns", group:"local-centers", desc:"Concentrate shops along a single pedestrian street to create a vibrant commercial spine.", appliedIn:[], notes:"" },
  { id:"pl-033", num:33, title:"Night Life", scale:"towns", group:"local-centers", desc:"Create areas of concentrated activity that come alive after dark with entertainment and gathering.", appliedIn:[], notes:"" },
  { id:"pl-034", num:34, title:"Interchange", scale:"towns", group:"local-centers", desc:"Design transit stops as active places of exchange between modes of transport and daily life.", appliedIn:[], notes:"" },

  // ── Towns: Housing Clusters ──
  { id:"pl-035", num:35, title:"Household Mix", scale:"towns", group:"housing-clusters", desc:"Provide a mix of household types, families, couples, singles, elderly, in every neighborhood.", appliedIn:[], notes:"" },
  { id:"pl-036", num:36, title:"Degrees of Publicness", scale:"towns", group:"housing-clusters", desc:"Arrange spaces in a gradient from fully public to increasingly private realms.", appliedIn:["Apple Music","Terms of Visibility","Safety Trap"], notes:"" },
  { id:"pl-037", num:37, title:"House Cluster", scale:"towns", group:"housing-clusters", desc:"Group houses around shared common land in intimate clusters of eight to twelve.", appliedIn:["Freedom"], notes:"" },
  { id:"pl-038", num:38, title:"Row Houses", scale:"towns", group:"housing-clusters", desc:"Connect houses in long rows that face pedestrian paths and shared gardens.", appliedIn:[], notes:"" },
  { id:"pl-039", num:39, title:"Housing Hill", scale:"towns", group:"housing-clusters", desc:"Step buildings up hillsides so all units have access to light and views.", appliedIn:[], notes:"" },
  { id:"pl-040", num:40, title:"Old People Everywhere", scale:"towns", group:"housing-clusters", desc:"Integrate housing for elderly people throughout the community rather than segregating them.", appliedIn:[], notes:"" },

  // ── Towns: Work Communities ──
  { id:"pl-041", num:41, title:"Work Community", scale:"towns", group:"work-communities", desc:"Cluster workplaces into small communities with shared common spaces and identity.", appliedIn:["Hybrid Intelligence"], notes:"" },
  { id:"pl-042", num:42, title:"Industrial Ribbon", scale:"towns", group:"work-communities", desc:"Concentrate industry in ribbons along rail lines and highways to separate noise from living areas.", appliedIn:[], notes:"" },
  { id:"pl-043", num:43, title:"University as a Marketplace", scale:"towns", group:"work-communities", desc:"Dissolve the campus boundary so the university becomes part of the surrounding community's fabric.", appliedIn:["What Lies Beyond Next"], notes:"" },
  { id:"pl-044", num:44, title:"Local Town Hall", scale:"towns", group:"work-communities", desc:"Provide each community with its own facility for democratic assembly and local governance.", appliedIn:[], notes:"" },
  { id:"pl-045", num:45, title:"Necklace of Community Projects", scale:"towns", group:"work-communities", desc:"Link community facilities together along a public path like beads on a necklace.", appliedIn:["Tribeca Festival"], notes:"" },
  { id:"pl-046", num:46, title:"Market of Many Shops", scale:"towns", group:"work-communities", desc:"Fill marketplaces with many small independently owned shops rather than a few large ones.", appliedIn:[], notes:"" },
  { id:"pl-047", num:47, title:"Health Center", scale:"towns", group:"work-communities", desc:"Create neighborhood health centers focused on wellness, prevention, and human connection.", appliedIn:[], notes:"" },
  { id:"pl-048", num:48, title:"Housing In Between", scale:"towns", group:"work-communities", desc:"Fill gaps between workplaces with housing to keep areas alive at all hours.", appliedIn:[], notes:"" },

  // ── Towns: Local Networking ──
  { id:"pl-049", num:49, title:"Looped Local Roads", scale:"towns", group:"local-networking", desc:"Connect local streets in loops rather than dead ends to maintain access without through-traffic.", appliedIn:[], notes:"" },
  { id:"pl-050", num:50, title:"T Junctions", scale:"towns", group:"local-networking", desc:"Use T-shaped intersections to slow traffic and discourage through-movement in neighborhoods.", appliedIn:["The False Step"], notes:"" },
  { id:"pl-051", num:51, title:"Green Streets", scale:"towns", group:"local-networking", desc:"Line local streets with grass, trees, and planting to soften the environment and slow cars.", appliedIn:[], notes:"" },
  { id:"pl-052", num:52, title:"Network of Paths and Cars", scale:"towns", group:"local-networking", desc:"Weave separate but crossing networks for pedestrians and cars so each has its own realm.", appliedIn:["Apple Music"], notes:"" },
  { id:"pl-053", num:53, title:"Main Gateways", scale:"towns", group:"local-networking", desc:"Mark major entrances to districts and neighborhoods with gateways, arches, or narrowings.", appliedIn:["Apple Music","Google Cloud"], notes:"" },
  { id:"pl-054", num:54, title:"Road Crossing", scale:"towns", group:"local-networking", desc:"Make pedestrian crossings safe, prominent, and comfortable at every major road.", appliedIn:["After the Bridge","The False Step"], notes:"" },
  { id:"pl-055", num:55, title:"Raised Walk", scale:"towns", group:"local-networking", desc:"Elevate pedestrian paths above road level where they cross busy streets for safety and continuity.", appliedIn:["After the Bridge"], notes:"" },
  { id:"pl-056", num:56, title:"Bike Paths and Racks", scale:"towns", group:"local-networking", desc:"Provide dedicated bike routes and convenient parking throughout the community.", appliedIn:[], notes:"" },
  { id:"pl-057", num:57, title:"Children in the City", scale:"towns", group:"local-networking", desc:"Design streets and paths so children can move freely and safely through the community.", appliedIn:[], notes:"" },

  // ── Towns: Community Recreation ──
  { id:"pl-058", num:58, title:"Carnival", scale:"towns", group:"community-recreation", desc:"Set aside community space and time for periodic festive celebrations and shared joy.", appliedIn:["Tribeca Festival","Reshaping Players"], notes:"" },
  { id:"pl-059", num:59, title:"Quiet Backs", scale:"towns", group:"community-recreation", desc:"Protect peaceful areas behind buildings as retreats from the intensity of street activity.", appliedIn:["Art of Tolerance"], notes:"" },
  { id:"pl-060", num:60, title:"Accessible Green", scale:"towns", group:"community-recreation", desc:"Ensure every household has open green space within a three-minute walk.", appliedIn:[], notes:"" },
  { id:"pl-061", num:61, title:"Small Public Squares", scale:"towns", group:"community-recreation", desc:"Create intimate public squares, no larger than about 70 feet across, for gathering.", appliedIn:["Tribeca Festival"], notes:"" },
  { id:"pl-062", num:62, title:"High Places", scale:"towns", group:"community-recreation", desc:"Provide accessible elevated points where people can survey the landscape and gain perspective.", appliedIn:[], notes:"" },
  { id:"pl-063", num:63, title:"Dancing in the Street", scale:"towns", group:"community-recreation", desc:"Design outdoor spaces that invite spontaneous performance, music, and dance.", appliedIn:["Tribeca Festival"], notes:"" },
  { id:"pl-064", num:64, title:"Pools and Streams", scale:"towns", group:"community-recreation", desc:"Incorporate natural water features into public spaces for beauty and engagement.", appliedIn:[], notes:"" },
  { id:"pl-065", num:65, title:"Birth Places", scale:"towns", group:"community-recreation", desc:"Create dignified, homelike settings for childbirth within the community.", appliedIn:[], notes:"" },
  { id:"pl-066", num:66, title:"Holy Ground", scale:"towns", group:"community-recreation", desc:"Designate consecrated ground where people can connect with something larger than daily life.", appliedIn:["Art of Tolerance"], notes:"" },

  // ── Towns: Local Recreation ──
  { id:"pl-067", num:67, title:"Common Land", scale:"towns", group:"local-recreation", desc:"Provide shared land collectively maintained by neighboring households for play and gathering.", appliedIn:["Freedom"], notes:"" },
  { id:"pl-068", num:68, title:"Connected Play", scale:"towns", group:"local-recreation", desc:"Link children's play areas so they can move safely between activity zones.", appliedIn:["Reshaping Players"], notes:"" },
  { id:"pl-069", num:69, title:"Public Outdoor Room", scale:"towns", group:"local-recreation", desc:"Create outdoor spaces that feel as sheltered and social as indoor rooms.", appliedIn:["Tribeca Festival"], notes:"" },
  { id:"pl-070", num:70, title:"Grave Sites", scale:"towns", group:"local-recreation", desc:"Keep burial grounds within communities as a visible part of everyday life and memory.", appliedIn:["Loud Goodbye"], notes:"" },
  { id:"pl-071", num:71, title:"Still Water", scale:"towns", group:"local-recreation", desc:"Include calm pools of water as places for quiet reflection and contemplation.", appliedIn:[], notes:"" },
  { id:"pl-072", num:72, title:"Local Sports", scale:"towns", group:"local-recreation", desc:"Provide fields and courts for community sports within easy walking distance.", appliedIn:[], notes:"" },
  { id:"pl-073", num:73, title:"Adventure Playground", scale:"towns", group:"local-recreation", desc:"Give children wild, unstructured spaces with raw materials for creative, self-directed play.", appliedIn:["Reshaping Players"], notes:"" },
  { id:"pl-074", num:74, title:"Animals", scale:"towns", group:"local-recreation", desc:"Include animals in the everyday environment so communities stay connected to living creatures.", appliedIn:[], notes:"" },

  // ── Towns: Families ──
  { id:"pl-075", num:75, title:"The Family", scale:"towns", group:"families", desc:"Support family life with spaces that accommodate its evolving shape and needs over time.", appliedIn:["Freedom"], notes:"" },
  { id:"pl-076", num:76, title:"House for a Small Family", scale:"towns", group:"families", desc:"Design homes for small families with distinct zones for children and adults.", appliedIn:[], notes:"" },
  { id:"pl-077", num:77, title:"House for a Couple", scale:"towns", group:"families", desc:"Shape a home around the unique rhythms and needs of two people living together.", appliedIn:[], notes:"" },
  { id:"pl-078", num:78, title:"House for One Person", scale:"towns", group:"families", desc:"Create homes for individuals that balance solitude with connection to community.", appliedIn:[], notes:"" },
  { id:"pl-079", num:79, title:"Your Own Home", scale:"towns", group:"families", desc:"Ensure every person has a place they can genuinely call their own.", appliedIn:["Safety Trap"], notes:"" },

  // ── Towns: Workgroups ──
  { id:"pl-080", num:80, title:"Self-Governing Workshops and Offices", scale:"towns", group:"workgroups", desc:"Let small work groups manage their own workspace, schedules, and organizational structure.", appliedIn:["Hybrid Intelligence"], notes:"" },
  { id:"pl-081", num:81, title:"Small Services Without Red Tape", scale:"towns", group:"workgroups", desc:"Deliver community services through small, accessible, human-scale outlets.", appliedIn:[], notes:"" },
  { id:"pl-082", num:82, title:"Office Connections", scale:"towns", group:"workgroups", desc:"Connect offices to the street and public life rather than isolating them in sealed buildings.", appliedIn:[], notes:"" },
  { id:"pl-083", num:83, title:"Master and Apprentices", scale:"towns", group:"workgroups", desc:"Structure work around experienced practitioners who teach through shared practice.", appliedIn:["Hybrid Intelligence","Beyond Age"], notes:"" },
  { id:"pl-084", num:84, title:"Teenage Society", scale:"towns", group:"workgroups", desc:"Provide spaces where teenagers can develop their own social world with some independence.", appliedIn:[], notes:"" },
  { id:"pl-085", num:85, title:"Shopfront Schools", scale:"towns", group:"workgroups", desc:"Place small learning environments in storefronts on public streets to integrate education with daily life.", appliedIn:[], notes:"" },
  { id:"pl-086", num:86, title:"Children's Home", scale:"towns", group:"workgroups", desc:"Create homelike environments for children who need care, embedded in the community.", appliedIn:[], notes:"" },

  // ── Towns: Local Gathering ──
  { id:"pl-087", num:87, title:"Individually Owned Shops", scale:"towns", group:"local-gathering", desc:"Favor independently owned shops over chains to preserve character and local identity.", appliedIn:["Vevo"], notes:"" },
  { id:"pl-088", num:88, title:"Street Cafe", scale:"towns", group:"local-gathering", desc:"Place cafe seating along the street where people watch the world go by.", appliedIn:[], notes:"" },
  { id:"pl-089", num:89, title:"Corner Grocery", scale:"towns", group:"local-gathering", desc:"Keep small food shops in every neighborhood for daily convenience and social exchange.", appliedIn:[], notes:"" },
  { id:"pl-090", num:90, title:"Beer Hall", scale:"towns", group:"local-gathering", desc:"Provide lively public houses where people gather to drink, talk, and build community.", appliedIn:[], notes:"" },
  { id:"pl-091", num:91, title:"Traveler's Inn", scale:"towns", group:"local-gathering", desc:"Offer lodging within communities where travelers can rest among locals.", appliedIn:[], notes:"" },
  { id:"pl-092", num:92, title:"Bus Stop", scale:"towns", group:"local-gathering", desc:"Make transit stops comfortable social places with shelter, seating, and visibility.", appliedIn:[], notes:"" },
  { id:"pl-093", num:93, title:"Food Stands", scale:"towns", group:"local-gathering", desc:"Place small food vendors in high-traffic pedestrian areas to animate public space.", appliedIn:[], notes:"" },
  { id:"pl-094", num:94, title:"Sleeping in Public", scale:"towns", group:"local-gathering", desc:"Allow people to find quiet corners in public spaces where they can rest undisturbed.", appliedIn:[], notes:"" },

  // ── Buildings: Group of Buildings ──
  { id:"pl-095", num:95, title:"Building Complex", scale:"buildings", group:"group-of-buildings", desc:"Arrange buildings in coherent complexes that relate to one another rather than standing as isolated structures.", appliedIn:["Google Cloud","Leveling Game"], notes:"" },
  { id:"pl-096", num:96, title:"Number of Stories", scale:"buildings", group:"group-of-buildings", desc:"Let the number of stories vary within a complex to match the social life each building contains.", appliedIn:[], notes:"" },
  { id:"pl-097", num:97, title:"Shielded Parking", scale:"buildings", group:"group-of-buildings", desc:"Screen parking areas behind buildings so cars don't dominate the visual environment.", appliedIn:[], notes:"" },
  { id:"pl-098", num:98, title:"Circulation Realms", scale:"buildings", group:"group-of-buildings", desc:"Create a hierarchy of paths from public thoroughfares to private entries within building groups.", appliedIn:["Apple Music","Google Cloud"], notes:"" },
  { id:"pl-099", num:99, title:"Main Building", scale:"buildings", group:"group-of-buildings", desc:"Give each building complex a single main building as its social and spatial focus.", appliedIn:["Google Cloud"], notes:"" },
  { id:"pl-100", num:100, title:"Pedestrian Street", scale:"buildings", group:"group-of-buildings", desc:"Create car-free streets where people walk freely among buildings and activity.", appliedIn:["Vevo","Tribeca Festival"], notes:"" },
  { id:"pl-101", num:101, title:"Building Thoroughfare", scale:"buildings", group:"group-of-buildings", desc:"Open buildings to create public paths through them, connecting the spaces on either side.", appliedIn:[], notes:"" },
  { id:"pl-102", num:102, title:"Family of Entrances", scale:"buildings", group:"group-of-buildings", desc:"Group related entrances together into a visible family so visitors can orient themselves.", appliedIn:["Google Cloud"], notes:"" },
  { id:"pl-103", num:103, title:"Small Parking Lots", scale:"buildings", group:"group-of-buildings", desc:"Break large parking areas into small lots of seven or fewer spaces scattered among buildings.", appliedIn:[], notes:"" },

  // ── Buildings: Siting the Buildings ──
  { id:"pl-104", num:104, title:"Site Repair", scale:"buildings", group:"siting", desc:"Build on the worst parts of a site and preserve the most beautiful areas for outdoor use.", appliedIn:["Foundation","Loud Goodbye"], notes:"" },
  { id:"pl-105", num:105, title:"South Facing Outdoors", scale:"buildings", group:"siting", desc:"Orient outdoor spaces to face the sun for warmth, light, and year-round usability.", appliedIn:[], notes:"" },
  { id:"pl-106", num:106, title:"Positive Outdoor Space", scale:"buildings", group:"siting", desc:"Shape outdoor areas as deliberately as indoor rooms, with defined edges and purpose.", appliedIn:["Relational Design","Architecture of Coherence","Relational Field Model"], notes:"" },
  { id:"pl-107", num:107, title:"Wings of Light", scale:"buildings", group:"siting", desc:"Extend buildings in narrow wings so every room can receive natural light from two sides.", appliedIn:[], notes:"" },
  { id:"pl-108", num:108, title:"Connected Buildings", scale:"buildings", group:"siting", desc:"Link separate buildings with covered walks, bridges, or shared spaces to form a whole.", appliedIn:["Freedom"], notes:"" },
  { id:"pl-109", num:109, title:"Long Thin House", scale:"buildings", group:"siting", desc:"Shape houses as long, narrow forms to maximize access to light and garden views.", appliedIn:[], notes:"" },

  // ── Buildings: Building Layout ──
  { id:"pl-110", num:110, title:"Main Entrance", scale:"buildings", group:"building-layout", desc:"Make the main entrance visible, welcoming, and clearly legible from the approach.", appliedIn:["Apple Music","Google Cloud"], notes:"" },
  { id:"pl-111", num:111, title:"Half-Hidden Garden", scale:"buildings", group:"building-layout", desc:"Place gardens where they are partially visible from the entrance, inviting exploration.", appliedIn:[], notes:"" },
  { id:"pl-112", num:112, title:"Entrance Transition", scale:"buildings", group:"building-layout", desc:"Create a sequence of spatial changes between the street and building interior to mark the passage.", appliedIn:["Apple Music","The Grieving Interface"], notes:"" },
  { id:"pl-113", num:113, title:"Car Connection", scale:"buildings", group:"building-layout", desc:"Connect car parking to the home through a sheltered, graceful transition.", appliedIn:[], notes:"" },
  { id:"pl-114", num:114, title:"Hierarchy of Open Space", scale:"buildings", group:"building-layout", desc:"Arrange outdoor areas in a clear sequence from large public spaces to small private ones.", appliedIn:["Apple Music","Google Cloud","Architecture of Coherence"], notes:"" },
  { id:"pl-115", num:115, title:"Courtyards Which Live", scale:"buildings", group:"building-layout", desc:"Design courtyards that open to surrounding activity rather than being sealed enclosures.", appliedIn:[], notes:"" },
  { id:"pl-116", num:116, title:"Cascade of Roofs", scale:"buildings", group:"building-layout", desc:"Step roofs down in layers from the highest ridge to the lowest eave at the building edge.", appliedIn:["Leveling Game"], notes:"" },
  { id:"pl-117", num:117, title:"Sheltering Roof", scale:"buildings", group:"building-layout", desc:"Let the roof be a prominent, protective element that visibly shelters the space below.", appliedIn:[], notes:"" },
  { id:"pl-118", num:118, title:"Roof Garden", scale:"buildings", group:"building-layout", desc:"Turn flat or accessible roofs into usable gardens, terraces, and living spaces.", appliedIn:[], notes:"" },

  // ── Buildings: Between the Buildings ──
  { id:"pl-119", num:119, title:"Arcades", scale:"buildings", group:"between-buildings", desc:"Create covered walkways along building edges as transitional spaces between inside and outside.", appliedIn:[], notes:"" },
  { id:"pl-120", num:120, title:"Paths and Goals", scale:"buildings", group:"between-buildings", desc:"Lay paths to connect specific destinations. Every path should lead somewhere meaningful.", appliedIn:["Apple Music"], notes:"" },
  { id:"pl-121", num:121, title:"Path Shape", scale:"buildings", group:"between-buildings", desc:"Curve paths slightly and vary their width to create spatial interest and a sense of discovery.", appliedIn:["Way of the Wave","The False Step"], notes:"" },
  { id:"pl-122", num:122, title:"Building Fronts", scale:"buildings", group:"between-buildings", desc:"Face the main sides of buildings toward public paths to create active, inviting street edges.", appliedIn:["Vevo","Terms of Visibility"], notes:"" },
  { id:"pl-123", num:123, title:"Pedestrian Density", scale:"buildings", group:"between-buildings", desc:"Concentrate pedestrian activity to maintain the lively foot traffic that makes streets feel alive.", appliedIn:[], notes:"" },
  { id:"pl-124", num:124, title:"Activity Pockets", scale:"buildings", group:"between-buildings", desc:"Create small, recessed areas along public paths where people pause for activities.", appliedIn:["Tribeca Festival","Reshaping Players"], notes:"" },
  { id:"pl-125", num:125, title:"Stair Seats", scale:"buildings", group:"between-buildings", desc:"Design wide outdoor stairs that double as informal amphitheater seating.", appliedIn:[], notes:"" },
  { id:"pl-126", num:126, title:"Something Roughly in the Middle", scale:"buildings", group:"between-buildings", desc:"Place a focal element, a tree, fountain, or sculpture, near the center of each public space.", appliedIn:[], notes:"" },

  // ── Buildings: Light and Space ──
  { id:"pl-127", num:127, title:"Intimacy Gradient", scale:"buildings", group:"light-and-space", desc:"Arrange spaces in a sequence from most public at the entrance to most private at the interior.", appliedIn:["Apple Music","Freedom","Relational Design"], notes:"" },
  { id:"pl-128", num:128, title:"Indoor Sunlight", scale:"buildings", group:"light-and-space", desc:"Orient rooms so every occupied space receives direct sunlight for at least part of the day.", appliedIn:[], notes:"" },
  { id:"pl-129", num:129, title:"Common Areas at the Heart", scale:"buildings", group:"light-and-space", desc:"Place shared gathering spaces at the building's center where all paths converge.", appliedIn:["Vevo","Relational Design"], notes:"" },
  { id:"pl-130", num:130, title:"Entrance Room", scale:"buildings", group:"light-and-space", desc:"Provide a distinct room at the entrance where visitors transition from the outside world.", appliedIn:[], notes:"" },
  { id:"pl-131", num:131, title:"The Flow Through Rooms", scale:"buildings", group:"light-and-space", desc:"Let rooms open directly into one another to create a continuous spatial flow.", appliedIn:["Apple Music","Tribeca Festival","Way of the Wave"], notes:"" },
  { id:"pl-132", num:132, title:"Short Passages", scale:"buildings", group:"light-and-space", desc:"Keep corridors short so they serve as brief connectors, not lifeless tunnels.", appliedIn:[], notes:"" },
  { id:"pl-133", num:133, title:"Staircase as a Stage", scale:"buildings", group:"light-and-space", desc:"Place staircases prominently so they become social focal points and spatial events.", appliedIn:[], notes:"" },
  { id:"pl-134", num:134, title:"Zen View", scale:"buildings", group:"light-and-space", desc:"Frame a single powerful view through a narrow opening, revealing it only at a key moment.", appliedIn:["Compression Sequence"], notes:"" },
  { id:"pl-135", num:135, title:"Tapestry of Light and Dark", scale:"buildings", group:"light-and-space", desc:"Alternate brightly lit and dimly lit spaces throughout the building to create rhythm and atmosphere.", appliedIn:["Internet and the Age of Emotion","Art of Tolerance"], notes:"" },

  // ── Buildings: Private Rooms ──
  { id:"pl-136", num:136, title:"Couple's Realm", scale:"buildings", group:"private-rooms", desc:"Give couples a private domain within the home, a sanctuary for their relationship.", appliedIn:[], notes:"" },
  { id:"pl-137", num:137, title:"Children's Realm", scale:"buildings", group:"private-rooms", desc:"Provide children with their own connected area where they can play and grow with some autonomy.", appliedIn:[], notes:"" },
  { id:"pl-138", num:138, title:"Sleeping to the East", scale:"buildings", group:"private-rooms", desc:"Place bedrooms on the eastern side of the building to wake with morning light.", appliedIn:[], notes:"" },
  { id:"pl-139", num:139, title:"Farmhouse Kitchen", scale:"buildings", group:"private-rooms", desc:"Make the kitchen a large, warm room at the center of family life, not a galley to hide in.", appliedIn:[], notes:"" },
  { id:"pl-140", num:140, title:"Private Terrace on the Street", scale:"buildings", group:"private-rooms", desc:"Give each home a semi-private outdoor area that faces the street for casual social contact.", appliedIn:[], notes:"" },
  { id:"pl-141", num:141, title:"A Room of One's Own", scale:"buildings", group:"private-rooms", desc:"Ensure every person in the household has a private room they can retreat to.", appliedIn:["Safety Trap"], notes:"" },
  { id:"pl-142", num:142, title:"Sequence of Sitting Spaces", scale:"buildings", group:"private-rooms", desc:"Offer a variety of sitting places with different characters, from intimate nooks to open communal spots.", appliedIn:[], notes:"" },
  { id:"pl-143", num:143, title:"Bed Cluster", scale:"buildings", group:"private-rooms", desc:"Group the bedroom with adjacent private spaces, dressing area and bathroom, into a sleeping cluster.", appliedIn:[], notes:"" },
  { id:"pl-144", num:144, title:"Bathing Room", scale:"buildings", group:"private-rooms", desc:"Design the bathroom as a generous, pleasurable room rather than a minimal utility space.", appliedIn:[], notes:"" },
  { id:"pl-145", num:145, title:"Bulk Storage", scale:"buildings", group:"private-rooms", desc:"Provide large, accessible storage areas for seasonal items and seldom-used belongings.", appliedIn:[], notes:"" },

  // ── Buildings: Public Rooms ──
  { id:"pl-146", num:146, title:"Flexible Office Space", scale:"buildings", group:"public-rooms", desc:"Create workspaces that can be easily rearranged as group sizes and needs change.", appliedIn:[], notes:"" },
  { id:"pl-147", num:147, title:"Communal Eating", scale:"buildings", group:"public-rooms", desc:"Design a central eating space that naturally brings people together for shared meals.", appliedIn:[], notes:"" },
  { id:"pl-148", num:148, title:"Small Work Groups", scale:"buildings", group:"public-rooms", desc:"Arrange workspaces so groups of eight or fewer can work together with their own identity.", appliedIn:["Hybrid Intelligence"], notes:"" },
  { id:"pl-149", num:149, title:"Reception Welcomes You", scale:"buildings", group:"public-rooms", desc:"Design the first space visitors encounter to feel warm, personal, and genuinely welcoming.", appliedIn:[], notes:"" },
  { id:"pl-150", num:150, title:"A Place to Wait", scale:"buildings", group:"public-rooms", desc:"Provide comfortable, dignified spaces for people who must wait, not sterile holding areas.", appliedIn:[], notes:"" },
  { id:"pl-151", num:151, title:"Small Meeting Rooms", scale:"buildings", group:"public-rooms", desc:"Provide intimate rooms for small groups of two to eight to meet informally.", appliedIn:[], notes:"" },
  { id:"pl-152", num:152, title:"Half-Private Office", scale:"buildings", group:"public-rooms", desc:"Give each worker a partially enclosed space that balances privacy with visual connection.", appliedIn:[], notes:"" },

  // ── Buildings: Outbuildings ──
  { id:"pl-153", num:153, title:"Rooms to Rent", scale:"buildings", group:"outbuildings", desc:"Include small rentable rooms within or adjacent to homes for tenants or visitors.", appliedIn:[], notes:"" },
  { id:"pl-154", num:154, title:"Teenager's Cottage", scale:"buildings", group:"outbuildings", desc:"Provide adolescents with a small, semi-independent space near the family home.", appliedIn:[], notes:"" },
  { id:"pl-155", num:155, title:"Old Age Cottage", scale:"buildings", group:"outbuildings", desc:"Create small, comfortable dwellings for aging family members close to but separate from the main house.", appliedIn:[], notes:"" },
  { id:"pl-156", num:156, title:"Settled Work", scale:"buildings", group:"outbuildings", desc:"Let long-established work settle into dedicated, well-adapted spaces shaped by practice.", appliedIn:[], notes:"" },
  { id:"pl-157", num:157, title:"Home Workshop", scale:"buildings", group:"outbuildings", desc:"Include workspace in or near the home for crafts, repairs, and creative projects.", appliedIn:[], notes:"" },
  { id:"pl-158", num:158, title:"Open Stairs", scale:"buildings", group:"outbuildings", desc:"Place external stairs along building facades to enliven the exterior and connect levels visibly.", appliedIn:[], notes:"" },

  // ── Buildings: Liminal Space ──
  { id:"pl-159", num:159, title:"Light on Two Sides of Every Room", scale:"buildings", group:"liminal-space", desc:"Ensure every habitable room has windows on at least two walls for balanced, natural light.", appliedIn:["Hybrid Intelligence"], notes:"" },
  { id:"pl-160", num:160, title:"Building Edge", scale:"buildings", group:"liminal-space", desc:"Create a rich transitional zone along the edge of every building where inside meets outside.", appliedIn:[], notes:"" },
  { id:"pl-161", num:161, title:"Sunny Place", scale:"buildings", group:"liminal-space", desc:"Position at least one sheltered outdoor spot that catches sunlight throughout the day.", appliedIn:[], notes:"" },
  { id:"pl-162", num:162, title:"North Face", scale:"buildings", group:"liminal-space", desc:"Handle the cold, sunless north side with service rooms, storage, and thick walls.", appliedIn:[], notes:"" },
  { id:"pl-163", num:163, title:"Outdoor Room", scale:"buildings", group:"liminal-space", desc:"Create an outdoor space enclosed enough on three sides to feel like a room open to the sky.", appliedIn:["Relational Design"], notes:"" },
  { id:"pl-164", num:164, title:"Street Windows", scale:"buildings", group:"liminal-space", desc:"Place windows where they give occupants a view onto the street and its public life.", appliedIn:["Internet and the Age of Emotion","The Grieving Interface"], notes:"" },
  { id:"pl-165", num:165, title:"Opening to the Street", scale:"buildings", group:"liminal-space", desc:"Open building facades to connect interior life with the activity of the street.", appliedIn:["Vevo","Terms of Visibility"], notes:"" },
  { id:"pl-166", num:166, title:"Gallery Surround", scale:"buildings", group:"liminal-space", desc:"Wrap upper floors with exterior galleries for outdoor circulation and social life above ground.", appliedIn:[], notes:"" },
  { id:"pl-167", num:167, title:"Six-Foot Balcony", scale:"buildings", group:"liminal-space", desc:"Make balconies at least six feet deep so they become truly usable outdoor rooms.", appliedIn:[], notes:"" },
  { id:"pl-168", num:168, title:"Connection to the Earth", scale:"buildings", group:"liminal-space", desc:"Bring the ground floor into direct, tangible contact with the earth beneath it.", appliedIn:["Beyond Productivity","Foundation"], notes:"" },

  // ── Buildings: Gardens ──
  { id:"pl-169", num:169, title:"Terraced Slope", scale:"buildings", group:"gardens", desc:"Shape sloping ground into terraces that create flat, usable areas at multiple levels.", appliedIn:[], notes:"" },
  { id:"pl-170", num:170, title:"Fruit Trees", scale:"buildings", group:"gardens", desc:"Plant fruit trees to provide food, shade, and the rhythm of seasonal change.", appliedIn:[], notes:"" },
  { id:"pl-171", num:171, title:"Tree Places", scale:"buildings", group:"gardens", desc:"Position trees to create canopied gathering spots where people naturally pause.", appliedIn:[], notes:"" },
  { id:"pl-172", num:172, title:"Garden Growing Wild", scale:"buildings", group:"gardens", desc:"Allow parts of the garden to grow freely in a natural, untamed state.", appliedIn:["GSL"], notes:"" },
  { id:"pl-173", num:173, title:"Garden Wall", scale:"buildings", group:"gardens", desc:"Enclose the garden with a wall to create a protected, room-like outdoor space.", appliedIn:[], notes:"" },
  { id:"pl-174", num:174, title:"Trellised Walk", scale:"buildings", group:"gardens", desc:"Create shaded garden paths with overhead trellises and climbing plants.", appliedIn:[], notes:"" },
  { id:"pl-175", num:175, title:"Greenhouse", scale:"buildings", group:"gardens", desc:"Include a glass-enclosed growing space connected to the building for year-round cultivation.", appliedIn:[], notes:"" },
  { id:"pl-176", num:176, title:"Garden Seat", scale:"buildings", group:"gardens", desc:"Place a sheltered seat in the garden as a quiet destination for rest and observation.", appliedIn:[], notes:"" },
  { id:"pl-177", num:177, title:"Vegetable Garden", scale:"buildings", group:"gardens", desc:"Dedicate garden space for growing food close to the kitchen and daily life.", appliedIn:[], notes:"" },
  { id:"pl-178", num:178, title:"Compost", scale:"buildings", group:"gardens", desc:"Integrate composting into the garden cycle to return organic matter to the soil.", appliedIn:["Foundation"], notes:"" },

  // ── Buildings: Minor Rooms ──
  { id:"pl-179", num:179, title:"Alcoves", scale:"buildings", group:"minor-rooms", desc:"Create small recesses off main rooms for quiet sitting, reading, or private retreat.", appliedIn:["Safety Trap"], notes:"" },
  { id:"pl-180", num:180, title:"Window Place", scale:"buildings", group:"minor-rooms", desc:"Build seating into window bays where natural light and the outside view converge.", appliedIn:["The Grieving Interface"], notes:"" },
  { id:"pl-181", num:181, title:"The Fire", scale:"buildings", group:"minor-rooms", desc:"Place an open fire or hearth as a communal focal point in the main living space.", appliedIn:[], notes:"" },
  { id:"pl-182", num:182, title:"Eating Atmosphere", scale:"buildings", group:"minor-rooms", desc:"Shape the eating area with focused light, partial enclosure, and warmth to make meals feel special.", appliedIn:[], notes:"" },
  { id:"pl-183", num:183, title:"Workspace Enclosure", scale:"buildings", group:"minor-rooms", desc:"Partially enclose individual workspaces to create focus without total isolation.", appliedIn:[], notes:"" },
  { id:"pl-184", num:184, title:"Cooking Layout", scale:"buildings", group:"minor-rooms", desc:"Arrange the kitchen so the cook faces the family and the room rather than a blank wall.", appliedIn:[], notes:"" },
  { id:"pl-185", num:185, title:"Sitting Circle", scale:"buildings", group:"minor-rooms", desc:"Arrange seats in a rough circle to encourage face-to-face conversation and social warmth.", appliedIn:[], notes:"" },
  { id:"pl-186", num:186, title:"Communal Sleeping", scale:"buildings", group:"minor-rooms", desc:"Create sleeping arrangements that can bring family members close together when desired.", appliedIn:[], notes:"" },
  { id:"pl-187", num:187, title:"Marriage Bed", scale:"buildings", group:"minor-rooms", desc:"Give the marriage bed a place of honor and intimacy within the bedroom.", appliedIn:[], notes:"" },
  { id:"pl-188", num:188, title:"Bed Alcove", scale:"buildings", group:"minor-rooms", desc:"Recess the bed into a niche or alcove to create a cave-like, sheltered sleeping space.", appliedIn:[], notes:"" },
  { id:"pl-189", num:189, title:"Dressing Rooms", scale:"buildings", group:"minor-rooms", desc:"Provide a small adjacent space for dressing and personal preparation near the bedroom.", appliedIn:[], notes:"" },

  // ── Buildings: Shaping the Rooms ──
  { id:"pl-190", num:190, title:"Ceiling Height Variety", scale:"buildings", group:"shaping-rooms", desc:"Vary ceiling heights room by room to match each space's social character and function.", appliedIn:["Apple Music"], notes:"" },
  { id:"pl-191", num:191, title:"The Shape of Indoor Space", scale:"buildings", group:"shaping-rooms", desc:"Shape rooms with roughly rectangular proportions that feel naturally comfortable.", appliedIn:[], notes:"" },
  { id:"pl-192", num:192, title:"Windows Overlooking Life", scale:"buildings", group:"shaping-rooms", desc:"Orient windows toward areas of human activity so occupants stay connected to the world.", appliedIn:[], notes:"" },
  { id:"pl-193", num:193, title:"Half-Open Wall", scale:"buildings", group:"shaping-rooms", desc:"Create partially open walls that balance visual connection between spaces with acoustic separation.", appliedIn:["Terms of Visibility"], notes:"" },
  { id:"pl-194", num:194, title:"Interior Windows", scale:"buildings", group:"shaping-rooms", desc:"Place windows between interior rooms to bring borrowed light and maintain visual connection.", appliedIn:[], notes:"" },
  { id:"pl-195", num:195, title:"Staircase Volume", scale:"buildings", group:"shaping-rooms", desc:"Give staircases their own generous volume of space flooded with surrounding light.", appliedIn:[], notes:"" },
  { id:"pl-196", num:196, title:"Corner Doors", scale:"buildings", group:"shaping-rooms", desc:"Place doors in the corners of rooms to preserve continuous wall space for furniture.", appliedIn:[], notes:"" },

  // ── Buildings: Thick Walls ──
  { id:"pl-197", num:197, title:"Thick Walls", scale:"buildings", group:"thick-walls", desc:"Build walls thick enough to contain shelves, seats, storage, and small inhabitable spaces.", appliedIn:["Architecture of Coherence"], notes:"" },
  { id:"pl-198", num:198, title:"Closets Between Rooms", scale:"buildings", group:"thick-walls", desc:"Use closets and deep storage as acoustic buffers in the thick walls between rooms.", appliedIn:[], notes:"" },
  { id:"pl-199", num:199, title:"Sunny Counter", scale:"buildings", group:"thick-walls", desc:"Place a kitchen counter or workspace where it catches natural sunlight from a nearby window.", appliedIn:[], notes:"" },
  { id:"pl-200", num:200, title:"Open Shelves", scale:"buildings", group:"thick-walls", desc:"Use open shelving instead of closed cabinets to display everyday objects within easy reach.", appliedIn:[], notes:"" },
  { id:"pl-201", num:201, title:"Waist-High Shelf", scale:"buildings", group:"thick-walls", desc:"Install a continuous shelf at waist height along frequently used paths for placing small objects.", appliedIn:[], notes:"" },
  { id:"pl-202", num:202, title:"Built-in Seats", scale:"buildings", group:"thick-walls", desc:"Construct permanent seating into walls, windows, and alcoves as integral parts of the room.", appliedIn:[], notes:"" },
  { id:"pl-203", num:203, title:"Child Caves", scale:"buildings", group:"thick-walls", desc:"Create small, enclosed spaces within thick walls where children can hide, play, and daydream.", appliedIn:[], notes:"" },
  { id:"pl-204", num:204, title:"Secret Place", scale:"buildings", group:"thick-walls", desc:"Include hidden, private recesses where both adults and children can withdraw from the world.", appliedIn:["Safety Trap","Loud Goodbye"], notes:"" },

  // ── Construction: Emergent Structure ──
  { id:"pl-205", num:205, title:"Structure Follows Social Spaces", scale:"construction", group:"emergent-structure", desc:"Let the structural system emerge from the social spaces it serves rather than imposing a grid.", appliedIn:["Relational Design","Google Cloud","GSL","Architecture of Coherence","Relational Field Model"], notes:"" },
  { id:"pl-206", num:206, title:"Efficient Structure", scale:"construction", group:"emergent-structure", desc:"Distribute structural loads as efficiently as possible through the building's frame.", appliedIn:["Leveling Game"], notes:"" },
  { id:"pl-207", num:207, title:"Good Materials", scale:"construction", group:"emergent-structure", desc:"Choose materials that age gracefully, connect to the senses, and improve over time.", appliedIn:["Diagram Packs","Compression Sequence"], notes:"" },
  { id:"pl-208", num:208, title:"Gradual Stiffening", scale:"construction", group:"emergent-structure", desc:"Build structure iteratively, allowing it to stiffen and harden gradually as the form takes shape.", appliedIn:["Beyond Productivity","Relational Design","GSL"], notes:"" },

  // ── Construction: Structural Layout ──
  { id:"pl-209", num:209, title:"Roof Layout", scale:"construction", group:"structural-layout", desc:"Derive the roof plan directly from the plan of the rooms below so the roof expresses the building's life.", appliedIn:[], notes:"" },
  { id:"pl-210", num:210, title:"Floor and Ceiling Layout", scale:"construction", group:"structural-layout", desc:"Express the floor and ceiling structure as visible spatial elements rather than hiding them.", appliedIn:["Leveling Game"], notes:"" },
  { id:"pl-211", num:211, title:"Thickening the Outer Walls", scale:"construction", group:"structural-layout", desc:"Gradually thicken external walls with layers of function: insulation, storage, planting.", appliedIn:[], notes:"" },
  { id:"pl-212", num:212, title:"Columns at the Corners", scale:"construction", group:"structural-layout", desc:"Place structural columns at the corners of rooms where they reinforce spatial edges.", appliedIn:[], notes:"" },
  { id:"pl-213", num:213, title:"Final Column Distribution", scale:"construction", group:"structural-layout", desc:"Refine column positions to create a coherent structural rhythm across the building.", appliedIn:[], notes:"" },

  // ── Construction: Erecting the Frame ──
  { id:"pl-214", num:214, title:"Root Foundations", scale:"construction", group:"erecting-frame", desc:"Ground foundations deeply into the earth like the roots of a tree, anchoring the building.", appliedIn:["Foundation"], notes:"" },
  { id:"pl-215", num:215, title:"Ground Floor Slab", scale:"construction", group:"erecting-frame", desc:"Lay the ground floor slab directly on the earth, keeping the building connected to the ground.", appliedIn:[], notes:"" },
  { id:"pl-216", num:216, title:"Box Columns", scale:"construction", group:"erecting-frame", desc:"Build columns as hollow boxes that carry structural loads while enclosing usable space.", appliedIn:[], notes:"" },
  { id:"pl-217", num:217, title:"Perimeter Beams", scale:"construction", group:"erecting-frame", desc:"Run structural beams around the perimeter of each floor to tie the building's frame together.", appliedIn:[], notes:"" },
  { id:"pl-218", num:218, title:"Wall Membranes", scale:"construction", group:"erecting-frame", desc:"Build non-load-bearing walls as thin membranes stretched between the structural columns.", appliedIn:[], notes:"" },
  { id:"pl-219", num:219, title:"Floor-Ceiling Vaults", scale:"construction", group:"erecting-frame", desc:"Shape floor structures as thin shell vaults that combine structural strength with spatial beauty.", appliedIn:[], notes:"" },
  { id:"pl-220", num:220, title:"Roof Vaults", scale:"construction", group:"erecting-frame", desc:"Form the roof as a vaulted shell that spans between perimeter walls and creates lofted space.", appliedIn:[], notes:"" },

  // ── Construction: Fenestration ──
  { id:"pl-221", num:221, title:"Natural Doors and Windows", scale:"construction", group:"fenestration", desc:"Place openings where they arise naturally from the activities and light needs of each room.", appliedIn:[], notes:"" },
  { id:"pl-222", num:222, title:"Low Sill", scale:"construction", group:"fenestration", desc:"Set window sills low enough to connect seated people with the view and the ground outside.", appliedIn:[], notes:"" },
  { id:"pl-223", num:223, title:"Deep Reveals", scale:"construction", group:"fenestration", desc:"Recess windows deeply into thick walls to create shadow, depth, and a sense of shelter.", appliedIn:[], notes:"" },
  { id:"pl-224", num:224, title:"Low Doorway", scale:"construction", group:"fenestration", desc:"Lower doorways slightly to create a tangible sense of passage and spatial transition.", appliedIn:[], notes:"" },
  { id:"pl-225", num:225, title:"Frames as Thickened Edges", scale:"construction", group:"fenestration", desc:"Thicken the frames around doors and windows to give openings visual weight and presence.", appliedIn:[], notes:"" },

  // ── Construction: Frame Adjustments ──
  { id:"pl-226", num:226, title:"Column Place", scale:"construction", group:"frame-adjustments", desc:"Widen columns into inhabitable places that people can lean against, sit beside, or gather around.", appliedIn:[], notes:"" },
  { id:"pl-227", num:227, title:"Column Connections", scale:"construction", group:"frame-adjustments", desc:"Join columns to beams and walls with visible, expressive structural connections.", appliedIn:[], notes:"" },
  { id:"pl-228", num:228, title:"Stair Vault", scale:"construction", group:"frame-adjustments", desc:"Build stairways as self-supporting vaulted structures that require no separate framing.", appliedIn:[], notes:"" },
  { id:"pl-229", num:229, title:"Duct Space", scale:"construction", group:"frame-adjustments", desc:"Integrate mechanical systems and ducts into the building's structural thickness.", appliedIn:[], notes:"" },
  { id:"pl-230", num:230, title:"Radiant Heat", scale:"construction", group:"frame-adjustments", desc:"Heat spaces from warm surfaces, floors, walls, ceilings, rather than blowing forced air.", appliedIn:[], notes:"" },
  { id:"pl-231", num:231, title:"Dormer Windows", scale:"construction", group:"frame-adjustments", desc:"Add dormer windows to bring natural light and air into upper-story and attic spaces.", appliedIn:[], notes:"" },
  { id:"pl-232", num:232, title:"Roof Caps", scale:"construction", group:"frame-adjustments", desc:"Cap roof vaults at their highest points with small ventilating openings for air flow.", appliedIn:[], notes:"" },

  // ── Construction: Interior Details ──
  { id:"pl-233", num:233, title:"Floor Surface", scale:"construction", group:"interior-details", desc:"Choose floor surfaces that are warm, slightly soft, and inviting underfoot.", appliedIn:[], notes:"" },
  { id:"pl-234", num:234, title:"Lapped Outside Walls", scale:"construction", group:"interior-details", desc:"Clad exterior walls with overlapping layers, shingles, boards, tiles, that shed water naturally.", appliedIn:[], notes:"" },
  { id:"pl-235", num:235, title:"Soft Inside Walls", scale:"construction", group:"interior-details", desc:"Finish interior walls with soft, paintable surfaces that accept nails and show human marks.", appliedIn:[], notes:"" },
  { id:"pl-236", num:236, title:"Windows Which Open Wide", scale:"construction", group:"interior-details", desc:"Hinge windows so they open fully to erase the boundary between inside and outside.", appliedIn:[], notes:"" },
  { id:"pl-237", num:237, title:"Solid Doors with Glass", scale:"construction", group:"interior-details", desc:"Make doors mostly solid with small glass panels for borrowed light and visual preview.", appliedIn:[], notes:"" },
  { id:"pl-238", num:238, title:"Filtered Light", scale:"construction", group:"interior-details", desc:"Filter harsh sunlight through lattices, blinds, or translucent materials for gentle illumination.", appliedIn:["Compression Sequence"], notes:"" },
  { id:"pl-239", num:239, title:"Small Panes", scale:"construction", group:"interior-details", desc:"Divide windows into small panes that create a human-scale pattern and reduce glare.", appliedIn:[], notes:"" },
  { id:"pl-240", num:240, title:"Half-Inch Trim", scale:"construction", group:"interior-details", desc:"Apply thin trim around edges and joints to create clean visual borders between materials.", appliedIn:[], notes:"" },

  // ── Construction: Outdoor Details ──
  { id:"pl-241", num:241, title:"Seat Spots", scale:"construction", group:"outdoor-details", desc:"Place outdoor seats precisely where they catch sun, shelter from wind, and offer views.", appliedIn:[], notes:"" },
  { id:"pl-242", num:242, title:"Front Door Bench", scale:"construction", group:"outdoor-details", desc:"Set a bench near the front door as a welcoming place to sit and watch the world.", appliedIn:[], notes:"" },
  { id:"pl-243", num:243, title:"Sitting Wall", scale:"construction", group:"outdoor-details", desc:"Build low walls at comfortable sitting height along paths and in gathering areas.", appliedIn:[], notes:"" },
  { id:"pl-244", num:244, title:"Canvas Roofs", scale:"construction", group:"outdoor-details", desc:"Use lightweight canvas or fabric roofs to shade outdoor spaces with minimal structure.", appliedIn:[], notes:"" },
  { id:"pl-245", num:245, title:"Raised Flowers", scale:"construction", group:"outdoor-details", desc:"Elevate planting beds so flowers and herbs are closer to eye level and easy to tend.", appliedIn:[], notes:"" },
  { id:"pl-246", num:246, title:"Climbing Plants", scale:"construction", group:"outdoor-details", desc:"Train climbing plants over walls and trellises to soften hard surfaces with living green.", appliedIn:[], notes:"" },
  { id:"pl-247", num:247, title:"Paving With Cracks Between the Stones", scale:"construction", group:"outdoor-details", desc:"Lay paving with deliberate gaps where grass and ground cover can grow through.", appliedIn:[], notes:"" },
  { id:"pl-248", num:248, title:"Soft Tile and Brick", scale:"construction", group:"outdoor-details", desc:"Use hand-fired tiles and bricks with warm, irregular surfaces that age with character.", appliedIn:[], notes:"" },

  // ── Construction: Ornamentation ──
  { id:"pl-249", num:249, title:"Ornament", scale:"construction", group:"ornamentation", desc:"Add personally meaningful ornament to surfaces and objects to make spaces feel inhabited.", appliedIn:["Vevo","Diagram Packs"], notes:"" },
  { id:"pl-250", num:250, title:"Warm Colors", scale:"construction", group:"ornamentation", desc:"Use warm tones of color on surfaces and in rooms to create a sense of human warmth.", appliedIn:["The Grieving Interface"], notes:"" },
  { id:"pl-251", num:251, title:"Different Chairs", scale:"construction", group:"ornamentation", desc:"Furnish rooms with a variety of chairs to suit different moods, postures, and social moments.", appliedIn:[], notes:"" },
  { id:"pl-252", num:252, title:"Pools of Light", scale:"construction", group:"ornamentation", desc:"Illuminate spaces with concentrated pools of light rather than uniform overhead brightness.", appliedIn:["Compression Sequence","Diagram Packs"], notes:"" },
  { id:"pl-253", num:253, title:"Things From Your Life", scale:"construction", group:"ornamentation", desc:"Fill your space with objects that carry personal meaning, memory, and lived history.", appliedIn:["Beyond Productivity"], notes:"" },
];
