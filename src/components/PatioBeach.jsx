import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import useSwipeNav from "../hooks/useSwipeNav";

// Normalize bare "media/..." paths in data to absolute "/media/..." so they
// resolve from the site root regardless of the current SPA route. Safe to
// call on already-absolute or http(s) URLs — they pass through untouched.
const abs = (s) => (!s ? s : /^(https?:|\/)/.test(s) ? s : `/${s}`);

// Strip redundant prefixes and attribution phrases from legacy IG captions so
// the stamp (No. NNN) and the explicit `by` attribution aren't duplicated.
const cleanCaption = (raw, by) => {
  if (!raw) return "";
  let c = raw;
  c = c.replace(/[ðâ]/g, "");
  c = c.replace(/^Trash\s*0*\d+[A-Za-z]?\s*/i, "");
  c = c.replace(/(?:guest\s+contributor|editor[-\s]?at[-\s]?large)\s*:?\s*@?\w*/gi, "");
  if (by) {
    const handle = by.replace(/^@/, "");
    c = c.replace(new RegExp(`@${handle}\\b`, "gi"), "");
  }
  c = c.replace(/\b(?:filmed\s+by|plucked\s+fr[o]?m|s\/o\s+to\s+my\s+connect|s\/o\s+to)\b/gi, "");
  c = c.replace(/^[\s:\-—–·•🎥📸🎵]+/u, "").replace(/[\s:\-—–·•🎥📸🎵]+$/u, "").trim();
  if (!/[a-z0-9]/i.test(c)) return "";
  return c;
};
const MONTHS = {
  "2018-04": {
    label: "April 2018",
    posts: [
      {n:1,c:"Trash 01",i:["media/posts/201804/17939689354009499.jpg"],d:"2018-04-16",t:"Misc",clr:"Multi",mat:"Mixed",cnd:"Scattered"},
      {n:2,c:"Trash 02",i:["media/posts/201804/17897703292198743.jpg"],d:"2018-04-17",t:"Clothing",clr:"Multi",mat:"Mixed",cnd:"Scattered"},
      {n:3,c:"Trash03",i:["media/posts/201804/17938774150061577.jpg"],d:"2018-04-17",t:"Misc",clr:"Black",mat:"Fabric",cnd:"Broken"},
      {n:4,c:"Trash04",i:["media/posts/201804/17908504351162607.jpg"],d:"2018-04-17",t:"Receptacles",clr:"White",mat:"Plastic",cnd:"Intact"},
      {n:5,c:"Trash05",i:["media/posts/201804/17933763649070607.jpg"],d:"2018-04-17",t:"Packaging",clr:"White",mat:"Plastic",cnd:"Scattered"},
      {n:6,c:"Trash06",i:["media/posts/201804/17939161447017087.jpg"],d:"2018-04-17",t:"Packaging",clr:"Multi",mat:"Mixed",cnd:"Scattered"},
      {n:7,c:"Trash07",i:["media/posts/201804/17866282903230045.jpg"],d:"2018-04-17",t:"Signage",clr:"Green",mat:"Metal",cnd:"Intact"},
      {n:8,c:"Trash08",i:["media/posts/201804/17933669959064109.jpg"],d:"2018-04-17",t:"Packaging",clr:"Black",mat:"Plastic",cnd:"Broken"},
      {n:9,c:"Trash09",i:["media/posts/201804/17940381934055663.jpg"],d:"2018-04-17",t:"Misc",clr:"Multi",mat:"Paper",cnd:"Intact"},
      {n:10,c:"Trash010",i:["media/posts/201804/17939376682026975.jpg"],d:"2018-04-17",t:"Packaging",clr:"White",mat:"Paper",cnd:"Scattered"},
      {n:11,c:"Trash011",i:["media/posts/201804/17939247139056641.jpg"],d:"2018-04-17",t:"Packaging",clr:"Blue",mat:"Paper",cnd:"Scattered"},
      {n:12,c:"Trash012",i:["media/posts/201804/17879616802203388.jpg"],d:"2018-04-17",t:"Packaging",clr:"Multi",mat:"Mixed",cnd:"Scattered"},
      {n:13,c:"Trash014",i:["media/posts/201804/17910115432152983.jpg"],d:"2018-04-17",t:"Packaging",clr:"Multi",mat:"Mixed",cnd:"Scattered"},
      {n:14,c:"Trash015",i:["media/posts/201804/17919775114094800.jpg"],d:"2018-04-17",t:"Electronics",clr:"Black",mat:"Mixed",cnd:"Broken"},
      {n:15,c:"Trash016",i:["media/posts/201804/17925533902129613.jpg"],d:"2018-04-17",t:"Electronics",clr:"Black",mat:"Plastic",cnd:"Intact"},
      {n:16,c:"Trash017 SF Edition",i:["media/posts/201804/17939212429020598.jpg"],d:"2018-04-17",t:"Packaging",clr:"Multi",mat:"Paper",cnd:"Scattered"},
      {n:17,c:"Trash018",i:["media/posts/201804/17908870831165822.jpg"],d:"2018-04-17",t:"Packaging",clr:"Green",mat:"Plastic",cnd:"Scattered"},
      {n:18,c:"Trash019",i:["media/posts/201804/17933070034065563.jpg"],d:"2018-04-17",t:"Food/Drink",clr:"Blue",mat:"Plastic",cnd:"Intact"},
      {n:19,c:"Trash019",i:["media/posts/201804/17939402245000291.jpg"],d:"2018-04-17",t:"Packaging",clr:"White",mat:"Paper",cnd:"Intact"},
      {n:20,c:"Trash020",i:["media/posts/201804/17847618022261540.jpg"],d:"2018-04-17",t:"Toys",clr:"Green",mat:"Mixed",cnd:"Intact"},
      {n:21,c:"Trash021 ð Guest Contributor: @beechertrouble",i:["media/posts/201804/17941267465004831.jpg"],d:"2018-04-24",by:"@beechertrouble",t:"Packaging",clr:"White",mat:"Paper",cnd:"Intact"},
      {n:22,c:"Trash022",i:["media/posts/201804/17939212204019451.jpg"],d:"2018-04-24",t:"Packaging",clr:"Multi",mat:"Paper",cnd:"Scattered"},
      {n:23,c:"Trash023",i:["media/posts/201804/17911994800154318.jpg"],d:"2018-04-24",t:"Receptacles",clr:"Multi",mat:"Mixed",cnd:"Scattered"},
      {n:24,c:"Trash024",i:["media/posts/201804/17914577689131389.jpg"],d:"2018-04-24",t:"Misc",clr:"Pink",mat:"Plastic",cnd:"Broken"},
      {n:25,c:"Trash025",i:["media/posts/201804/17927751313110369.jpg"],d:"2018-04-24",t:"Food/Drink",clr:"Multi",mat:"Plastic",cnd:"Intact"},
      {n:26,c:"",i:["media/posts/201804/17939814472025583.jpg","media/posts/201804/17881999126201645.jpg","media/posts/201804/17867322823233243.jpg"],d:"2018-04-24",t:"Packaging",clr:"White",mat:"Paper",cnd:"Broken"},
      {n:27,c:"Trash029",i:["media/posts/201804/17926616800097823.jpg"],d:"2018-04-24",t:"Clothing",clr:"Brown",mat:"Fabric",cnd:"Intact"},
      {n:28,c:"Trash030",i:["media/posts/201804/17926729009102740.jpg"],d:"2018-04-24",t:"Packaging",clr:"Multi",mat:"Mixed",cnd:"Scattered"},
      {n:29,c:"Trash031",i:["media/posts/201804/17941360717004786.jpg"],d:"2018-04-24",t:"Signage",clr:"Orange",mat:"Plastic",cnd:"Broken"},
      {n:30,c:"Trash032",i:["media/posts/201804/17914474009133605.jpg"],d:"2018-04-24",t:"Clothing",clr:"White",mat:"Rubber",cnd:"Intact"},
      {n:31,c:"Trash033",i:["media/posts/201804/17911673677159724.jpg"],d:"2018-04-24",t:"Misc",clr:"Yellow",mat:"Paper",cnd:"Intact"},
      {n:32,c:"Trash034",i:["media/posts/201804/17882193889200559.jpg"],d:"2018-04-24",t:"Furniture",clr:"Orange",mat:"Wood",cnd:"Intact"},
      {n:33,c:"Trash035",i:["media/posts/201804/17912735212151328.jpg"],d:"2018-04-24",t:"Signage",clr:"Yellow",mat:"Plastic",cnd:"Intact"},
      {n:34,c:"Trash036",i:["media/posts/201804/17941227403050443.jpg"],d:"2018-04-24",t:"Misc",clr:"Multi",mat:"Organic",cnd:"Scattered"},
      {n:35,c:"Trash037",i:["media/posts/201804/17940296167010777.jpg"],d:"2018-04-24",t:"Clothing",clr:"Multi",mat:"Fabric",cnd:"Scattered"},
      {n:36,c:"",i:["media/posts/201804/17911352050157724.jpg","media/posts/201804/17927928262101830.jpg"],d:"2018-04-24",t:"Packaging",clr:"Multi",mat:"Mixed",cnd:"Scattered"},
      {n:37,c:"Trash039",i:["media/posts/201804/17911844005157924.jpg"],d:"2018-04-24",t:"Food/Drink",clr:"Multi",mat:"Glass",cnd:"Intact"},
      {n:38,c:"Trash040 What kind of animal would throw this out?",i:["media/posts/201804/17867884537226830.jpg"],d:"2018-04-24",t:"Receptacles",clr:"Black",mat:"Mixed",cnd:"Intact"},
      {n:39,c:"",i:["media/posts/201804/17913264100147150.jpg","media/posts/201804/17915034991191044.jpg","media/posts/201804/17878658752222090.jpg","media/posts/201804/17941347961029262.jpg","media/posts/201804/17941041472055803.jpg","media/posts/201804/17941265200053678.jpg","media/posts/201804/17914327345135257.jpg","media/posts/201804/17940447691061777.jpg"],d:"2018-04-24",t:"Packaging",clr:"Multi",mat:"Mixed",cnd:"Scattered"},
      {n:40,c:"Trash042",i:["media/posts/201804/17866503952241333.jpg"],d:"2018-04-24",t:"Misc",clr:"Multi",mat:"Mixed",cnd:"Scattered"},
      {n:41,c:"Trash043",i:["media/posts/201804/17862878752244318.jpg"],d:"2018-04-24",t:"Food/Drink",clr:"Blue",mat:"Paper",cnd:"Intact"},
      {n:42,c:"Trash044",i:["media/posts/201804/17881758115204453.jpg"],d:"2018-04-24",t:"Food/Drink",clr:"White",mat:"Plastic",cnd:"Intact"},
      {n:43,c:"Trash045",i:["media/posts/201804/17897689219199280.jpg"],d:"2018-04-24",t:"Electronics",clr:"Black",mat:"Mixed",cnd:"Intact"},
      {n:44,c:"Trash046",i:["media/posts/201804/17941160992036356.jpg"],d:"2018-04-24",t:"Food/Drink",clr:"Multi",mat:"Plastic",cnd:"Intact"},
      {n:45,c:"",i:["media/posts/201804/17940580897008418.jpg","media/posts/201804/17941070233026952.jpg","media/posts/201804/17914100503135649.jpg","media/posts/201804/17941633804039710.jpg","media/posts/201804/17898832006197960.jpg"],d:"2018-04-24",t:"Signage",clr:"White",mat:"Paper",cnd:"Intact"},
      {n:46,c:"Trash047",i:["media/posts/201804/17910002425165739.jpg"],d:"2018-04-24",t:"Clothing",clr:"Brown",mat:"Fabric",cnd:"Intact"},
      {n:47,c:"Trash021ð",i:["media/posts/201804/17926436503114546.jpg"],d:"2018-04-24",t:"Food/Drink",clr:"Multi",mat:"Glass",cnd:"Intact"},
      {n:48,c:"Trash048",i:["media/posts/201804/17927516191108623.jpg"],d:"2018-04-24",t:"Furniture",clr:"Brown",mat:"Wood",cnd:"Intact"},
      {n:49,c:"Trash049 London’s refuse compositions are so considered.",i:["media/posts/201804/17912497831146334.jpg"],d:"2018-04-24",t:"Food/Drink",clr:"Yellow",mat:"Organic",cnd:"Decayed"},
      {n:50,c:"",i:["media/posts/201804/17879812726214966.jpg","media/posts/201804/17927087971103961.jpg"],d:"2018-04-24",t:"Misc",clr:"White",mat:"Metal",cnd:"Intact"},
      {n:51,c:"",i:["media/posts/201804/17940486958040130.jpg","media/posts/201804/17881792609202879.jpg"],d:"2018-04-24",t:"Misc",clr:"Purple",mat:"Rubber",cnd:"Intact"},
      {n:52,c:"Trash052 a double quarter and two pennies of trash studies in the the can. You’re welcome. S/O to trash for being constant and limitless #milestones #goals",i:["media/posts/201804/17907830191173762.jpg"],d:"2018-04-24",t:"Packaging",clr:"White",mat:"Paper",cnd:"Intact"},
      {n:53,c:"Trash053 - The person flexing on this card is not trash but this physical object is on the ground - Which technically... is trash",i:["media/posts/201804/17849216356257418.jpg"],d:"2018-04-24",t:"Misc",clr:"Multi",mat:"Paper",cnd:"Intact"},
      {n:54,c:"Trash054 : Guest Contributor @merrill_hagan - romance",i:["media/posts/201804/17849200714257865.jpg"],d:"2018-04-24",by:"@merrill_hagan",t:"Misc",clr:"Multi",mat:"Organic",cnd:"Decayed"},
      {n:55,c:"Trash055",i:["media/posts/201804/17939866099011130.jpg"],d:"2018-04-24",t:"Food/Drink",clr:"Brown",mat:"Paper",cnd:"Intact"},
      {n:56,c:"Trash056",i:["media/posts/201804/17921347507085183.jpg"],d:"2018-04-24",t:"Packaging",clr:"White",mat:"Plastic",cnd:"Intact"},
      {n:57,c:"Trash057 #Kobra",i:["media/posts/201804/17849198596258305.jpg"],d:"2018-04-24",t:"Food/Drink",clr:"Multi",mat:"Metal",cnd:"Intact"},
      {n:58,c:"Trash058",i:["media/posts/201804/17898494569197291.jpg"],d:"2018-04-24",t:"Food/Drink",clr:"Brown",mat:"Glass",cnd:"Intact"},
      {n:59,c:"Trash059 Guest Contributor: @mistajoshua",i:["media/posts/201804/17922051331082535.jpg"],d:"2018-04-24",by:"@mistajoshua",t:"Packaging",clr:"Multi",mat:"Paper",cnd:"Intact"},
      {n:60,c:"Trash060 Guest Contributor: @underwhelmer — Perfectly aligned #nikedunk and #nikeaf1 with spring inspired color blocking. Direct from Jon: This appears to be some kind of of sneaker-head trap. Jon is right. It is a trashp. My bad.",i:["media/posts/201804/17868458842228128.jpg"],d:"2018-04-24",by:"@underwhelmer",t:"Clothing",clr:"Multi",mat:"Mixed",cnd:"Arranged"},
      {n:61,c:"",i:["media/posts/201804/17913813247177867.jpg","media/posts/201804/17940222523044793.jpg","media/posts/201804/17908152829171842.jpg","media/posts/201804/17939785612029765.jpg"],d:"2018-04-24",t:"Food/Drink",clr:"Multi",mat:"Glass",cnd:"Intact"},
      {n:62,c:"Trash062 Receptacles as Refuse.",i:["media/posts/201804/17879098042217476.jpg"],d:"2018-04-24",t:"Receptacles",clr:"Multi",mat:"Metal",cnd:"Intact"},
      {n:63,c:"Trash063 Ha.",i:["media/posts/201804/17913358552149899.jpg"],d:"2018-04-24",t:"Packaging",clr:"Pink",mat:"Plastic",cnd:"Intact"},
      {n:64,c:"Trash064 ð",i:["media/posts/201804/17910203425166945.jpg"],d:"2018-04-24",t:"Food/Drink",clr:"Red",mat:"Organic",cnd:"Decayed"},
      {n:65,c:"Trash065",i:["media/posts/201804/17921268616085656.jpg"],d:"2018-04-24",t:"Food/Drink",clr:"Multi",mat:"Plastic",cnd:"Scattered"},
      {n:66,c:"Trash066",i:["media/posts/201804/17941414966021915.jpg"],d:"2018-04-24",t:"Electronics",clr:"Multi",mat:"Plastic",cnd:"Intact"},
      {n:67,c:"",i:["media/posts/201804/17927536288108281.jpg","media/posts/201804/17899449460198595.jpg","media/posts/201804/17940269308063095.jpg"],d:"2018-04-24",t:"Clothing",clr:"Black",mat:"Fabric",cnd:"Scattered"},
      {n:68,c:"Trash032B Edition: Halloween ð» #Reprint",i:["media/posts/201804/17924410288126187.jpg"],d:"2018-04-24",t:"Misc",clr:"White",mat:"Plastic",cnd:"Intact"},
      {n:69,c:"Trash068",i:["media/posts/201804/17939992357023180.jpg"],d:"2018-04-24",t:"Misc",clr:"Blue",mat:"Mixed",cnd:"Scattered"},
      {n:70,c:"",i:["media/posts/201804/17940082099055041.jpg","media/posts/201804/17868747163226324.jpg","media/posts/201804/17914138780187392.jpg","media/posts/201804/17938335625065391.jpg","media/posts/201804/17941210060013543.jpg"],d:"2018-04-24",t:"Toys",clr:"White",mat:"Plastic",cnd:"Intact"},
      {n:71,c:"Trash070",i:["media/posts/201804/17908415092168557.jpg"],d:"2018-04-24",t:"Toys",clr:"Multi",mat:"Plastic",cnd:"Intact"},
      {n:72,c:"Trash071 Guest Contributor: @peterjohnkearney ‘Eureka’, Peter exclaimed as his attention was drawn to this normal oddity. Paperboys getting paper.",i:["media/posts/201804/17939713945039389.jpg"],d:"2018-04-24",by:"@peterjohnkearney",t:"Packaging",clr:"Multi",mat:"Paper",cnd:"Scattered"},
      {n:73,c:"Trash072",i:["media/posts/201804/17939564422045855.jpg"],d:"2018-04-24",t:"Packaging",clr:"Yellow",mat:"Plastic",cnd:"Intact"},
      {n:74,c:"Trash073",i:["media/posts/201804/17926283650113173.jpg"],d:"2018-04-24",t:"Clothing",clr:"Red",mat:"Mixed",cnd:"Intact"},
      {n:75,c:"Trash074",i:["media/posts/201804/17914198921187344.jpg"],d:"2018-04-24",t:"Misc",clr:"Pink",mat:"Plastic",cnd:"Intact"},
      {n:76,c:"",i:["media/posts/201804/17879947741211788.jpg","media/posts/201804/17881162462205544.jpg"],d:"2018-04-24",t:"Packaging",clr:"Multi",mat:"Plastic",cnd:"Intact"},
      {n:77,c:"Trash076",i:["media/posts/201804/17879343202217969.jpg"],d:"2018-04-24",t:"Receptacles",clr:"Red",mat:"Metal",cnd:"Intact"},
      {n:78,c:"Trash077 Ramen Noodles and Leaves. Watercolor on canvas 24\"x24\"",i:["media/posts/201804/17940013687057146.jpg"],d:"2018-04-24",t:"Food/Drink",clr:"Yellow",mat:"Organic",cnd:"Scattered"},
      {n:79,c:"Trash078 Guest Contributor: @gsr The metaphysical levels reached in this composition are remarkable. Allegorical even. ð Mauve strip added for visual interests.",i:["media/posts/201804/17912698942154745.jpg"],d:"2018-04-24",by:"@gsr",t:"Food/Drink",clr:"Multi",mat:"Organic",cnd:"Scattered"},
      {n:80,c:"Trash079 #ad The Holiday are in full swing. Bacardi burns all the way down. I suggest Barbancourt or Mount Gay if you have to drink rhum. @bacardiusa",i:["media/posts/201804/17921388667080662.jpg"],d:"2018-04-24",t:"Food/Drink",clr:"Green",mat:"Glass",cnd:"Intact"},
      {n:81,c:"Trash080 Editor-At-Large @beechertrouble continues to challenge notions of conventional trash. I wish all trash was ephemeral like ice.",i:["media/posts/201804/17910381664166123.jpg"],d:"2018-04-24",by:"@beechertrouble",t:"Misc",clr:"White",mat:"Organic",cnd:"Scattered"},
      {n:82,c:"",i:["media/posts/201804/17881673026203960.jpg","media/posts/201804/17878957741218059.jpg","media/posts/201804/17939950825040100.jpg","media/posts/201804/17867152651232859.jpg","media/posts/201804/17849062279261790.mp4"],d:"2018-04-24",t:"Toys",clr:"Multi",mat:"Rubber",cnd:"Intact"},
      {n:83,c:"",i:["media/posts/201804/17879339239223584.jpg","media/posts/201804/17863023625246128.jpg"],d:"2018-04-24",t:"Toys",clr:"Green",mat:"Plastic",cnd:"Intact"},
      {n:84,c:"Trash084 ð",i:["media/posts/201804/17879915899214962.jpg"],d:"2018-04-24",t:"Food/Drink",clr:"Orange",mat:"Organic",cnd:"Intact"},
      {n:85,c:"Trash085 #ad Guest Contributor: @kimkardashian Kim delivers a tour de force post-post modern allegorical image that make us wonder if we’ve been fed trash as luxury commerce all along. #repost @highsnobiety @lvmh",i:["media/posts/201804/17939584276010201.jpg"],d:"2018-04-24",by:"@kimkardashian",t:"Receptacles",clr:"Multi",mat:"Plastic",cnd:"Intact"},
      {n:86,c:"Trash083 Guest Contributor: @vanessacantave remembers thinking Bear Pon de Floor! My bad #Hibernating",i:["media/posts/201804/17913142564158998.jpg"],d:"2018-04-24",by:"@vanessacantave",t:"Toys",clr:"Brown",mat:"Fabric",cnd:"Intact"},
      {n:87,c:"",i:["media/posts/201804/17850321376252225.jpg","media/posts/201804/17942479330037661.jpg","media/posts/201804/17936855029067388.jpg"],d:"2018-04-24",t:"Electronics",clr:"White",mat:"Plastic",cnd:"Broken"},
      {n:88,c:"",i:["media/posts/201804/17944033726048296.jpg","media/posts/201804/17914908466139459.jpg"],d:"2018-04-24",t:"Misc",clr:"Multi",mat:"Mixed",cnd:"Scattered"},
      {n:89,c:"",i:["media/posts/201804/17912047693179442.jpg","media/posts/201804/17867666905228726.jpg"],d:"2018-04-24",t:"Misc",clr:"Green",mat:"Paper",cnd:"Intact"},
      {n:90,c:"Trash089 The road to 100 trash posts is paved with good intentions.",i:["media/posts/201804/17849861680300076.jpg"],d:"2018-04-24",t:"Receptacles",clr:"Brown",mat:"Metal",cnd:"Intact"},
      {n:91,c:"Trash090 Office ðð¿ Artifacts",i:["media/posts/201804/17938923265046094.jpg"],d:"2018-04-24",t:"Electronics",clr:"Black",mat:"Plastic",cnd:"Arranged"},
      {n:92,c:"Trash091 Guest Contributor: @minkchow When life gives you a lemon make sure it’s a meyer ð b/c they are the best. If it’s not a meyer lemon, paint that shit gold. Then sell it. #atmosphere",i:["media/posts/201804/17881771507204453.jpg"],d:"2018-04-24",by:"@minkchow",t:"Food/Drink",clr:"Orange",mat:"Organic",cnd:"Intact"},
      {n:93,c:"Trash092 Guest Contributor: @gabbypris submits a narrative rich and desperate image.",i:["media/posts/201804/17921735554085824.jpg"],d:"2018-04-24",by:"@gabbypris",t:"Clothing",clr:"Blue",mat:"Fabric",cnd:"Intact"},
      {n:94,c:"Trash093",i:["media/posts/201804/17867980402234502.jpg"],d:"2018-04-24",t:"Clothing",clr:"Black",mat:"Fabric",cnd:"Intact"},
      {n:95,c:"Trash095",i:["media/posts/201804/17927007520116007.jpg"],d:"2018-04-24",t:"Misc",clr:"Black",mat:"Mixed",cnd:"Broken"},
      {n:96,c:"Trash096",i:["media/posts/201804/17926481545105606.jpg"],d:"2018-04-24",t:"Receptacles",clr:"Red",mat:"Plastic",cnd:"Intact"},
      {n:97,c:"Trash098 ð",i:["media/posts/201804/17866363885240349.jpg"],d:"2018-04-24",t:"Packaging",clr:"Red",mat:"Plastic",cnd:"Crushed"},
      {n:98,c:"Trash097B redo #ad @usps_service",i:["media/posts/201804/17867808457234473.jpg"],d:"2018-04-24",t:"Receptacles",clr:"White",mat:"Plastic",cnd:"Intact"},
      {n:99,c:"Trash099",i:["media/posts/201804/17912026327177815.jpg"],d:"2018-04-24",t:"Furniture",clr:"Brown",mat:"Wood",cnd:"Intact"},
      {n:100,c:"",i:["media/posts/201804/17915208322191023.jpg","media/posts/201804/17914004887181580.jpg"],d:"2018-04-24",t:"Misc",clr:"Blue",mat:"Plastic",cnd:"Intact"},
      {n:101,c:"Trash0101",i:["media/posts/201804/17868096961236661.jpg"],d:"2018-04-25",t:"Food/Drink",clr:"Brown",mat:"Glass",cnd:"Broken"},
      {n:102,c:"Trash0102",i:["media/posts/201804/17881436746206148.jpg"],d:"2018-04-25",t:"Signage",clr:"White",mat:"Paper",cnd:"Intact"},
      {n:103,c:"Trash0103",i:["media/posts/201804/17917428499139854.jpg"],d:"2018-04-26",t:"Toys",clr:"Yellow",mat:"Plastic",cnd:"Intact"},
      {n:104,c:"Trash0104 Editor-At-Large : @beechertrouble captures how America responds to books on Terror. America provides a statement to confirm his position. ‘Nah we don’t believe in that. To clarify we believe in the basic theory of terror but nah.’ #Faranheit451",i:["media/posts/201804/17849618914257532.jpg"],d:"2018-04-26",by:"@beechertrouble",t:"Misc",clr:"Red",mat:"Paper",cnd:"Scattered"},
      {n:105,c:"Trash0105",i:["media/posts/201804/17926715821119137.jpg"],d:"2018-04-26",t:"Food/Drink",clr:"Orange",mat:"Organic",cnd:"Intact"},
      {n:106,c:"Trash0106 #ad #kevinlyons #illustration #sonicdrivein @sonicdrivein",i:["media/posts/201804/17941922227041994.jpg"],d:"2018-04-27",t:"Food/Drink",clr:"Multi",mat:"Paper",cnd:"Intact"},
      {n:107,c:"Trash0107",i:["media/posts/201804/17910518278167302.jpg"],d:"2018-04-27",t:"Misc",clr:"Multi",mat:"Paper",cnd:"Broken"},
      {n:108,c:"Trash0108 collage of office and home equipment resting at the base of double headed street lamp. tapping into my inner #gregorycrewdson",i:["media/posts/201804/17883149404206807.jpg"],d:"2018-04-27",t:"Furniture",clr:"Brown",mat:"Wood",cnd:"Arranged"},
      {n:109,c:"",i:["media/posts/201804/17940513175031857.jpg","media/posts/201804/17942377138019920.jpg","media/posts/201804/17913252706149313.jpg","media/posts/201804/17913964426151872.jpg"],d:"2018-04-28",t:"Furniture",clr:"White",mat:"Mixed",cnd:"Intact"},
      {n:110,c:"Trash0110 Editor-at-Large: @beechertrouble disarms us every time. An image two lines longer than a sonnet.",i:["media/posts/201804/17942136877042112.jpg"],d:"2018-04-29",by:"@beechertrouble",t:"Signage",clr:"Blue",mat:"Plastic",cnd:"Intact"},
      {n:111,c:"Trash0111",i:["media/posts/201804/17941758073005457.jpg"],d:"2018-04-29",t:"Misc",clr:"Red",mat:"Fabric",cnd:"Intact"},
      {n:112,c:"Trash0112",i:["media/posts/201804/17914040731146387.jpg"],d:"2018-04-30"}
    ]
  },
  "2018-05":{label:"May 2018",posts:[{n:113,c:"Trash0113",i:["media/posts/201805/17941194916029149.jpg"],d:"2018-05-03",t:"Food/Drink",clr:"Green",mat:"Glass",cnd:"Intact"},{n:114,c:"Trash0114 Guest Contributor: @yomoms submits a classic composition plating our hearts with unrealized nostalgia. #bravo",i:["media/posts/201805/17843612440265376.jpg"],d:"2018-05-04",by:"@yomoms",t:"Toys",clr:"Multi",mat:"Mixed",cnd:"Scattered"},{n:115,c:"Trash0115",i:["media/posts/201805/17869808119239196.jpg"],d:"2018-05-04",t:"Misc",clr:"Blue",mat:"Fabric",cnd:"Intact"},{n:116,c:"Trash0116 â¥ï¸",i:["media/posts/201805/17946152755048309.jpg"],d:"2018-05-04",t:"Toys",clr:"White",mat:"Paper",cnd:"Intact"},{n:117,c:"Trash0117 Guest Contributor: @graciawalker Reminds us how displacement can also be the coldest form of character study",i:["media/posts/201805/17915070523154885.jpg"],d:"2018-05-06",by:"@graciawalker",t:"Toys",clr:"Red",mat:"Plastic",cnd:"Broken"},{n:118,c:"Trash0118",i:["media/posts/201805/17917142440189227.jpg"],d:"2018-05-06",t:"Food/Drink",clr:"Multi",mat:"Plastic",cnd:"Crushed"},{n:119,c:"Trash0119",i:["media/posts/201805/17942057140034693.jpg"],d:"2018-05-06",t:"Receptacles",clr:"Brown",mat:"Metal",cnd:"Intact"},{n:120,c:"Trash0120 #ad @trassshny for @nike",i:["media/posts/201805/17882629837208851.jpg"],d:"2018-05-06",t:"Clothing",clr:"White",mat:"Mixed",cnd:"Intact"},{n:121,c:"Trash0121",i:["media/posts/201805/17910565420174301.jpg"],d:"2018-05-07",t:"Clothing",clr:"Pink",mat:"Fabric",cnd:"Arranged"},{n:122,c:"Trash0122",i:["media/posts/201805/17910806497173112.jpg"],d:"2018-05-07",t:"Electronics",clr:"Brown",mat:"Mixed",cnd:"Intact"},{n:123,c:"Trash0123",i:["media/posts/201805/17910670552172923.jpg"],d:"2018-05-07",t:"Receptacles",clr:"Blue",mat:"Mixed",cnd:"Intact"},{n:124,c:"Trash0124 #ad Editor-At-Large: @beechertrouble for @arizonabeveragesofficial delivers the perfect image. #Gawd",i:["media/posts/201805/17853939838252687.jpg"],d:"2018-05-08",by:"@beechertrouble",t:"Packaging",clr:"Multi",mat:"Paper",cnd:"Intact"},{n:125,c:"Trash0125",i:["media/posts/201805/17911034899170786.jpg"],d:"2018-05-08",t:"Misc",clr:"Red",mat:"Mixed",cnd:"Intact"},{n:126,c:"Trash0126",i:["media/posts/201805/17944251715010630.jpg"],d:"2018-05-08",t:"Food/Drink",clr:"White",mat:"Plastic",cnd:"Intact"},{n:127,c:"Trash0127",i:["media/posts/201805/17924491975083293.jpg"],d:"2018-05-08",t:"Food/Drink",clr:"Multi",mat:"Glass",cnd:"Intact"},{n:128,c:"Trash0128",i:["media/posts/201805/17852237326260359.jpg"],d:"2018-05-08",t:"Electronics",clr:"Black",mat:"Plastic",cnd:"Intact"},{n:129,c:"Trash0129",i:["media/posts/201805/17910977263172154.jpg"],d:"2018-05-09",t:"Furniture",clr:"White",mat:"Mixed",cnd:"Broken"},{n:130,c:"Trash0130 ð",i:["media/posts/201805/17870550148233706.jpg"],d:"2018-05-09",t:"Packaging",clr:"Multi",mat:"Plastic",cnd:"Crushed"},{n:131,c:"Trash0131 Guest Contributor @k1enks Captures an aggressively poignant moment in time. #MAGA",i:["media/posts/201805/17883646498218077.jpg"],d:"2018-05-12",by:"@k1enks",t:"Clothing",clr:"Red",mat:"Fabric",cnd:"Broken"},{n:132,c:"Trash 0132",i:["media/posts/201805/17887769362202603.jpg"],d:"2018-05-13",t:"Toys",clr:"Multi",mat:"Mixed",cnd:"Broken"},{n:133,c:"Trash0133 A special episode of #trassshny",i:["media/posts/201805/17930754943115503.jpg"],d:"2018-05-15",t:"Clothing",clr:"Black",mat:"Fabric",cnd:"Arranged"},{n:134,c:"Trash0134",i:["media/posts/201805/17885904379202698.jpg"],d:"2018-05-15",t:"Misc",clr:"White",mat:"Paper",cnd:"Decayed"},{n:135,c:"Trash0135 Editor-At-Large @beechertrouble is sending me love notes. Yes a million times over. #loversandcollaborators",i:["media/posts/201805/17938393153076245.jpg"],d:"2018-05-15",by:"@beechertrouble",t:"Signage",clr:"White",mat:"Paper",cnd:"Intact"},{n:136,c:"Trash0136 Editor-At-Large @beechertrouble delivers an overtly daytime entitled west village image.",i:["media/posts/201805/17856083611249365.jpg"],d:"2018-05-16",by:"@beechertrouble",t:"Toys",clr:"Orange",mat:"Plastic",cnd:"Intact"},{n:137,c:"Trash0137 Guest Contributor: @rfc44 Flips Wednesday & Color on it’s head — #dadhats aren’t completely playedout / also the dad hat peed on itself",i:["media/posts/201805/17854420288257512.jpg"],d:"2018-05-17",by:"@rfc44",t:"Clothing",clr:"Green",mat:"Fabric",cnd:"Intact"},{n:138,c:"Trash0138 Editor-At-Large @beechertrouble Completes the Circle. Alpha and Omega. Life and Death. George Carlin and Bill Burr.",i:["media/posts/201805/17917121275153980.jpg"],d:"2018-05-18",by:"@beechertrouble",t:"Receptacles",clr:"Black",mat:"Metal",cnd:"Intact"},{n:139,c:"Trash0139 Guest Contributor @codyduma Delivers a naturally occurring dada-esque composition. Break the fork in the rode.",i:["media/posts/201805/17945948944016878.jpg"],d:"2018-05-18",by:"@codyduma",t:"Misc",clr:"White",mat:"Plastic",cnd:"Broken"},{n:140,c:"",i:["media/posts/201805/17945677786056660.jpg","media/posts/201805/17945604838017176.jpg"],d:"2018-05-18",t:"Misc",clr:"Yellow",mat:"Mixed",cnd:"Broken"},{n:141,c:"Trash0141",i:["media/posts/201805/17921014048188318.jpg"],d:"2018-05-19",t:"Signage",clr:"White",mat:"Paper",cnd:"Intact"},{n:142,c:"Trash0142 Guest Contributor: @cleezytaughtu Reminds us it’s lonely and occasionally sad at the top. Sean added, ‘I wanted my CEO to know, I know how hard it can it be. #leanonme",i:["media/posts/201805/17948911714061588.jpg"],d:"2018-05-19",by:"@cleezytaughtu",t:"Clothing",clr:"Black",mat:"Fabric",cnd:"Intact"},{n:143,c:"Trash0143 Guest Contributor: @pajji Takes us back to when #turnup was simplified, malted and endorsed by #westcoastrap",i:["media/posts/201805/17847184486263995.jpg"],d:"2018-05-19",by:"@pajji",t:"Packaging",clr:"Brown",mat:"Paper",cnd:"Broken"},{n:144,c:"Trash0144 Editor-At-Large: @beechertrouble Photographs a compelling house party artifact. No doubt an excerpt from his long awaited title ‘Night Forces’. A chilling study of philosophical objects that helped to shape house party culture in Bushwick County. #raisetheroof",i:["media/posts/201805/17932045012112235.jpg"],d:"2018-05-20",by:"@beechertrouble",t:"Misc",clr:"Multi",mat:"Mixed",cnd:"Intact"},{n:145,c:"Trash0145",i:["media/posts/201805/17946658612045414.jpg"],d:"2018-05-24",t:"Signage",clr:"Green",mat:"Paper",cnd:"Intact"},{n:146,c:"Trash0146 Guest Contributor: @mario1000words Delivers a wildly meta response to media. Hey media, shit isn’t about tropes. Fucking grow up. #imserious",i:["media/posts/201805/17885884069217725.jpg"],d:"2018-05-25",by:"@mario1000words",t:"Electronics",clr:"Black",mat:"Mixed",cnd:"Intact"},{n:147,c:"Trash0147 ð­",i:["media/posts/201805/18068783824139379.jpg"],d:"2018-05-26",t:"Electronics",clr:"Black",mat:"Plastic",cnd:"Intact"},{n:148,c:"Trash0148 ð¦",i:["media/posts/201805/17917221664160060.jpg"],d:"2018-05-26",t:"Misc",clr:"Multi",mat:"Paper",cnd:"Intact"},{n:149,c:"Trash0149 ð¤¡",i:["media/posts/201805/17934812005098634.jpg"],d:"2018-05-27",t:"Receptacles",clr:"Red",mat:"Plastic",cnd:"Intact"},{n:150,c:"Trash0150 #ad Editor-At-Larger @beechertrouble for @cocacola #cokeisit",i:["media/posts/201805/17928297007090510.jpg"],d:"2018-05-27",by:"@beechertrouble",t:"Food/Drink",clr:"Red",mat:"Metal",cnd:"Crushed"},{n:151,c:"Trash0151",i:["media/posts/201805/17948358289011507.jpg"],d:"2018-05-27",t:"Packaging",clr:"White",mat:"Paper",cnd:"Broken"},{n:152,c:"Trash0152 Editor-At-Large: @beechertrouble Announced the end summer with post-pop imagery rivaling #helmutnewton Accurate with tasteful Historical Relevance. #tradgicandbeautiful",i:["media/posts/201805/17946869554026844.jpg"],d:"2018-05-28",by:"@beechertrouble",t:"Toys",clr:"Pink",mat:"Plastic",cnd:"Intact"},{n:153,c:"",i:["media/posts/201805/17857310062260568.jpg","media/posts/201805/17948380018004173.jpg"],d:"2018-05-28",t:"Electronics",clr:"Black",mat:"Mixed",cnd:"Broken"},{n:154,c:"Trash0154 Woah — S/O #MDW2018 #weouthere #putinworkorsteptothesidequietly",i:["media/posts/201805/17940378871073564.jpg"],d:"2018-05-29",t:"Food/Drink",clr:"Multi",mat:"Glass",cnd:"Intact"},{n:155,c:"Trash0155 I’m just a lil’ ol’ table. Don’t sit on me but do rest a beverage or 2. Gather around. Let’s litely figure out each other over shared interests.",i:["media/posts/201805/17842029628275231.jpg"],d:"2018-05-31",t:"Furniture",clr:"Brown",mat:"Wood",cnd:"Intact"}]},
  "2018-06":{label:"June 2018",posts:[{n:156,c:"Trash0156 Guest Contributor: @danisalright pushes through his ocd just enough to let his shadow pick up a chicken wing bone. Bravo Dan. That takes real courage. #govball2018",i:["media/posts/201806/17933227489121377.jpg"],d:"2018-06-02",by:"@danisalright",t:"Food/Drink",clr:"White",mat:"Organic",cnd:"Intact"},{n:157,c:"Trash0157 #ad @newamsterdamvodkard",i:["media/posts/201806/17949070783037206.jpg"],d:"2018-06-04",t:"Food/Drink",clr:"Multi",mat:"Glass",cnd:"Intact"},{n:158,c:"Trash0158",i:["media/posts/201806/17859026929257597.jpg"],d:"2018-06-04",t:"Food/Drink",clr:"White",mat:"Paper",cnd:"Intact"},{n:159,c:"Trash0159 Guest Contributor: @emily.hursh reminds us late nite pizza ambition has tragedy in its dna.",i:["media/posts/201806/17921399161154180.jpg"],d:"2018-06-04",by:"@emily",t:"Food/Drink",clr:"Multi",mat:"Organic",cnd:"Broken"},{n:160,c:"Trash0160 ð§",i:["media/posts/201806/17922002989182804.jpg"],d:"2018-06-04",t:"Misc",clr:"Blue",mat:"Mixed",cnd:"Intact"},{n:161,c:"Trash0161 HBD Dayna! Did the office do a thing for you? Oh, nice gurl.",i:["media/posts/201806/17950054129016716.jpg"],d:"2018-06-05",t:"Misc",clr:"White",mat:"Paper",cnd:"Decayed"},{n:162,c:"Trash0162 #gospeedracer",i:["media/posts/201806/17889288724222389.jpg"],d:"2018-06-08",t:"Misc",clr:"White",mat:"Paper",cnd:"Intact"},{n:163,c:"Trash0163 We’ll make an exception — Sir.",i:["media/posts/201806/17937044842107898.jpg"],d:"2018-06-09",t:"Clothing",clr:"Blue",mat:"Fabric",cnd:"Intact"},{n:164,c:"Trash0164",i:["media/posts/201806/17952554659037781.jpg"],d:"2018-06-11",t:"Furniture",clr:"Multi",mat:"Mixed",cnd:"Intact"},{n:165,c:"Trash0165 #totems",i:["media/posts/201806/17950294432064414.jpg"],d:"2018-06-13",t:"Furniture",clr:"White",mat:"Plastic",cnd:"Arranged"},{n:166,c:"Trash0166 ð",i:["media/posts/201806/17861669350258747.jpg"],d:"2018-06-13",t:"Furniture",clr:"Brown",mat:"Wood",cnd:"Broken"},{n:167,c:"Trash0167 ð â½ï¸ ð¥",i:["media/posts/201806/17925903301187810.jpg"],d:"2018-06-14",t:"Toys",clr:"Multi",mat:"Mixed",cnd:"Intact"},{n:168,c:"Trash0168 @jamaaldavies captures straight-up trash. reminds me of when trash was sophomoric and classless #tbt #backtobasic submitted by @slopegirlknits",i:["media/posts/201806/17924864143144778.jpg"],d:"2018-06-14",t:"Receptacles",clr:"Black",mat:"Plastic",cnd:"Scattered"},{n:169,c:"Trash0169 TAMAR the right frame goes a long way. I can see it now — all buffed and shiny — complimenting but not over powering your primitive brush technique . ð #thinktwice #beautyredeems",i:["media/posts/201806/17935587808121664.jpg"],d:"2018-06-14",t:"Misc",clr:"Multi",mat:"Paper",cnd:"Intact"},{n:170,c:"Trash0170",i:["media/posts/201806/17953374388061446.jpg"],d:"2018-06-16",t:"Misc",clr:"Multi",mat:"Paper",cnd:"Intact"},{n:171,c:"Trash0171 #ad @danisalright for @sanpellegrino_us #jacobriis #beachglass",i:["media/posts/201806/17925510166176963.jpg"],d:"2018-06-16",t:"Food/Drink",clr:"Green",mat:"Glass",cnd:"Intact"},{n:172,c:"Trash0172 Guest Contributor @minkchow delivers a hair raising alt-mixed universe image. #studentteacher",i:["media/posts/201806/17936844232123568.jpg"],d:"2018-06-17",by:"@minkchow",t:"Toys",clr:"Multi",mat:"Plastic",cnd:"Arranged"},{n:173,c:"Trash0173 Editor—At—Large: @beechertrouble reminds us that losing a friend means someone else gains the same friend. #gamejustrewinds",i:["media/posts/201806/17938648513115813.jpg"],d:"2018-06-17",by:"@beechertrouble",t:"Toys",clr:"Brown",mat:"Fabric",cnd:"Intact"},{n:174,c:"Trash0174 ð",i:["media/posts/201806/17919874687175276.jpg"],d:"2018-06-18",t:"Tools",clr:"Yellow",mat:"Metal",cnd:"Intact"},{n:175,c:"Trash0175",i:["media/posts/201806/17954235412014464.jpg"],d:"2018-06-18",t:"Signage",clr:"White",mat:"Paper",cnd:"Intact"},{n:176,c:"Trash0176 Guest Contributor: @mrmedina captures the moment right before a transformation occurs. Alex causally comments, ‘life requires movement.’",i:["media/posts/201806/17933912602092452.jpg"],d:"2018-06-18",by:"@mrmedina",t:"Toys",clr:"Red",mat:"Fabric",cnd:"Intact"},{n:177,c:"Trash0177 ð¥¨",i:["media/posts/201806/17881075960227947.jpg"],d:"2018-06-19",t:"Food/Drink",clr:"Brown",mat:"Organic",cnd:"Intact"},{n:178,c:"Trash0178 #ad Team Work Makes the Dream Work @danisalright for @cocacola #worldcup2018 #cokeisit",i:["media/posts/201806/17951396404068156.jpg"],d:"2018-06-19",t:"Food/Drink",clr:"Red",mat:"Metal",cnd:"Intact"},{n:179,c:"Trash0179 â",i:["media/posts/201806/17951532721070256.jpg"],d:"2018-06-19",t:"Misc",clr:"Black",mat:"Mixed",cnd:"Broken"},{n:180,c:"Trash0180 | NSFW | Guest Contributor:  @mario1000words Expands and pushes the definition of hump day forward. #pushtheculture",i:["media/posts/201806/17864891227250837.jpg"],d:"2018-06-21",by:"@mario1000words",t:"Toys",clr:"Brown",mat:"Rubber",cnd:"Intact"},{n:181,c:"Trash0181",i:["media/posts/201806/17854705888269236.jpg"],d:"2018-06-21",t:"Receptacles",clr:"White",mat:"Plastic",cnd:"Intact"},{n:182,c:"Trash0182",i:["media/posts/201806/17955859426043545.jpg"],d:"2018-06-23",t:"Furniture",clr:"White",mat:"Mixed",cnd:"Intact"},{n:183,c:"Trash0183 #ad @danisalright for @walmart",i:["media/posts/201806/17935359028090349.jpg"],d:"2018-06-25",t:"Receptacles",clr:"Blue",mat:"Metal",cnd:"Broken"},{n:184,c:"Trash0184",i:["media/posts/201806/17927227417150942.jpg"],d:"2018-06-27",t:"Electronics",clr:"White",mat:"Mixed",cnd:"Intact"},{n:185,c:"Trash0185 ð¶/ ð",i:["media/posts/201806/17920718701149028.jpg"],d:"2018-06-27",t:"Toys",clr:"Green",mat:"Plastic",cnd:"Intact"},{n:186,c:"Trash0186 #ad Guest Contributor: @danisalright for @drinkarizona teens come thirst.",i:["media/posts/201806/17930973355139114.jpg"],d:"2018-06-29",by:"@danisalright",t:"Food/Drink",clr:"Green",mat:"Metal",cnd:"Intact"},{n:187,c:"Trash0187 Guest Contributor: @abjallen captures floral patina rolls poetically indicating the streets are dead. #bringflowers",i:["media/posts/201806/17896170589206394.jpg"],d:"2018-06-29",by:"@abjallen",t:"Packaging",clr:"Multi",mat:"Paper",cnd:"Intact"},{n:188,c:"Trash0188 Guest Contributor: @jboehmig typically makes this his OOO reply. #riskybusiness",i:["media/posts/201806/17949472963075418.jpg"],d:"2018-06-30",by:"@jboehmig",t:"Clothing",clr:"Brown",mat:"Fabric",cnd:"Intact"}]},
  "2018-07":{label:"July 2018",posts:[{n:189,c:"Trash0189 Editor-At-Larger @beechertrouble drops off a disarmingly casual pictorial statement.",i:["media/posts/201806/17915307781194499.jpg"],d:"2018-07-01",by:"@beechertrouble",t:"Clothing",clr:"Brown",mat:"Mixed",cnd:"Intact"},{n:190,c:"Trash0190 Guest Contributor: @pozzonyc spies a pair of broken-in #airhuaraches and immediately gasp after reading #Lebron left #thecleve for LA. No such coincidence or color story @nba #lakers",i:["media/posts/201807/17956486393037098.jpg"],d:"2018-07-02",by:"@pozzonyc",t:"Clothing",clr:"Black",mat:"Mixed",cnd:"Intact"},{n:191,c:"Trash0191",i:["media/posts/201807/17859085777262895.jpg"],d:"2018-07-04",t:"Furniture",clr:"Brown",mat:"Wood",cnd:"Broken"},{n:192,c:"Trash0192 Guest Contributor: @thetalkofshame captures an abstract portrait of a fatigued ‘free will’. A visual reminder that no matter how disparate the subject matter, we all have the right to pursue inherent vices. #godblessamerica #4thofjuly #actiontheory",i:["media/posts/201807/17944155040101692.jpg"],d:"2018-07-04",by:"@thetalkofshame",t:"Misc",clr:"Multi",mat:"Mixed",cnd:"Arranged"},{n:193,c:"",i:["media/posts/201807/17897758984200433.jpg","media/posts/201807/17956797178025668.jpg"],d:"2018-07-05",t:"Electronics",clr:"Black",mat:"Mixed",cnd:"Arranged"},{n:194,c:"",i:["media/posts/201807/17932823554137422.jpg","media/posts/201807/17859780691262962.jpg"],d:"2018-07-06",t:"Furniture",clr:"Multi",mat:"Mixed",cnd:"Intact"},{n:195,c:"",i:["media/posts/201807/17927326561163997.jpg","media/posts/201807/17945549914099182.jpg"],d:"2018-07-07",t:"Packaging",clr:"Yellow",mat:"Mixed",cnd:"Crushed"},{n:196,c:"Trash0196 : liking this ð¶ pose",i:["media/posts/201807/17944263481113749.jpg"],d:"2018-07-08",t:"Misc",clr:"Multi",mat:"Paper",cnd:"Intact"},{n:197,c:"",i:["media/posts/201807/17938393057088196.jpg","media/posts/201807/17959419304043292.jpg","media/posts/201807/17938789459095896.jpg"],d:"2018-07-09",t:"Toys",clr:"Multi",mat:"Mixed",cnd:"Broken"},{n:198,c:"Trash0198 ð´",i:["media/posts/201807/17958704119021200.jpg"],d:"2018-07-10",t:"Misc",clr:"Black",mat:"Mixed",cnd:"Intact"},{n:199,c:"Breaking protocol here. No numbering or cataloging. This ascends. s/o @salvalopez for giving permission to post this beautiful image.",i:["media/posts/201807/17956187989071727.jpg"],d:"2018-07-12",t:"Food/Drink",clr:"Multi",mat:"Paper",cnd:"Intact"},{n:200,c:"Trash0200 The angel number. A spiritual journey into the light. Out of muck and grime, beauty emerges. Thank you to all the Guest Contributors for your thoughtful contributions. s/o Editor-At-Large @beechertrouble for his unwavering ð and commitment to craft. 2 X ð¯Gentrifying in the name of renewal. Also s/o to me for allowing my distractions become to my focus.",i:["media/posts/201807/17945364970113115.jpg"],d:"2018-07-15",by:"@beechertrouble",t:"Electronics",clr:"Grey",mat:"Plastic",cnd:"Intact"},{n:201,c:"Trash0201",i:["media/posts/201807/17919031720197946.jpg"],d:"2018-07-16",t:"Packaging",clr:"Blue",mat:"Paper",cnd:"Intact"},{n:202,c:"Trash0202 ð",i:["media/posts/201807/17943571957127183.jpg"],d:"2018-07-17",t:"Toys",clr:"Multi",mat:"Paper",cnd:"Intact"},{n:203,c:"Trash0203",i:["media/posts/201807/17952829684078349.jpg"],d:"2018-07-18",t:"Receptacles",clr:"White",mat:"Plastic",cnd:"Intact"},{n:204,c:"Trash0204",i:["media/posts/201807/17961339970054984.jpg"],d:"2018-07-18",t:"Signage",clr:"Orange",mat:"Paper",cnd:"Intact"},{n:205,c:"Trash0205 Guest Contributor: @bryanhaker suggest that trash might be collaborative and interactive",i:["media/posts/201807/17853595870277671.jpg"],d:"2018-07-19",by:"@bryanhaker",t:"Packaging",clr:"Multi",mat:"Mixed",cnd:"Scattered"},{n:206,c:"Trash0206 #ad @danisalright for @prada a pensive dan, journals — Lux is but a sash with no true crossing guard. A depreciating representation of inner perceived value. 20% Silk 70% Ring-spun Cotton 10% Shantung",i:["media/posts/201807/17843682085281889.jpg"],d:"2018-07-20",t:"Clothing",clr:"White",mat:"Fabric",cnd:"Intact"},{n:207,c:"Trash0207",i:["media/posts/201807/17900911675208815.jpg"],d:"2018-07-21",t:"Signage",clr:"White",mat:"Paper",cnd:"Intact"},{n:208,c:"Trash0208 winter’s herald brings evidence of summer’s long suspected ailing health. triggering fans of the beloved season to festinate half-assed local beach plans. including beach-goer @minkchow he adds—while adjusting his wayfarers, ‘i wasn’t even thinking... you get so caught up in your own shit, you forget to pack la croix, precut fruit, & rosÃ¨. those are her favorite things. goddamit! i’m here to pay my respects is all. she does a lot & we can’t look past our own needs? summer deserves better.’ #summer2018",i:["media/posts/201807/17854576147278648.jpg"],d:"2018-07-22",t:"Food/Drink",clr:"Red",mat:"Organic",cnd:"Intact"},{n:209,c:"Trash209 Editor-At-Large: @beechertrouble matter-o-factly suggests the streets is not watching or talking b/c they died after Jay-Z’s musical film and cult classic ‘Street is Watchin’ was released. Beecher adds,”why else would beautiful flowers be brought to them?” #bringflowers",i:["media/posts/201807/17963351332054321.jpg"],d:"2018-07-22",by:"@beechertrouble",t:"Misc",clr:"Multi",mat:"Organic",cnd:"Arranged"},{n:210,c:"Trash0210 #ad @cleezytaughtu for @ny_lottery sean whispered to me, ‘I look for patterns in nature and numbers don’t lie.’",i:["media/posts/201807/17942425048084088.jpg"],d:"2018-07-23",t:"Misc",clr:"White",mat:"Paper",cnd:"Intact"},{n:211,c:"Trash0211 Editor-At-Large: @beechertrouble delivers sage advice — cast the longest shadow so your legacy’s legacy has to develop its personality.",i:["media/posts/201807/17855514460272787.jpg"],d:"2018-07-26",by:"@beechertrouble",t:"Misc",clr:"White",mat:"Organic",cnd:"Broken"},{n:212,c:"Trash0212 Guest Contributor: @daveneff summarizes wednesday",i:["media/posts/201807/17937153403141453.jpg"],d:"2018-07-26",by:"@daveneff",t:"Packaging",clr:"Purple",mat:"Paper",cnd:"Intact"},{n:213,c:"Trash0213  #casualfriday",i:["media/posts/201807/17905813405205768.jpg"],d:"2018-07-27",t:"Clothing",clr:"Blue",mat:"Fabric",cnd:"Scattered"},{n:214,c:"Trash0214",i:["media/posts/201807/17964345514005310.jpg"],d:"2018-07-28",t:"Food/Drink",clr:"Green",mat:"Plastic",cnd:"Crushed"},{n:215,c:"Trash0215",i:["media/posts/201807/17856535504277756.jpg"],d:"2018-07-28",t:"Misc",clr:"Grey",mat:"Plastic",cnd:"Intact"},{n:216,c:"Trash0216",i:["media/posts/201807/17935655656183019.jpg"],d:"2018-07-30",t:"Packaging",clr:"White",mat:"Paper",cnd:"Intact"},{n:217,c:"Trash0217",i:["media/posts/201807/17903645188209607.jpg"],d:"2018-07-31",t:"Receptacles",clr:"Blue",mat:"Mixed",cnd:"Intact"},{n:218,c:"Trash0218 #ad @danisalright for @gansettbeer #hydrate",i:["media/posts/201807/17965486723057247.jpg"],d:"2018-07-31",t:"Food/Drink",clr:"Multi",mat:"Metal",cnd:"Intact"},{n:219,c:"Trash0219 ð",i:["media/posts/201807/17933344849164850.jpg"],d:"2018-07-31",t:"Tools",clr:"Black",mat:"Metal",cnd:"Intact"}]},
  "2018-08":{label:"August 2018",posts:[{n:220,c:"Trash0220 Guest Contributor: @johnpdarcy more evidence of summer’s demise washes up. the irony! john yelled softly. coarse sand in place of cold beer. the hidden message couldn’t be more clear. #smh #ripsummer",i:["media/posts/201808/17945120950089163.jpg"],d:"2018-08-01",by:"@johnpdarcy",t:"Food/Drink",clr:"Brown",mat:"Glass",cnd:"Intact"},{n:221,c:"Trash0221 — If you wanna be free, be free.",i:["media/posts/201808/17965039222041107.jpg"],d:"2018-08-02",t:"Clothing",clr:"Red",mat:"Fabric",cnd:"Intact"},{n:222,c:"Trash0222 ð¨",i:["media/posts/201808/17876892355250514.jpg"],d:"2018-08-04",t:"Electronics",clr:"White",mat:"Mixed",cnd:"Intact"},{n:223,c:"Trash0223 Guest Contributor: @pozzonyc captures a never before seen #irl collabo between #renemagritte x #tomwasselmann - bravo alfonso.",i:["media/posts/201808/17945570662095249.jpg"],d:"2018-08-04",by:"@pozzonyc",t:"Clothing",clr:"Multi",mat:"Mixed",cnd:"Intact"},{n:224,c:"Trash0224 extra-special — @pozzonyc submits back-2-back gems. 1st guest contributor to do so. alfonso was not available for comment. #goat",i:["media/posts/201808/17940053776186931.jpg"],d:"2018-08-05",by:"@pozzonyc",t:"Receptacles",clr:"White",mat:"Plastic",cnd:"Intact"},{n:225,c:"Trash0225 oh shit - @pozzonyc w/ the 3-peat. alphonso offers a message to the youth. ‘ain’t nothing in those street ya’ll...go back to school. take a photography course or something. this might be your bed one day.’ #dontsleeponthestreets",i:["media/posts/201808/17939409106134922.jpg"],d:"2018-08-05",t:"Furniture",clr:"White",mat:"Mixed",cnd:"Intact"},{n:226,c:"Trash0226 holy fuuuuuuuuck: @pozzonyc shooting from the rafters & touching net. 4-peat. #witnesshistory #chefcurry #ledead",i:["media/posts/201808/17889017248245933.jpg"],d:"2018-08-05",t:"Electronics",clr:"Black",mat:"Mixed",cnd:"Intact"},{n:227,c:"Trash0227 Guest Contributor: @whatchusees_iswhatchuget reminds us: shit is real.",i:["media/posts/201808/17942020297143465.jpg"],d:"2018-08-06",by:"@whatchusees_iswhatchuget",t:"Furniture",clr:"Multi",mat:"Mixed",cnd:"Scattered"},{n:228,c:"Trash0228 Guest Contributor: @pozzonyc aka ð¥ðcontinues his visual assault â¢ alfonso adds, ‘we export to find meaning. we import to assist growth.’ #unpack",i:["media/posts/201808/17967283732026392.jpg"],d:"2018-08-06",by:"@pozzonyc",t:"Misc",clr:"Multi",mat:"Mixed",cnd:"Intact"},{n:229,c:"Trash0229 with news of summer’s demise spreading. a hot-muggy anger has reached the gowanus township. mangled beach chair shown above, once suitable for lounging. now only good for nothing.",i:["media/posts/201808/17877262138248476.jpg"],d:"2018-08-07",t:"Furniture",clr:"Multi",mat:"Mixed",cnd:"Broken"},{n:230,c:"Trash0230",i:["media/posts/201808/17877286030253916.jpg"],d:"2018-08-07",t:"Packaging",clr:"White",mat:"Paper",cnd:"Intact"},{n:231,c:"Trash0231 Editor-At-Large: @beechertrouble reports — as summer reaches a boiling point, Watermelon violently erupts on a Toyota Camry. #bloodysummer",i:["media/posts/201808/17907179920209366.jpg"],d:"2018-08-09",by:"@beechertrouble",t:"Food/Drink",clr:"Multi",mat:"Organic",cnd:"Scattered"},{n:232,c:"Trash0232 — 4:3 is being purged like my childhood memories. making room for new aspect ratios.",i:["media/posts/201808/17940545416131160.jpg"],d:"2018-08-09",t:"Electronics",clr:"Grey",mat:"Mixed",cnd:"Broken"},{n:233,c:"Trash0233",i:["media/posts/201808/17941074457177017.jpg"],d:"2018-08-10",t:"Misc",clr:"White",mat:"Plastic",cnd:"Intact"},{n:234,c:"Trash0234 ð¦ ð",i:["media/posts/201808/17907701353204132.jpg"],d:"2018-08-10",t:"Misc",clr:"Multi",mat:"Mixed",cnd:"Intact"},{n:235,c:"Trash0235 — ayeeee",i:["media/posts/201808/17870168626268493.jpg"],d:"2018-08-12",t:"Misc",clr:"White",mat:"Metal",cnd:"Intact"},{n:236,c:"Trash236 ð±",i:["media/posts/201808/17894799457242225.jpg"],d:"2018-08-14",t:"Signage",clr:"Yellow",mat:"Paper",cnd:"Intact"},{n:237,c:"Trash0237 ð¤·ð¾ââï¸ s/o @missiondistrict ð",i:["media/posts/201808/17910008674206215.jpg"],d:"2018-08-15",t:"Toys",clr:"Multi",mat:"Plastic",cnd:"Intact"},{n:238,c:"Trash0238 new lows",i:["media/posts/201808/17941412287148144.jpg"],d:"2018-08-15",t:"Packaging",clr:"Multi",mat:"Paper",cnd:"Intact"},{n:239,c:"Trash0239 ð hbd ramy",i:["media/posts/201808/17954067826122054.jpg"],d:"2018-08-15",t:"Signage",clr:"Multi",mat:"Paper",cnd:"Intact"},{n:240,c:"Trash0240 Guest Contributor: @minkchow — Like a broom without a handle in a half forgotten dream. Like the ripples of a pebble someone tosses in a stream â¢â¢â¢ ðð¥",i:["media/posts/201808/17955909949100309.jpg"],d:"2018-08-16",by:"@minkchow",t:"Tools",clr:"Brown",mat:"Mixed",cnd:"Broken"},{n:241,c:"Trash0241",i:["media/posts/201808/17872171477269453.jpg"],d:"2018-08-18",t:"Packaging",clr:"Orange",mat:"Plastic",cnd:"Scattered"},{n:242,c:"Trash0242 #ad @danisalright for @papajohns can’t spell pizza w/out papa",i:["media/posts/201808/17943757087130450.jpg"],d:"2018-08-18",t:"Packaging",clr:"Red",mat:"Paper",cnd:"Crushed"},{n:243,c:"Trash0243",i:["media/posts/201808/17941313980157111.jpg"],d:"2018-08-18",t:"Food/Drink",clr:"Brown",mat:"Organic",cnd:"Decayed"},{n:244,c:"Trash0243 #ad @danisalright for @hennessy #hennypalooza",i:["media/posts/201808/17950533124091785.jpg"],d:"2018-08-19",t:"Food/Drink",clr:"Multi",mat:"Glass",cnd:"Intact"},{n:245,c:"Trash0245 #ad @danisalright for @nike — I’m mean, who’s wearing who. ðð¤·ð¾ââï¸",i:["media/posts/201808/17872822516264931.jpg"],d:"2018-08-20",t:"Clothing",clr:"Grey",mat:"Mixed",cnd:"Intact"},{n:246,c:"Trash0246",i:["media/posts/201808/17951345461094218.jpg"],d:"2018-08-21",t:"Furniture",clr:"Brown",mat:"Wood",cnd:"Intact"},{n:247,c:"",i:["media/posts/201808/17873404150263228.jpg","media/posts/201808/17882572582253754.jpg"],d:"2018-08-22",t:"Toys",clr:"Multi",mat:"Rubber",cnd:"Scattered"},{n:248,c:"Trash0248",i:["media/posts/201808/17944599748187286.jpg"],d:"2018-08-22",t:"Furniture",clr:"Black",mat:"Fabric",cnd:"Intact"},{n:249,c:"Trash0249",i:["media/posts/201808/17898905698243240.jpg"],d:"2018-08-26",t:"Toys",clr:"Multi",mat:"Mixed",cnd:"Intact"},{n:250,c:"Trash0250",i:["media/posts/201808/17969527360068200.jpg"],d:"2018-08-27",t:"Packaging",clr:"Multi",mat:"Paper",cnd:"Arranged"},{n:251,c:"Trash0251",i:["media/posts/201808/17972823139060894.jpg"],d:"2018-08-27",t:"Signage",clr:"Pink",mat:"Paper",cnd:"Intact"},{n:252,c:"Trash0252",i:["media/posts/201808/17947020535135132.jpg"],d:"2018-08-27",t:"Packaging",clr:"Blue",mat:"Plastic",cnd:"Broken"},{n:253,c:"Trash0253 Guest Contributor: @arecolman",i:["media/posts/201808/17960222092111414.jpg"],d:"2018-08-27",by:"@arecolman",t:"Toys",clr:"Multi",mat:"Fabric",cnd:"Intact"},{n:254,c:"Trash0254",i:["media/posts/201808/17953768891084960.jpg"],d:"2018-08-28",t:"Furniture",clr:"Red",mat:"Mixed",cnd:"Intact"},{n:255,c:"Trash0255 : Color Study",i:["media/posts/201808/17855664445284385.jpg"],d:"2018-08-28",t:"Packaging",clr:"Multi",mat:"Mixed",cnd:"Scattered"},{n:256,c:"Trash0255 : Getting the jump on hump day — my bad",i:["media/posts/201808/17942768146165536.jpg"],d:"2018-08-28",t:"Furniture",clr:"Brown",mat:"Wood",cnd:"Intact"},{n:257,c:"Trash0257",i:["media/posts/201808/17969445139071589.jpg"],d:"2018-08-29",t:"Misc",clr:"White",mat:"Paper",cnd:"Intact"},{n:258,c:"Trash0258",i:["media/posts/201808/17899549594242526.jpg"],d:"2018-08-29",t:"Misc",clr:"White",mat:"Paper",cnd:"Intact"},{n:259,c:"",i:["media/posts/201808/17975594572048182.jpg","media/posts/201808/17969466286064698.jpg","media/posts/201808/17901062425237776.jpg","media/posts/201808/17856092695282243.jpg"],d:"2018-08-29",t:"Packaging",clr:"Multi",mat:"Paper",cnd:"Intact"},{n:260,c:"Trash0260",i:["media/posts/201808/17974736359035383.jpg"],d:"2018-08-30",t:"Misc",clr:"White",mat:"Paper",cnd:"Intact"}]},
  "2018-09":{label:"September 2018",posts:[{n:261,c:"Trash0261 Guest Contributor: @beechertrouble reminds us to keep it chill during this holiday weekend — the courts don’t open until Tuesday ya’ll â¢ #ifyouknowyouknow",i:["media/posts/201809/17901207517243006.jpg"],d:"2018-09-03",by:"@beechertrouble",t:"Misc",clr:"Multi",mat:"Mixed",cnd:"Arranged"},{n:262,c:"Trash0262",i:["media/posts/201809/17886909682247093.jpg"],d:"2018-09-03",t:"Packaging",clr:"White",mat:"Paper",cnd:"Intact"},{n:263,c:"Trash0263 : #newfreezerchallenge",i:["media/posts/201809/17977700707033328.jpg"],d:"2018-09-03",t:"Electronics",clr:"White",mat:"Metal",cnd:"Intact"},{n:264,c:"Trash0264",i:["media/posts/201809/17869478800273583.jpg"],d:"2018-09-03",t:"Furniture",clr:"Brown",mat:"Fabric",cnd:"Intact"},{n:265,c:"Trash0265",i:["media/posts/201809/17904004855230787.jpg"],d:"2018-09-03",t:"Toys",clr:"Multi",mat:"Plastic",cnd:"Intact"},{n:266,c:"Trash0266 Guest Contributor : @skiphursh — summer 18 is literally suplexing your therapy sessions.",i:["media/posts/201809/17886657766249304.jpg"],d:"2018-09-04",by:"@skiphursh",t:"Furniture",clr:"Brown",mat:"Wood",cnd:"Broken"},{n:267,c:"Trash0267 #ad @danisalright for @pabstblueribbon — top 20oz are drinkable / bottom 20oz are a gentleman’s bet",i:["media/posts/201809/17885822674259112.jpg"],d:"2018-09-05",t:"Food/Drink",clr:"Brown",mat:"Glass",cnd:"Intact"},{n:268,c:"Trash0268",i:["media/posts/201809/17944458718161904.jpg"],d:"2018-09-05",t:"Toys",clr:"Blue",mat:"Plastic",cnd:"Intact"},{n:269,c:"Trash0269 : s/o Saint George’s Cross",i:["media/posts/201809/17899608931245665.jpg"],d:"2018-09-06",t:"Packaging",clr:"Multi",mat:"Mixed",cnd:"Broken"},{n:270,c:"Trash0270",i:["media/posts/201809/17960238028125537.jpg"],d:"2018-09-06",t:"Packaging",clr:"White",mat:"Plastic",cnd:"Intact"},{n:271,c:"Trash0271",i:["media/posts/201809/17976925516012628.jpg"],d:"2018-09-07",t:"Clothing",clr:"Blue",mat:"Fabric",cnd:"Intact"},{n:272,c:"Trash0272",i:["media/posts/201809/17981133856048761.jpg"],d:"2018-09-08",t:"Clothing",clr:"Multi",mat:"Fabric",cnd:"Intact"},{n:273,c:"Trash0273 : Guest Contributor : @pozzonyc picks out the perfect coffin for summer’s wake. #ripsummer",i:["media/posts/201809/17951157814130736.jpg"],d:"2018-09-09",by:"@pozzonyc",t:"Misc",clr:"Black",mat:"Metal",cnd:"Intact"},{n:274,c:"Trash0274 kickoff szn ð",i:["media/posts/201809/17948025019144966.jpg"],d:"2018-09-09",t:"Toys",clr:"Red",mat:"Plastic",cnd:"Intact"},{n:275,c:"Trash0275",i:["media/posts/201809/17904330439241102.jpg"],d:"2018-09-10",t:"Furniture",clr:"Green",mat:"Mixed",cnd:"Broken"},{n:276,c:"Trash0276",i:["media/posts/201809/17880133246263435.jpg"],d:"2018-09-11",t:"Misc",clr:"White",mat:"Paper",cnd:"Intact"},{n:277,c:"Trash0277 #dinnerpartyszn",i:["media/posts/201809/17964217177111630.jpg"],d:"2018-09-12",t:"Tools",clr:"Brown",mat:"Mixed",cnd:"Broken"},{n:278,c:"Trash0278 ð",i:["media/posts/201809/17964258712106494.jpg"],d:"2018-09-14",t:"Clothing",clr:"Blue",mat:"Fabric",cnd:"Intact"},{n:279,c:"Trash0279 : I hereby declare you free from blocks, locks, dumb shit, people who hate themselves, vampires, ralph, common projects, rising waters, maine style lobster rolls, religious programming, projects you never started, riesling, extended happy hours & drake memes.",i:["media/posts/201809/17965810612108556.jpg"],d:"2018-09-18",t:"Tools",clr:"Blue",mat:"Metal",cnd:"Intact"},{n:280,c:"Trash0280 Guest Contributor: @cleezytaughtu R.I.P. my homie Spoons. Shit man. The good die mostly over bullshit.",i:["media/posts/201809/17952581986149888.jpg"],d:"2018-09-19",by:"@cleezytaughtu",t:"Tools",clr:"Black",mat:"Plastic",cnd:"Broken"},{n:281,c:"Trash281",i:["media/posts/201809/17973093553078207.jpg"],d:"2018-09-20",t:"Furniture",clr:"Multi",mat:"Mixed",cnd:"Intact"},{n:282,c:"Trash0282",i:["media/posts/201809/17967081640098432.jpg"],d:"2018-09-20",t:"Clothing",clr:"Brown",mat:"Mixed",cnd:"Intact"},{n:283,c:"Trash0283 - Editor-At-Large : @beechertrouble pitches @whitehouse on @jeffkoons creating the next presidential portrait. #trump #deflategate",i:["media/posts/201809/17953250293192155.jpg"],d:"2018-09-21",by:"@beechertrouble",t:"Toys",clr:"Multi",mat:"Rubber",cnd:"Intact"},{n:284,c:"Trash0284",i:["media/posts/201809/17946607336172776.jpg"],d:"2018-09-21",t:"Packaging",clr:"Multi",mat:"Plastic",cnd:"Intact"},{n:285,c:"Trash285 : Guest Contributor :  @pozzonyc answers the question, where does nostalgia go. ‘Up right and curb side.’ Start living you romantic fucks! Ain’t no future in the past. Unless, the past is the future. I’ll leave that to you to sort out.",i:["media/posts/201809/17966096593107573.jpg"],d:"2018-09-21",by:"@pozzonyc",t:"Electronics",clr:"Brown",mat:"Mixed",cnd:"Intact"},{n:286,c:"",i:["media/posts/201809/17952108553152998.jpg","media/posts/201809/17981013052010121.jpg"],d:"2018-09-23",t:"Signage",clr:"Multi",mat:"Mixed",cnd:"Intact"}]},
  "2018-10":{label:"October 2018",posts:[{n:287,c:"Trash0287 Guest Contributor : @cont4ct finds the money stash.",i:["media/posts/201810/17944491409197350.jpg"],d:"2018-10-04",by:"@cont4ct",t:"Packaging",clr:"Multi",mat:"Mixed",cnd:"Arranged"},{n:288,c:"Trash0288",i:["media/posts/201810/17972709688107664.jpg"],d:"2018-10-10",t:"Misc",clr:"White",mat:"Paper",cnd:"Intact"},{n:289,c:"Trash0289 : Editor-At-Large: @beechertrouble exposes the duality embedded in cognitive dissonance surely covered in #thegoodplace",i:["media/posts/201810/17958795178148043.jpg"],d:"2018-10-10",by:"@beechertrouble",t:"Packaging",clr:"Multi",mat:"Plastic",cnd:"Scattered"},{n:290,c:"Trash0290 ‘peligro-peligro’",i:["media/posts/201810/17988002491014796.jpg"],d:"2018-10-10",t:"Signage",clr:"Yellow",mat:"Paper",cnd:"Intact"},{n:291,c:"Trash0291",i:["media/posts/201810/17909415646244645.jpg"],d:"2018-10-11",t:"Clothing",clr:"Red",mat:"Mixed",cnd:"Intact"},{n:292,c:"Trash0292 : Guest Contributor : @lsancheezy triangulates xerox, cannibalism, & predictive outcomes into an o-town pavement sim",i:["media/posts/201810/17889745252270730.jpg"],d:"2018-10-11",by:"@lsancheezy",t:"Electronics",clr:"Multi",mat:"Plastic",cnd:"Decayed"},{n:293,c:"Trash0293 : Editor-At-Large : @beechertrouble finds the missing baby doll leg.",i:["media/posts/201810/17909911822246158.jpg"],d:"2018-10-11",by:"@beechertrouble",t:"Toys",clr:"Pink",mat:"Plastic",cnd:"Broken"},{n:294,c:"Trash0294 : Guest Contributor : @abjallen captures a highly textural moment",i:["media/posts/201810/17913012064240077.jpg"],d:"2018-10-11",by:"@abjallen",t:"Clothing",clr:"Brown",mat:"Fabric",cnd:"Intact"},{n:295,c:"Trash0295 : Guest Contributor : @rob.cantave found a private collection outdoor beds in Panama City",i:["media/posts/201810/17960123866135135.jpg"],d:"2018-10-12",by:"@rob",t:"Furniture",clr:"Multi",mat:"Mixed",cnd:"Scattered"},{n:296,c:"Trash0296 : Guest Contributor : @pozzonyc discovers tina knowles’ source material",i:["media/posts/201810/17989839610001219.jpg"],d:"2018-10-12",by:"@pozzonyc",t:"Furniture",clr:"Multi",mat:"Mixed",cnd:"Intact"},{n:297,c:"Trash0297",i:["media/posts/201810/17956908088165421.jpg"],d:"2018-10-15",t:"Electronics",clr:"White",mat:"Mixed",cnd:"Intact"},{n:298,c:"",i:["media/posts/201810/17990281258006729.jpg","media/posts/201810/17988941452043882.jpg","media/posts/201810/17928162031203410.jpg"],d:"2018-10-15",t:"Packaging",clr:"Multi",mat:"Plastic",cnd:"Scattered"},{n:299,c:"Trash0299 - not rn ye",i:["media/posts/201810/17960003164150721.jpg"],d:"2018-10-15",t:"Packaging",clr:"Multi",mat:"Paper",cnd:"Intact"},{n:300,c:"Trash0300 ð¯ x 3",i:["media/posts/201810/17947064311195132.jpg"],d:"2018-10-18",t:"Food/Drink",clr:"Green",mat:"Organic",cnd:"Intact"},{n:301,c:"Trash0301 #ad @danisalright for @redbull burning bright and crashing hard are two key constructs of hustle-nomics. powerfully addictive drug for algorithms. #morelife beacon-martyrs-lemurs",i:["media/posts/201810/17986232278064609.jpg"],d:"2018-10-18",t:"Food/Drink",clr:"Blue",mat:"Metal",cnd:"Intact"},{n:302,c:"Trash0302 poetryyyy^",i:["media/posts/201810/17954431150169864.jpg"],d:"2018-10-18",t:"Tools",clr:"Brown",mat:"Wood",cnd:"Broken"},{n:303,c:"Trash0303 Editor-At-Large : @beechertrouble finds a file cabinet drawers & an extra large waste basket",i:["media/posts/201810/17991676597036185.jpg"],d:"2018-10-22",by:"@beechertrouble",t:"Furniture",clr:"Multi",mat:"Mixed",cnd:"Scattered"},{n:304,c:"Trash0304 cheeky humpday",i:["media/posts/201810/17963931937144953.jpg"],d:"2018-10-24",t:"Clothing",clr:"Blue",mat:"Fabric",cnd:"Intact"},{n:305,c:"Trash0305 : neva too late to buy ticket & take the ride : after - @mattspangler",i:["media/posts/201810/17991584275029103.jpg"],d:"2018-10-24",t:"Misc",clr:"Red",mat:"Paper",cnd:"Intact"},{n:306,c:"Trash0306",i:["media/posts/201810/17957130343175975.jpg"],d:"2018-10-27",t:"Food/Drink",clr:"Multi",mat:"Mixed",cnd:"Arranged"},{n:307,c:"Trash307 #ad @danisalright for @supremenewyork",i:["media/posts/201810/17919125950229588.jpg"],d:"2018-10-27",t:"Packaging",clr:"Red",mat:"Paper",cnd:"Intact"},{n:308,c:"Trash0308",i:["media/posts/201810/17967411286191036.jpg"],d:"2018-10-29",t:"Clothing",clr:"Multi",mat:"Mixed",cnd:"Intact"},{n:309,c:"Trash0309 ð",i:["media/posts/201810/17995256089055838.jpg"],d:"2018-10-31",t:"Food/Drink",clr:"Orange",mat:"Organic",cnd:"Broken"}]},
  "2018-11":{label:"November 2018",posts:[{n:310,c:"",i:["media/posts/201811/17903501236256021.jpg","media/posts/201811/17864431423288942.jpg"],d:"2018-11-01",t:"Misc",clr:"Black",mat:"Mixed",cnd:"Intact"},{n:311,c:"Trash0311",i:["media/posts/201811/17920765855242541.jpg"],d:"2018-11-01",t:"Electronics",clr:"White",mat:"Mixed",cnd:"Intact"},{n:312,c:"Trash0312",i:["media/posts/201811/17935201342206610.jpg"],d:"2018-11-01",t:"Furniture",clr:"Black",mat:"Wood",cnd:"Intact"},{n:313,c:"Trash0313",i:["media/posts/201811/17995374031049194.jpg"],d:"2018-11-01",t:"Packaging",clr:"White",mat:"Plastic",cnd:"Intact"},{n:314,c:"",i:["media/posts/201811/17991572788071250.jpg","media/posts/201811/17980062637105125.jpg"],d:"2018-11-01",t:"Packaging",clr:"White",mat:"Paper",cnd:"Intact"},{n:315,c:"Trash0315",i:["media/posts/201811/17993352391065011.jpg"],d:"2018-11-02",t:"Toys",clr:"Multi",mat:"Plastic",cnd:"Broken"},{n:316,c:"Trash0316",i:["media/posts/201811/17922207646236330.jpg"],d:"2018-11-02",t:"Food/Drink",clr:"Blue",mat:"Paper",cnd:"Intact"},{n:317,c:"Trash0317",i:["media/posts/201811/17995865551016029.jpg"],d:"2018-11-02",t:"Toys",clr:"Red",mat:"Plastic",cnd:"Intact"},{n:318,c:"Trash0318",i:["media/posts/201811/17973778666092098.jpg"],d:"2018-11-03",t:"Toys",clr:"Blue",mat:"Rubber",cnd:"Intact"},{n:319,c:"Trash0319",i:["media/posts/201811/18003238297024763.jpg"],d:"2018-11-04",t:"Receptacles",clr:"Red",mat:"Plastic",cnd:"Intact"},{n:320,c:"Trash0320",i:["media/posts/201811/17995781305054986.jpg"],d:"2018-11-04",t:"Food/Drink",clr:"Multi",mat:"Paper",cnd:"Intact"},{n:321,c:"Trash0321",i:["media/posts/201811/17995657729022935.jpg"],d:"2018-11-04",t:"Clothing",clr:"Multi",mat:"Mixed",cnd:"Intact"},{n:322,c:"Trash0322",i:["media/posts/201811/17921806459241581.jpg"],d:"2018-11-06",t:"Toys",clr:"Multi",mat:"Plastic",cnd:"Intact"},{n:323,c:"Trash0323",i:["media/posts/201811/17996850013040903.jpg"],d:"2018-11-08",t:"Packaging",clr:"Multi",mat:"Mixed",cnd:"Intact"},{n:324,c:"Trash0324",i:["media/posts/201811/17881953892300941.jpg"],d:"2018-11-09",t:"Furniture",clr:"Brown",mat:"Wood",cnd:"Intact"},{n:325,c:"Trash0325 : Editor-At-Large @beechertrouble suggests the sky’s reflection is trash",i:["media/posts/201811/17967276361156702.jpg"],d:"2018-11-09",by:"@beechertrouble",t:"Packaging",clr:"Multi",mat:"Plastic",cnd:"Scattered"},{n:326,c:"Trash0326",i:["media/posts/201811/17997164416049431.jpg"],d:"2018-11-10",t:"Toys",clr:"Multi",mat:"Mixed",cnd:"Broken"},{n:327,c:"Trash0326 : Guest Contributor: @pozzonyc finds assorted pieces to be reassembled in a space where love and hope are abundant.",i:["media/posts/201811/17935553632209359.jpg"],d:"2018-11-10",by:"@pozzonyc",t:"Electronics",clr:"White",mat:"Mixed",cnd:"Scattered"},{n:328,c:"Trash0328 : Guest Contributor : @maddtothebone finds a bare faux model butt",i:["media/posts/201811/17938790275204313.jpg"],d:"2018-11-12",by:"@maddtothebone",t:"Misc",clr:"Multi",mat:"Plastic",cnd:"Intact"},{n:329,c:"Trash0329 : Guest Contributor : @pozzonyc arrives minutes after a sad couch jumped to its death",i:["media/posts/201811/17969675806183151.jpg"],d:"2018-11-12",by:"@pozzonyc",t:"Furniture",clr:"Brown",mat:"Fabric",cnd:"Intact"},{n:330,c:"",i:["media/posts/201811/17908557580254939.jpg","media/posts/201811/17881024501304081.jpg","media/posts/201811/17990933686073220.jpg","media/posts/201811/17969679907176643.jpg"],d:"2018-11-13",t:"Toys",clr:"Pink",mat:"Plastic",cnd:"Intact"},{n:331,c:"Trash0331",i:["media/posts/201811/17868871510291872.jpg"],d:"2018-11-13",t:"Clothing",clr:"Multi",mat:"Fabric",cnd:"Scattered"},{n:332,c:"",i:["media/posts/201811/17973273877190799.jpg"],d:"2018-11-15",t:"Electronics",clr:"White",mat:"Plastic",cnd:"Broken"},{n:333,c:"Trash0333",i:["media/posts/201811/17893154146276292.jpg"],d:"2018-11-16",t:"Receptacles",clr:"White",mat:"Plastic",cnd:"Intact"},{n:334,c:"Trash0334 : Editor-At-Large @beechertrouble locates a displaced standard issue dry cleaner hanger",i:["media/posts/201811/17927086375238359.jpg"],d:"2018-11-18",by:"@beechertrouble",t:"Signage",clr:"Multi",mat:"Paper",cnd:"Broken"},{n:335,c:"",i:["media/posts/201811/18001501735014083.jpg"],d:"2018-11-18",t:"Clothing",clr:"Black",mat:"Fabric",cnd:"Intact"},{n:336,c:"",i:["media/posts/201811/17880490231287226.jpg","media/posts/201811/17941244368205251.jpg","media/posts/201811/17972075935182663.jpg","media/posts/201811/17959491544194034.jpg"],d:"2018-11-19",t:"Toys",clr:"Red",mat:"Plastic",cnd:"Broken"},{n:337,c:"Trash0337",i:["media/posts/201811/17972413855176558.jpg"],d:"2018-11-20",t:"Furniture",clr:"Brown",mat:"Wood",cnd:"Intact"},{n:338,c:"Trash0337 Guest Contributor @johnpdarcy finds the panda’s inner confidence",i:["media/posts/201811/17973247627180698.jpg"],d:"2018-11-26",by:"@johnpdarcy",t:"Toys",clr:"Multi",mat:"Fabric",cnd:"Intact"}]},
  "2018-12":{label:"December 2018",posts:[{n:339,c:"Trash0339 : found mr oizo",i:["media/posts/201812/18008013736019244.jpg"],d:"2018-12-06",t:"Toys",clr:"Orange",mat:"Fabric",cnd:"Intact"},{n:340,c:"Trash0340",i:["media/posts/201812/18011290291026528.jpg"],d:"2018-12-16",t:"Receptacles",clr:"Green",mat:"Plastic",cnd:"Intact"},{n:341,c:"Trash0341",i:["media/posts/201812/17980639891157742.jpg"],d:"2018-12-17",t:"Misc",clr:"Blue",mat:"Paper",cnd:"Intact"},{n:342,c:"Trash0342",i:["media/posts/201812/17948030674217961.jpg"],d:"2018-12-20",t:"Toys",clr:"White",mat:"Plastic",cnd:"Intact"},{n:343,c:"Trash0343",i:["media/posts/201812/17982551824149323.jpg"],d:"2018-12-20",t:"Signage",clr:"Multi",mat:"Paper",cnd:"Intact"},{n:344,c:"Trash0344",i:["media/posts/201812/17891726464287056.jpg"],d:"2018-12-20",t:"Food/Drink",clr:"Red",mat:"Organic",cnd:"Intact"},{n:345,c:"Trash0345 : Happy Holidays",i:["media/posts/201812/17990594059091159.jpg"],d:"2018-12-23",t:"Signage",clr:"Multi",mat:"Paper",cnd:"Intact"},{n:346,c:"Trash0346 : Editor-At- Large - @beechertrouble understands in the inherent cost involved in evaluating the Xmas spirit. #happyholidays",i:["media/posts/201812/17906908423279191.jpg"],d:"2018-12-24",by:"@beechertrouble",t:"Packaging",clr:"White",mat:"Plastic",cnd:"Intact"},{n:347,c:"Trash0347 #ad : @supremenewyork",i:["media/posts/201812/17923101163261226.jpg"],d:"2018-12-27",t:"Clothing",clr:"Red",mat:"Fabric",cnd:"Intact"},{n:348,c:"Trash0348 ð",i:["media/posts/201812/17842772263330620.jpg"],d:"2018-12-29",t:"Misc",clr:"Green",mat:"Organic",cnd:"Intact"}]},
  "2019-01":{label:"January 2019",posts:[{n:349,c:"Trash0349",i:["media/posts/201901/17990952667190371.jpg"],d:"2019-01-04",t:"Misc",clr:"White",mat:"Wood",cnd:"Intact"},{n:350,c:"Trash0350",i:["media/posts/201901/17925971047259402.jpg"],d:"2019-01-04",t:"Clothing",clr:"White",mat:"Mixed",cnd:"Intact"},{n:351,c:"Trash0351",i:["media/posts/201901/18019734319040088.jpg"],d:"2019-01-06",t:"Misc",clr:"Blue",mat:"Paper",cnd:"Intact"},{n:352,c:"Trash0352 : #ad @hennessy when the #remy in the system ain’t no telling...",i:["media/posts/201901/17842094581343828.jpg"],d:"2019-01-07",t:"Packaging",clr:"White",mat:"Paper",cnd:"Intact"},{n:353,c:"Trash0353 - Guest Contributor : @genevalw dramatizes the discarded ð¥",i:["media/posts/201901/17856764704310976.jpg"],d:"2019-01-07",by:"@genevalw",t:"Food/Drink",clr:"Multi",mat:"Mixed",cnd:"Scattered"},{n:354,c:"Trash0354",i:["media/posts/201901/18012029929078253.jpg"],d:"2019-01-09",t:"Receptacles",clr:"Black",mat:"Plastic",cnd:"Intact"},{n:355,c:"Trash0355",i:["media/posts/201901/18006824743108608.jpg"],d:"2019-01-10",t:"Electronics",clr:"Blue",mat:"Plastic",cnd:"Intact"},{n:356,c:"Trash0356",i:["media/posts/201901/18024256351013302.jpg"],d:"2019-01-18",t:"Packaging",clr:"White",mat:"Paper",cnd:"Intact"},{n:357,c:"Trash357 : outtake #dayaftertomorrow #frozenpizza",i:["media/posts/201901/17925102403270984.jpg"],d:"2019-01-22",t:"Food/Drink",clr:"Orange",mat:"Organic",cnd:"Intact"},{n:358,c:"Trash0358",i:["media/posts/201901/17925848602269797.jpg"],d:"2019-01-23",t:"Toys",clr:"Red",mat:"Plastic",cnd:"Intact"},{n:359,c:"Trash0359 : Editor-At-Large @beechertrouble discovers that recordable media desires to reflect on the natural world",i:["media/posts/201901/17860066714319293.jpg"],d:"2019-01-25",by:"@beechertrouble",t:"Electronics",clr:"Multi",mat:"Plastic",cnd:"Arranged"},{n:360,c:"Trash0360",i:["media/posts/201901/18007213561125748.jpg"],d:"2019-01-27",t:"Clothing",clr:"Black",mat:"Mixed",cnd:"Intact"},{n:361,c:"Trash0361",i:["media/posts/201901/18012879160128882.jpg"],d:"2019-01-27",t:"Misc",clr:"Brown",mat:"Wood",cnd:"Intact"}]},
  "2019-02":{label:"February 2019",posts:[{n:362,c:"Trash0362",i:["media/posts/201902/18000818572134271.jpg"],d:"2019-02-02",t:"Signage",clr:"Blue",mat:"Mixed",cnd:"Broken"},{n:363,c:"Trash363",i:["media/posts/201902/17862331996323860.jpg"],d:"2019-02-08",t:"Packaging",clr:"Red",mat:"Plastic",cnd:"Scattered"},{n:364,c:"",i:["media/posts/201902/18014583823112403.jpg","media/posts/201902/18013206160127874.jpg"],d:"2019-02-08",t:"Toys",clr:"Orange",mat:"Rubber",cnd:"Broken"},{n:365,c:"Trash0365",i:["media/posts/201902/18015212056113664.jpg"],d:"2019-02-11",t:"Packaging",clr:"White",mat:"Plastic",cnd:"Intact"},{n:366,c:"Trash366",i:["media/posts/201902/17932889872268032.jpg"],d:"2019-02-12",t:"Misc",clr:"White",mat:"Paper",cnd:"Broken"},{n:367,c:"Trash0367",i:["media/posts/201902/17993278786198693.jpg"],d:"2019-02-19",t:"Toys",clr:"Red",mat:"Plastic",cnd:"Intact"},{n:368,c:"Trash0368",i:["media/posts/201902/18019212175106873.jpg"],d:"2019-02-20",t:"Misc",clr:"White",mat:"Mixed",cnd:"Intact"},{n:369,c:"Trash0369",i:["media/posts/201902/17873524684311757.jpg"],d:"2019-02-24",t:"Packaging",clr:"Brown",mat:"Paper",cnd:"Intact"},{n:370,c:"Trash370",i:["media/posts/201902/18012995290093341.jpg"],d:"2019-02-24",t:"Packaging",clr:"Multi",mat:"Mixed",cnd:"Scattered"},{n:371,c:"",i:["media/posts/201902/17851180999360357.jpg","media/posts/201902/17972082877223941.jpg"],d:"2019-02-24",t:"Packaging",clr:"Multi",mat:"Plastic",cnd:"Intact"}]},
  "2019-03":{label:"March 2019",posts:[{n:372,c:"Trash0372",i:["media/posts/201903/18040116793034775.jpg"],d:"2019-03-04",t:"Misc",clr:"Multi",mat:"Mixed",cnd:"Intact"},{n:373,c:"Trash0373",i:["media/posts/201903/18040978606051566.jpg"],d:"2019-03-04",t:"Packaging",clr:"Yellow",mat:"Paper",cnd:"Crushed"},{n:374,c:"Trash0374",i:["media/posts/201903/17870854870325924.jpg"],d:"2019-03-05",t:"Food/Drink",clr:"Multi",mat:"Plastic",cnd:"Intact"},{n:375,c:"Trash0375 : Guest Contributor @annaleeklenkar defines the meaning of compression in the codependent world of agency",i:["media/posts/201903/18018309352084690.jpg"],d:"2019-03-11",by:"@annaleeklenkar",t:"Packaging",clr:"White",mat:"Paper",cnd:"Intact"},{n:376,c:"Trash0376",i:["media/posts/201903/18012291499154223.jpg"],d:"2019-03-11",t:"Packaging",clr:"Red",mat:"Plastic",cnd:"Intact"},{n:377,c:"Trash0377",i:["media/posts/201903/17968387507225772.jpg"],d:"2019-03-12",t:"Packaging",clr:"White",mat:"Plastic",cnd:"Intact"},{n:378,c:"Trash378",i:["media/posts/201903/18044233624063069.jpg"],d:"2019-03-12",t:"Misc",clr:"Brown",mat:"Mixed",cnd:"Intact"},{n:379,c:"Trash0379",i:["media/posts/201903/17969069998234675.jpg"],d:"2019-03-15",t:"Packaging",clr:"Multi",mat:"Mixed",cnd:"Scattered"},{n:380,c:"Trash0380",i:["media/posts/201903/17854047433370320.jpg"],d:"2019-03-17",t:"Packaging",clr:"Multi",mat:"Mixed",cnd:"Scattered"},{n:381,c:"Trash0381",i:["media/posts/201903/18037644046077636.jpg"],d:"2019-03-17",t:"Packaging",clr:"Red",mat:"Plastic",cnd:"Intact"},{n:382,c:"Trash0382",i:["media/posts/201903/18019202530136328.jpg"],d:"2019-03-18",t:"Food/Drink",clr:"Orange",mat:"Organic",cnd:"Arranged"},{n:383,c:"Trash0384 : Guest Contributor @msmelina finds a tire on a sidewalk",i:["media/posts/201903/18031956787104706.jpg"],d:"2019-03-23",by:"@msmelina",t:"Misc",clr:"Black",mat:"Rubber",cnd:"Intact"},{n:384,c:"Trash0385",i:["media/posts/201903/17971687534234440.jpg"],d:"2019-03-23",t:"Packaging",clr:"White",mat:"Plastic",cnd:"Intact"},{n:385,c:"Trash0385",i:["media/posts/201903/18049123129015013.jpg"],d:"2019-03-24",t:"Furniture",clr:"Grey",mat:"Mixed",cnd:"Broken"},{n:386,c:"Trash0386",i:["media/posts/201903/17953278208261672.jpg"],d:"2019-03-24",t:"Packaging",clr:"White",mat:"Paper",cnd:"Intact"},{n:387,c:"Trash0387",i:["media/posts/201903/17853849697372605.jpg"],d:"2019-03-24",t:"Packaging",clr:"White",mat:"Paper",cnd:"Intact"},{n:388,c:"Trash0387 : Editor-At-Large @beechertrouble finds laundry in a treeð",i:["media/posts/201903/18049508407057998.jpg"],d:"2019-03-24",by:"@beechertrouble",t:"Clothing",clr:"Black",mat:"Fabric",cnd:"Intact"},{n:389,c:"Trash0389",i:["media/posts/201903/18020136427190138.jpg"],d:"2019-03-24",t:"Misc",clr:"White",mat:"Plastic",cnd:"Intact"},{n:390,c:"Trash0390",i:["media/posts/201903/18050831155008651.jpg"],d:"2019-03-31",t:"Misc",clr:"Black",mat:"Rubber",cnd:"Intact"}]},
  "2019-04":{label:"April 2019",posts:[{n:391,c:"Trash0391 : Guest Contributor @pozzonyc finds a scary-ass painting",i:["media/posts/201904/18025935859139105.jpg"],d:"2019-04-08",by:"@pozzonyc",t:"Misc",clr:"Brown",mat:"Mixed",cnd:"Intact"},{n:392,c:"Trash0392 natural parabole",i:["media/posts/201904/17874617239341668.jpg"],d:"2019-04-08",t:"Misc",clr:"Grey",mat:"Mixed",cnd:"Broken"},{n:393,c:"Trash0393",i:["media/posts/201904/17943264115276147.jpg"],d:"2019-04-08",t:"Misc",clr:"Red",mat:"Mixed",cnd:"Intact"},{n:394,c:"Trash0394",i:["media/posts/201904/18054588697004877.jpg"],d:"2019-04-08",t:"Toys",clr:"Multi",mat:"Plastic",cnd:"Broken"},{n:395,c:"",i:["media/posts/201904/17919376210289754.jpg","media/posts/201904/18027447811090238.jpg"],d:"2019-04-08",t:"Packaging",clr:"Multi",mat:"Mixed",cnd:"Scattered"},{n:396,c:"Trash0396",i:["media/posts/201904/17843333041411563.jpg"],d:"2019-04-08",t:"Clothing",clr:"Yellow",mat:"Fabric",cnd:"Intact"},{n:397,c:"Trash0397 #ad @dior",i:["media/posts/201904/17895820228307406.jpg"],d:"2019-04-09",t:"Packaging",clr:"White",mat:"Paper",cnd:"Intact"},{n:398,c:"Trash0398",i:["media/posts/201904/18054657760008841.jpg"],d:"2019-04-09",t:"Packaging",clr:"White",mat:"Plastic",cnd:"Broken"},{n:399,c:"Trash0399",i:["media/posts/201904/17992070341203309.jpg"],d:"2019-04-11",t:"Clothing",clr:"Pink",mat:"Fabric",cnd:"Intact"},{n:400,c:"Trash0400 (four hundred) is the natural number following 399 and preceding 401 : also â¢ 4 x ð¯ â¢ 8 x 50",i:["media/posts/201904/17944592077279906.jpg"],d:"2019-04-11",t:"Packaging",clr:"White",mat:"Paper",cnd:"Intact"},{n:401,c:"Trash0401",i:["media/posts/201904/17854673773385017.jpg"],d:"2019-04-14",t:"Misc",clr:"Red",mat:"Mixed",cnd:"Intact"},{n:402,c:"Trash0402",i:["media/posts/201904/17848163296406553.jpg"],d:"2019-04-16",t:"Misc",clr:"Multi",mat:"Mixed",cnd:"Intact"},{n:403,c:"Trash0403",i:["media/posts/201904/17975034322243533.jpg"],d:"2019-04-18",t:"Toys",clr:"Pink",mat:"Fabric",cnd:"Intact"},{n:404,c:"Trash0404",i:["media/posts/201904/18057595717053263.jpg"],d:"2019-04-18",t:"Tools",clr:"Yellow",mat:"Wood",cnd:"Broken"},{n:405,c:"Trash0405",i:["media/posts/201904/18056298610009358.jpg"],d:"2019-04-18",t:"Misc",clr:"Brown",mat:"Wood",cnd:"Intact"},{n:406,c:"Trash0406",i:["media/posts/201904/17954680903267859.jpg"],d:"2019-04-18",t:"Tools",clr:"Multi",mat:"Plastic",cnd:"Intact"},{n:407,c:"Trash0407",i:["media/posts/201904/18039459697113856.jpg"],d:"2019-04-18",t:"Food/Drink",clr:"Green",mat:"Plastic",cnd:"Intact"},{n:408,c:"Trash0408",i:["media/posts/201904/18058490719015625.jpg"],d:"2019-04-24",t:"Misc",clr:"Multi",mat:"Paper",cnd:"Intact"},{n:409,c:"Trash0409",i:["media/posts/201904/17991194428220852.jpg"],d:"2019-04-24",t:"Toys",clr:"Multi",mat:"Wood",cnd:"Broken"}]},
  "2019-05":{label:"May 2019",posts:[{n:410,c:"Trash0410",i:["media/posts/201905/18068288293061936.jpg"],d:"2019-05-16",t:"Misc",clr:"Black",mat:"Mixed",cnd:"Broken"},{n:411,c:"Trash0411",i:["media/posts/201905/17850651547433351.jpg"],d:"2019-05-18",t:"Clothing",clr:"Brown",mat:"Mixed",cnd:"Intact"},{n:412,c:"Trash0412 Editor-At-Large @beechertrouble thank you for this confection",i:["media/posts/201905/17865644086388528.jpg"],d:"2019-05-19",by:"@beechertrouble",t:"Clothing",clr:"Multi",mat:"Fabric",cnd:"Intact"},{n:413,c:"Trash0412 : Guest Resident Roller Skater @maddtothebone reminds us its all been done before but it’s still fun to get busy.",i:["media/posts/201905/17856915550418578.jpg"],d:"2019-05-25",t:"Electronics",clr:"Grey",mat:"Mixed",cnd:"Arranged"},{n:414,c:"Trash0413",i:["media/posts/201905/17867636356378990.jpg"],d:"2019-05-25",t:"Packaging",clr:"White",mat:"Paper",cnd:"Intact"}]},
  "2019-06":{label:"June 2019",posts:[{n:415,c:"Trash0412",i:["media/posts/201906/18072647845003391.jpg"],d:"2019-06-07",t:"Furniture",clr:"White",mat:"Wood",cnd:"Intact"},{n:416,c:"Trash0413",i:["media/posts/201906/18039671077153929.jpg"],d:"2019-06-08",t:"Food/Drink",clr:"Red",mat:"Organic",cnd:"Intact"},{n:417,c:"Trash0417",i:["media/posts/201906/18069537619066398.jpg"],d:"2019-06-11",t:"Furniture",clr:"Multi",mat:"Wood",cnd:"Intact"},{n:418,c:"Trash0418",i:["media/posts/201906/17847919456472152.jpg"],d:"2019-06-17",t:"Electronics",clr:"White",mat:"Mixed",cnd:"Broken"},{n:419,c:"Trash0419",i:["media/posts/201906/17898740860331622.jpg"],d:"2019-06-17",t:"Misc",clr:"Red",mat:"Fabric",cnd:"Intact"},{n:420,c:"Trash0420",i:["media/posts/201906/18076863403009521.jpg"],d:"2019-06-17",t:"Clothing",clr:"Black",mat:"Mixed",cnd:"Intact"},{n:421,c:"Trash0421",i:["media/posts/201906/17898663448334952.jpg"],d:"2019-06-24",t:"Misc",clr:"Brown",mat:"Organic",cnd:"Intact"},{n:422,c:"Trash0422",i:["media/posts/201906/18049131529184549.jpg"],d:"2019-06-24",t:"Packaging",clr:"Orange",mat:"Plastic",cnd:"Intact"},{n:423,c:"Trash0423",i:["media/posts/201906/17865352099419353.jpg"],d:"2019-06-24",t:"Clothing",clr:"Pink",mat:"Fabric",cnd:"Intact"},{n:424,c:"Trash0424 : Guezt Pon Contributrrr - @andrew_herzog triangulates the intersection of art, trash, and undeliverables",i:["media/posts/201906/18077564884002690.mp4"],d:"2019-06-24",t:"Misc",clr:"Multi",mat:"Mixed",cnd:"Scattered"},{n:425,c:"Trash0425 : Editor-Et-Al @beechertrouble is in a place of acceptance for trash’s need to be seen and heard. It annoyed him for a long time but then he realized it caused him to suffer uncontrollably. He had empathy for himself which allowed him see maybe trash never got what they needed from their parents and now trash seeks to fill its own bin.",i:["media/posts/201906/17842432876506908.mp4"],d:"2019-06-24",by:"@beechertrouble",t:"Misc",clr:"Grey",mat:"Mixed",cnd:"Scattered"},{n:426,c:"",i:["media/posts/201906/18045471703151190.mp4"],d:"2019-06-27",t:"Misc",clr:"Multi",mat:"Mixed",cnd:"Scattered"},{n:427,c:"Trash0427",i:["media/posts/201906/17968661716273852.jpg"],d:"2019-06-29",t:"Receptacles",clr:"Black",mat:"Plastic",cnd:"Broken"},{n:428,c:"Trash0428",i:["media/posts/201906/17851034431469886.jpg"],d:"2019-06-29",t:"Packaging",clr:"Multi",mat:"Mixed",cnd:"Scattered"},{n:429,c:"Trash0429",i:["media/posts/201906/18060791521114357.mp4"],d:"2019-06-29",t:"Misc",clr:"Multi",mat:"Mixed",cnd:"Scattered"}]},
  "2019-07":{label:"July 2019",posts:[{n:430,c:"Trash0431 Editor-In-Person : @danisalright  suggest the automatic teller has always been ready for more but #fintech proved it was nothing more than #bridgetech never mistake urdelf for the champers party.",i:["media/posts/201907/17879324809387902.jpg"],d:"2019-07-08",by:"@danisalright",t:"Electronics",clr:"White",mat:"Mixed",cnd:"Broken"},{n:431,c:"Trash0432 : Guest ‘mmmpressionist @skiphursh channels #Renoir thru psychic medium photography to share suburbanized desires",i:["media/posts/201907/17987129116249857.jpg"],d:"2019-07-09",t:"Packaging",clr:"Multi",mat:"Plastic",cnd:"Scattered"},{n:432,c:"Trash0433 : Guest Patio Man @pajji shows a softer side of the distant cousin Sports Man who once dominated man-meme. #Dolan Over heard humming, ‘Learn to be still...’",i:["media/posts/201907/18064394158109007.jpg"],d:"2019-07-09",t:"Misc",clr:"Multi",mat:"Mixed",cnd:"Intact"},{n:433,c:"Trash0434 : brown bear, brown bear ð» #dang",i:["media/posts/201907/18063412957103655.mp4"],d:"2019-07-09",t:"Toys",clr:"Brown",mat:"Fabric",cnd:"Intact"},{n:434,c:"Trash0434 : Guest Lazy @danisalright shows us what it means to cash out and give up.",i:["media/posts/201907/18065106160097911.jpg"],d:"2019-07-10",t:"Receptacles",clr:"Black",mat:"Plastic",cnd:"Intact"},{n:435,c:"Trash0435",i:["media/posts/201907/18054859750089778.jpg"],d:"2019-07-11",t:"Packaging",clr:"Blue",mat:"Plastic",cnd:"Intact"},{n:436,c:"Trash0436 : Guest History @maddtothebone helps",i:["media/posts/201907/17971545643278610.jpg"],d:"2019-07-14",t:"Receptacles",clr:"White",mat:"Plastic",cnd:"Broken"},{n:437,c:"Trash0439 : Guest Astronomer  @skiphursh turns his lens downward and captures the tesseract! The universe is a microcosm #spacetime",i:["media/posts/201907/18085697149030766.mp4"],d:"2019-07-23",t:"Misc",clr:"Multi",mat:"Mixed",cnd:"Arranged"},{n:438,c:"Trash0440",i:["media/posts/201907/18055345288133152.jpg"],d:"2019-07-24",t:"Packaging",clr:"White",mat:"Paper",cnd:"Intact"},{n:439,c:"Trash0441",i:["media/posts/201907/17882022565381853.jpg"],d:"2019-07-26",t:"Clothing",clr:"Black",mat:"Fabric",cnd:"Broken"},{n:440,c:"Trash0442 : Guest Contributor @nomecopies_ goes grocery shopping.",i:["media/posts/201907/18087776563044083.jpg"],d:"2019-07-31",by:"@nomecopies_",t:"Receptacles",clr:"White",mat:"Paper",cnd:"Intact"}]},
  "2019-08":{label:"August 2019",posts:[{n:441,c:"Trash0443",i:["media/posts/201908/17847741121529132.jpg"],d:"2019-08-06",t:"Food/Drink",clr:"White",mat:"Plastic",cnd:"Crushed"},{n:442,c:"",i:["media/posts/201908/18090874969062145.jpg","media/posts/201908/17861876845464541.jpg"],d:"2019-08-12",t:"Signage",clr:"White",mat:"Paper",cnd:"Intact"},{n:443,c:"Trash0445",i:["media/posts/201908/18077521855111673.jpg"],d:"2019-08-27",t:"Misc",clr:"Orange",mat:"Paper",cnd:"Intact"}]},
  "2019-10":{label:"October 2019",posts:[{n:444,c:"Trash 0446",i:["media/posts/201910/18083448523111170.jpg"],d:"2019-10-03",t:"Signage",clr:"Red",mat:"Metal",cnd:"Intact"},{n:445,c:"Trash0447",i:["media/posts/201910/17842244848741755.jpg"],d:"2019-10-15",t:"Packaging",clr:"Black",mat:"Plastic",cnd:"Intact"}]},
  "2019-11":{label:"November 2019",posts:[{n:446,c:"Trash0448",i:["media/posts/201911/18080049607192056.jpg"],d:"2019-11-18",t:"Packaging",clr:"Blue",mat:"Plastic",cnd:"Intact"},{n:447,c:"Trash0449",i:["media/posts/201911/18078556441130366.jpg"],d:"2019-11-18",t:"Furniture",clr:"Orange",mat:"Fabric",cnd:"Intact"},{n:448,c:"Trash0450 - patriots are trash #microcheating #30for30",i:["media/posts/201911/18116507074052550.jpg"],d:"2019-11-26",t:"Receptacles",clr:"Blue",mat:"Mixed",cnd:"Intact"}]},
  "2019-12":{label:"December 2019",posts:[{n:449,c:"Trash0451",i:["media/posts/201912/17883908020464115.jpg"],d:"2019-12-17",t:"Toys",clr:"Multi",mat:"Rubber",cnd:"Intact"},{n:450,c:"Trash0452",i:["media/posts/201912/17872799530520621.jpg"],d:"2019-12-17",t:"Misc",clr:"Blue",mat:"Mixed",cnd:"Scattered"},{n:451,c:"Trash0453 : Thesis level shooter @maddtothebone dresses basketball in surrealism. #Layups swish swish #ofotd",i:["media/posts/201912/17856555454681537.jpg"],d:"2019-12-31",t:"Toys",clr:"Red",mat:"Rubber",cnd:"Arranged"},{n:452,c:"Trash0454 : @jwildegq location hunt 4 @thefader",i:["media/posts/201912/17931872401337298.jpg"],d:"2019-12-31",t:"Misc",clr:"Green",mat:"Organic",cnd:"Intact"},{n:453,c:"Trash0455 : @jwildegq offers a lite framework for living",i:["media/posts/201912/18123209548061394.jpg"],d:"2019-12-31",t:"Clothing",clr:"White",mat:"Plastic",cnd:"Intact"}]},
  "2020-01":{label:"January 2020",posts:[{n:454,c:"Trash0456 multiple windows",i:["media/posts/202001/18114471109068741.jpg"],d:"2020-01-08",t:"Misc",clr:"White",mat:"Mixed",cnd:"Broken"},{n:455,c:"Trash0457 : international person @chopstix.jpg finds a used holiday container",i:["media/posts/202001/17911630300381585.jpg"],d:"2020-01-08",t:"Packaging",clr:"White",mat:"Mixed",cnd:"Broken"},{n:456,c:"",i:["media/posts/202001/18086097520182617.jpg","media/posts/202001/17926548520358419.jpg","media/posts/202001/18088994218143510.jpg","media/posts/202001/17855165842735807.jpg","media/posts/202001/17940722182325265.jpg","media/posts/202001/17847702538846026.jpg"],d:"2020-01-09",t:"Packaging",clr:"Blue",mat:"Plastic",cnd:"Intact"}]},
  "2020-03":{label:"March 2020",posts:[{n:457,c:"Trash0458",i:["media/posts/202003/17862066460775272.jpg"],d:"2020-03-31",t:"Signage",clr:"Multi",mat:"Mixed",cnd:"Decayed"}]},
  "2020-04":{label:"April 2020",posts:[{n:458,c:"Trash0459",i:["media/posts/202004/18099723328184832.jpg"],d:"2020-04-01",t:"Packaging",clr:"White",mat:"Paper",cnd:"Intact"},{n:459,c:"Trash0460",i:["media/posts/202004/17852492980901889.jpg"],d:"2020-04-05",t:"Receptacles",clr:"Green",mat:"Plastic",cnd:"Intact"},{n:460,c:"Trash 0461",i:["media/posts/202004/18135724087012518.jpg"],d:"2020-04-07",t:"Signage",clr:"Blue",mat:"Paper",cnd:"Intact"},{n:461,c:"Trash 0462",i:["media/posts/202004/17860569442822477.jpg"],d:"2020-04-12",t:"Receptacles",clr:"Blue",mat:"Plastic",cnd:"Broken"},{n:462,c:"Trash 0463",i:["media/posts/202004/18090734737164406.jpg"],d:"2020-04-16",t:"Receptacles",clr:"Pink",mat:"Metal",cnd:"Intact"},{n:463,c:"Trash 0464",i:["media/posts/202004/17897877400469948.jpg"],d:"2020-04-18",t:"Furniture",clr:"White",mat:"Fabric",cnd:"Intact"}]},
  "2020-05":{label:"May 2020",posts:[{n:464,c:"Trash0465",i:["media/posts/202004/17890503112505477.jpg"],d:"2020-05-01",t:"Furniture",clr:"Blue",mat:"Fabric",cnd:"Intact"},{n:465,c:"Trash 0466",i:["media/posts/202005/17842434521167891.jpg"],d:"2020-05-10",t:"Packaging",clr:"Multi",mat:"Plastic",cnd:"Intact"},{n:466,c:"Trash 0467",i:["media/posts/202005/18143230558050861.jpg"],d:"2020-05-13",t:"Furniture",clr:"Multi",mat:"Mixed",cnd:"Arranged"},{n:467,c:"Trash 0468",i:["media/posts/202005/17863315207834258.jpg"],d:"2020-05-14",t:"Furniture",clr:"Pink",mat:"Metal",cnd:"Intact"},{n:468,c:"Trash 0469",i:["media/posts/202005/18053371249241158.jpg"],d:"2020-05-15",t:"Receptacles",clr:"Red",mat:"Metal",cnd:"Intact"},{n:469,c:"Trash 0470",i:["media/posts/202005/18128325241078795.jpg"],d:"2020-05-16",t:"Furniture",clr:"Blue",mat:"Fabric",cnd:"Intact"},{n:470,c:"Trash 0471",i:["media/posts/202005/18117967258106014.jpg"],d:"2020-05-19",t:"Furniture",clr:"White",mat:"Mixed",cnd:"Broken"},{n:471,c:"Trash 0472",i:["media/posts/202005/17893764274508499.jpg"],d:"2020-05-19",t:"Furniture",clr:"Multi",mat:"Mixed",cnd:"Intact"},{n:472,c:"Trash 0473",i:["media/posts/202005/17858153467943211.jpg"],d:"2020-05-19",t:"Furniture",clr:"Blue",mat:"Mixed",cnd:"Intact"},{n:473,c:"Trash 0744",i:["media/posts/202005/17852011514031032.jpg"],d:"2020-05-19",t:"Electronics",clr:"Blue",mat:"Plastic",cnd:"Intact"},{n:474,c:"Trash 0745 Guest ð· @towinisnice",i:["media/posts/202005/18095412244161721.jpg"],d:"2020-05-22",t:"Clothing",clr:"Multi",mat:"Fabric",cnd:"Intact"},{n:475,c:"Trash0476",i:["media/posts/202005/17913507973435303.jpg"],d:"2020-05-31",t:"Electronics",clr:"Black",mat:"Plastic",cnd:"Intact"}]},
  "2020-06":{label:"June 2020",posts:[{n:476,c:"Trash0477",i:["media/posts/202006/17842599695236534.jpg"],d:"2020-06-10",t:"Furniture",clr:"Multi",mat:"Fabric",cnd:"Intact"},{n:477,c:"Trash0478",i:["media/posts/202006/17860709989911799.jpg"],d:"2020-06-14",t:"Misc",clr:"Grey",mat:"Fabric",cnd:"Broken"},{n:478,c:"Trash0479",i:["media/posts/202006/17948840662348179.jpg"],d:"2020-06-14",t:"Electronics",clr:"Blue",mat:"Mixed",cnd:"Intact"},{n:479,c:"Trash0480",i:["media/posts/202006/17892318487549598.jpg"],d:"2020-06-16",t:"Furniture",clr:"Grey",mat:"Fabric",cnd:"Intact"},{n:480,c:"Trash0481",i:["media/posts/202006/17890096654560027.jpg"],d:"2020-06-29",t:"Furniture",clr:"Red",mat:"Fabric",cnd:"Intact"}]},
  "2020-07":{label:"July 2020",posts:[{n:481,c:"Trash0482",i:["media/posts/202007/18064247986237910.jpg"],d:"2020-07-28",t:"Furniture",clr:"White",mat:"Plastic",cnd:"Intact"}]},
  "2021-03":{label:"March 2021",posts:[{n:482,c:"Trash0483 : guest contributor @underwhelmer finds evidence we on the road to nowhere",i:["media/posts/202103/17866428941403501.jpg"],d:"2021-03-21",by:"@underwhelmer",t:"Furniture",clr:"Multi",mat:"Fabric",cnd:"Intact"},{n:483,c:"Trash0485 : Guest Traveler @messynacho Shows without telling",i:["media/posts/202103/17864042999401836.jpg"],d:"2021-03-31",t:"Furniture",clr:"Multi",mat:"Mixed",cnd:"Intact"},{n:484,c:"Trash0486 : Guest Traveler @messynacho captures what it feels like to see a pink baroque chair in nature",i:["media/posts/202103/18067738693302151.jpg"],d:"2021-03-31",t:"Furniture",clr:"Pink",mat:"Fabric",cnd:"Intact"},{n:485,c:"Trash0487 : Guest Traveler @messynacho reveals playfulness to be remote.",i:["media/posts/202103/17931678913511827.jpg"],d:"2021-03-31",t:"Toys",clr:"Red",mat:"Metal",cnd:"Intact"}]},
  "2021-10":{label:"October 2021",posts:[{n:486,c:"Trash 0488 : Editor-at-Large @beechertrouble shows us it hard to breath w a bag over your head. You’re just breathing in old xerox-ed stories. snap out of it",i:["media/posts/202110/18149544304205999.jpg"],d:"2021-10-01",by:"@beechertrouble",t:"Packaging",clr:"White",mat:"Plastic",cnd:"Scattered"}]}
};
const MONTH_KEYS = Object.keys(MONTHS);

