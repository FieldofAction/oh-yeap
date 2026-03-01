export const THEMES = {
  threshold: { label:"Threshold", bg:"#0C0D10", fg:"#E8EAF0", fm:"#868B94", ff:"#565A62", bd:"#1C1E24", sf:"#12131A", sfh:"#1A1C22", cbg:"#101118", ch:"#181A20", ac1:"#2F5BFF", ac2:"#2F5BFF" },
  canon: { label:"Canon", bg:"#2A2D36", fg:"#E0E3EC", fm:"#8A8F9A", ff:"#5E6370", bd:"#383B44", sf:"#303340", sfh:"#363940", cbg:"#2E3138", ch:"#343840", ac1:"#2F5BFF", ac2:"#2F5BFF" },
  light: { label:"Light", bg:"#F4F5F7", fg:"#1A1B1E", fm:"#474A52", ff:"#868B94", bd:"#D6D9E0", sf:"#EBEDF2", sfh:"#E2E4EA", cbg:"#EDEEF2", ch:"#E5E7EC", ac1:"#2F5BFF", ac2:"#2F5BFF" },
  info: { label:"Info", bg:"#D8DAE0", fg:"#1A1B1E", fm:"#4A4D56", ff:"#70747E", bd:"#C0C3CC", sf:"#CDD0D8", sfh:"#C4C7D0", cbg:"#D0D2DA", ch:"#C8CAD2", ac1:"#2F5BFF", ac2:"#2F5BFF" },
};

export function cv(t){return{"--bg":t.bg,"--fg":t.fg,"--fm":t.fm,"--ff":t.ff,"--bd":t.bd,"--sf":t.sf,"--sfh":t.sfh,"--cbg":t.cbg,"--ch":t.ch,"--ac1":t.ac1,"--ac2":t.ac2}}
