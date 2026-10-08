import { MATERIAL_DOMAINS } from './materials.js';

// Authored, speculative readings of material properties. These are design
// hypotheses, not predictions or evidence of a social effect. Every pair is
// explicit so unexpected combinations retain a meaningful interpretation.
const PHYSICAL_DIGITAL = {
  stone: {
    surface: 'Stone can make an edge durable; a digital surface can make its available actions legible. The useful connection is between a boundary that holds and an interface that explains how to approach it.',
    color: 'A stone marker can provide a stable reference while digital color signals what has changed around it. The two can distinguish a lasting condition from a temporary one.',
    typography: 'An inscription in stone suggests durability, while editable type can qualify or update it. Together they raise the question of which statements should endure and which must remain revisable.',
    shape: 'The contour of stone and the outline of a control can give a boundary a recognizable form. Recognition may travel between them, but a familiar shape does not guarantee the same access.',
    layout: 'Stone can anchor a place; digital layout can describe routes around that anchor. A clear route on screen still needs a usable route through the physical setting.',
    motion: 'Stone offers a relatively fixed reference against which digital motion can make change visible. This contrast can distinguish what persists from what is happening now.',
    state: 'Stone can embody a lasting commitment while a digital state reports its current availability or condition. The display needs to stay accountable to the physical reality.',
  },
  wood: {
    surface: 'A wooden object offers a place to touch, rest, or gather; a digital surface can make the associated actions available. Both can invite use, but their invitations need to agree.',
    color: 'Wood’s grain and finish create physical variation; digital color can emphasize a shared cue across that variation. The cue needs to remain readable in the actual light and finish.',
    typography: 'Wooden furnishings establish a setting for an encounter; typography can explain its terms. An informal setting can still feel restrictive if the written instructions are commanding.',
    shape: 'Joinery gives a wooden form its structure; interface shapes distinguish its possible actions. Repeated forms can connect the object and interface when their behavior also agrees.',
    layout: 'Wooden furnishings can organize bodies in a room; digital layout organizes the choices encountered before or during arrival. They can reinforce the same invitation or contradict one another.',
    motion: 'Moving or reconfiguring a wooden object takes physical effort; digital motion can reveal the proposed change. The interface should leave time for the actual rearrangement.',
    state: 'A wooden seat or object has a physical condition and availability; digital state can communicate it. A useful connection depends on whether the reported state matches what someone finds.',
  },
  metal: {
    surface: 'A metal joint creates a physical connection; a digital surface exposes where someone can act on a system. Both can make connection points legible while concealing how much force or permission an action requires.',
    color: 'Metal can reflect its surroundings while digital color gives a signal a defined role. A cue repeated across them needs checking under glare and changing light.',
    typography: 'Metal can carry a durable label; typography can explain how a connection works or how to release it. The instruction matters most where the mechanism is unfamiliar.',
    shape: 'A metal part’s contour and an interface control’s shape can both suggest how pieces fit. A visually convincing fit still needs mechanical or functional verification.',
    layout: 'Metal structures can support and constrain movement; digital layout directs someone through options. Their routes can align, or an apparent digital choice can lead to a physically fixed arrangement.',
    motion: 'Metal can carry force, vibration, or movement; digital motion can make a change visible. Their timing can connect an action to its response when the visible movement corresponds to something real.',
    state: 'A metal connection may offer physical evidence of engagement; digital state can report whether the system recognizes it. A mismatch makes the connection difficult to trust or correct.',
  },
  textiles: {
    surface: 'A textile can divide while remaining permeable; a digital surface can reveal or conceal layers. Together they suggest a boundary with degrees of openness rather than a single open-or-closed condition.',
    color: 'Weave and lighting change a textile’s apparent color; digital color can carry a more explicit signal. Their relation needs to be studied in context rather than assumed from a matching swatch.',
    typography: 'Textiles can soften or filter a setting; typography can make its expectations explicit. A soft physical invitation and demanding written language may produce conflicting cues.',
    shape: 'A textile changes contour through drape and tension; a digital shape can mark an adjustable boundary. Together they invite exploration of a form that adapts without becoming unreadable.',
    layout: 'Fabric screens can rearrange a space; digital layout can explain the routes or choices that remain available. Each needs to change when the other changes.',
    motion: 'Textiles make movement visible through drape or vibration; interface motion makes transitions legible. Their timing can be composed together, although neither provides a universal pace for participants.',
    state: 'A drawn curtain or folded fabric expresses a physical condition; digital state can explain its meaning. A visible change becomes more useful when people can tell what it permits and how to reverse it.',
  },
  color: {
    surface: 'Physical contrast can distinguish an edge while a digital surface distinguishes an action area. They can direct attention toward the same boundary if it remains perceivable in both settings.',
    color: 'Physical and digital color can repeat a cue across settings, but pigment, light, and screen rendering behave differently. Their connection is a shared meaning to verify, not an assumed visual match.',
    typography: 'Physical color can draw attention while typography specifies what a cue means. Words can clarify an invitation that color alone leaves ambiguous.',
    shape: 'Color and digital shape can reinforce a distinction using two different cues. They can also conflict if a familiar color and a familiar outline imply different actions.',
    layout: 'Color can pull attention toward a location; digital layout gives that location a place in a sequence. Their emphasis can align, or color can pull someone away from the intended route.',
    motion: 'A physical color cue can offer a stable point of reference while digital motion announces change. The moving cue may support orientation or overwhelm the quieter marker.',
    state: 'Physical color may indicate a condition; digital state can make that condition explicit and updateable. A text label or another cue is needed when color is ambiguous or unavailable.',
  },
  glass: {
    surface: 'Glass can make something visible while keeping it physically separate; a digital surface can reveal content while restricting action. Together they make the difference between seeing and accessing especially important.',
    color: 'Glass filters or reflects light; digital color can communicate a chosen signal. A visible cue may change meaning or disappear through tint, reflection, or glare.',
    typography: 'Glass can reveal a setting before entry; typography can explain what entering involves. Being able to see inside does not by itself explain permission or expectations.',
    shape: 'A glass edge may be hard to perceive; a digital outline can make a boundary explicit. The digital cue should clarify the actual edge rather than imply that it has disappeared.',
    layout: 'Glass can expose adjacent spaces while digital layout exposes adjacent options. A useful arrangement distinguishes what is visible, what is reachable, and what requires permission.',
    motion: 'Reflection and changing light animate a glass surface; digital motion can add another layer of change. These signals may reinforce one another or compete for attention.',
    state: 'Glass can provide a view of a condition; digital state can interpret or qualify that view. The interpretation needs to acknowledge what remains hidden or uncertain.',
  },
  clay: {
    surface: 'Unfired clay can hold a form that remains revisable; a digital surface can expose a draft without treating it as final. Together they can make provisional work available for handling and response.',
    color: 'Clay changes appearance with moisture and firing; digital color can mark stages of a process. The cue should describe a real stage rather than make an unfinished object look resolved.',
    typography: 'Clay can carry marks that remain editable before firing; typography can name the decisions still open. Together they make commitment a point of discussion rather than an invisible transition.',
    shape: 'Clay permits direct reshaping; digital shape can show or compare alternatives. The relation is useful when the screen preserves the constraints discovered through handling the material.',
    layout: 'Clay studies can offer several physical arrangements; digital layout can organize those alternatives for comparison. The selected arrangement need not become final merely because it appears first or largest.',
    motion: 'Clay can change continuously under pressure; digital motion can reveal a sequence of revisions. A smooth transition on screen may conceal the effort or irreversibility of the physical process.',
    state: 'Clay moves through conditions with different degrees of reversibility; digital state can make those transitions explicit. This can clarify when revision is still possible and when commitment has a cost.',
  },
};

