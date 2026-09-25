'use client';

import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Check, ChevronDown, Download, FileText, Github, GripVertical, ImagePlus, LayoutTemplate, Linkedin, Monitor, Palette, PanelLeft, Plus, Redo2, Rocket, Save, Sparkles, Trash2, Undo2, Upload, Wand2, X, ExternalLink, Copy, Eye, EyeOff, RefreshCw, Smartphone, Tablet, Zap } from 'lucide-react';
import type { Device, PortfolioConfig, Project, TemplateId, ThemeId } from '@/types/portfolio';
import { demoPortfolio } from '@/lib/demo-data';
import { templates, themes } from '@/lib/templates';
import { techColor } from '@/lib/tech-colors';

// Deploy details are sent to the FolioForge team automatically in the
// background via POST /api/notify (see that route + n8n/deploy-notify.json).
// This is disclosed to users via the privacy note in DeployModal below —
// no external app is opened and no button needs to be clicked.
async function notifyDeploy(name: string, url: string) {
  try {
    const res = await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, url }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

const clone=<T,>(v:T):T=>JSON.parse(JSON.stringify(v));
const uid=()=>typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2);
const SECTION_NAMES:Record<string,string>={experience:'Experience',projects:'Projects',education:'Education',activities:'Activities',skills:'Technical Skills',softSkills:'Soft Skills',languages:'Languages',contact:'Contact'};
const ALL_SECTION_IDS=['experience','projects','education','activities','skills','softSkills','languages','contact'];

