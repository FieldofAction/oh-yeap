export const THEMES = {
  threshold: { label:"Threshold", bg:"#0E0E0C", fg:"#F0EDE6", fm:"#8A867E", ff:"#5A564E", bd:"#1E1D1A", sf:"#151412", sfh:"#1C1B18", cbg:"#121110", ch:"#1A1816", ac1:"#3B4A3F", ac2:"#FF5F1F" },
  light: { label:"Light", bg:"#F7F5F0", fg:"#1C1C1A", fm:"#4A4845", ff:"#8A867E", bd:"#DDD9D2", sf:"#EEEBE5", sfh:"#E5E2DC", cbg:"#F0EDE7", ch:"#EAE7E0", ac1:"#3B4A3F", ac2:"#FF5F1F" },
};

export function cv(t){return{"--bg":t.bg,"--fg":t.fg,"--fm":t.fm,"--ff":t.ff,"--bd":t.bd,"--sf":t.sf,"--sfh":t.sfh,"--cbg":t.cbg,"--ch":t.ch,"--ac1":t.ac1,"--ac2":t.ac2}}
