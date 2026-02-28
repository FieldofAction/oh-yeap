export const THEMES = {
  threshold: { label:"Threshold", bg:"#0C0D10", fg:"#E8EAF0", fm:"#868B94", ff:"#565A62", bd:"#1C1E24", sf:"#12131A", sfh:"#1A1C22", cbg:"#101118", ch:"#181A20", ac1:"#2F5BFF", ac2:"#2F5BFF" },
  light: { label:"Light", bg:"#F4F5F7", fg:"#1A1B1E", fm:"#474A52", ff:"#868B94", bd:"#D6D9E0", sf:"#EBEDF2", sfh:"#E2E4EA", cbg:"#EDEEF2", ch:"#E5E7EC", ac1:"#2F5BFF", ac2:"#2F5BFF" },
};

export function cv(t){return{"--bg":t.bg,"--fg":t.fg,"--fm":t.fm,"--ff":t.ff,"--bd":t.bd,"--sf":t.sf,"--sfh":t.sfh,"--cbg":t.cbg,"--ch":t.ch,"--ac1":t.ac1,"--ac2":t.ac2}}