/* ── Reels (IG stories) — videos + stills captured alongside the archive ── */
const REELS = [
  {n:1,u:"media/posts/stories/201806/17922282466147338.mp4",d:"2018-06-08"},
  {n:2,u:"media/posts/stories/201806/17922179653159622.mp4",d:"2018-06-08"},
  {n:3,u:"media/posts/stories/201806/17936458183107139.mp4",d:"2018-06-08"},
  {n:4,u:"media/posts/stories/201806/17877822610234151.mp4",d:"2018-06-08",by:"@skiphursh"},
  {n:5,u:"media/posts/stories/201806/17951838943060676.mp4",d:"2018-06-14"},
  {n:6,u:"media/posts/stories/201807/17885493469227432.mp4",d:"2018-07-05"},
  {n:7,u:"media/posts/stories/201807/17931389173134058.mp4",d:"2018-07-08"},
  {n:8,u:"media/posts/stories/201807/17939464282095809.mp4",d:"2018-07-12",c:"filmed by @mario1000words",by:"@mario1000words"},
  {n:9,u:"media/posts/stories/201807/17945350861112925.mp4",d:"2018-07-16"},
  {n:10,u:"media/posts/stories/201807/17920980286194024.mp4",d:"2018-07-21"},
  {n:11,u:"media/posts/stories/201807/17941447840089072.mp4",d:"2018-07-21",c:"s/o to my connect @department_of_sanitation",by:"@department_of_sanitation"},
  {n:12,u:"media/posts/stories/201807/17961877051045984.mp4",d:"2018-07-22"},
  {n:13,u:"media/posts/stories/201807/17938394410187219.jpg",d:"2018-07-23"},
  {n:14,u:"media/posts/stories/201807/17873730844256296.mp4",d:"2018-07-28"},
  {n:15,u:"media/posts/stories/201807/17964700114061072.jpg",d:"2018-07-29"},
  {n:16,u:"media/posts/stories/201808/17936083087180985.mp4",d:"2018-08-01"},
  {n:17,u:"media/posts/stories/201808/17880285244247000.mp4",d:"2018-08-11"},
  {n:18,u:"media/posts/stories/201808/17957785531101536.jpg",d:"2018-08-22",c:"@dailpicsofcoconuts i could never lose you. you were the only one who left a comment 🙏🏽 ru a robot?",by:"@dailpicsofcoconuts"},
  {n:19,u:"media/posts/stories/201808/17972772412062503.mp4",d:"2018-08-22",c:"🎥 @draeger 🎵 #morrissey 'how soon is now'",by:"@draeger"},
  {n:20,u:"media/posts/stories/201808/17941743601163775.mp4",d:"2018-08-27"},
  {n:21,u:"media/posts/stories/201809/17880883084265748.mp4",d:"2018-09-14"},
  {n:22,u:"media/posts/stories/201809/17851897384294854.mp4",d:"2018-09-24"},
  {n:23,u:"media/posts/stories/201810/17977422268101749.mp4",d:"2018-10-24"},
  {n:24,u:"media/posts/stories/201810/17883049819300296.mp4",d:"2018-10-24"},
  {n:25,u:"media/posts/stories/201810/17901206476262268.jpg",d:"2018-10-27"},
  {n:26,u:"media/posts/stories/201810/17997357040020488.jpg",d:"2018-10-30"},
  {n:27,u:"media/posts/stories/201811/17923294795228494.jpg",d:"2018-11-02",c:"plucked frm @ignoredprayers",by:"@ignoredprayers"},
  {n:28,u:"media/posts/stories/201811/17906520916256900.mp4",d:"2018-11-09"},
  {n:29,u:"media/posts/stories/201812/17876710891288798.mp4",d:"2018-12-06"},
  {n:30,u:"media/posts/stories/201812/17948222704218605.mp4",d:"2018-12-20"},
  {n:31,u:"media/posts/stories/201901/17852793667327833.mp4",d:"2019-01-24"},
  {n:32,u:"media/posts/stories/201902/18033591835025155.mp4",d:"2019-02-09"},
  {n:33,u:"media/posts/stories/201902/18030313237025350.mp4",d:"2019-02-09"},
  {n:34,u:"media/posts/stories/201902/17971366411202935.mp4",d:"2019-02-09"},
  {n:35,u:"media/posts/stories/201904/18054791860004810.mp4",d:"2019-04-04",by:"@draeger"},
  {n:36,u:"media/posts/stories/201906/17958394600281431.mp4",d:"2019-06-24"},
  {n:37,u:"media/posts/stories/201906/17843788843498475.mp4",d:"2019-06-24",by:"@beechertrouble"},
  {n:38,u:"media/posts/stories/201906/18077419297009294.mp4",d:"2019-06-24"},
  {n:39,u:"media/posts/stories/201906/18045988474180442.mp4",d:"2019-06-24",by:"@andrew_herzog"},
  {n:40,u:"media/posts/stories/201906/18001024522232202.mp4",d:"2019-06-27"},
  {n:41,u:"media/posts/stories/201906/18079208371063831.jpg",d:"2019-06-29"},
  {n:42,u:"media/posts/stories/201906/18046424488183788.mp4",d:"2019-06-29"},
  {n:43,u:"media/posts/stories/201906/17889016831362151.mp4",d:"2019-06-29"},
  {n:44,u:"media/posts/stories/201906/17984059474250135.mp4",d:"2019-06-29"},
  {n:45,u:"media/posts/stories/201906/18042386791164233.jpg",d:"2019-06-30"},
  {n:46,u:"media/posts/stories/201907/18057703012124141.mp4",d:"2019-07-01"},
  {n:47,u:"media/posts/stories/201907/18078809467023702.mp4",d:"2019-07-07"},
  {n:48,u:"media/posts/stories/201907/18064446016110178.mp4",d:"2019-07-07"},
  {n:49,u:"media/posts/stories/201907/17985480496256314.jpg",d:"2019-07-07"},
  {n:50,u:"media/posts/stories/201907/17844737668512600.mp4",d:"2019-07-07"},
  {n:51,u:"media/posts/stories/201907/18039428395174895.mp4",d:"2019-07-07"},
  {n:52,u:"media/posts/stories/201907/18004453459228875.mp4",d:"2019-07-08"},
  {n:53,u:"media/posts/stories/201907/17870416273416505.mp4",d:"2019-07-09"},
  {n:54,u:"media/posts/stories/201907/17879701954388489.mp4",d:"2019-07-10"},
  {n:55,u:"media/posts/stories/201907/18053541679184132.mp4",d:"2019-07-10"},
  {n:56,u:"media/posts/stories/201907/18059952697123402.mp4",d:"2019-07-10"},
  {n:57,u:"media/posts/stories/201907/17872907668409838.mp4",d:"2019-07-10"},
  {n:58,u:"media/posts/stories/201907/18060327862124355.jpg",d:"2019-07-10"},
  {n:59,u:"media/posts/stories/201907/18005813356233308.mp4",d:"2019-07-11"},
  {n:60,u:"media/posts/stories/201907/17982818434271882.mp4",d:"2019-07-23",by:"@skiphursh"},
  {n:61,u:"media/posts/stories/201907/18020437225207929.mp4",d:"2019-07-23"},
  {n:62,u:"media/posts/stories/201907/17845541200537952.mp4",d:"2019-07-31"},
  {n:63,u:"media/posts/stories/201907/17858527975475352.mp4",d:"2019-07-31"},
  {n:64,u:"media/posts/stories/201908/18074704876106184.mp4",d:"2019-08-16"},
  {n:65,u:"media/posts/stories/201908/18064466290186749.mp4",d:"2019-08-16"},
  {n:66,u:"media/posts/stories/201911/17845127725753687.jpg",d:"2019-11-07"},
];

