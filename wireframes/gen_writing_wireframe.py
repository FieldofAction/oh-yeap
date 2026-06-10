#!/usr/bin/env python3
# Baseline Writing Detail wireframe — six-station spine.
# Standalone artifact generator. Touches nothing in src/.
# Emits: writing-detail-wireframe.svg  +  .html wrapper (for Chrome raster/PDF).

import html

W = 1440
SPINE_X = 34
GUT_X   = 84          # numbers / station labels
CON_X   = 300         # content column left
CON_W   = 660         # content column width  (right edge 960)
CON_R   = CON_X + CON_W
ANN_X   = 1004        # annotation column left (to ~1392)

INK="#211C16"; MUTE="#6F685C"; FAINT="#A79E8E"; ACC="#B6402B"
BOX_S="#CDC6B7"; BOX_F="#ECE7DC"; PLATE_F="#E2DCCE"; PAPER="#F3EFE7"

S=[]  # svg fragments

def esc(t): return html.escape(str(t), quote=True)

def text(x,y,s,size=11,cls="mono mute",anchor="start",ls=None,italic=False,weight=None):
    extra=""
    if ls is not None: extra+=f' letter-spacing="{ls}"'
    if italic: extra+=' font-style="italic"'
    if weight: extra+=f' font-weight="{weight}"'
    S.append(f'<text x="{x}" y="{y}" font-size="{size}" class="{cls}" text-anchor="{anchor}"{extra}>{esc(s)}</text>')

def lines(x,y,arr,size=11,cls="mono mute",lh=16,ls=None):
    for i,t in enumerate(arr):
        text(x,y+i*lh,t,size,cls,ls=ls)

def box(x,y,w,h,fill=BOX_F,dashed=False,rx=3,stroke=BOX_S,sw=1.2):
    d=' stroke-dasharray="5 5"' if dashed else ''
    S.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{d}/>')

def ph(x,y,s):  # placeholder caption inside a box (mono, faint)
    text(x+14,y+22,s,11,"mono faint")

def rule(x1,y,x2,color=FAINT,sw=1):
    S.append(f'<line x1="{x1}" y1="{y}" x2="{x2}" y2="{y}" stroke="{color}" stroke-width="{sw}"/>')

def station_label(y,num,name,tag=None):
    text(GUT_X,y, num, 28, "mono faint", weight="500")
    text(GUT_X,y+26, name, 12.5, "mono ink", ls=2, weight="600")
    if tag:
        text(GUT_X,y+44, tag, 10.5, "mono acc", ls=1)

def annotation(y, blocks):
    # blocks: list of (kind,text). kind: h(accent header) / k(key line) / n(note)
    cy=y
    for kind,t in blocks:
        if kind=="h":
            text(ANN_X,cy,t,10.5,"mono acc",ls=1.5); cy+=18
        elif kind=="k":
            text(ANN_X,cy,t,11,"mono ink"); cy+=16
        elif kind=="sp":
            cy+=8
        else:
            text(ANN_X,cy,t,11,"mono mute"); cy+=16
    return cy

# ---------------- header ----------------
lines(GUT_X,48,[
    "FIELD OF ACTION  /  WRITING DETAIL",
    "BASELINE WIREFRAME v1  ·  SIX-STATION SPINE",
    "VIEWPORT 1440  ·  REGISTER SHOWN: ESSAY (BASELINE)",
],11,"mono mute",16,ls=0.5)

text(GUT_X,150,"A spine for standing",46,"serif ink",italic=True)
text(GUT_X,200,"the thought in the field.",46,"serif ink",italic=True)
text(GUT_X,238,"Six stations. One spine. The register dials what each station carries.",13,"mono mute",ls=0.3)
rule(GUT_X,268,1392,FAINT,1)

y = 332

def act_band(y,label,note):
    rule(GUT_X,y,1392,ACC,1.4)
    text(GUT_X,y+22,label,12.5,"mono acc",ls=2,weight="600")
    text(1392,y+22,note,11,"mono faint",anchor="end")
    return y+52

# ===== ACT I · FIELD READS =====
y = act_band(y,"ACT I  ·  FIELD READS","the piece announces itself, and sets the frame")

