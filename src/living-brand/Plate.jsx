// Drawn stand-ins for brand material, so an archive can be looked at without
// reproducing anyone's artwork or marks. Each motif is a small abstract SVG.
// A brand may supply its own five-colour palette; otherwise a tone is used.

const TONES = {
  dusk: ['#2b2140', '#5b3b5e', '#c9735a', '#f0c98a', '#f7e7c6'],
  night: ['#0f1530', '#22305a', '#3d4f80', '#9bb0d8', '#f3e6b8'],
  day: ['#cfe3e0', '#9cc4bd', '#5f9c92', '#2f6a63', '#fff6df'],
  neon: ['#08040f', '#ff2bd6', '#2bf0ff', '#fffa3d', '#7a00ff'],
  paper: ['#f4efe6', '#e3dacb', '#b9ad98', '#5c5548', '#26231e'],
  old: ['#e9e4d8', '#d4c9b0', '#a99a78', '#6d6148', '#3a3427'],
  code: ['#16181c', '#23262d', '#5d6a7d', '#9fb3c8', '#e8eef5'],
  grid: ['#20283b', '#34405a', '#c9735a', '#f0c98a', '#e9e2d0'],
  amber: ['#1c1426', '#4a2a3a', '#d98b3a', '#ffd27a', '#fff1d0'],
  ink: ['#000000', '#171717', '#595959', '#d3d3d3', '#ffffff'],
};

const hills = (c, n, seed) => Array.from({ length: n }, (_, k) => {
  const y = 120 + k * 22;
  const a = 18 + ((seed * (k + 3)) % 17);
  const d = `M0 ${y} C 60 ${y - a}, 120 ${y + a / 2}, 200 ${y - a / 3} S 330 ${y - a}, 400 ${y} L400 260 L0 260 Z`;
  return <path key={k} d={d} fill={c[Math.min(k + 1, c.length - 2)]} opacity={0.96} />;
});

