import type { TemplateId, ThemeId } from '@/types/portfolio';

export const templates: { id:TemplateId; name:string; tag:string; desc:string; bestFor:string }[] = [
 {id:'modern',name:'Modern',tag:'Developer',desc:'Bold editorial hierarchy inspired by your original portfolio.',bestFor:'Developers & engineers'},
 {id:'minimal',name:'Minimal',tag:'Professional',desc:'Quiet typography, whitespace and a CV-first reading flow.',bestFor:'Corporate & job seekers'},
 {id:'creative',name:'Creative',tag:'Visual',desc:'Large type, expressive spacing and project-first storytelling.',bestFor:'Designers & creatives'},
 {id:'terminal',name:'Terminal',tag:'Tech',desc:'Command-line aesthetic with technical, monospace character.',bestFor:'Developers & open source'},
 {id:'academic',name:'Academic',tag:'Research',desc:'Structured research, education, publications-style sections.',bestFor:'Students & academics'},
 {id:'bento',name:'Bento',tag:'Product',desc:'Modern dashboard-inspired cards for skills and projects.',bestFor:'Product & software profiles'},
 {id:'editorial',name:'Editorial',tag:'Premium',desc:'Magazine-like layout with refined typography and contrast.',bestFor:'Senior professionals'},
 {id:'brutalist',name:'Brutalist',tag:'Bold',desc:'Thick borders, hard shadows and stark contrast for maximum impact.',bestFor:'Designers who want to stand out'},
 {id:'glass',name:'Glass',tag:'Modern',desc:'Frosted, translucent panels over soft gradient light.',bestFor:'Product & design portfolios'},
 {id:'neon',name:'Neon',tag:'Futuristic',desc:'Dark cyberpunk canvas with glowing accent edges.',bestFor:'Game & creative technologists'},
 {id:'timeline',name:'Timeline',tag:'Narrative',desc:'A vertical career timeline that tells your story in order.',bestFor:'Career changers & storytellers'},
];
export const themes:{id:ThemeId;name:string;accent:string;background:string;surface:string}[] = [
 {id:'midnight',name:'Midnight',accent:'#f97316',background:'#090909',surface:'#121212'},
 {id:'paper',name:'Paper',accent:'#171717',background:'#f5f1e8',surface:'#fffdf8'},
 {id:'ocean',name:'Ocean',accent:'#38bdf8',background:'#07111f',surface:'#0c1b2d'},
 {id:'forest',name:'Forest',accent:'#4ade80',background:'#07130c',surface:'#0d2114'},
 {id:'sunset',name:'Sunset',accent:'#fb7185',background:'#170a12',surface:'#26101b'},
 {id:'mono',name:'Monochrome',accent:'#ffffff',background:'#101010',surface:'#191919'},
 {id:'violet',name:'Violet',accent:'#a78bfa',background:'#100c1c',surface:'#1b152c'},
 {id:'rose',name:'Rose',accent:'#fb5f96',background:'#1a0810',surface:'#26101a'},
 {id:'amber',name:'Amber',accent:'#f5b944',background:'#120d04',surface:'#1c1508'},
 {id:'slate',name:'Slate',accent:'#94a3b8',background:'#0b0e13',surface:'#131820'},
 {id:'coral',name:'Coral',accent:'#ff7a59',background:'#160b08',surface:'#22120d'},
 {id:'aurora',name:'Aurora',accent:'#2dd4bf',background:'#050f14',surface:'#0a1e24'},
];