const MONTH_LABEL = ["","January","February","March","April","May","June","July","August","September","October","November","December"];
const REEL_MONTHS = REELS.reduce((acc, r) => {
  const [y, m] = r.d.split("-");
  const key = `${y}-${m}`;
  if (!acc[key]) acc[key] = { label: `${MONTH_LABEL[parseInt(m)]} ${y}`, reels: [] };
  acc[key].reels.push(r);
  return acc;
}, {});

/* ── pick a few representative images for narrative photo clusters ── */
const CLUSTER_A = [
  "media/posts/201804/17939689354009499.jpg",
  "media/posts/201804/17908504351162607.jpg",
  "media/posts/201804/17866282903230045.jpg",
  "media/posts/201805/17842029628275231.jpg",
  "media/posts/201806/17854705888269236.jpg",
  "media/posts/201807/17843682085281889.jpg",
];
const CLUSTER_B = [
  "media/posts/201809/17869478800273583.jpg",
  "media/posts/201810/17889745252270730.jpg",
  "media/posts/201811/17864431423288942.jpg",
  "media/posts/201901/17842094581343828.jpg",
];

function ImageCard({ src: rawSrc, index, onClick, isMulti, by, caption }) {
  const src = abs(rawSrc);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const isVideo = src.endsWith(".mp4");
  return (
    <div onClick={onClick} className="pb-card">
      <div className="pb-card-thumb">
        {error ? (
          <div className="pb-card-err">—</div>
        ) : isVideo ? (
          <video src={src} muted loop playsInline onLoadedData={()=>setLoaded(true)} onError={()=>setError(true)} onMouseEnter={e=>e.target.play()} onMouseLeave={e=>{e.target.pause();e.target.currentTime=0;}} className="pb-card-media" style={{ opacity:loaded?1:0.4 }} />
        ) : (
          <img src={src} alt="" loading="lazy" onLoad={()=>setLoaded(true)} onError={()=>setError(true)} className="pb-card-media pb-card-img" style={{ opacity:loaded?1:0.4 }} />
        )}
        {isMulti && <div className="pb-card-multi">+</div>}
        {by && <div className="pb-card-by">{by}</div>}
      </div>
      {caption && <div className="pb-card-hover"><span>{caption}</span></div>}
    </div>
  );
}