export default function Plate({ item, large = false }) {
  const v = item.visual || {};
  const c = (Array.isArray(v.palette) && v.palette.length === 5) ? v.palette : (TONES[v.tone] || TONES.paper);
  const accent = v.accent || '#c9735a';
  const seed = item.id.length * 7;
  let body;
  switch (v.motif) {
    case 'papercut':
      body = (<>
        <rect width="400" height="260" fill={c[0]} />
        <circle cx={v.tone === 'day' ? 300 : 280} cy="78" r="34" fill={c[4]} />
        {hills(c, 4, seed)}
      </>);
      break;
    case 'neon':
      body = (<>
        <rect width="400" height="260" fill={c[0]} />
        {[0, 1, 2, 3, 4, 5].map(k => <line key={k} x1={-40 + k * 80} y1="260" x2={60 + k * 70} y2="0" stroke={c[1 + (k % 4)]} strokeWidth="6" />)}
        <circle cx="200" cy="120" r="46" fill="none" stroke={c[3]} strokeWidth="5" />
      </>);
      break;
    case 'wave':
      body = (<>
        <rect width="400" height="260" fill={c[0]} />
        {[0, 1, 2].map(k => <circle key={k} cx={130 + k * 70} cy={100 + k * 28} r="14" fill={c[3 + (k % 2)]} />)}
        <path d="M20 200 Q 100 150 200 200 T 380 200" stroke={c[2]} strokeWidth="3" fill="none" />
      </>);
      break;
    case 'chart':
      body = (<>
        <rect width="400" height="260" fill={c[0]} />
        {[0, 1, 2, 3, 4, 5].map(k => <rect key={k} x={50 + k * 52} y={200 - ((seed * (k + 2)) % 120) - 20} width="30" height={((seed * (k + 2)) % 120) + 20} fill={k === 4 ? accent : c[2]} />)}
        <line x1="40" y1="200" x2="370" y2="200" stroke={c[3]} strokeWidth="2" />
      </>);
      break;
    case 'quote':
      body = (<>
        <rect width="400" height="260" fill={c[0]} />
        {[0, 1, 2, 3].map(k => <rect key={k} x="60" y={70 + k * 34} width={280 - (k % 2) * 80} height="12" rx="6" fill={c[2]} />)}
        <circle cx="52" cy="58" r="10" fill={accent} />
      </>);
      break;
    case 'photo':
      body = (<>
        <rect width="400" height="260" fill={c[1]} />
        {[0, 1, 2].map(k => <rect key={k} x={40 + k * 115} y="50" width="95" height="150" fill={c[2 + (k % 2)]} transform={`rotate(${k * 4 - 4} ${90 + k * 115} 125)`} />)}
      </>);
      break;
    case 'web':
      body = (<>
        <rect width="400" height="260" fill={c[4]} />
        <rect x="0" y="0" width="400" height="26" fill={c[0]} />
        <rect x="30" y="50" width="200" height="22" fill={c[0]} />
        <rect x="30" y="84" width="150" height="12" fill={c[2]} />
        <rect x="240" y="50" width="130" height="150" fill={c[1]} />
        <circle cx="305" cy="100" r="18" fill={c[3]} />
      </>);
      break;
    case 'card':
      body = (<>
        <rect width="400" height="260" fill={c[0]} />
        <rect x="90" y="70" width="220" height="30" fill={c[4]} />
        <rect x="140" y="130" width="120" height="34" rx="17" fill={accent} />
      </>);
      break;
    case 'type':
      // A type specimen: heavy bars standing in for display lines, thin for text.
      body = (<>
        <rect width="400" height="260" fill={c[0]} />
        <rect x="40" y="52" width="300" height="38" fill={c[4]} />
        <rect x="40" y="100" width="220" height="38" fill={c[4]} />
        <rect x="40" y="162" width="90" height="8" fill={accent} />
        {[0, 1, 2].map(k => <rect key={k} x="40" y={184 + k * 16} width={260 - k * 40} height="6" fill={c[3]} />)}
      </>);
      break;
    case 'swatch':
      body = (<>
        <rect width="400" height="260" fill={c[1]} />
        {[c[0], c[4], accent, c[2], c[3]].map((fill, k) => <rect key={k} x={32 + k * 68} y="60" width="60" height="140" rx="4" fill={fill} stroke={c[2]} strokeWidth="1" />)}
      </>);
      break;
    case 'bubble':
      // Rounded conversation shapes; deliberately not any company's mark.
      body = (<>
        <rect width="400" height="260" fill={c[0]} />
        <rect x="60" y="56" width="190" height="64" rx="32" fill={accent} />
        <rect x="150" y="140" width="190" height="64" rx="32" fill={c[4]} />
        <circle cx="96" cy="88" r="9" fill={c[0]} /><circle cx="124" cy="88" r="9" fill={c[0]} />
      </>);
      break;
    case 'glyph':
      // A placeholder for a mark: one plain block on a field, and a line where
      // a name would sit. It is kept free of any figure that could be read as
      // a symbol: no cross, ring, star or emblem.
      body = (<>
        <rect width="400" height="260" fill={c[0]} />
        <rect x="150" y="62" width="100" height="100" rx="14" fill={c[4]} />
        <rect x="150" y="184" width="100" height="10" rx="5" fill={accent} />
      </>);
      break;
    case 'can':
      body = (<>
        <rect width="400" height="260" fill={c[1]} />
        <rect x="150" y="36" width="100" height="196" rx="16" fill={c[4]} />
        <rect x="150" y="96" width="100" height="74" fill={accent} />
        <rect x="162" y="50" width="76" height="8" rx="4" fill={c[2]} />
      </>);
      break;
    case 'grid':
      body = (<>
        <rect width="400" height="260" fill={c[0]} />
        {[0, 1, 2, 3, 4].map(k => <line key={k} x1={60 + k * 70} y1="30" x2={60 + k * 70} y2="230" stroke={c[2]} strokeWidth="2" />)}
        <rect x="130" y="30" width="140" height="200" fill={accent} opacity=".85" />
        <rect x="60" y="30" width="70" height="200" fill={c[3]} opacity=".35" />
      </>);
      break;
    default:
      body = (<>
        <rect width="400" height="260" fill={c[0]} />
        <rect x="70" y="30" width="260" height="210" fill={c[1]} />
        {[0, 1, 2, 3, 4, 5].map(k => <rect key={k} x="96" y={60 + k * 26} width={k === 0 ? 140 : 200 - (k % 3) * 30} height={k === 0 ? 14 : 8} fill={c[3]} />)}
      </>);
  }
  return (
    <svg className={large ? 'lb-plate lb-plate-large' : 'lb-plate'} viewBox="0 0 400 260" role="img" aria-label={`Drawn stand-in for ${item.title}`} preserveAspectRatio="xMidYMid slice">
      {body}
    </svg>
  );
}