// Each verb phrase says what this material could contribute through a given
// relational quality. The phrases compose into a three-material hypothesis.
const PHYSICAL_ROLES = {
  stone: ['anchor a place someone can return to', 'provide a steady point of orientation', 'lend an invitation a sense of weight or permanence', 'establish a lasting reference around which activity changes', 'make a boundary physically consequential', 'make wear or displacement a trace of use', 'give shared activity a durable place'],
  wood: ['offer a place to settle without demanding a contribution', 'orient a body toward or away from an activity', 'express an invitation through scale, finish, and arrangement', 'let seating or objects be rearranged between phases of an encounter', 'make distance adjustable through movable furnishings', 'carry traces of handling and adaptation', 'give people something they can rearrange to support how they join'],
  metal: ['make contact or connection physically perceptible', 'produce a distinct tactile or acoustic cue', 'give an encounter a precise, yielding, or resistant physical character', 'make intervals or transitions perceptible through movement or resonance', 'hold a boundary while making the point of connection explicit', 'provide physical evidence of engagement, release, or strain', 'support shared use through connections that can be joined or released'],
  textiles: ['provide shelter or partial enclosure without requiring complete separation', 'filter competing sensory cues in a setting', 'give an invitation a tactile and acoustic character', 'change the sensory conditions around pauses and transitions', 'offer different degrees of enclosure and exposure', 'make use or movement visible through tension, folds, and wear', 'let people adjust a shared space through screens, coverings, or seating'],
  color: ['mark availability in the physical setting', 'make one part of the setting more noticeable', 'give an invitation emphasis that depends on its surroundings', 'mark recurring phases or changes in an encounter', 'distinguish adjacent areas without building a solid partition', 'provide a visible cue that a physical condition has changed', 'make a physical entry point or contribution area easier to find'],
  glass: ['allow someone to be seen while maintaining physical separation', 'bring adjacent activity into view', 'make an invitation feel exposed or protected through transparency', 'let activity across a boundary become a cue for timing', 'separate physical access from visual exposure', 'make some consequences visible across a boundary', 'let people inspect a setting before deciding whether to enter'],
  clay: ['hold a trace of someone’s handling or contribution', 'invite close attention to a form as it changes', 'express openness to revision through an unfinished form', 'make the stages between forming and commitment tangible', 'let the degree of enclosure be revised before the form is fixed', 'make the result of a gesture immediately available for another response', 'offer a shared form that participants can change before it hardens'],
};
const DIGITAL_ROLES = {
  surface: ['make availability legible without exposing everything behind it', 'separate the active area from competing layers', 'express how open or guarded an invitation is through containment', 'mark transitions between one layer of activity and the next', 'offer deliberate degrees of access and visibility', 'show where a response belongs and what it can change', 'make places for contributing, observing, and withdrawing explicit'],
  color: ['signal availability alongside a readable label', 'mark a chosen focus without relying on color alone', 'emphasize or soften the written invitation', 'signal a change of phase alongside another perceivable cue', 'distinguish levels of access without equating visibility with permission', 'make a response or changed condition easier to notice', 'make available actions easier to distinguish without privileging a single way to join'],
  typography: ['state when someone or something is available', 'give reading a clear hierarchy and a manageable pace', 'make the wording and visual voice of an invitation agree', 'let people read and respond at different speeds', 'explain the terms of access, privacy, and withdrawal', 'name what changed and how to correct it', 'explain how to join, observe, decline, or propose a different contribution'],
  shape: ['give availability a recognizable form', 'distinguish a focus from the surrounding controls', 'set an expectation through the contour of a control', 'give successive stages a recognizable visual identity', 'make the edge of an action area visible', 'make a changed form a cue to a changed condition', 'make the places for contribution recognizable'],
  layout: ['show where someone can settle or remain at the edge', 'order information without making every element equally demanding', 'let spacing and sequence support the invitation’s wording', 'offer a sequence with room to pause or return', 'make routes toward, around, and out of an encounter findable', 'keep the response close to the action that produced it', 'show several ways to join, observe, and leave'],
  motion: ['acknowledge arrival or departure without demanding continuous activity', 'direct attention to a meaningful change and then let it settle', 'make a transition feel measured or urgent through timing', 'give transitions an explicit duration that can be adjusted', 'make an approach or withdrawal legible', 'connect an action to its visible consequence', 'make a contribution and its effect visible without turning participation into a performance'],
  state: ['distinguish availability, absence, and uncertainty', 'let people tell when attention is needed and when they can step away', 'state limitations and failures in language that matches the invitation', 'make waiting, readiness, and completion legible', 'report what access is available and how it can change', 'make the system’s response explicit and open to correction', 'show whether a contribution was received and what can happen next'],
};