# 01 STANDING
station_label(y,"01","STANDING","TOTEM")
# colophon rail
box(CON_X,y,CON_W,52)
cellw=CON_W/4
for i,lab in enumerate(["AUTHOR","EDITION","READ","STATUS"]):
    cx=CON_X+i*cellw
    if i>0: S.append(f'<line x1="{cx}" y1="{y+10}" x2="{cx}" y2="{y+42}" stroke="{BOX_S}" stroke-width="1"/>')
    text(cx+14,y+22,lab,9.5,"mono faint",ls=1)
    text(cx+14,y+40,"[ … ]",12,"mono mute")
text(CON_X,y-8,"COLOPHON RAIL",9.5,"mono faint",ls=1.5)
# standing line
sy=y+76
box(CON_X,sy,CON_W,96,fill=PLATE_F)
text(CON_X+14,sy-8,"THE STANDING LINE",9.5,"mono faint",ls=1.5)
text(CON_X+CON_W/2,sy+58,"[ the thesis, set as one display line ]",24,"serif ink",anchor="middle",italic=True)
annotation(y, [
    ("h","TOTEM LIVES HERE"),
    ("n","Spine = vertical specimen"),
    ("n","mark, far left edge."),
    ("n","Colophon does identity"),
    ("n","work before word one."),
    ("sp",""),
    ("h","DIAL"),
    ("k","CASE STUDY  + pedestal hero"),
    ("k","SPEC  + version / status"),
    ("k","CANON  already a colophon"),
])
y = sy+96+52

# 02 PREMISE
station_label(y,"02","PREMISE")
box(CON_X,y,CON_W,108)
text(CON_X+14,y-8,"LEDE",9.5,"mono faint",ls=1.5)
for i in range(4):
    rule(CON_X+18,y+30+i*20, CON_R-18 if i<3 else CON_X+360, MUTE if i==0 else BOX_S, 2 if i==0 else 1)
text(CON_X+18,y+24,"[ why this exists — the frame you read it through ]",11,"mono faint")
annotation(y,[
    ("h","THE READING FRAME"),
    ("sp",""),
    ("h","DIAL"),
    ("k","ESSAY  the lede"),
    ("k","EXPLORATION  the question"),
    ("k","SPEC  premise + cause/effect"),
    ("k","FIELD NOTE  one line"),
])
y = y+108+52

# ===== ACT II · ACTION PRODUCES =====
y = act_band(y,"ACT II  ·  ACTION PRODUCES","the work — authored passages, one declared centerpiece")

# 03 BODY
station_label(y,"03","BODY")
by=y
# plain measure
box(CON_X,by,CON_W,84); text(CON_X+14,by-8,"PLAIN MEASURE",9.5,"mono faint",ls=1.5)
for i in range(3): rule(CON_X+18,by+26+i*18, CON_R-18 if i<2 else CON_X+420, BOX_S,1)
by+=84+22
# standing line (held thought)
box(CON_X+110,by,CON_W-220,56,fill=PLATE_F); text(CON_X+110+14,by-8,"HELD LINE",9.5,"mono faint",ls=1.5)
text(CON_X+CON_W/2,by+34,"[ one line, centered, air around it ]",15,"serif ink",anchor="middle",italic=True)
by+=56+22
# situated epigraph
box(CON_X,by,CON_W,66); text(CON_X+14,by-8,"SITUATED EPIGRAPH",9.5,"mono faint",ls=1.5)
S.append(f'<line x1="{CON_X+18}" y1="{by+14}" x2="{CON_X+18}" y2="{by+52}" stroke="{ACC}" stroke-width="2"/>')
text(CON_X+34,by+30,"[ a quoted passage, set with its source world around it ]",11,"serif mute",italic=True)
text(CON_X+34,by+50,"— attribution · source · date",10,"mono faint")
by+=66+22
# three-beat
box(CON_X,by,CON_W,70,fill=PAPER,stroke=PAPER); text(CON_X+14,by-8,"THREE-BEAT",9.5,"mono faint",ls=1.5)
tbw=(CON_W-2*16)/3
for i in range(3):
    tx=CON_X+i*(tbw+16)
    box(tx,by,tbw,70)
    text(tx+12,by+30,["[ claim one ]","[ claim two ]","[ claim three ]"][i],10.5,"mono faint")