export default function Builder(){
 const [portfolio,setPortfolio]=useState<PortfolioConfig>(()=>clone(demoPortfolio));
 const [past,setPast]=useState<PortfolioConfig[]>([]),[future,setFuture]=useState<PortfolioConfig[]>([]);
 const [active,setActive]=useState('design'); const [device,setDevice]=useState<Device>('desktop'); const [deployOpen,setDeployOpen]=useState(false);
 const [status,setStatus]=useState('Ready. Everything is stored locally in this browser.'); const [aiBusy,setAiBusy]=useState(false); const [hydrated,setHydrated]=useState(false);
 const saveTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const theme=themes.find(t=>t.id===portfolio.theme)!;
 // The Paper theme's accent is a near-black ink colour meant for a light portfolio
 // background; reused directly on the dark app chrome it would make primary buttons
 // and the brand mark unreadable, so the chrome falls back to the brand colour.
 const chromeAccent=theme.id==='paper'?'#f97316':theme.accent;
 useEffect(()=>{try{const raw=localStorage.getItem('folioforge:v2');if(raw){const p=JSON.parse(raw);if(p?.version===2)setPortfolio(p)}}catch{}setHydrated(true)},[]);
 useEffect(()=>{if(!hydrated)return; if(saveTimer.current)clearTimeout(saveTimer.current);saveTimer.current=setTimeout(()=>{localStorage.setItem('folioforge:v2',JSON.stringify({...portfolio,meta:{...portfolio.meta,updatedAt:new Date().toISOString()}}));setStatus('Saved locally • no database required.')},350)},[portfolio,hydrated]);
 useEffect(()=>{const fn=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();undo()}else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();redo()}else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();downloadProject()}};window.addEventListener('keydown',fn);return()=>window.removeEventListener('keydown',fn)},[past,future,portfolio]);
 function commit(next:PortfolioConfig|string|((p:PortfolioConfig)=>void)){const cur=clone(portfolio);let n:PortfolioConfig;if(typeof next==='function'){n=clone(cur);next(n)}else if(typeof next==='string'){n=JSON.parse(next)}else{n=clone(next)}setPast(h=>[...h.slice(-39),cur]);setFuture([]);setPortfolio(n)}
 function undo(){if(!past.length)return;const previous=past[past.length-1];setPast(p=>p.slice(0,-1));setFuture(f=>[clone(portfolio),...f.slice(0,39)]);setPortfolio(clone(previous));setStatus('Undo applied.')}
 function redo(){if(!future.length)return;const next=future[0];setFuture(f=>f.slice(1));setPast(p=>[...p.slice(-39),clone(portfolio)]);setPortfolio(clone(next));setStatus('Redo applied.')}
 function updateData(fn:(p:PortfolioConfig)=>void){commit(fn)}
 async function uploadCV(e:ChangeEvent<HTMLInputElement>){const file=e.target.files?.[0];if(!file)return;if(file.size>10*1024*1024){setStatus('CV is larger than 10 MB.');return}setStatus(`Sending ${file.name} to n8n…`);try{const fd=new FormData();fd.append('file',file);const r=await fetch('/api/cv',{method:'POST',body:fd});const j=await r.json();if(!r.ok)throw new Error(j.error||'CV workflow failed');const incoming=j.portfolio??j;commit(p=>{p.data={...p.data,...incoming,personal:{...p.data.personal,...(incoming.personal||{})},social:{...p.data.social,...(incoming.social||{})}};p.meta={...p.meta,source:'cv',cvFileName:file.name}});setStatus('CV imported. Review the extracted fields before publishing.');setActive('content')}catch(err){setStatus(err instanceof Error?err.message:'CV import failed. Check n8n configuration.')}}
 async function aiAction(prompt='Review my portfolio and suggest high-impact improvements without inventing facts.'){setAiBusy(true);setStatus('n8n AI workflow is working…');try{const r=await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'assistant',prompt,portfolio})});const j=await r.json();if(!r.ok)throw new Error(j.error||'AI workflow failed');if(j.portfolio)commit(j.portfolio);setStatus(j.message||'AI result received. Review before accepting changes.')}catch(e){setStatus(e instanceof Error?e.message:'AI workflow unavailable.')}finally{setAiBusy(false)}}
 function reset(){if(confirm('Reset this local portfolio to the demo?')){commit(clone(demoPortfolio));setStatus('Demo portfolio restored.')}}
 function downloadJSON(){downloadBlob(JSON.stringify(portfolio,null,2),'portfolio.json','application/json');setStatus('Portfolio JSON exported.')}
 async function downloadProject(){const html=buildStaticHTML(portfolio);const files={'index.html':html,'README.md':`# ${portfolio.data.personal.name}\n\nGenerated by FolioForge v2.\n\nOpen index.html locally or deploy this folder/ZIP to Vercel Drop.`};const zip=makeZip(files);downloadBlob(zip,`${slug(portfolio.data.personal.name)||'portfolio'}-folioforge.zip`,'application/zip');setStatus('Static portfolio ZIP generated.');}
 const nav=[['design',Palette,'Design'],['content',FileText,'Content'],['sections',PanelLeft,'Sections'],['images',ImagePlus,'Media'],['assistant',Wand2,'AI Assistant'] ] as const;
 return <div className="app" style={{'--accent':chromeAccent} as React.CSSProperties}>
  <header className="topbar glass"><div className="brand"><div className="brandmark">F</div><div><div className="brandtitle">FolioForge</div><div className="brandsub">AI PORTFOLIO STUDIO • V2</div></div></div><div className="top-actions"><button className="btn ghost" onClick={undo} disabled={!past.length} title="Ctrl/Cmd + Z"><Undo2 size={15}/><span>Undo</span></button><button className="btn ghost" onClick={redo} disabled={!future.length} title="Ctrl/Cmd + Y"><Redo2 size={15}/><span>Redo</span></button><button className="btn" onClick={downloadJSON}><Download size={15}/><span>JSON</span></button><button className="btn" onClick={downloadProject}><Download size={15}/><span>ZIP</span></button><button className="btn primary" onClick={()=>setDeployOpen(true)}><Rocket size={15}/><span>Deploy</span></button></div></header>
  <main className="builder">
   <aside className="sidebar"><label className="upload-card"><input type="file" accept=".pdf" onChange={uploadCV}/><div className="upload-row"><div className="iconbox"><Upload size={18}/></div><div><div style={{fontWeight:700,fontSize:12}}>Import CV with n8n</div><div className="tiny">PDF • max 10 MB</div></div></div></label>
    <div className="section-label">Studio</div>{nav.map(([id,Icon,label])=><button key={id} className={`navbtn ${active===id?'active':''}`} onClick={()=>setActive(id)}><Icon size={16}/>{label}{id==='design'&&<span className="tag">{portfolio.template}</span>}</button>)}
    <div className="section-label">Workspace</div><button className="navbtn" onClick={downloadProject}><Download size={16}/>Export website</button><button className="navbtn" onClick={reset}><RefreshCw size={16}/>Reset demo</button>
    <div className="section-label">Status</div><div className="status">{status}</div><div className="tip"><strong>Privacy-first.</strong><br/>No database is used. Your working portfolio stays in this browser. n8n only receives data when you explicitly run a workflow.</div>
    <div className="tip"><strong>Shortcuts</strong><br/><span className="shortcut">Ctrl/⌘ Z</span> undo &nbsp; <span className="shortcut">Ctrl/⌘ Y</span> redo &nbsp; <span className="shortcut">Ctrl/⌘ S</span> export</div>
   </aside>
   <section className="canvas">
    {active==='design'&&<DesignPanel portfolio={portfolio} commit={commit}/>} {active==='content'&&<ContentPanel portfolio={portfolio} update={updateData}/>} {active==='sections'&&<SectionsPanel portfolio={portfolio} update={updateData}/>} {active==='images'&&<ImagesPanel portfolio={portfolio} update={updateData} setStatus={setStatus}/>} {active==='assistant'&&<AssistantPanel busy={aiBusy} onRun={aiAction}/>} 
    <div className="preview-wrap" style={{maxWidth:device==='mobile'?390:device==='tablet'?760:1100}}><PortfolioPreview portfolio={portfolio}/></div>
   </section>
   <aside className="rightbar"><div className="panel"><div className="panelhead"><div><div className="eyebrow">Live canvas</div><h1>Preview</h1></div><div style={{display:'flex',gap:4}}>{([['desktop',Monitor],['tablet',Tablet],['mobile',Smartphone]] as const).map(([d,I])=><button key={d} className={`btn ghost ${device===d?'primary':''}`} onClick={()=>setDevice(d as Device)} title={d}><I size={14}/></button>)}</div></div></div>
    <div className="panel" style={{marginTop:10}}><div className="tiny">Current design</div><div style={{fontWeight:800,marginTop:4}}>{templates.find(t=>t.id===portfolio.template)?.name}</div><div className="tiny" style={{marginTop:3}}>{theme.name} theme</div></div>
    <div className="panel" style={{marginTop:10}}><div className="tiny">Publishing health</div><Checklist label="Profile identity" ok={!!portfolio.data.personal.name}/><Checklist label="Projects" ok={portfolio.data.projects.length>0}/><Checklist label="Experience" ok={portfolio.data.experience.length>0}/><Checklist label="Contact" ok={!!portfolio.data.personal.email}/><Checklist label="Mobile preview" ok/></div>
    <div className="panel" style={{marginTop:10}}><div className="tiny">Local version</div><div style={{fontFamily:'DM Mono',fontSize:11,marginTop:5}}>v2 • no database</div><div className="tiny" style={{marginTop:5}}>Last edit {new Date(portfolio.meta.updatedAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div></div>
    <button className="btn primary" style={{width:'100%',justifyContent:'center',marginTop:10}} onClick={()=>setDeployOpen(true)}><Rocket size={15}/> Deploy to Vercel <ExternalLink size={14}/></button>
   </aside>
  </main>
  {deployOpen&&<DeployModal onClose={()=>setDeployOpen(false)} onExport={downloadProject} defaultName={portfolio.data.personal.name}/>} 
 </div>
}

function DesignPanel({portfolio,commit}:{portfolio:PortfolioConfig;commit:(fn:(p:PortfolioConfig)=>void)=>void}){return <><div className="panel"><div className="panelhead"><div><div className="eyebrow">Design system</div><h1>Choose a layout</h1><p className="sub">Change the visual structure without changing your CV data.</p></div><LayoutTemplate size={22} color="var(--muted-2)"/></div><div className="grid cols3" style={{marginTop:15}}>{templates.map(t=><button key={t.id} className={`design-card ${portfolio.template===t.id?'selected':''}`} onClick={()=>commit(p=>{p.template=t.id})}><div className="mock"><div className="tiny">{t.tag}</div><div className="bar"/><div className="line"/><div className="line" style={{width:'70%'}}/><div className="line" style={{width:'45%'}}/></div><div className="design-name">{t.name}</div><div className="tiny">{t.desc}</div><div className="tiny" style={{marginTop:6}}>Best for: {t.bestFor}</div></button>)}</div></div><div className="panel" style={{marginTop:10}}><div className="eyebrow">Theme</div><h1>Make it yours</h1><div className="grid cols4" style={{marginTop:13}}>{themes.map(t=><button key={t.id} className={`theme-card ${portfolio.theme===t.id?'selected':''}`} onClick={()=>commit(p=>{p.theme=t.id})}><div className="theme-swatch" style={{background:t.background}}><div className="theme-dot" style={{background:t.accent}}/></div><div className="design-name">{t.name}</div><div className="tiny">Accent {t.accent}</div></button>)}</div></div><div className="panel" style={{marginTop:10}}><div className="eyebrow">Design intelligence</div><p className="sub" style={{marginTop:5}}>FolioForge keeps content, layout and theme independent. This means one CV can power many visual identities without re-entering your information.</p></div></>}

function ContentPanel({portfolio,update}:{portfolio:PortfolioConfig;update:(fn:(p:PortfolioConfig)=>void)=>void}){const d=portfolio.data;const set=(path:string,value:string)=>update(p=>{const [a,b]=path.split('.');(p.data as any)[a][b]=value});return <div className="panel"><div className="eyebrow">Content workspace</div><h1>Review and edit your information</h1><p className="sub">AI extraction is never treated as final. Verify important facts before publishing.</p><div className="formgrid" style={{marginTop:15}}><Field label="Name" value={d.personal.name} onChange={v=>set('personal.name',v)}/><Field label="Professional title" value={d.personal.title} onChange={v=>set('personal.title',v)}/><Field label="Location" value={d.personal.location} onChange={v=>set('personal.location',v)}/><Field label="Email" value={d.personal.email} onChange={v=>set('personal.email',v)}/><Field label="Phone" value={d.personal.phone} onChange={v=>set('personal.phone',v)}/><Field label="GitHub" value={d.social.github} onChange={v=>set('social.github',v)}/><Field label="LinkedIn" value={d.social.linkedin} onChange={v=>set('social.linkedin',v)}/><Field label="Website" value={d.social.website} onChange={v=>set('social.website',v)}/><Field full label="About" textarea value={d.personal.about} onChange={v=>set('personal.about',v)}/></div><div style={{marginTop:18}}><EditorList title="Experience" items={d.experience.map(x=>`${x.role} • ${x.company} • ${x.period}`)} onAdd={()=>update(p=>p.data.experience.push({id:uid(),company:'Company',role:'Role',period:'2026 — Present',description:'Describe responsibilities and measurable impact.'}))} onRemove={i=>update(p=>p.data.experience.splice(i,1))}/><EditorList title="Education" items={d.education.map(x=>`${x.degree} • ${x.institution} • ${x.period}`)} onAdd={()=>update(p=>p.data.education.push({id:uid(),institution:'University',degree:'Degree',period:'2022 — 2026'}))} onRemove={i=>update(p=>p.data.education.splice(i,1))}/></div></div>}
function Field({label,value,onChange,textarea,full}:{label:string;value:string;onChange:(v:string)=>void;textarea?:boolean;full?:boolean}){return <div className={`field ${full?'full':''}`}><label>{label}</label>{textarea?<textarea className="textarea" value={value} onChange={e=>onChange(e.target.value)}/>:<input className="input" value={value} onChange={e=>onChange(e.target.value)}/>}</div>}
function EditorList({title,items,onAdd,onRemove}:{title:string;items:string[];onAdd:()=>void;onRemove:(i:number)=>void}){return <div style={{marginTop:14}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><div style={{fontWeight:700,fontSize:13}}>{title}</div><button className="btn" onClick={onAdd}><Plus size={14}/>Add</button></div>{items.map((x,i)=><div key={i} className="section-card" style={{marginTop:7,display:'flex',alignItems:'center',gap:8}}><div style={{flex:1,fontSize:11,color:'#aaa'}}>{x}</div><button className="btn ghost danger" onClick={()=>onRemove(i)}><Trash2 size={13}/></button></div>)}</div>}

function SectionsPanel({portfolio,update}:{portfolio:PortfolioConfig;update:(fn:(p:PortfolioConfig)=>void)=>void}){const [drag,setDrag]=useState<string|null>(null);const sections=portfolio.visibleSections;const rowOrder=[...sections,...ALL_SECTION_IDS.filter(x=>!sections.includes(x))];function move(id:string,to:number){update(p=>{const a=p.visibleSections.filter(x=>x!==id);a.splice(to,0,id);p.visibleSections=a})}return <div className="panel"><div className="eyebrow">Structure</div><h1>Sections & order</h1><p className="sub">Drag to reorder. This is the order they'll appear in on the published portfolio.</p><div style={{marginTop:14}}>{rowOrder.map((id)=>{const visible=sections.includes(id);return <div key={id} draggable onDragStart={()=>setDrag(id)} onDragOver={e=>e.preventDefault()} onDrop={()=>{if(drag){move(drag,Math.max(0,sections.indexOf(id)));setDrag(null)}}} className="section-card" style={{marginTop:8,opacity:visible?1:.55}}><div className="section-row"><GripVertical className="drag-handle" size={16}/><div className="grow"><div style={{fontWeight:700,fontSize:12}}>{SECTION_NAMES[id]}</div><small>{visible?'Visible on portfolio':'Hidden'}</small></div><button className="btn ghost" onClick={()=>update(p=>{if(p.visibleSections.includes(id))p.visibleSections=p.visibleSections.filter(x=>x!==id);else p.visibleSections.push(id)})}>{visible?<Eye size={14}/>:<EyeOff size={14}/>}</button></div></div>})}</div><div className="tip" style={{marginTop:14}}><strong>Tip:</strong> Keep the first screen focused. Your strongest project and clearest professional title should be visible without making visitors hunt for them.</div></div>}

function ImagesPanel({portfolio,update,setStatus}:{portfolio:PortfolioConfig;update:(fn:(p:PortfolioConfig)=>void)=>void;setStatus:(s:string)=>void}){
 const projectInput=useRef<HTMLInputElement>(null), avatarInput=useRef<HTMLInputElement>(null);
 const projects=portfolio.data.projects;
 async function setProjectImage(i:number,file?:File){if(!file)return;if(file.size>8*1024*1024){setStatus('Image exceeds 8 MB.');return}const data=await readFile(file);update(p=>{p.data.projects[i].image=data});setStatus('Project image added locally.')}
 async function setAvatar(file?:File){if(!file)return;if(file.size>8*1024*1024){setStatus('Image exceeds 8 MB.');return}const data=await readFile(file);update(p=>{p.data.personal.avatar=data});setStatus('Profile image added locally.')}
 function openProject(i:number){projectInput.current?.setAttribute('data-index',String(i));projectInput.current?.click()}
 function drop(e:DragEvent<HTMLDivElement>,i:number){e.preventDefault();void setProjectImage(i,e.dataTransfer.files?.[0])}
 return <div className="panel"><div className="eyebrow">Media lab</div><h1>Project images</h1><p className="sub">Images stay local and are embedded into the exported static website.</p><div className="image-grid" style={{marginTop:15}}>{projects.map((p,i)=><div className="image-item" key={p.id}>{p.image?<img src={p.image} alt=""/>:<div className="image-drop" style={{height:150,display:'grid',placeItems:'center'}} onDragOver={e=>e.preventDefault()} onDrop={e=>drop(e,i)} onClick={()=>openProject(i)}><div><ImagePlus size={24} style={{margin:'0 auto 7px'}}/><div style={{fontSize:11}}>Drop or upload image</div></div></div>}<div className="body"><div style={{fontWeight:700,fontSize:12}}>{p.title}</div><div style={{display:'flex',gap:6,marginTop:8}}>{p.image&&<button className="btn ghost" onClick={()=>update(x=>{x.data.projects[i].image=''})}><Trash2 size={13}/>Remove</button>}<button className="btn" onClick={()=>openProject(i)}><Upload size={13}/>Upload</button></div></div></div>)}</div><input ref={projectInput} type="file" accept="image/*" hidden onChange={e=>{const i=Number(e.currentTarget.getAttribute('data-index')||'0');void setProjectImage(i,e.target.files?.[0]);e.currentTarget.value=''}}/><div className="panel" style={{marginTop:12,padding:14}}><div style={{fontWeight:700,fontSize:12}}>Profile photo</div><div style={{display:'flex',alignItems:'center',gap:12,marginTop:10}}>{portfolio.data.personal.avatar?<img className="avatar-preview" src={portfolio.data.personal.avatar} alt=""/>:<div className="avatar-preview" style={{display:'grid',placeItems:'center',background:'#151515'}}><ImagePlus size={20}/></div>}<button className="btn" onClick={()=>avatarInput.current?.click()}><Upload size={13}/>Upload profile image</button></div><input ref={avatarInput} type="file" accept="image/*" hidden onChange={e=>{void setAvatar(e.target.files?.[0]);e.currentTarget.value=''}}/></div></div>}

function AssistantPanel({busy,onRun}:{busy:boolean;onRun:(prompt:string)=>void}){const [prompt,setPrompt]=useState('');const ideas=['Make my About section more concise and professional','Suggest the best template for my profile','Improve project descriptions without inventing facts','Find weak or missing portfolio information','Make the portfolio feel more premium'];return <div className="panel"><div className="panelhead"><div><div className="eyebrow">n8n + AI</div><h1>Portfolio copilot</h1><p className="sub">Describe a change. n8n orchestrates the AI workflow and returns structured portfolio updates.</p></div><div className="iconbox" style={{background:'color-mix(in srgb, var(--intel) 16%, var(--panel2))',borderColor:'color-mix(in srgb, var(--intel) 35%, var(--line-soft))'}}><Zap size={18} color="var(--intel-2)"/></div></div><div className="chat" style={{marginTop:15}}><div className="bubble">I will work only with the information in your portfolio. I won't invent employers, degrees, projects or achievements.</div>{ideas.map(x=><button key={x} className="btn ghost" style={{justifyContent:'flex-start'}} onClick={()=>setPrompt(x)}>{x}</button>)}</div><div style={{display:'flex',gap:8,marginTop:12}}><textarea className="textarea" style={{minHeight:80}} placeholder="Tell the AI what you want…" value={prompt} onChange={e=>setPrompt(e.target.value)}/></div><button className="btn intel" style={{marginTop:8}} disabled={busy||!prompt.trim()} onClick={()=>onRun(prompt.trim())}>{busy?<RefreshCw size={15} className="spin"/>:<Sparkles size={15}/>} {busy?'Running n8n…':'Run workflow'}</button></div>}

function Checklist({label,ok}:{label:string;ok:boolean}){return <div className={`check ${ok?'ok':''}`}><i>{ok?<Check size={11}/>:''}</i>{label}</div>}

function PortfolioPreview({portfolio}:{portfolio:PortfolioConfig}){const d=portfolio.data;return <div className={`portfolio-preview preview-${portfolio.theme} template-${portfolio.template}`}><section className="preview-section"><div className="preview-kicker">{portfolio.template==='terminal'?'$ whoami':'Portfolio / 2026'}</div><div style={{display:'flex',gap:20,alignItems:'flex-start',flexWrap:'wrap'}}>{d.personal.avatar&&<img src={d.personal.avatar} alt="" style={{width:84,height:84,borderRadius:22,objectFit:'cover',border:'1px solid var(--pline)'}}/>}<div><h1 className="preview-title">{d.personal.name}</h1><div className="preview-subtitle">{d.personal.title}</div></div></div><p className="preview-about">{d.personal.about}</p><div className="preview-meta">{d.personal.location&&<span>{d.personal.location}</span>}{d.personal.email&&<span>• {d.personal.email}</span>}{d.personal.phone&&<span>• {d.personal.phone}</span>}</div><div className="preview-pills">{d.social.github&&<span className="preview-pill"><Github size={12}/>GitHub</span>}{d.social.linkedin&&<span className="preview-pill"><Linkedin size={12}/>LinkedIn</span>}{d.social.website&&<span className="preview-pill">Website</span>}</div></section>{portfolio.visibleSections.map((id,i)=><PreviewSection key={id} id={id} index={i+1} d={d}/>)}<footer className="preview-footer">Built with FolioForge • {d.personal.name}</footer></div>}
function PreviewSection({id,index,d}:{id:string;index:number;d:PortfolioConfig['data']}){const num=String(index).padStart(2,'0');switch(id){
 case 'experience':return <section className="preview-section"><div className="preview-kicker">{num} / Experience</div>{d.experience.map(e=><div className="preview-line" key={e.id}><div style={{color:'var(--pacc)',fontFamily:'DM Mono'}}>{e.period}</div><div><h3>{e.role}</h3><div style={{color:'var(--pmuted)',fontSize:13}}>{e.company}</div><p>{e.description}</p></div></div>)}</section>;
 case 'projects':return <section className="preview-section"><div className="preview-kicker">{num} / Selected Projects</div><div className="preview-grid">{d.projects.map(p=><article className="preview-card" key={p.id}>{p.image&&<div className="imgwrap"><img src={p.image} alt=""/></div>}<h3>{p.title}</h3><p>{p.description}</p><div className="preview-pills">{p.technologies.map(t=><TechPill key={t} name={t}/>)}</div></article>)}</div></section>;
 case 'education':return <section className="preview-section"><div className="preview-kicker">{num} / Education</div>{d.education.map(e=><div className="preview-line" key={e.id}><div style={{color:'var(--pacc)',fontFamily:'DM Mono'}}>{e.period}</div><div><h3>{e.degree}</h3><div style={{color:'var(--pmuted)',fontSize:13}}>{e.institution}</div></div></div>)}</section>;
 case 'skills':return <PreviewPills num={num} title="Skills" items={d.skills} tech/>;
 case 'activities':return <PreviewPills num={num} title="Activities" items={d.activities}/>;
 case 'softSkills':return <PreviewPills num={num} title="Soft Skills" items={d.softSkills}/>;
 case 'languages':return <PreviewPills num={num} title="Languages" items={d.languages}/>;
 case 'contact':return <section className="preview-section"><div className="preview-kicker">{num} / Contact</div><h2 style={{fontSize:'clamp(38px,6vw,72px)',letterSpacing:'-.03em',margin:'20px 0',fontFamily:"'Space Grotesk',sans-serif"}}>Let's build something useful.</h2><div className="preview-meta">{d.personal.email}{d.social.linkedin&&<span>• LinkedIn</span>}{d.social.github&&<span>• GitHub</span>}</div></section>;
 default:return null;
}}
function PreviewPills({num,title,items,tech}:{num:string;title:string;items:string[];tech?:boolean}){return <section className="preview-section"><div className="preview-kicker">{num} / {title}</div><div className="preview-pills">{items.map(x=>tech?<TechPill key={x} name={x}/>:<span className="preview-pill" key={x}>{x}</span>)}</div></section>}
function TechPill({name}:{name:string}){const c=techColor(name);return <span className="preview-pill">{c&&<span className="tech-dot" style={{background:c}}/>}{name}</span>}

function DeployModal({onClose,onExport,defaultName}:{onClose:()=>void;onExport:()=>void;defaultName:string}){
 const [name,setName]=useState(defaultName||'');
 const [url,setUrl]=useState('');
 const [sendState,setSendState]=useState<'idle'|'sending'|'sent'|'error'>('idle');
 const ready=name.trim().length>0&&url.trim().length>0;
 useEffect(()=>{
  if(!ready){setSendState('idle');return}
  setSendState('sending');
  const t=setTimeout(async()=>{
   const ok=await notifyDeploy(name.trim(),url.trim());
   setSendState(ok?'sent':'error');
  },800);
  return()=>clearTimeout(t);
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[name,url]);
 return <div className="modalback"><div className="modal"><div className="panelhead"><div><div className="eyebrow">Publishing</div><h1>Deploy without a database</h1><p className="sub">FolioForge generates a self-contained static website. You can deploy it to Vercel without Git or a backend.</p></div><button className="btn ghost" onClick={onClose}><X size={17}/></button></div><div className="deploy-step"><div style={{display:'flex',gap:10}}><div className="stepnum">1</div><div><b style={{fontSize:13}}>Generate your website ZIP</b><div className="tiny" style={{marginTop:4}}>Everything is bundled into index.html plus a README. Images are embedded locally.</div><button className="btn" style={{marginTop:9}} onClick={onExport}><Download size={14}/>Generate ZIP</button></div></div></div><div className="deploy-step"><div style={{display:'flex',gap:10}}><div className="stepnum">2</div><div><b style={{fontSize:13}}>Open Vercel Drop</b><div className="tiny" style={{marginTop:4}}>Open Vercel's browser deployment page and drag your ZIP/folder into it.</div><a className="btn primary" style={{marginTop:9,textDecoration:'none'}} href="https://vercel.com/drop" target="_blank" rel="noreferrer"><Rocket size={14}/>Open Vercel <ExternalLink size={13}/></a></div></div></div><div className="deploy-step"><div style={{display:'flex',gap:10}}><div className="stepnum">3</div><div><b style={{fontSize:13}}>Publish and test</b><div className="tiny" style={{marginTop:4}}>Check the generated URL on desktop and mobile. If you edit the portfolio, generate a new ZIP and redeploy.</div></div></div></div>
  <div className="deploy-step"><div style={{display:'flex',gap:10}}><div className="stepnum">4</div><div style={{flex:1}}><b style={{fontSize:13}}>Register your live link</b><div className="tiny" style={{marginTop:4}}>Enter your name and the deployed URL so the FolioForge team has a record of it. This is shared automatically once both fields are filled in — no extra step needed.</div>
   <div className="formgrid" style={{marginTop:10}}><Field label="Your name" value={name} onChange={setName}/><Field label="Deployment link" value={url} onChange={setUrl}/></div>
   <div className="tiny" style={{marginTop:8,opacity:.75}}>
    {sendState==='sending'&&'Saving…'}
    {sendState==='sent'&&'✓ Saved'}
    {sendState==='error'&&'Could not save — check your connection.'}
   </div>
  </div></div></div>
  <div className="tip" style={{marginTop:12}}><strong>No database:</strong> the published site is static. n8n is only needed when the builder performs AI/CV automations.</div></div></div>}

function readFile(file:File){return new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=reject;r.readAsDataURL(file)})}
function downloadBlob(data:BlobPart,name:string,type?:string){const blob=new Blob([data],{type:type||'application/octet-stream'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
function slug(s:string){return s.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')}
function esc(s:string){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!))}
const PREVIEW_THEME_VARS:Record<ThemeId,{bg:string;text:string;muted:string;line:string;acc:string}> = {
 midnight:{bg:'#090909',text:'#f7f7f7',muted:'#9b9b9b',line:'#272727',acc:'#f97316'},
 paper:{bg:'#f5f1e8',text:'#161616',muted:'#6b675f',line:'#d7d0c4',acc:'#161616'},
 ocean:{bg:'#07111f',text:'#eef7ff',muted:'#8da5b8',line:'#173047',acc:'#38bdf8'},
 forest:{bg:'#07130c',text:'#effcf3',muted:'#8faf99',line:'#1b3825',acc:'#4ade80'},
 sunset:{bg:'#170a12',text:'#fff2f5',muted:'#bda0aa',line:'#3d1e2b',acc:'#fb7185'},
 mono:{bg:'#101010',text:'#f7f7f7',muted:'#999999',line:'#303030',acc:'#ffffff'},
 violet:{bg:'#100c1c',text:'#f7f2ff',muted:'#aaa0bd',line:'#33264c',acc:'#a78bfa'},
 rose:{bg:'#1a0810',text:'#fff0f5',muted:'#c99aac',line:'#3a1826',acc:'#fb5f96'},
 amber:{bg:'#120d04',text:'#fdf6e6',muted:'#b8a97e',line:'#332608',acc:'#f5b944'},
 slate:{bg:'#0b0e13',text:'#eef2f6',muted:'#8b97a6',line:'#232b36',acc:'#94a3b8'},
 coral:{bg:'#160b08',text:'#fff3ee',muted:'#c2a196',line:'#391f17',acc:'#ff7a59'},
 aurora:{bg:'#050f14',text:'#eafffb',muted:'#7fa5a0',line:'#123039',acc:'#2dd4bf'},
};

function svgFavicon(letter:string,accent:string,bg:string){const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${accent}"/><text x="32" y="43" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="${bg}" text-anchor="middle">${letter}</text></svg>`;return `data:image/svg+xml,${encodeURIComponent(svg)}`}

function techPill(name:string){const c=techColor(name);return `<span class="pill">${c?`<span class="tdot" style="background:${c}"></span>`:''}${esc(name)}</span>`}
function pillSection(num:string,title:string,id:string,items:string[],tech?:boolean){return `<section class="sec" id="${id}" data-reveal><div class="kicker">${num} / ${esc(title)}</div><div class="pills">${items.map(x=>tech?techPill(x):`<span class="pill">${esc(x)}</span>`).join('')}</div></section>`}

function sectionHTML(id:string,index:number,d:PortfolioConfig['data']):string{const num=String(index).padStart(2,'0');switch(id){
 case 'experience':return `<section class="sec" id="experience" data-reveal><div class="kicker">${num} / Experience</div>${d.experience.map(e=>`<div class="line"><div class="date">${esc(e.period)}</div><div><h3>${esc(e.role)}</h3><div class="muted">${esc(e.company)}</div><p>${esc(e.description)}</p></div></div>`).join('')}</section>`;
 case 'projects':return `<section class="sec" id="projects" data-reveal><div class="kicker">${num} / Selected Projects</div><div class="grid">${d.projects.map(x=>`<article class="card">${x.image?`<div class="imgwrap"><img src="${x.image}" alt="${esc(x.title)} preview" loading="lazy"></div>`:''}<h3>${esc(x.title)}</h3><p>${esc(x.description)}</p><div class="pills">${x.technologies.map(t=>techPill(t)).join('')}</div>${(x.github||x.live)?`<div class="pill-links">${x.live?`<a href="${esc(x.live)}" target="_blank" rel="noreferrer">Live site</a>`:''}${x.github?`<a href="${esc(x.github)}" target="_blank" rel="noreferrer">Source</a>`:''}</div>`:''}</article>`).join('')}</div></section>`;
 case 'education':return `<section class="sec" id="education" data-reveal>${'<div class="kicker">'+num+' / Education</div>'}${d.education.map(e=>`<div class="line"><div class="date">${esc(e.period)}</div><div><h3>${esc(e.degree)}</h3><div class="muted">${esc(e.institution)}</div></div></div>`).join('')}</section>`;
 case 'skills':return pillSection(num,'Skills','skills',d.skills,true);
 case 'activities':return pillSection(num,'Activities','activities',d.activities);
 case 'softSkills':return pillSection(num,'Soft Skills','soft-skills',d.softSkills);
 case 'languages':return pillSection(num,'Languages','languages',d.languages);
 case 'contact':return `<section class="sec" id="contact" data-reveal><div class="kicker">${num} / Contact</div><h2 class="cta">Let's build something useful.</h2><div class="meta">${[d.personal.email?`<a href="mailto:${esc(d.personal.email)}">${esc(d.personal.email)}</a>`:'',d.social.linkedin?`<a href="${esc(d.social.linkedin)}" target="_blank" rel="noreferrer">LinkedIn</a>`:'',d.social.github?`<a href="${esc(d.social.github)}" target="_blank" rel="noreferrer">GitHub</a>`:''].filter(Boolean).join(' • ')}</div></section>`;
 default:return '';
}}

function staticPortfolioCSS(template:TemplateId,tv:{bg:string;text:string;muted:string;line:string;acc:string}){
 const headingFont=template==='terminal'?`'DM Mono',monospace`:template==='editorial'?`Georgia,'Times New Roman',serif`:`'Space Grotesk',Inter,sans-serif`;
 const titleSize=template==='creative'?'clamp(52px,10vw,140px)':template==='academic'?'clamp(38px,6vw,76px)':'clamp(42px,8vw,100px)';
 const sectionPadY=template==='minimal'?'52px':'72px';
 const sectionPadX=template==='editorial'?'10%':'8%';
 const sectionBorder=template==='terminal'?'dashed':'solid';
 const gridCols=template==='bento'?'repeat(3,minmax(0,1fr))':'repeat(2,minmax(0,1fr))';
 const firstCardSpan=template==='bento'?'grid-column:span 2;':'';
 const extra=(()=>{switch(template){
  case 'brutalist':return `.card{border-width:3px;border-radius:4px;box-shadow:7px 7px 0 ${tv.acc};transition:transform .15s var(--ease,ease),box-shadow .15s var(--ease,ease)}.card:hover{transform:translate(-3px,-3px);box-shadow:10px 10px 0 ${tv.acc}}.pill{border-radius:4px;border-width:2px}h1{font-weight:800}`;
  case 'glass':return `.card{background:color-mix(in srgb, ${tv.bg} 50%, transparent);backdrop-filter:blur(14px) saturate(160%);border-color:color-mix(in srgb, ${tv.text} 14%, transparent)}.pill{background:color-mix(in srgb, ${tv.bg} 40%, transparent);backdrop-filter:blur(8px)}.hero{background:radial-gradient(ellipse 700px 320px at 18% 0%, color-mix(in srgb, ${tv.acc} 12%, transparent), transparent 70%)}`;
  case 'neon':return `h1{text-shadow:0 0 26px color-mix(in srgb, ${tv.acc} 65%, transparent)}.card{border-color:color-mix(in srgb, ${tv.acc} 50%, ${tv.line});box-shadow:0 0 0 1px color-mix(in srgb, ${tv.acc} 25%, transparent), 0 0 26px -6px color-mix(in srgb, ${tv.acc} 55%, transparent);transition:box-shadow .2s var(--ease,ease)}.card:hover{box-shadow:0 0 0 1px color-mix(in srgb, ${tv.acc} 70%, transparent), 0 0 36px -4px color-mix(in srgb, ${tv.acc} 80%, transparent)}.pill{border-color:color-mix(in srgb, ${tv.acc} 55%, ${tv.line});color:${tv.acc}}`;
  case 'timeline':return `.line{grid-template-columns:1fr;position:relative;padding-left:28px}.line::before{content:'';position:absolute;left:5px;top:28px;bottom:-22px;width:1px;background:${tv.line}}.line::after{content:'';position:absolute;left:1px;top:28px;width:9px;height:9px;border-radius:50%;background:${tv.acc}}.line:last-child::before{display:none}`;
  default:return '';
 }})();
 return `
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:${tv.bg};color:${tv.text};font:16px/1.6 Inter,system-ui,sans-serif}
a{color:inherit}
.skip{position:absolute;left:-999px;top:auto}
.skip:focus{left:16px;top:16px;background:${tv.acc};color:${tv.bg};padding:8px 12px;border-radius:8px;z-index:999}
main,.foot{max-width:1120px;margin:0 auto}
.nav{position:sticky;top:0;z-index:10;display:flex;align-items:center;gap:18px;padding:16px 8%;background:color-mix(in srgb, ${tv.bg} 82%, transparent);backdrop-filter:blur(10px);border-bottom:1px solid ${tv.line}}
.nav .mark{width:30px;height:30px;border-radius:8px;background:${tv.acc};color:${tv.bg};display:grid;place-items:center;font-family:${headingFont};font-weight:700;text-decoration:none;flex:none}
.nav nav{display:flex;gap:16px;flex-wrap:wrap;font-size:13px}
.nav nav a{color:${tv.muted};text-decoration:none}
.nav nav a:hover{color:${tv.text}}
.nav .navcta{margin-left:auto;font-size:13px;color:${tv.acc};text-decoration:none;border:1px solid ${tv.line};padding:6px 12px;border-radius:999px;flex:none}
.sec,.hero{padding:${sectionPadY} ${sectionPadX};border-bottom:1px ${sectionBorder} ${tv.line}}
.kicker{font:500 11px 'DM Mono',monospace;color:${tv.acc};letter-spacing:.1em}
.heroTop{display:flex;gap:20px;align-items:flex-start;flex-wrap:wrap;margin-top:18px}
.avatar{width:84px;height:84px;border-radius:22px;object-fit:cover;border:1px solid ${tv.line}}
h1{font:700 ${titleSize} ${headingFont};line-height:.92;letter-spacing:-.03em;margin:0 0 6px}
.subtitle{font-size:clamp(18px,3vw,28px);color:${tv.muted}}
.about{color:${tv.muted};max-width:680px;line-height:1.75;margin-top:22px;font-size:15.5px}
.meta{color:${tv.muted};font-size:13px;margin-top:22px}
.meta a{color:inherit;text-decoration:none;border-bottom:1px solid ${tv.line}}
.pills{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}
.pill{display:inline-flex;align-items:center;border:1px solid ${tv.line};border-radius:999px;padding:7px 11px;color:${tv.muted};font-size:12px;transition:transform .15s ease,border-color .15s ease}
.pill:hover{transform:translateY(-2px);border-color:color-mix(in srgb, ${tv.acc} 45%, ${tv.line})}
.tdot{width:7px;height:7px;border-radius:50%;margin-right:6px;flex:none}
.grid{display:grid;grid-template-columns:${gridCols};gap:16px;margin-top:24px}
.card{border:1px solid ${tv.line};border-radius:16px;padding:20px;background:color-mix(in srgb, ${tv.bg} 85%, ${tv.text} 4%);transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease}
.card:hover{transform:translateY(-4px);border-color:color-mix(in srgb, ${tv.acc} 40%, ${tv.line});box-shadow:0 18px 34px -18px rgba(0,0,0,.45)}
.card:first-child{${firstCardSpan}}
.card .imgwrap{overflow:hidden;border-radius:11px;margin-bottom:14px}
.card img{width:100%;height:180px;object-fit:cover;display:block;transition:transform .35s ease}
.card:hover img{transform:scale(1.06)}
.card h3{margin:0 0 8px;font:600 19px ${headingFont}}
.card p{color:${tv.muted};line-height:1.6;font-size:13px;margin:0 0 10px}
.pill-links{display:flex;gap:14px;font-size:12px;margin-top:2px}
.pill-links a{color:${tv.acc};text-decoration:none;transition:opacity .15s ease}
.pill-links a:hover{opacity:.7}
.line{display:grid;grid-template-columns:150px 1fr;gap:25px;padding:22px 0;border-bottom:1px solid ${tv.line}}
.line:last-child{border-bottom:0}
.line .date{color:${tv.acc};font-family:'DM Mono',monospace;font-size:13px}
.line h3{margin:0;font:600 21px ${headingFont}}
.line .muted{color:${tv.muted};font-size:13px;margin-top:2px}
.line p{color:${tv.muted};line-height:1.65;font-size:13px;margin-top:8px}
.cta{font:700 clamp(34px,6vw,64px) ${headingFont};letter-spacing:-.02em;margin:18px 0}
.foot{padding:34px 8%;color:${tv.muted};font-size:11px}
.nav .mark{transition:transform .2s ease}
.nav .mark:hover{transform:rotate(-8deg) scale(1.08)}
[data-reveal]{opacity:0;transform:translateY(26px);transition:opacity .7s cubic-bezier(.2,.7,.2,1),transform .7s cubic-bezier(.2,.7,.2,1)}
[data-reveal].in{opacity:1;transform:none}
@media (prefers-reduced-motion: no-preference){
 .hero h1,.hero .subtitle,.hero .about{animation:rise .6s cubic-bezier(.2,.7,.2,1) both}
 .hero .subtitle{animation-delay:.08s}
 .hero .about{animation-delay:.16s}
 @keyframes rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
}
@media (prefers-reduced-motion: reduce){
 [data-reveal]{opacity:1;transform:none;transition:none}
}
${extra}
@media(max-width:700px){
 .sec,.hero{padding:48px 7%}
 .grid{grid-template-columns:1fr}
 .card:first-child{grid-column:auto}
 .line{grid-template-columns:1fr;gap:6px}
 .nav{padding:14px 6%}
 .nav nav{display:none}
}`;
}

function buildStaticHTML(p:PortfolioConfig){
 const d=p.data;
 const tv=PREVIEW_THEME_VARS[p.theme];
 const name=d.personal.name||'Portfolio';
 const roleTitle=d.personal.title||'';
 const pageTitle=roleTitle?`${name} — ${roleTitle}`:name;
 const description=esc((d.personal.about||pageTitle).replace(/\s+/g,' ').trim().slice(0,155));
 const initial=esc((name.trim().charAt(0)||'F').toUpperCase());
 const favicon=svgFavicon(initial,tv.acc,tv.bg);
 const navLinks=p.visibleSections.filter(id=>id!=='contact').map(id=>`<a href="#${id==='softSkills'?'soft-skills':id}">${esc(SECTION_NAMES[id]||id)}</a>`).join('');
 const sectionsHTML=p.visibleSections.map((id,i)=>sectionHTML(id,i+1,d)).join('');
 const metaLine=[d.personal.location,d.personal.email,d.personal.phone].filter(Boolean).map(esc).join(' • ');
 const socials=[d.social.github?`<a class="pill" href="${esc(d.social.github)}" target="_blank" rel="noreferrer">GitHub</a>`:'',d.social.linkedin?`<a class="pill" href="${esc(d.social.linkedin)}" target="_blank" rel="noreferrer">LinkedIn</a>`:'',d.social.website?`<a class="pill" href="${esc(d.social.website)}" target="_blank" rel="noreferrer">Website</a>`:''].filter(Boolean).join('');
 return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(pageTitle)}</title>
<meta name="description" content="${description}">
<meta property="og:title" content="${esc(pageTitle)}">
<meta property="og:description" content="${description}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="${tv.bg}">
<link rel="icon" href="${favicon}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
<style>${staticPortfolioCSS(p.template,tv)}</style>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="nav"><a class="mark" href="#top" aria-label="Back to top">${initial}</a><nav>${navLinks}</nav>${d.personal.email?`<a class="navcta" href="#contact">Contact</a>`:''}</header>
<main id="main">
<section class="hero" id="top"><div class="kicker">${p.template==='terminal'?'$ whoami':'Portfolio / 2026'}</div><div class="heroTop">${d.personal.avatar?`<img class="avatar" src="${d.personal.avatar}" alt="${esc(name)}">`:''}<div><h1>${esc(name)}</h1><div class="subtitle">${esc(roleTitle)}</div></div></div>${d.personal.about?`<p class="about">${esc(d.personal.about)}</p>`:''}${metaLine?`<div class="meta">${metaLine}</div>`:''}${socials?`<div class="pills">${socials}</div>`:''}</section>
${sectionsHTML}
</main>
<footer class="foot">Built with FolioForge • ${esc(name)} • ${new Date().getFullYear()}</footer>
<script>(function(){
if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
var els=document.querySelectorAll('[data-reveal]');
if(!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('in')});return}
var io=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.add('in');io.unobserve(entry.target)}})},{threshold:.12,rootMargin:'0px 0px -8% 0px'});
els.forEach(function(e){io.observe(e)});
})();</script>
</body>
</html>`;
}

// Small dependency-free ZIP writer. Files are stored (no compression), which keeps the exporter reliable in the browser.
function crc32(data:Uint8Array){let c=0xffffffff;for(const b of data){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0)}return (c^0xffffffff)>>>0}
function u32(n:number){return new Uint8Array([n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255])}
function u16(n:number){return new Uint8Array([n&255,(n>>>8)&255])}
function concatBytes(parts:Uint8Array[]){const len=parts.reduce((n,p)=>n+p.length,0);const out=new Uint8Array(len);let o=0;for(const p of parts){out.set(p,o);o+=p.length}return out}
function makeZip(files:Record<string,string>){const enc=new TextEncoder(),parts:Uint8Array[]=[];const central:Uint8Array[]=[];let offset=0;for(const [name,text] of Object.entries(files)){const nb=enc.encode(name),db=enc.encode(text),crc=crc32(db);const local=concatBytes([u32(0x04034b50),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(db.length),u32(db.length),u16(nb.length),u16(0),nb,db]);parts.push(local);const cd=concatBytes([u32(0x02014b50),u16(20),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(db.length),u32(db.length),u16(nb.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),nb]);central.push(cd);offset+=local.length}const cstart=offset;const cdata=concatBytes(central);const end=concatBytes([u32(0x06054b50),u16(0),u16(0),u16(central.length),u16(central.length),u32(cdata.length),u32(cstart),u16(0)]);return concatBytes([...parts, cdata, end])}
