export const THEMES = {
  threshold: { label:"Threshold", bg:"#0a0a09", fg:"#f0ede6", fm:"#8a867e", ff:"#4a4740", bd:"#1e1d1a", sf:"#131210", sfh:"#1a1816", cbg:"#111110", ch:"#181715" },
  light: { label:"Light", bg:"#f7f5f1", fg:"#111110", fm:"#6b6860", ff:"#a8a49c", bd:"#e2dfda", sf:"#edeae5", sfh:"#e4e1dc", cbg:"#f0ede8", ch:"#eae7e1" },
};

export function cv(t){return{"--bg":t.bg,"--fg":t.fg,"--fm":t.fm,"--ff":t.ff,"--bd":t.bd,"--sf":t.sf,"--sfh":t.sfh,"--cbg":t.cbg,"--ch":t.ch}}