by+=70+22
# raw fragment
box(CON_X,by,CON_W,58,dashed=True); text(CON_X+14,by-8,"RAW FRAGMENT",9.5,"mono faint",ls=1.5)
text(CON_X+18,by+26,"[ a dated note / marginalia — documentary register ]",11,"mono faint")
text(CON_X+18,by+44,"2026 · field note",10,"mono faint")
by+=58
annotation(y,[
    ("h","AUTHORED, NOT GUESSED"),
    ("n","The writer DECLARES each"),
    ("n","frame. Most paragraphs"),
    ("n","stay plain measure."),
    ("n","Budget the framed moments."),
    ("sp",""),
    ("h","KEYSTONE"),
    ("n","replaces length-sniffing"),
    ("n","in WritingDetail.jsx:183"),
])
y = by+52

# 04 CENTERPIECE
station_label(y,"04","CENTERPIECE","PEDESTAL")
# full-content plate with slight overhang to read as 'lifted'
box(CON_X-24,y,CON_W+48,150,fill=PLATE_F)
text(CON_X-24+14,y-8,"THE CENTERPIECE — declared, one per piece",9.5,"mono faint",ls=1.5)
text(CON_X+CON_W/2,y+72,"[ the one signature object ]",26,"serif ink",anchor="middle",italic=True)
text(CON_X+CON_W/2,y+104,"for an essay: the turn",12,"mono mute",anchor="middle")
annotation(y,[
    ("h","PEDESTAL LIVES HERE"),
    ("n","ONE per piece, declared."),
    ("n","The piece orbits it."),
    ("sp",""),
    ("h","DIAL"),
    ("k","ESSAY  the turn"),
    ("k","SPEC  the chain (the hero)"),
    ("k","CASE STUDY  the catalogue"),
    ("k","EXPLORATION  open question"),
    ("k","FIELD NOTE  the one image"),
])
y = y+150+52

# ===== ACT III · FIELD HOLDS =====
y = act_band(y,"ACT III  ·  FIELD HOLDS","it lands on the real, then is placed in the field")

# 05 IN PRACTICE
station_label(y,"05","IN PRACTICE")
box(CON_X,y,CON_W,134)
text(CON_X+14,y-8,"WORKED ONCE ON THE REAL",9.5,"mono faint",ls=1.5)
text(CON_X+18,y+26,"[ the thought applied once, documentary, on a real subject ]",11,"mono faint")
for i in range(3):
    ry=y+44+i*28
    text(CON_X+18,ry+18,["01","02","03"][i],11,"mono acc")
    rule(CON_X+46,ry+22,CON_R-18,BOX_S,1)
    text(CON_X+46,ry+14,["[ step ]","[ step ]","[ decision ]"][i],10.5,"mono faint")
annotation(y,[
    ("h","NATIVE-SURFACE REGISTER"),
    ("n","Applied once, on something"),
    ("n","real. Hardest to fake,"),
    ("n","which is why it reads true."),
    ("sp",""),
    ("h","DIAL"),
    ("k","SPEC  the example card"),
    ("k","ESSAY  the lived example"),
    ("k","EXPLORATION  often absent"),
])
y = y+134+52

# 06 LINEAGE
station_label(y,"06","LINEAGE")
box(CON_X,y,CON_W*0.56,96)
text(CON_X+14,y-8,"WORKS CITED",9.5,"mono faint",ls=1.5)
for i in range(3): rule(CON_X+18,y+30+i*22,CON_X+CON_W*0.56-18,BOX_S,1)
lx=CON_X+CON_W*0.56+18
box(lx,y,CON_R-lx,96)
text(lx+14,y-8,"RELATED / RELATIONS",9.5,"mono faint",ls=1.5)
for i in range(3):
    chy=y+24+i*24
    S.append(f'<rect x="{lx+14}" y="{chy}" width="150" height="18" rx="9" fill="none" stroke="{BOX_S}" stroke-width="1"/>')
    text(lx+24,chy+13,"→ [ linked work ]",9.5,"mono faint")