function Lightbox({ post, imageIndex, onClose, onNext, onPrev, onImageNav }) {
  const currentSrc = abs(post.i[imageIndex] || post.i[0]);
  const isVideo = currentSrc.endsWith(".mp4");
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") { if (post.i.length > 1 && imageIndex < post.i.length - 1) onImageNav(imageIndex + 1); else onNext(); }
      if (e.key === "ArrowLeft") { if (post.i.length > 1 && imageIndex > 0) onImageNav(imageIndex - 1); else onPrev(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, onNext, onPrev, imageIndex, onImageNav, post.i.length]);
  const num = String(post.n).padStart(3, "0");
  const caption = cleanCaption(post.c, post.by);
  const swipe = useSwipeNav({
    onNext: () => { if (post.i.length > 1 && imageIndex < post.i.length - 1) onImageNav(imageIndex + 1); else onNext(); },
    onPrev: () => { if (post.i.length > 1 && imageIndex > 0) onImageNav(imageIndex - 1); else onPrev(); },
  });
  return createPortal(
    <div onClick={onClose} className="pb-lightbox" {...swipe}>
      <button onClick={e=>{e.stopPropagation();onPrev();}} className="pb-lb-arrow pb-lb-prev">&#8249;</button>
      <figure className="pb-lb-slide" onClick={e=>e.stopPropagation()}>
        <div className="pb-lb-slide-top">
          <span className="pb-lb-stamp">NEST</span>
          <span className="pb-lb-stamp">No. {num}</span>
          <span className="pb-lb-stamp">{post.d}</span>
        </div>
        <div className="pb-lb-slide-window">
          {isVideo ? (
            <video src={currentSrc} controls autoPlay loop muted playsInline className="pb-lb-window-media" />
          ) : (
            <img src={currentSrc} alt="" className="pb-lb-window-media" />
          )}
        </div>
        {post.i.length > 1 && (
          <div className="pb-lb-dots">
            {post.i.map((_,idx)=>(
              <button key={idx} onClick={()=>onImageNav(idx)} className={`pb-lb-dot${idx===imageIndex?" on":""}`} />
            ))}
          </div>
        )}
        {(caption || post.by) && (
          <figcaption className="pb-lb-slide-caption">
            {caption && <p className="pb-lb-caption">{caption}</p>}
            {post.by && <p className="pb-lb-by">Guest contributor · {post.by}</p>}
          </figcaption>
        )}
      </figure>
      <button onClick={e=>{e.stopPropagation();onNext();}} className="pb-lb-arrow pb-lb-next">&#8250;</button>
      <button onClick={onClose} className="pb-lb-close">&#10005;</button>
    </div>,
    document.body
  );
}