const RELATIONAL_LENSES = {
  presence: { title: 'Availability without constant exposure', condition: 'people can choose how much of their presence to signal', outcome: 'a shared setting where acknowledgment does not require continuous visibility', tension: 'Acknowledgment can become monitoring. Check who controls the signal and whether absence is treated as a problem.', observe: 'Can someone feel acknowledged while choosing to remain quiet or less visible?' },
  attention: { title: 'Attention that can settle and recover', condition: 'people can direct and recover their own attention', outcome: 'a focus that is supported across the physical setting and interface without demanding constant engagement', tension: 'A clearer signal can still demand too much. Check what it draws attention away from and whether people can disengage.', observe: 'What becomes easier to notice, what disappears from attention, and who needs a different cue?' },
  tone: { title: 'An invitation that holds across settings', condition: 'the invitation’s physical character, wording, and behavior agree', outcome: 'a tone that is carried by the encounter as well as by its message', tension: 'A welcoming appearance can conceal restrictive terms. Ask whether people experience the invitation as optional.', observe: 'Do participants describe the same invitation that the design appears to offer?' },
  rhythm: { title: 'A pace people can negotiate', condition: 'participants can pause, anticipate, and rejoin the activity', outcome: 'a shared rhythm with enough variation for different speeds of participation', tension: 'Synchronizing the system can exclude people who need another tempo. Stillness and delay may be useful responses.', observe: 'Who gains room from the new timing, and who loses continuity or feels rushed?' },
  proximity: { title: 'Closeness with adjustable boundaries', condition: 'participants can choose their distance and degree of exposure', outcome: 'a boundary people can approach, adjust, or leave rather than merely encounter', tension: 'Visibility and access can increase while control over privacy decreases. Check who can alter the boundary.', observe: 'Can people get closer or step away without having to justify themselves?' },
  feedback: { title: 'A response people can interpret and correct', condition: 'responses are understandable and participants can challenge their meaning', outcome: 'a conversation between physical evidence, digital response, and participant interpretation', tension: 'A clear response can still be wrong. A digital confirmation must not erase contradictory physical evidence or a participant’s account.', observe: 'Can someone tell what changed, explain what it meant to them, and correct the system’s interpretation?' },
  participation: { title: 'Participation with adjustable terms', condition: 'people have real permission to contribute, observe, rearrange, or refuse', outcome: 'an encounter whose terms can be influenced by the people taking part', tension: 'An available place or action can still feel compulsory. The people offering a choice may retain all the power to define it.', observe: 'Who can change the terms of joining, and is declining treated as a legitimate outcome?' },
};