annotation(y,[
    ("h","THE DESIGNED CLOSE"),
    ("n","Places the piece in the field."),
    ("sp",""),
    ("h","DIAL"),
    ("k","CASE STUDY  credits as"),
    ("k","   production"),
    ("k","ALL  cited + related"),
])
y = y+96+64

# ===== REGISTER DIAL MATRIX (footer) =====
rule(GUT_X,y,1392,ACC,1.4)
text(GUT_X,y+22,"THE REGISTER DIAL",12.5,"mono acc",ls=2,weight="600")
text(1392,y+22,"read DOWN a column = the through-line   ·   read ACROSS a row = the register",11,"mono faint",anchor="end")
y+=52

cols=["1 STANDING","2 PREMISE","3 BODY","4 CENTERPIECE","5 IN PRACTICE","6 LINEAGE"]
rows=[
 ("CASE STUDY",   "●●●●●●"),
 ("CONDITION SET","●●●●●●"),
 ("ESSAY",        "●●●●◐●"),
 ("FIELD NOTE",   "◐◐◐●·◐"),
 ("EXPLORATION",  "◐●◐●—◐"),
 ("CANON",        "●◐●●◐●"),
]
mx=CON_X-24      # matrix left (label column)
labw=170
colw=(1392-(mx+labw))/6
# column headers
for i,c in enumerate(cols):
    cx=mx+labw+i*colw+colw/2
    text(cx,y,c,9,"mono mute",anchor="middle",ls=0.5)
y+=10
rule(mx,y,1392,BOX_S,1)
y+=8
for name,pattern in rows:
    yy=y+18
    text(mx,yy,name,10.5,"mono ink",ls=0.5)
    for i,ch in enumerate(pattern):
        cx=mx+labw+i*colw+colw/2
        col = ACC if ch=="●" else (MUTE if ch=="◐" else FAINT)
        text(cx,yy,ch,13,"mono",anchor="middle")
        S[-1]=S[-1].replace('class="mono"',f'class="mono" fill="{col}"')
    y+=30
    rule(mx,y-6,1392,"#E4DECF",1)
y+=6
text(mx,y+16,"●  full     ◐  lean     ·  minimal     —  absent",10.5,"mono mute",ls=0.5)
text(mx,y+40,"The two rows you already built — Case Study and Condition Set — are this spine fully expressed.",11,"serif mute",italic=True)
y+=80

H = y

# spine (totem) — far left, runs the body
S.append(f'<line x1="{SPINE_X}" y1="332" x2="{SPINE_X}" y2="{int(H)-90}" stroke="{FAINT}" stroke-width="2"/>')
S.append(f'<g transform="translate({SPINE_X-4},560) rotate(-90)"><text x="0" y="0" font-size="10" class="mono faint" letter-spacing="3">ESSAY · WRITING · FIELD OF ACTION · SPECIMEN</text></g>')

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{int(H)}" viewBox="0 0 {W} {int(H)}">
<defs><style>
text{{font-family:'IBM Plex Mono',ui-monospace,Menlo,monospace}}
.serif{{font-family:'Playfair Display',Georgia,'Times New Roman',serif}}
.mono{{font-family:'IBM Plex Mono',ui-monospace,Menlo,monospace}}
.ink{{fill:{INK}}} .mute{{fill:{MUTE}}} .faint{{fill:{FAINT}}} .acc{{fill:{ACC}}}
</style></defs>
<rect x="0" y="0" width="{W}" height="{int(H)}" fill="{PAPER}"/>
{''.join(S)}
</svg>'''

base="/Users/alfreddicksonii/FieldofAction/oh-yeap/wireframes"
open(f"{base}/writing-detail-wireframe.svg","w").write(svg)

htmlwrap=f'''<!doctype html><html><head><meta charset="utf-8">
<style>@page{{size:{W}px {int(H)}px;margin:0}}html,body{{margin:0;padding:0;background:{PAPER}}}svg{{display:block}}</style>
</head><body>{svg}</body></html>'''
open(f"{base}/_render.html","w").write(htmlwrap)

print(f"OK  W={W}  H={int(H)}")