/* ── Reel card — vertical 9:16 thumb ── */
function ReelCard({ reel, onClick }) {
  const src = abs(reel.u);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const isVideo = src.endsWith(".mp4");
  return (
    <div onClick={onClick} className="pb-reel-card">
      <div className="pb-reel-thumb">
        {error ? (
          <div className="pb-card-err">—</div>
        ) : isVideo ? (
          <video
            src={src}
            muted loop playsInline preload="metadata"
            onLoadedData={()=>setLoaded(true)}
            onError={()=>setError(true)}
            onMouseEnter={e=>e.target.play()}
            onMouseLeave={e=>{e.target.pause();e.target.currentTime=0;}}
            className="pb-reel-media"
            style={{ opacity:loaded?1:0.4 }}
          />
        ) : (
          <img
            src={src} alt="" loading="lazy"
            onLoad={()=>setLoaded(true)}
            onError={()=>setError(true)}
            className="pb-reel-media"
            style={{ opacity:loaded?1:0.4 }}
          />
        )}
        {isVideo && <div className="pb-reel-play">▶</div>}
        {reel.by && <div className="pb-card-by">{reel.by}</div>}
      </div>
    </div>
  );
}

/* ── Reel lightbox — slide mount with 9:16 portrait window ── */
function ReelLightbox({ reels, index, onClose, onNav }) {
  const r = reels[index];
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNav(1);
      if (e.key === "ArrowLeft") onNav(-1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, onNav]);
  if (!r) return null;
  const src = abs(r.u);
  const isVideo = src.endsWith(".mp4");
  const num = String(r.n).padStart(3, "0");
  const caption = cleanCaption(r.c, r.by);
  const swipe = useSwipeNav({ onNext: () => onNav(1), onPrev: () => onNav(-1) });
  return createPortal(
    <div onClick={onClose} className="pb-lightbox" {...swipe}>
      <button onClick={e=>{e.stopPropagation();onNav(-1);}} className="pb-lb-arrow pb-lb-prev">&#8249;</button>
      <figure className="pb-lb-slide pb-lb-slide-reel" onClick={e=>e.stopPropagation()}>
        <div className="pb-lb-slide-top">
          <span className="pb-lb-stamp">NEST</span>
          <span className="pb-lb-stamp">Reel {num}</span>
          <span className="pb-lb-stamp">{r.d}</span>
        </div>
        <div className="pb-lb-slide-window pb-lb-reel-window">
          {isVideo ? (
            <video src={src} controls autoPlay loop playsInline className="pb-lb-window-media" />
          ) : (
            <img src={src} alt="" className="pb-lb-window-media" />
          )}
        </div>
        {(caption || r.by) && (
          <figcaption className="pb-lb-slide-caption">
            {caption && <p className="pb-lb-caption">{caption}</p>}
            {r.by && <p className="pb-lb-by">Guest contributor · {r.by}</p>}
          </figcaption>
        )}
      </figure>
      <button onClick={e=>{e.stopPropagation();onNav(1);}} className="pb-lb-arrow pb-lb-next">&#8250;</button>
      <button onClick={onClose} className="pb-lb-close">&#10005;</button>
    </div>,
    document.body
  );
}