const PHYSICAL_TRIALS = {
  stone: 'reposition a small stone marker in a tabletop model of the setting',
  wood: 'change the orientation of a movable wooden furnishing or its model',
  metal: 'compare a fixed connection with a reversible one in a small model',
  textiles: 'compare a fabric screen open and drawn',
  color: 'change the contrast of one physical marker',
  glass: 'compare a clear boundary with a translucent mock-up',
  clay: 'revise the opening of an unfired clay form',
};
const RELATIONAL_ORDER = ['presence', 'attention', 'tone', 'rhythm', 'proximity', 'feedback', 'participation'];

export function synthesizeMaterials(selected) {
  const find = domain => MATERIAL_DOMAINS.find(d => d.id === domain)?.items.find(m => m.id === selected?.[domain]);
  const p = find('physical'), d = find('digital'), r = find('relational');
  if (!p || !d || !r) return null;
  const index = RELATIONAL_ORDER.indexOf(r.id);
  const lens = RELATIONAL_LENSES[r.id];
  const physicalRole = PHYSICAL_ROLES[p.id][index];
  const digitalRole = DIGITAL_ROLES[d.id][index];
  const physicalName = p.id === 'color' ? 'Physical color' : p.name;
  const digitalName = d.id === 'color' ? 'Digital color' : d.name;
  const pairing = `${physicalName} × ${digitalName} × ${r.name}`;
  return {
    key: `${p.id}/${d.id}/${r.id}`,
    pairing,
    title: lens.title,
    summary: `${physicalName} could ${physicalRole}, while ${digitalName.toLowerCase()} could ${digitalRole}.`,
    emergence: `When ${lens.condition}, these choices could support ${lens.outcome}.`,
    relationships: [
      { label: `${physicalName} ↔ ${digitalName}`, text: PHYSICAL_DIGITAL[p.id][d.id] },
      { label: `${physicalName} ↔ ${r.name}`, text: `${p.name} could ${physicalRole}. The relational question is: ${r.question.charAt(0).toLowerCase()}${r.question.slice(1)}` },
      { label: `${digitalName} ↔ ${r.name}`, text: `${d.name} could ${digitalRole}. Its effectiveness depends on how participants interpret and use that possibility.` },
    ],
    tension: lens.tension,
    materialLimits: `${p.name}: ${p.resistance} ${d.name}: ${d.resistance}`,
    trial: `Make two small versions of the encounter. In the second, ${PHYSICAL_TRIALS[p.id]}. Keep the digital ${d.name.toLowerCase()} consistent so you can examine the physical change in relation to ${r.name.toLowerCase()}.`,
    observe: lens.observe,
  };
}

export function synthesisText(synthesis) {
  return [
    `Working hypothesis — ${synthesis.pairing}`,
    `${synthesis.title}\n${synthesis.summary}\n${synthesis.emergence}`,
    ...synthesis.relationships.map(pair => `${pair.label}\n${pair.text}`),
    `Tension\n${synthesis.tension}\n${synthesis.materialLimits}`,
    `Try\n${synthesis.trial}\nNotice: ${synthesis.observe}`,
  ].join('\n\n');
}