/* ── Narrative section ── */
function NarrativeSection({ label, children }) {
  return (
    <div className="pb-narr-section">
      {label && <div className="pb-narr-label">{label}</div>}
      {children}
    </div>
  );
}

/* ── Contributors tiered by contribution count ── */
const CONTRIBUTORS = (() => {
  const counts = {};
  Object.values(MONTHS).forEach(m => m.posts.forEach(p => {
    if (p.by) counts[p.by] = (counts[p.by] || 0) + 1;
  }));
  const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]);
  const tiers = {
    "Editor-at-Large": [],    // 10+
    "Senior Correspondent": [],// 3-9
    "Field Agent": [],         // 2
    "One-Time Informant": [],  // 1
  };
  sorted.forEach(([name, count]) => {
    if (count >= 10) tiers["Editor-at-Large"].push({ name, count });
    else if (count >= 3) tiers["Senior Correspondent"].push({ name, count });
    else if (count >= 2) tiers["Field Agent"].push({ name, count });
    else tiers["One-Time Informant"].push({ name, count });
  });
  return tiers;
})();

function ContributorsSection() {
  const tierClass = { "Editor-at-Large": "gold", "Senior Correspondent": "silver", "Field Agent": "", "One-Time Informant": "" };
  return (
    <div className="pb-contribs">
      <div className="pb-contribs-h">Guest Contributors</div>
      {Object.entries(CONTRIBUTORS).map(([tier, people]) => people.length > 0 && (
        <div key={tier} className={`pb-contrib-tier ${tierClass[tier]}`}>
          <div className="pb-contrib-tier-label">{tier}</div>
          <div className="pb-contrib-list">
            {people.map(p => (
              <span key={p.name} className="pb-contrib">
                {p.name}<span className="pb-contrib-count">{p.count}</span>
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PhotoCluster({ images }) {
  return (
    <div className="pb-cluster">
      {images.map((src,i) => (
        <div key={i} className="pb-cluster-img">
          <img src={abs(src)} alt="" loading="lazy" />
        </div>
      ))}
    </div>
  );
}

/* ── Filter dimensions ── */
const FILTER_DIMS = [
  { key: "month", label: "Month" },
  { key: "type", label: "Type" },
  { key: "contributor", label: "Contributor" },
  { key: "season", label: "Season" },
  { key: "color", label: "Color" },
  { key: "material", label: "Material" },
  { key: "condition", label: "Condition" },
];

function getSeason(dateStr) {
  const m = parseInt(dateStr.split("-")[1]);
  if (m >= 3 && m <= 5) return "Spring";
  if (m >= 6 && m <= 8) return "Summer";
  if (m >= 9 && m <= 11) return "Fall";
  return "Winter";
}

/* ── Build lookup maps for dynamic filter options ── */
const ALL_POSTS_FLAT = [];
Object.entries(MONTHS).forEach(([month, data]) => {
  data.posts.forEach(post => { ALL_POSTS_FLAT.push({ ...post, month, season: getSeason(post.d) }); });
});

function getFilterOptions(dim) {
  if (dim === "month") {
    const years = {};
    MONTH_KEYS.forEach(k => { const y = k.split("-")[0]; if (!years[y]) years[y] = []; years[y].push(k); });
    return { type: "months", years };
  }
  const fieldMap = { type: "t", contributor: "by", season: "season", color: "clr", material: "mat", condition: "cnd" };
  const field = fieldMap[dim];
  if (!field) return { type: "values", values: [] };
  const set = new Set();
  ALL_POSTS_FLAT.forEach(p => { const v = p[field]; if (v) set.add(v); });
  const values = [...set].sort();
  return { type: "values", values };
}

export default function PatioBeach() {
  const [view, setView] = useState("narrative"); // "narrative" | "archive" | "reels"
  const [filters, setFilters] = useState({ month: "all", type: "all", contributor: "all", season: "all", color: "all", material: "all", condition: "all" });
  const [expandedDim, setExpandedDim] = useState(null);
  const [lightboxPost, setLightboxPost] = useState(null);
  const [lightboxImageIdx, setLightboxImageIdx] = useState(0);
  const [reelIdx, setReelIdx] = useState(null);
  const handleReelNav = useCallback((dir) => {
    setReelIdx(prev => {
      if (prev === null) return prev;
      const next = prev + dir;
      if (next < 0) return REELS.length - 1;
      if (next >= REELS.length) return 0;
      return next;
    });
  }, []);

  const allPosts = ALL_POSTS_FLAT;

  /* ── Chained filtering ── */
  const filteredPosts = allPosts.filter(p => {
    if (filters.month !== "all" && p.month !== filters.month) return false;
    if (filters.type !== "all" && p.t !== filters.type) return false;
    if (filters.contributor !== "all" && p.by !== filters.contributor) return false;
    if (filters.season !== "all" && p.season !== filters.season) return false;
    if (filters.color !== "all" && p.clr !== filters.color) return false;
    if (filters.material !== "all" && p.mat !== filters.material) return false;
    if (filters.condition !== "all" && p.cnd !== filters.condition) return false;
    return true;
  });

  const activeFilterCount = Object.values(filters).filter(v => v !== "all").length;

  const currentIndex = lightboxPost ? filteredPosts.findIndex(p => p.n === lightboxPost.n) : -1;
  const handleNext = useCallback(() => { if (currentIndex < filteredPosts.length - 1) { setLightboxPost(filteredPosts[currentIndex + 1]); setLightboxImageIdx(0); } }, [currentIndex, filteredPosts]);
  const handlePrev = useCallback(() => { if (currentIndex > 0) { setLightboxPost(filteredPosts[currentIndex - 1]); setLightboxImageIdx(0); } }, [currentIndex, filteredPosts]);
  const years = {};
  MONTH_KEYS.forEach(k => { const y = k.split("-")[0]; if (!years[y]) years[y] = []; years[y].push(k); });
  const ABBR = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const setFilter = (dim, value) => {
    setFilters(prev => ({ ...prev, [dim]: value }));
  };

  const clearAllFilters = () => {
    setFilters({ month: "all", type: "all", contributor: "all", season: "all", color: "all", material: "all", condition: "all" });
    setExpandedDim(null);
  };

  const toggleDim = (dim) => {
    setExpandedDim(prev => prev === dim ? null : dim);
  };

  return (
    <div className="pb-wrap en">
      {/* Header */}
      <div className="pb-header">
        <div className="pb-header-label">Archive</div>
        <h1 className="pb-title">Nest</h1>
        <p className="pb-subtitle">486 posts, 556 images, 2018–2021</p>
        <div className="pb-view-toggle">
          <button className={`pb-view-btn${view==="narrative"?" on":""}`} onClick={()=>setView("narrative")}>About</button>
          <button className={`pb-view-btn${view==="archive"?" on":""}`} onClick={()=>setView("archive")}>Archive</button>
          <button className={`pb-view-btn${view==="reels"?" on":""}`} onClick={()=>setView("reels")}>Reels</button>
        </div>
      </div>

      {view === "reels" ? (
        <div className="pb-reels">
          <p className="pb-reels-intro">Ephemeral companions to the archive — short clips and stills captured alongside the walks. {REELS.length} in total.</p>
          {Object.entries(REEL_MONTHS).map(([monthKey, monthData]) => (
            <div key={monthKey} className="pb-month-group">
              <div className="pb-month-label">{monthData.label}<span>{monthData.reels.length}</span></div>
              <div className="pb-reel-grid">
                {monthData.reels.map(r => (
                  <ReelCard key={r.n} reel={r} onClick={()=>setReelIdx(REELS.findIndex(x=>x.n===r.n))} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : view === "narrative" ? (
        <div className="pb-narrative">
          {/* 1. Opening — The Premise */}
          <NarrativeSection>
            <p className="pb-narr-lead">Discarded things have meaning.</p>
            <p className="pb-narr-body">This project began as a simple act of noticing.</p>
            <p className="pb-narr-body">For a few years I walked my son Mathis to preschool along the same route each morning. Park Slope to Gowanus in Brooklyn. Along the way I'd whip out my iPhone or my Fujifilm X100 and photograph objects that had been left behind: broken furniture, lost toys, crushed packaging, forgotten tools, and empty alcohol containers. Honestly, it felt like a wild party happened after dark. But every night. Chaos!</p>
            <p className="pb-narr-body">One of the first images I took was of me in a thrown-out mirror. Funny looking back on it now. But it snowballed from there. At first it felt like a small curiosity or a way to sharpen my eye. Over time I realized the documenting was fun. New York is a dirty city. Lots of garbage and all types. Large and small. People throw away anything. The quiet life of things the city had decided it no longer needed. And perhaps the things we decide are the same about ourselves.</p>
            <p className="pb-narr-body">I was not the first person to discover the hidden material of refuse. I'm reminded of Justin Gignac's <a href="https://www.nycgarbage.com/" target="_blank" rel="noopener noreferrer">Garbage for Sale</a>, Young Blanks' legendary <a href="https://www.youngblanks.com/periodical-table-of-trash" target="_blank" rel="noopener noreferrer">Periodical Table of Trash</a>, and the <a href="https://www.noahpurifoy.com/" target="_blank" rel="noopener noreferrer">Noah Purifoy Outdoor Desert Art Museum</a> in Joshua Tree, a 10-acre open-air gallery featuring over 100 large-scale assemblage sculptures created from found desert, household, and industrial junk. Each person brings their own perspective. It hits everyone differently.</p>
          </NarrativeSection>

          {/* Photo cluster */}
          <PhotoCluster images={CLUSTER_A} />

          {/* 2. The Route */}
          <NarrativeSection label="The Route">
            <p className="pb-narr-body">The first several photos were taken along a short daily walk. Way before I knew it was anything. As time passed I branched out.</p>
            <p className="pb-narr-route">Park Slope → Gowanus</p>
            <p className="pb-narr-body pb-narr-quiet">A distance of less than two miles.</p>

            {/* Route map */}
            <a href="https://maps.app.goo.gl/doCvsJgNw5pvPuG89" target="_blank" rel="noopener noreferrer" className="pb-route-map">
              <div className="pb-route-img">
                <img src="/media/nest/route-map.png" alt="Walking route from 302 5th St to Rivendell School, Park Slope to Gowanus" />
              </div>
              <div className="pb-route-labels">
                <div className="pb-route-place">
                  <span className="pb-route-place-name">302 5th St</span>
                  <span className="pb-route-place-hood">Park Slope</span>
                </div>
                <div className="pb-route-place" style={{textAlign:"right"}}>
                  <span className="pb-route-place-name">Rivendell School</span>
                  <span className="pb-route-place-hood">277 3rd Ave, Gowanus</span>
                </div>
              </div>
              <div className="pb-route-meta">
                0.5 mi · 11 min walk · Open in Google Maps ↗
              </div>
            </a>

            <p className="pb-narr-body">What began as a routine gradually became a ritual. Walking the same streets every day created a kind of visual awareness. Small details surfaced. Patterns emerged. The ordinary started to feel like signals.</p>
            <p className="pb-narr-body">This route became the only space in my life at the time where I created purely from curiosity. No brief. No client. No outcome required.</p>
          </NarrativeSection>

          {/* 3. Gowanus */}
          <NarrativeSection label="Gowanus">
            <p className="pb-narr-body">Many of the early photographs were taken near the Gowanus Canal. One of the most polluted waterways in America.</p>
            <p className="pb-narr-body">For over a century the canal absorbed the industrial byproducts of New York: chemicals, waste, residue from manufacturing and shipping. Today it is a designated Superfund site, a place where the past remains visible in the environment.</p>
            <p className="pb-narr-body">Walking along its edges each day, the objects I found began to feel less random. They felt like artifacts of the city's shadow. Things removed from sight so the surface of life could appear clean and orderly.</p>
          </NarrativeSection>

          {/* Photo cluster */}
          <PhotoCluster images={CLUSTER_B} />

          {/* 4. The Shadow */}
          <NarrativeSection label="The Shadow">
            <p className="pb-narr-body">At some point I realized the photographs were not only about the city. They were also about me.</p>
            <p className="pb-narr-body">It wasn't until I lost interest in the project that the real tension surfaced. I had so many photos and wanted to make something of them, maybe a book. But the photos had lost their appeal. They weren't beautiful in any conventional sense. I struggled with how or what to do with them. And that was the point. The photos were ugly, and in those moments I was able to see and connect with my uglier sides.</p>
            <p className="pb-narr-body">The discarded objects reflected something internal. The parts of ourselves we quietly set aside because they no longer match the image we want to project. Broken things. Unfinished things. Things that once mattered but were left behind.</p>
            <p className="pb-narr-body">Carl Jung described this as the shadow: the hidden aspects of identity we ignore or suppress. The streets were full of it. And so was I.</p>
          </NarrativeSection>

          {/* 5. The Bowerbird */}
          <NarrativeSection label="The Bowerbird">
            <div className="pb-narr-figure">
              <img src="/media/nest/bowerbird.jpg" alt="Satin bowerbird" className="pb-narr-figure-img" />
              <div className="pb-narr-figure-cap">Satin bowerbird (<em>Ptilonorhynchus violaceus</em>)</div>
            </div>
            <p className="pb-narr-body">Around this same time I learned about the bowerbird. A small bird known for building elaborate nests from objects it collects from the forest floor. Flowers, shells, pieces of glass, bits of plastic. Anything colorful or unusual. The bird arranges these fragments carefully, creating a structure meant to attract a mate. Beauty assembled from what others overlook.</p>
            <p className="pb-narr-body">I couldn't help but see the connection. Without realizing it, I had been doing something similar. Collecting the discarded fragments of the city. Building a visual nest.</p>
          </NarrativeSection>

          {/* 6. Mathis */}
          <NarrativeSection label="Mathis">
            <p className="pb-narr-body">This project would not exist without my son. Walking him to school created the space where the photographs happened. But more importantly, his presence changed the way I saw the world. Children notice things adults move past. A crushed toy. A strange object on the sidewalk. Something bright in the gutter.</p>
            <p className="pb-narr-body">Walking with him slowed my attention. Mathis came into the world with awareness, seeing the unacknowledged easily. He shared that gift with me through fatherhood and care.</p>
            <p className="pb-narr-body">What began as visual curiosity eventually led to something else: a rediscovery of my own voice. First visually, then personally, and eventually through advocacy and action. Awareness creates momentum.</p>
          </NarrativeSection>

          {/* Contributors */}
          <ContributorsSection />

          {/* 7. Nest */}
          <NarrativeSection label="Nest">
            <p className="pb-narr-body">Over time more than 500 photographs accumulated. Each one a fragment. A small record of something discarded. Together they form something else entirely. A nest built from the overlooked pieces of the city. Not as an archive of trash, but as a meditation on attention. The beauty, tension, and meaning hidden inside what we usually walk past. <strong>Because what we discard, ignore, or hide often tells the most honest story about who we are.</strong></p>
          </NarrativeSection>

          {/* CTA to archive */}
          <div className="pb-narr-cta">
            <button className="pb-view-btn on" onClick={()=>{setView("archive");window.scrollTo(0,0);}}>View the Archive</button>
            <span className="pb-narr-cta-count">486 posts · 556 images · 2018–2021</span>
          </div>
        </div>
      ) : (
        /* ── Archive Grid ── */
        <div className="pb-archive">
          {/* Row 1: Dimension selector chips */}
          <div className="pb-filter-dimensions">
            {FILTER_DIMS.map(dim => {
              const isActive = filters[dim.key] !== "all";
              const isExpanded = expandedDim === dim.key;
              return (
                <button
                  key={dim.key}
                  onClick={() => toggleDim(dim.key)}
                  className={`pb-filter-dim-btn${isActive ? " active" : ""}${isExpanded ? " expanded" : ""}`}
                >
                  {dim.label}
                  {isActive && <span className="pb-filter-dim-val">{filters[dim.key] === "all" ? "" : dim.key === "month" ? ABBR[parseInt(filters[dim.key].split("-")[1])] + " " + filters[dim.key].split("-")[0] : filters[dim.key]}</span>}
                </button>
              );
            })}
            <span className="pb-filter-count">{filteredPosts.length}</span>
            {activeFilterCount > 0 && (
              <button onClick={clearAllFilters} className="pb-filter-clear">Clear all</button>
            )}
          </div>

          {/* Row 2: Contextual values for expanded dimension */}
          {expandedDim && (() => {
            const opts = getFilterOptions(expandedDim);
            if (opts.type === "months") {
              return (
                <div className="pb-filter-values">
                  <button onClick={() => setFilter("month", "all")} className={`pb-filter-btn${filters.month === "all" ? " on" : ""}`}>All</button>
                  {Object.entries(opts.years).map(([year, keys]) => (
                    <div key={year} className="pb-filter-year">
                      <span className="pb-filter-yr-label">{year}</span>
                      {keys.map(k => { const m = parseInt(k.split("-")[1]); return (
                        <button key={k} onClick={() => setFilter("month", k)} className={`pb-filter-btn${filters.month === k ? " on" : ""}`}>{ABBR[m]}</button>
                      ); })}
                    </div>
                  ))}
                </div>
              );
            }
            return (
              <div className="pb-filter-values">
                <button onClick={() => setFilter(expandedDim, "all")} className={`pb-filter-btn${filters[expandedDim] === "all" ? " on" : ""}`}>All</button>
                {opts.values.map(v => (
                  <button key={v} onClick={() => setFilter(expandedDim, v)} className={`pb-filter-btn${filters[expandedDim] === v ? " on" : ""}`}>{v}</button>
                ))}
                {opts.values.length === 0 && <span className="pb-filter-empty">No tags yet</span>}
              </div>
            );
          })()}

          {/* Active filter summary */}
          {activeFilterCount > 0 && (
            <div className="pb-filter-summary">
              {Object.entries(filters).filter(([,v]) => v !== "all").map(([dim, val]) => (
                <span key={dim} className="pb-filter-tag">
                  {FILTER_DIMS.find(d => d.key === dim)?.label}: {dim === "month" ? ABBR[parseInt(val.split("-")[1])] + " " + val.split("-")[0] : val}
                  <button onClick={() => setFilter(dim, "all")} className="pb-filter-tag-x">&times;</button>
                </span>
              ))}
            </div>
          )}

          <div className={`pb-grid-wrap${activeFilterCount > 0 ? " pb-filtered" : ""}`}>
            {activeFilterCount === 0 ? Object.entries(MONTHS).map(([monthKey, monthData]) => (
              <div key={monthKey} className="pb-month-group">
                <div className="pb-month-label">{monthData.label}<span>{monthData.posts.length}</span></div>
                <div className="pb-grid">
                  {monthData.posts.map((post,i) => <ImageCard key={post.n} src={post.i[0]} index={i} isMulti={post.i.length>1} by={post.by} caption={post.c} onClick={()=>{setLightboxPost(post);setLightboxImageIdx(0);}} />)}
                </div>
              </div>
            )) : (
              <div className="pb-grid">
                {filteredPosts.map((post,i) => <ImageCard key={post.n} src={post.i[0]} index={i} isMulti={post.i.length>1} by={post.by} caption={post.c} onClick={()=>{setLightboxPost(post);setLightboxImageIdx(0);}} />)}
              </div>
            )}
            {filteredPosts.length === 0 && <div className="pb-empty">No posts matching filters</div>}
          </div>
        </div>
      )}

      {lightboxPost && <Lightbox post={lightboxPost} imageIndex={lightboxImageIdx} onClose={()=>setLightboxPost(null)} onNext={handleNext} onPrev={handlePrev} onImageNav={idx=>setLightboxImageIdx(idx)} />}
      {reelIdx !== null && <ReelLightbox reels={REELS} index={reelIdx} onClose={()=>setReelIdx(null)} onNav={handleReelNav} />}
    </div>
  );
}
