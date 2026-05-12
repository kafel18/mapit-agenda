import { useState, useEffect } from “react”;
import { initializeApp } from “firebase/app”;
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch } from “firebase/firestore”;

const firebaseConfig = {
apiKey: “AIzaSyAvrA9PcQ3mNZ61ybVH6InSF0JCzJL3uIc”,
authDomain: “agenda-mapit-b0a03.firebaseapp.com”,
projectId: “agenda-mapit-b0a03”,
storageBucket: “agenda-mapit-b0a03.firebasestorage.app”,
messagingSenderId: “608992104710”,
appId: “1:608992104710:web:075e3eb6e4a3da83de0e87”
};
const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp);

import LOGO_SRC from “./logo.js”;

const C = {
navy:”#2B3990”, green:”#1A7A4A”, orange:”#F47920”,
bg:”#FFFFFF”, bgSoft:”#F5F6FA”, border:”#DDE1EE”,
text:”#1a2340”, muted:”#7A8499”, light:”#ECEEF6”,
};
const INIT_EMPLOYEES = [
{ id:“emp1”, name:“כרמל לוי”,  color:C.navy,   initials:“כל” },
{ id:“emp2”, name:“יואב כהן”,  color:C.green,  initials:“יכ” },
{ id:“emp3”, name:“מיכל דוד”,  color:C.orange, initials:“מד” },
];
const HOURS=[“07:00”,“08:00”,“09:00”,“10:00”,“11:00”,“12:00”,“13:00”,“14:00”,“15:00”,“16:00”,“17:00”,“18:00”,“19:00”];
const DAYS_HE=[“ראשון”,“שני”,“שלישי”,“רביעי”,“חמישי”,“שישי”];
const MONTHS_HE=[“ינו”,“פבר”,“מרץ”,“אפר”,“מאי”,“יונ”,“יול”,“אוג”,“ספט”,“אוק”,“נוב”,“דצמ”];
const SERVICES=[“רק קירות”,“קירות, גבהים ופתחים”,“חשמל ואינסטלציה”];
const EMP_COLORS=[C.navy,C.green,C.orange,”#8B5CF6”,”#0891B2”,”#DC2626”,”#059669”,”#D97706”];

function todayStr(){return new Date().toISOString().slice(0,10);}
function getWeekDates(base){
const d=new Date(base),sun=new Date(d);
sun.setDate(d.getDate()-d.getDay());
const r=[];
for(let i=0;i<7;i++){const dd=new Date(sun);dd.setDate(sun.getDate()+i);if(dd.getDay()!==6)r.push(dd.toISOString().slice(0,10));}
return r;
}
function fmtDate(str){const d=new Date(str+“T00:00:00”);return `${d.getDate()} ${MONTHS_HE[d.getMonth()]}`;}
function getDayHe(str){return DAYS_HE[new Date(str+“T00:00:00”).getDay()];}
function addH(hour,n){return `${String(parseInt(hour)+n).padStart(2,"0")}:00`;}
function hIdx(h){return HOURS.indexOf(h);}

function useIsMobile(){
const [mob,setMob]=useState(window.innerWidth<768);
useEffect(()=>{const h=()=>setMob(window.innerWidth<768);window.addEventListener(“resize”,h);return()=>window.removeEventListener(“resize”,h);},[]);
return mob;
}

function Avatar({emp,size=36}){
return <div style={{width:size,height:size,borderRadius:“50%”,background:emp.color+“18”,border:`2px solid ${emp.color}`,display:“flex”,alignItems:“center”,justifyContent:“center”,color:emp.color,fontSize:size*0.35,fontWeight:800,flexShrink:0,fontFamily:”‘Heebo’,sans-serif”}}>{emp.initials}</div>;
}
function Toast({msg,onDone}){
useEffect(()=>{const t=setTimeout(onDone,3500);return()=>clearTimeout(t);},[]);
return <div onClick={onDone} style={{position:“fixed”,bottom:80,left:“50%”,transform:“translateX(-50%)”,zIndex:9999,background:C.green,color:”#fff”,fontFamily:”‘Heebo’,sans-serif”,fontWeight:700,fontSize:14,padding:“13px 26px”,borderRadius:12,cursor:“pointer”,boxShadow:`0 6px 24px ${C.green}55`,animation:“slideUp .3s ease”,maxWidth:“88vw”,lineHeight:1.5,direction:“rtl”,textAlign:“center”,whiteSpace:“nowrap”}}>{msg}</div>;
}
function Spinner(){
return <div style={{display:“flex”,alignItems:“center”,justifyContent:“center”,height:“100vh”,flexDirection:“column”,gap:16,fontFamily:”‘Heebo’,sans-serif”,color:C.muted}}>
<div style={{width:36,height:36,border:`3px solid ${C.border}`,borderTop:`3px solid ${C.navy}`,borderRadius:“50%”,animation:“spin 0.8s linear infinite”}}/>
<span style={{fontSize:14}}>טוען…</span>

  </div>;
}
const iStyle=(x={})=>({background:C.bgSoft,border:`1.5px solid ${C.border}`,borderRadius:8,color:C.text,padding:"10px 14px",width:"100%",fontFamily:"'Heebo',sans-serif",fontSize:14,direction:"rtl",outline:"none",...x});
const btn=(bg=C.green,col="#fff",x={})=>({background:bg,border:"none",borderRadius:8,cursor:"pointer",color:col,fontFamily:"'Heebo',sans-serif",fontWeight:700,fontSize:13,padding:"9px 14px",transition:"opacity .15s",...x});

// ── Visit Popup ──────────────────────────────────────────────
function VisitPopup({visit,emp,onClose,onCancel}){
return(
<div style={{position:“fixed”,inset:0,background:”#00000060”,zIndex:3000,display:“flex”,alignItems:“center”,justifyContent:“center”,padding:16}} onClick={onClose}>
<div onClick={e=>e.stopPropagation()} dir=“rtl” style={{background:C.bg,borderRadius:18,padding:24,width:“100%”,maxWidth:380,boxShadow:“0 20px 60px #0004”,fontFamily:”‘Heebo’,sans-serif”,animation:“slideUp .25s ease”,maxHeight:“90vh”,overflowY:“auto”}}>
<div style={{display:“flex”,alignItems:“center”,gap:12,marginBottom:18}}>
<Avatar emp={emp} size={42}/>
<div style={{flex:1}}><div style={{fontSize:16,fontWeight:800,color:C.text}}>{visit.contactName}</div><div style={{fontSize:12,color:C.muted}}>{emp.name}</div></div>
<button onClick={onClose} style={{background:“transparent”,border:“none”,cursor:“pointer”,color:C.muted,fontSize:22,lineHeight:1,padding:2}}>✕</button>
</div>
<div style={{display:“flex”,flexDirection:“column”,gap:8}}>
{[
[“📅 תאריך”,`${getDayHe(visit.date)} ${fmtDate(visit.date)}`],
[“🕐 התחלה”,visit.hour],
[“🕕 סיום”,addH(visit.hour,visit.duration)],
[“⏱ משך”,`${visit.duration} שע'`],
[“🔧 שירות”,visit.service],
visit.city&&[“🏙 עיר”,visit.city],
visit.address&&[“📍 כתובת”,visit.address],
[“👤 איש קשר”,visit.contactName],
visit.phone&&[“📞 טלפון”,visit.phone],
visit.note&&[“📝 הערות”,visit.note],
].filter(Boolean).map(([l,v])=>(
<div key={l} style={{display:“flex”,gap:10,alignItems:“flex-start”,padding:“8px 10px”,background:C.bgSoft,borderRadius:8}}>
<span style={{fontSize:12,color:C.muted,minWidth:84,flexShrink:0}}>{l}</span>
<span style={{fontSize:13,fontWeight:600,color:C.text,wordBreak:“break-word”}}>{v}</span>
</div>
))}
</div>
<button onClick={()=>{onCancel(visit.id);onClose();}} style={{marginTop:18,width:“100%”,background:”#FEE2E2”,border:“none”,borderRadius:9,color:”#DC2626”,fontFamily:”‘Heebo’,sans-serif”,fontWeight:700,fontSize:14,padding:“12px”,cursor:“pointer”}}>🗑 בטל ביקור</button>
</div>
</div>
);
}

// ── Booking Modal ────────────────────────────────────────────
function BookingModal({slot,employees,isAvailable,isBooked,onConfirm,onClose}){
const emp=employees.find(e=>e.id===slot.empId);
const [form,setForm]=useState({contactName:””,phone:””,city:””,address:””,note:””,service:“רק קירות”,duration:1});
const [err,setErr]=useState(””);
function handleConfirm(){
if(!form.contactName.trim()){setErr(“נא למלא שם איש קשר”);return;}
if(!form.city.trim()){setErr(“נא למלא עיר”);return;}
if(!form.address.trim()){setErr(“נא למלא כתובת”);return;}
setErr(””);onConfirm({…slot,…form,client:form.contactName});
}
return(
<div style={{position:“fixed”,inset:0,background:”#00000060”,zIndex:2000,display:“flex”,alignItems:“flex-end”,justifyContent:“center”}} onClick={onClose}>
<div onClick={e=>e.stopPropagation()} dir=“rtl” style={{background:C.bg,borderRadius:“18px 18px 0 0”,padding:22,width:“100%”,maxWidth:480,boxShadow:“0 -8px 40px #0003”,fontFamily:”‘Heebo’,sans-serif”,animation:“slideUp .3s ease”,maxHeight:“92vh”,overflowY:“auto”}}>
<div style={{width:40,height:4,background:C.border,borderRadius:2,margin:“0 auto 16px”}}/>
<div style={{display:“flex”,alignItems:“center”,gap:12,marginBottom:16}}>
<Avatar emp={emp} size={40}/>
<div style={{flex:1}}><div style={{fontSize:15,fontWeight:800,color:C.text}}>קביעת ביקור</div><div style={{fontSize:11,color:C.muted}}>{emp.name} · {getDayHe(slot.date)} {fmtDate(slot.date)} · {slot.hour}</div></div>
<button onClick={onClose} style={{background:“transparent”,border:“none”,cursor:“pointer”,color:C.muted,fontSize:22}}>✕</button>
</div>
<div style={{display:“flex”,flexDirection:“column”,gap:11}}>
<div>
<label style={{fontSize:12,color:C.muted,display:“block”,marginBottom:5,fontWeight:600}}>🔧 שירות</label>
<div style={{display:“flex”,flexDirection:“column”,gap:6}}>
{SERVICES.map(s=>(
<label key={s} style={{display:“flex”,alignItems:“center”,gap:10,cursor:“pointer”,padding:“9px 14px”,borderRadius:9,border:`1.5px solid ${form.service===s?emp.color:C.border}`,background:form.service===s?emp.color+“10”:C.bgSoft,transition:“all .15s”}}>
<input type=“radio” name=“service” value={s} checked={form.service===s} onChange={()=>setForm(p=>({…p,service:s}))} style={{accentColor:emp.color,width:16,height:16}}/>
<span style={{fontSize:14,fontWeight:form.service===s?700:400,color:form.service===s?emp.color:C.text}}>{s}</span>
</label>
))}
</div>
</div>
<div>
<label style={{fontSize:12,color:C.muted,display:“block”,marginBottom:5,fontWeight:600}}>⏱ משך · {slot.hour} – {addH(slot.hour,form.duration)}</label>
<div style={{display:“flex”,gap:7,flexWrap:“wrap”}}>
{[1,2,3,4,5].map(n=>{
let ok=true;
if(n>1){for(let i=1;i<n;i++){const h=addH(slot.hour,i);if(!isAvailable(slot.empId,slot.date,h)||isBooked(slot.empId,slot.date,h)){ok=false;break;}}}
if(!HOURS.includes(addH(slot.hour,n))&&n>1)ok=false;
return(<button key={n} disabled={!ok} onClick={()=>ok&&setForm(p=>({…p,duration:n}))} style={{padding:“8px 14px”,borderRadius:8,fontSize:13,fontWeight:700,cursor:ok?“pointer”:“not-allowed”,background:form.duration===n?emp.color:ok?C.bgSoft:”#f0f0f0”,color:form.duration===n?”#fff”:ok?C.text:C.muted,border:`1.5px solid ${form.duration===n?emp.color:ok?C.border:"#e0e0e0"}`,opacity:ok?1:0.4}}>{n}h</button>);
})}
</div>
</div>
<div><label style={{fontSize:12,color:C.muted,display:“block”,marginBottom:4,fontWeight:600}}>👤 שם איש קשר *</label><input placeholder=“שם מלא” value={form.contactName} onChange={e=>setForm(p=>({…p,contactName:e.target.value}))} style={iStyle()}/></div>
<div><label style={{fontSize:12,color:C.muted,display:“block”,marginBottom:4,fontWeight:600}}>📞 טלפון</label><input placeholder=“מספר טלפון” value={form.phone} type=“tel” onChange={e=>setForm(p=>({…p,phone:e.target.value}))} style={iStyle()}/></div>
<div><label style={{fontSize:12,color:C.muted,display:“block”,marginBottom:4,fontWeight:600}}>🏙 עיר *</label><input placeholder=“שם העיר” value={form.city} onChange={e=>setForm(p=>({…p,city:e.target.value}))} style={iStyle()}/></div>
<div><label style={{fontSize:12,color:C.muted,display:“block”,marginBottom:4,fontWeight:600}}>📍 כתובת *</label><input placeholder=“רחוב ומספר” value={form.address} onChange={e=>setForm(p=>({…p,address:e.target.value}))} style={iStyle()}/></div>
<div><label style={{fontSize:12,color:C.muted,display:“block”,marginBottom:4,fontWeight:600}}>📝 הערות</label><input placeholder=“הערות (אופציונלי)” value={form.note} onChange={e=>setForm(p=>({…p,note:e.target.value}))} style={iStyle()}/></div>
{err&&<div style={{color:”#DC2626”,fontSize:13,fontWeight:600,textAlign:“center”}}>{err}</div>}
</div>
<div style={{display:“flex”,gap:10,marginTop:16}}>
<button onClick={handleConfirm} style={{flex:1,background:C.green,border:“none”,borderRadius:9,color:”#fff”,fontFamily:”‘Heebo’,sans-serif”,fontWeight:700,fontSize:15,padding:“13px”,cursor:“pointer”}}>✓ אשר ביקור</button>
<button onClick={onClose} style={{background:C.light,border:“none”,borderRadius:9,color:C.navy,fontFamily:”‘Heebo’,sans-serif”,fontWeight:700,fontSize:14,padding:“13px 16px”,cursor:“pointer”}}>ביטול</button>
</div>
</div>
</div>
);
}

// ── Employee Modal ───────────────────────────────────────────
function EmpModal({emp,onSave,onDelete,onClose}){
const isNew=!emp.id;
const [form,setForm]=useState({name:emp.name||””,color:emp.color||C.navy});
const [confirmDelete,setConfirmDelete]=useState(false);
const hb=”‘Heebo’,sans-serif”;
function handleSave(){
if(!form.name.trim())return;
const parts=form.name.trim().split(” “);
const initials=(parts[0][0]+(parts[1]?.[0]||””)).slice(0,2);
onSave({…emp,name:form.name.trim(),color:form.color,initials});
}
if(confirmDelete){
return(
<div style={{position:“fixed”,inset:0,background:”#00000060”,zIndex:4000,display:“flex”,alignItems:“center”,justifyContent:“center”,padding:16}} onClick={()=>setConfirmDelete(false)}>
<div onClick={e=>e.stopPropagation()} dir=“rtl” style={{background:C.bg,borderRadius:18,padding:28,width:“100%”,maxWidth:320,boxShadow:“0 20px 60px #0003”,fontFamily:hb,animation:“slideUp .2s ease”,textAlign:“center”}}>
<div style={{fontSize:40,marginBottom:12}}>🗑️</div>
<div style={{fontSize:16,fontWeight:800,color:C.text,marginBottom:8}}>מחיקת עובד</div>
<div style={{fontSize:14,color:C.muted,marginBottom:24,lineHeight:1.6}}>האם למחוק את <strong style={{color:C.text}}>{emp.name}</strong>?<br/><span style={{fontSize:12}}>כל הביקורים והזמינות שלו יימחקו.</span></div>
<div style={{display:“flex”,gap:10}}>
<button onClick={()=>onDelete(emp.id)} style={{flex:1,background:”#DC2626”,border:“none”,borderRadius:9,color:”#fff”,fontFamily:hb,fontWeight:700,fontSize:14,padding:“13px”,cursor:“pointer”}}>כן, מחק</button>
<button onClick={()=>setConfirmDelete(false)} style={{flex:1,background:C.light,border:“none”,borderRadius:9,color:C.navy,fontFamily:hb,fontWeight:700,fontSize:14,padding:“13px”,cursor:“pointer”}}>ביטול</button>
</div>
</div>
</div>
);
}
return(
<div style={{position:“fixed”,inset:0,background:”#00000060”,zIndex:4000,display:“flex”,alignItems:“flex-end”,justifyContent:“center”}} onClick={onClose}>
<div onClick={e=>e.stopPropagation()} dir=“rtl” style={{background:C.bg,borderRadius:“18px 18px 0 0”,padding:24,width:“100%”,maxWidth:480,boxShadow:“0 -8px 40px #0003”,fontFamily:hb,animation:“slideUp .25s ease”}}>
<div style={{width:40,height:4,background:C.border,borderRadius:2,margin:“0 auto 16px”}}/>
<div style={{display:“flex”,alignItems:“center”,gap:12,marginBottom:20}}>
<div style={{width:48,height:48,borderRadius:“50%”,background:form.color+“18”,border:`2px solid ${form.color}`,display:“flex”,alignItems:“center”,justifyContent:“center”,color:form.color,fontSize:20,fontWeight:800,fontFamily:hb,flexShrink:0}}>{form.name[0]||”?”}</div>
<div style={{flex:1,fontSize:16,fontWeight:800,color:C.text}}>{isNew?“עובד חדש”:“עריכת עובד”}</div>
<button onClick={onClose} style={{background:“transparent”,border:“none”,cursor:“pointer”,color:C.muted,fontSize:22,lineHeight:1}}>✕</button>
</div>
<div style={{display:“flex”,flexDirection:“column”,gap:14}}>
<div><label style={{fontSize:12,color:C.muted,display:“block”,marginBottom:4,fontWeight:600}}>👤 שם *</label><input value={form.name} onChange={e=>setForm(p=>({…p,name:e.target.value}))} onKeyDown={e=>e.key===“Enter”&&handleSave()} placeholder=“שם מלא” style={iStyle()} autoFocus/></div>
<div>
<label style={{fontSize:12,color:C.muted,display:“block”,marginBottom:8,fontWeight:600}}>🎨 צבע</label>
<div style={{display:“flex”,gap:9,flexWrap:“wrap”}}>{EMP_COLORS.map(c=>(<button key={c} onClick={()=>setForm(p=>({…p,color:c}))} style={{width:34,height:34,borderRadius:“50%”,background:c,border:form.color===c?`3px solid ${C.text}`:“3px solid transparent”,cursor:“pointer”}}/>))}</div>
</div>
</div>
<div style={{display:“flex”,flexDirection:“column”,gap:10,marginTop:22}}>
<button onClick={handleSave} disabled={!form.name.trim()} style={{width:“100%”,background:C.green,border:“none”,borderRadius:10,color:”#fff”,fontFamily:hb,fontWeight:700,fontSize:15,padding:“13px”,cursor:“pointer”,opacity:form.name.trim()?1:0.45}}>{isNew?”+ הוסף עובד”:“✓ שמור שינויים”}</button>
{!isNew&&(<button onClick={()=>setConfirmDelete(true)} style={{width:“100%”,background:”#FEE2E2”,border:“1.5px solid #FECACA”,borderRadius:10,color:”#DC2626”,fontFamily:hb,fontWeight:700,fontSize:14,padding:“12px”,cursor:“pointer”}}>🗑 מחק עובד</button>)}
<button onClick={onClose} style={{width:“100%”,background:“transparent”,border:“none”,color:C.muted,fontFamily:hb,fontWeight:600,fontSize:13,padding:“8px”,cursor:“pointer”}}>ביטול</button>
</div>
</div>
</div>
);
}

// ── Calendar Grid ────────────────────────────────────────────
function CalendarGrid({weekDates,employees,isAvailable,isBooked,isVisitStart,onCellClick,weekBase,onShiftWeek}){
return(
<div style={{display:“flex”,flexDirection:“column”,height:“100%”}}>
<div style={{padding:“10px 14px”,borderBottom:`1px solid ${C.border}`,background:C.bg,display:“flex”,alignItems:“center”,gap:10,flexShrink:0}}>
<button onClick={()=>onShiftWeek(-1)} style={btn(C.light,C.navy,{padding:“8px 12px”,fontSize:12})}>‹ קודם</button>
<span style={{fontSize:12,color:C.navy,fontWeight:700,flex:1,textAlign:“center”}}>{fmtDate(weekDates[0])} – {fmtDate(weekDates[weekDates.length-1])}</span>
<button onClick={()=>onShiftWeek(1)} style={btn(C.light,C.navy,{padding:“8px 12px”,fontSize:12})}>הבא ›</button>
</div>
<div style={{padding:“6px 12px”,background:C.bgSoft,borderBottom:`1px solid ${C.border}`,display:“flex”,gap:10,flexWrap:“wrap”,flexShrink:0}}>
{employees.map(emp=>(<span key={emp.id} style={{display:“flex”,alignItems:“center”,gap:4,fontSize:11,color:C.muted}}><span style={{width:8,height:8,borderRadius:2,background:emp.color,display:“inline-block”}}/>{emp.name}</span>))}
<span style={{display:“flex”,alignItems:“center”,gap:4,fontSize:11,color:C.muted}}><span style={{width:8,height:8,borderRadius:2,background:”#FFF3E0”,border:`1px solid ${C.orange}`,display:“inline-block”}}/>ביקור</span>
</div>
<div style={{flex:1,overflowY:“auto”,overflowX:“auto”,padding:“6px 8px 16px”}}>
<table style={{borderCollapse:“separate”,borderSpacing:“3px 3px”,width:“100%”}}>
<thead>
<tr>
<th style={{width:42,color:C.muted,fontSize:10,textAlign:“right”,paddingRight:3,paddingBottom:2}}>שעה</th>
{weekDates.map(date=>(<th key={date} colSpan={employees.length} style={{textAlign:“center”,fontSize:10,fontWeight:700,padding:“3px 2px 5px”,color:date===todayStr()?C.orange:C.navy,borderBottom:date===todayStr()?`2.5px solid ${C.orange}`:`1.5px solid ${C.border}`}}>{getDayHe(date)}<br/><span style={{fontWeight:400,color:C.muted,fontSize:9}}>{fmtDate(date)}</span></th>))}
</tr>
<tr><th/>{weekDates.map(date=>employees.map(emp=>(<th key={emp.id+date} style={{textAlign:“center”,padding:“2px 1px 4px”}}><Avatar emp={emp} size={15}/></th>)))}</tr>
</thead>
<tbody>
{HOURS.map(hour=>(
<tr key={hour}>
<td style={{color:C.muted,fontSize:10,textAlign:“right”,paddingRight:3,verticalAlign:“middle”}}>{hour}</td>
{weekDates.map(date=>employees.map(emp=>{
const avail=isAvailable(emp.id,date,hour);
const booked=isBooked(emp.id,date,hour);
const past=date<todayStr();
const isStart=isVisitStart(emp.id,date,hour);
return(
<td key={emp.id+date+hour} style={{padding:“1px”}}>
<button onClick={()=>onCellClick(emp.id,date,hour)} style={{width:“100%”,height:28,borderRadius:5,border:“none”,cursor:booked?“pointer”:avail&&!past?“pointer”:“default”,background:booked?”#FFF3E0”:avail?emp.color+“22”:C.bgSoft,borderWidth:1.5,borderStyle:“solid”,borderColor:booked?C.orange:avail?emp.color+“99”:C.border,opacity:past&&!booked?0.3:1,fontSize:11,color:booked?C.orange:avail?emp.color:“transparent”,fontWeight:700,transition:“all .12s”}}>
{booked?(isStart?“📍”:”·”):avail?“✓”:””}
</button>
</td>
);
}))}
</tr>
))}
</tbody>
</table>
</div>
</div>
);
}

// ── Employee Availability Grid ───────────────────────────────
function EmpGrid({emp,empWeekDates,isAvailable,isBooked,isVisitStart,onCellClick,onShiftWeek}){
return(
<div style={{display:“flex”,flexDirection:“column”,height:“100%”}}>
<div style={{padding:“9px 16px”,display:“flex”,gap:16,fontSize:11,color:C.muted,background:C.bgSoft,borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
{[[emp.color+“18”,emp.color,“זמין”],[C.light,C.border,“לא זמין”],[”#FFF3E0”,C.orange,“ביקור”]].map(([bg,bc,l])=>(<span key={l} style={{display:“flex”,alignItems:“center”,gap:5}}><span style={{width:12,height:12,borderRadius:3,background:bg,border:`1.5px solid ${bc}`,display:“inline-block”}}/>{l}</span>))}
</div>
<div style={{padding:“8px 14px”,display:“flex”,alignItems:“center”,gap:10,borderBottom:`1px solid ${C.border}`,background:C.bg,flexShrink:0}}>
<button onClick={()=>onShiftWeek(-1)} style={btn(C.light,C.navy,{padding:“7px 12px”,fontSize:12})}>‹ קודם</button>
<span style={{fontSize:12,color:C.navy,fontWeight:700,flex:1,textAlign:“center”}}>{fmtDate(empWeekDates[0])} – {fmtDate(empWeekDates[empWeekDates.length-1])}</span>
<button onClick={()=>onShiftWeek(1)} style={btn(C.light,C.navy,{padding:“7px 12px”,fontSize:12})}>הבא ›</button>
</div>
<div style={{flex:1,overflowX:“auto”,overflowY:“auto”,padding:“10px 12px 40px”}}>
<table style={{borderCollapse:“separate”,borderSpacing:“4px 4px”,minWidth:400}}>
<thead>
<tr>
<th style={{width:48,color:C.muted,fontSize:10,textAlign:“right”,paddingRight:5}}>שעה</th>
{empWeekDates.map(date=>(<th key={date} style={{color:date===todayStr()?emp.color:C.navy,fontSize:11,fontWeight:700,padding:“5px 3px”,textAlign:“center”,minWidth:66,borderBottom:date===todayStr()?`2.5px solid ${emp.color}`:`1.5px solid ${C.border}`}}><div>{getDayHe(date)}</div><div style={{fontSize:9,fontWeight:400,color:C.muted}}>{fmtDate(date)}</div></th>))}
</tr>
</thead>
<tbody>
{HOURS.map(hour=>(
<tr key={hour}>
<td style={{color:C.muted,fontSize:10,textAlign:“right”,paddingRight:5,verticalAlign:“middle”}}>{hour}</td>
{empWeekDates.map(date=>{
const booked=isBooked(emp.id,date,hour);
const avail=isAvailable(emp.id,date,hour);
const past=date<todayStr();
const isStart=isVisitStart(emp.id,date,hour);
return(<td key={date}><button onClick={()=>onCellClick(emp.id,date,hour)} style={{width:“100%”,height:40,borderRadius:7,border:“none”,cursor:past&&!booked?“default”:booked?“pointer”:“pointer”,background:booked?”#FFF3E0”:avail?emp.color+“22”:C.light,borderWidth:1.5,borderStyle:“solid”,borderColor:booked?C.orange:avail?emp.color:C.border,transition:“all .15s”,opacity:past&&!booked?0.35:1,fontSize:14,color:booked?C.orange:avail?emp.color:C.border}}>{booked?(isStart?“📍”:”·”):avail?“✓”:””}</button></td>);
})}
</tr>
))}
</tbody>
</table>
</div>
</div>
);
}

// ══════════════════════════════════════════════════════════════
export default function MapitAgenda(){
const isMobile=useIsMobile();
const [mobileTab,setMobileTab]=useState(“calendar”); // calendar | visits | employees
const [view,setView]=useState(“admin”); // admin | employee
const [selectedEmp,setSelectedEmp]=useState(null);
const [loading,setLoading]=useState(true);
const [employees,setEmployees]=useState([]);
const [availability,setAvailability]=useState({});
const [visits,setVisits]=useState([]);
const [weekBase,setWeekBase]=useState(todayStr());
const [empWeekBase,setEmpWeekBase]=useState(todayStr());
const [bookingSlot,setBookingSlot]=useState(null);
const [viewVisit,setViewVisit]=useState(null);
const [empModal,setEmpModal]=useState(null);
const [toast,setToast]=useState(null);
const [filterEmp,setFilterEmp]=useState(“all”);

useEffect(()=>{
let loaded={emps:false,visits:false,avail:false};
function checkDone(){if(loaded.emps&&loaded.visits&&loaded.avail)setLoading(false);}
const unsubEmps=onSnapshot(collection(db,“employees”),snap=>{
const docs=snap.docs.map(d=>({…d.data(),id:d.id}));
if(docs.length===0){
const batch=writeBatch(db);
INIT_EMPLOYEES.forEach(e=>batch.set(doc(db,“employees”,e.id),e));
batch.commit();setEmployees(INIT_EMPLOYEES);
} else setEmployees(docs);
loaded.emps=true;checkDone();
});
const unsubVisits=onSnapshot(collection(db,“visits”),snap=>{setVisits(snap.docs.map(d=>({…d.data(),id:d.id})));loaded.visits=true;checkDone();});
const unsubAvail=onSnapshot(collection(db,“availability”),snap=>{const av={};snap.docs.forEach(d=>{av[d.id]=d.data();});setAvailability(av);loaded.avail=true;checkDone();});
return()=>{unsubEmps();unsubVisits();unsubAvail();};
},[]);

const isAvailable=(id,d,h)=>(availability[id]?.[d]||[]).includes(h);
function isBooked(id,d,h){return visits.some(v=>{if(v.empId!==id||v.date!==d)return false;const si=hIdx(v.hour),ti=hIdx(h);return ti>=si&&ti<si+v.duration;});}
function getBookedVisit(id,d,h){return visits.find(v=>{if(v.empId!==id||v.date!==d)return false;const si=hIdx(v.hour),ti=hIdx(h);return ti>=si&&ti<si+v.duration;});}
function isVisitStart(id,d,h){return visits.some(v=>v.empId===id&&v.date===d&&v.hour===h);}

async function toggleSlot(empId,date,hour){
if(isBooked(empId,date,hour))return;
const slots=(availability[empId]?.[date]||[]);
const has=slots.includes(hour);
const newSlots=has?slots.filter(h=>h!==hour):[…slots,hour].sort();
await setDoc(doc(db,“availability”,empId),{…(availability[empId]||{}),[date]:newSlots});
}

function handleAdminCell(empId,date,hour){
const bv=getBookedVisit(empId,date,hour);
if(bv){setViewVisit(bv);return;}
if(!isAvailable(empId,date,hour))return;
setBookingSlot({empId,date,hour});
}
function handleEmpCell(empId,date,hour){
const bv=getBookedVisit(empId,date,hour);
if(bv){setViewVisit(bv);return;}
if(date<todayStr()||isBooked(empId,date,hour))return;
toggleSlot(empId,date,hour);
}

async function confirmBooking(data){
const emp=employees.find(e=>e.id===data.empId);
const id=“v_”+Date.now();
await setDoc(doc(db,“visits”,id),{…data,id});
setToast(`✅ ביקור נקבע! ${emp.name} קיבל הודעה.`);
setBookingSlot(null);
}
async function cancelVisit(id){
const v=visits.find(x=>x.id===id);
const emp=employees.find(e=>e.id===v?.empId);
await deleteDoc(doc(db,“visits”,id));
setToast(`🗑️ הביקור של ${emp?.name} בוטל.`);
}
async function saveEmployee(data){
const empId=data.id||(“emp_”+Date.now());
await setDoc(doc(db,“employees”,empId),{…data,id:empId});
setToast(data.id?“✅ שם העובד עודכן.”:“✅ עובד נוסף בהצלחה.”);
setEmpModal(null);
}
async function deleteEmployee(id){
await deleteDoc(doc(db,“employees”,id));
for(const v of visits.filter(v=>v.empId===id))await deleteDoc(doc(db,“visits”,v.id));
await deleteDoc(doc(db,“availability”,id));
setToast(“🗑️ עובד הוסר.”);setEmpModal(null);
if(view===“employee”&&selectedEmp?.id===id)setView(“admin”);
}
function shiftWeek(dir,setter,base){const d=new Date(base);d.setDate(d.getDate()+dir*7);setter(d.toISOString().slice(0,10));}

const weekDates=getWeekDates(weekBase);
const empWeekDates=getWeekDates(empWeekBase);
const upcomingVisits=visits.filter(v=>v.date>=todayStr()&&(filterEmp===“all”||v.empId===filterEmp)).sort((a,b)=>a.date.localeCompare(b.date)||a.hour.localeCompare(b.hour));

const CSS=`@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700;800&display=swap'); *{box-sizing:border-box;margin:0;padding:0;} @keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}} @keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes spin{to{transform:rotate(360deg)}} button:hover{opacity:.84} select:focus,input:focus{border-color:${C.navy}!important;outline:none}`;

if(loading)return <div style={{fontFamily:”‘Heebo’,sans-serif”}}><style>{CSS}</style><Spinner/></div>;

// ── Employee view (both mobile & desktop) ──────────────────
if(view===“employee”&&selectedEmp){
const emp=selectedEmp;
return(
<div dir=“rtl” style={{height:“100vh”,display:“flex”,flexDirection:“column”,background:C.bg,fontFamily:”‘Heebo’,sans-serif”}}>
<style>{CSS}</style>
<div style={{background:C.bg,borderBottom:`1.5px solid ${C.border}`,padding:“12px 16px”,display:“flex”,alignItems:“center”,justifyContent:“space-between”,flexShrink:0,boxShadow:“0 2px 8px #0001”}}>
<div style={{display:“flex”,alignItems:“center”,gap:10}}>
<Avatar emp={emp} size={40}/>
<div><div style={{fontSize:15,fontWeight:800}}>{emp.name}</div><div style={{fontSize:11,color:C.muted}}>✓ זמינות · 📍 ביקור</div></div>
</div>
<button onClick={()=>setView(“admin”)} style={btn(C.light,C.navy,{fontSize:12,padding:“7px 12px”})}>→ חזור</button>
</div>
<div style={{flex:1,overflow:“hidden”}}>
<EmpGrid emp={emp} empWeekDates={empWeekDates} isAvailable={isAvailable} isBooked={isBooked} isVisitStart={isVisitStart} onCellClick={handleEmpCell} onShiftWeek={dir=>shiftWeek(dir,setEmpWeekBase,empWeekBase)}/>
</div>
{viewVisit&&(()=>{const e=employees.find(x=>x.id===viewVisit.empId);return <VisitPopup visit={viewVisit} emp={e} onClose={()=>setViewVisit(null)} onCancel={id=>{cancelVisit(id);setViewVisit(null);}}/>;})()}
{toast&&<Toast msg={toast} onDone={()=>setToast(null)}/>}
</div>
);
}

// ── Shared header ──────────────────────────────────────────
const Header=({showTabs=false})=>(
<div style={{background:C.bg,borderBottom:`1.5px solid ${C.border}`,flexShrink:0,boxShadow:“0 2px 8px #0001”}}>
<div style={{padding:“10px 16px”,display:“flex”,alignItems:“center”,justifyContent:“space-between”}}>
<div style={{display:“flex”,alignItems:“center”,gap:10}}>
<img src={LOGO_SRC} alt=“Mapit” style={{height:32,width:“auto”}}/>
<div style={{width:1,height:24,background:C.border}}/>
<div><div style={{fontSize:12,fontWeight:800,color:C.navy}}>Agenda</div><div style={{fontSize:9,color:C.muted}}>מערכת ניהול ביקורים</div></div>
</div>
<div style={{fontSize:11,color:C.muted,fontWeight:600}}>{getDayHe(todayStr())} {fmtDate(todayStr())}</div>
</div>
{showTabs&&(
<div style={{display:“flex”,borderTop:`1px solid ${C.border}`}}>
{[{id:“calendar”,label:“לוח”,icon:“📅”},{id:“visits”,label:“ביקורים”,icon:“📍”},{id:“employees”,label:“עובדים”,icon:“👥”}].map(t=>(
<button key={t.id} onClick={()=>setMobileTab(t.id)} style={{flex:1,background:“transparent”,border:“none”,cursor:“pointer”,padding:“8px 4px 6px”,display:“flex”,flexDirection:“column”,alignItems:“center”,gap:2,borderBottom:mobileTab===t.id?`2.5px solid ${C.navy}`:“2.5px solid transparent”,transition:“all .15s”}}>
<span style={{fontSize:18}}>{t.icon}</span>
<span style={{fontSize:11,fontWeight:mobileTab===t.id?700:400,color:mobileTab===t.id?C.navy:C.muted,fontFamily:”‘Heebo’,sans-serif”}}>{t.label}</span>
</button>
))}
</div>
)}
</div>
);

// ── Visits list (shared) ───────────────────────────────────
const VisitsList=()=>(
<div style={{display:“flex”,flexDirection:“column”,height:“100%”}}>
<div style={{padding:“12px 14px 8px”,borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
<div style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:1,textTransform:“uppercase”,marginBottom:7}}>ביקורים קרובים</div>
<select value={filterEmp} onChange={e=>setFilterEmp(e.target.value)} style={{…iStyle(),padding:“7px 10px”,fontSize:12}}>
<option value="all">כל העובדים</option>
{employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
</select>
</div>
<div style={{flex:1,overflowY:“auto”,padding:“8px 12px”}}>
{upcomingVisits.length===0&&<div style={{color:C.muted,fontSize:13,textAlign:“center”,marginTop:50,opacity:.6}}>אין ביקורים</div>}
{upcomingVisits.map(v=>{
const emp=employees.find(e=>e.id===v.empId);
return(<div key={v.id} onClick={()=>setViewVisit(v)} style={{background:C.bg,borderRadius:12,padding:“12px 14px”,marginBottom:10,borderRight:`3px solid ${emp?.color||C.border}`,cursor:“pointer”,boxShadow:“0 1px 8px #0001”,animation:“fadeIn .3s”}}>
<div style={{display:“flex”,justifyContent:“space-between”,alignItems:“center”,marginBottom:4}}>
<div style={{fontSize:14,fontWeight:700,whiteSpace:“nowrap”,overflow:“hidden”,textOverflow:“ellipsis”,maxWidth:“75%”,wordBreak:“break-word”,whiteSpace:“normal”}}>{v.contactName}</div>
<button onClick={e=>{e.stopPropagation();cancelVisit(v.id);}} style={{background:“transparent”,border:“none”,cursor:“pointer”,color:C.muted,fontSize:16,lineHeight:1,padding:2}}>✕</button>
</div>
<div style={{fontSize:12,color:C.muted}}><span style={{color:emp?.color,fontWeight:700}}>{emp?.name}</span>{” · “}{fmtDate(v.date)}{” · “}{v.hour}–{addH(v.hour,v.duration)}</div>
{v.city&&<div style={{fontSize:12,color:C.muted,marginTop:2}}>{v.city}{v.address?`, ${v.address}`:””}</div>}
<div style={{marginTop:6}}><span style={{background:”#EFF8F3”,borderRadius:5,padding:“2px 8px”,fontSize:11,color:C.green,fontWeight:600}}>{v.service}</span></div>
</div>);
})}
</div>
</div>
);

// ── Employees list (shared) ────────────────────────────────
const EmployeesList=()=>(
<div style={{display:“flex”,flexDirection:“column”,height:“100%”}}>
<div style={{padding:“12px 14px 8px”,borderBottom:`1px solid ${C.border}`,display:“flex”,justifyContent:“space-between”,alignItems:“center”,flexShrink:0}}>
<div style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:1,textTransform:“uppercase”}}>עובדים</div>
<button onClick={()=>setEmpModal({id:null,name:””,color:C.navy,initials:””})} style={btn(C.green,undefined,{fontSize:11,padding:“6px 12px”})}>+ חדש</button>
</div>
<div style={{flex:1,overflowY:“auto”,padding:“8px 12px”}}>
{employees.map(emp=>(
<div key={emp.id} style={{display:“flex”,alignItems:“center”,gap:10,padding:“11px 10px”,borderRadius:12,marginBottom:6,background:C.bg,boxShadow:“0 1px 6px #0001”}}>
<div onClick={()=>{setSelectedEmp(emp);setView(“employee”);}} style={{display:“flex”,alignItems:“center”,gap:10,flex:1,minWidth:0,cursor:“pointer”}}>
<Avatar emp={emp} size={38}/>
<div style={{minWidth:0}}>
<div style={{fontSize:14,fontWeight:700,whiteSpace:“nowrap”,overflow:“hidden”,textOverflow:“ellipsis”}}>{emp.name}</div>
<div style={{fontSize:11,color:C.muted}}>{Object.values(availability[emp.id]||{}).flat().length} שע’ זמינות</div>
</div>
</div>
<button onClick={()=>setEmpModal(emp)} style={{background:C.light,border:“none”,borderRadius:8,cursor:“pointer”,padding:“6px 10px”,fontSize:14}}>✏️</button>
</div>
))}
</div>
</div>
);

// ── MOBILE LAYOUT ──────────────────────────────────────────
if(isMobile){
return(
<div dir=“rtl” style={{height:“100vh”,display:“flex”,flexDirection:“column”,background:C.bgSoft,fontFamily:”‘Heebo’,sans-serif”,overflow:“hidden”}}>
<style>{CSS}</style>
<Header showTabs={true}/>
<div style={{flex:1,overflow:“hidden”,background:C.bgSoft}}>
{mobileTab===“calendar”&&<CalendarGrid weekDates={weekDates} employees={employees} isAvailable={isAvailable} isBooked={isBooked} isVisitStart={isVisitStart} onCellClick={handleAdminCell} weekBase={weekBase} onShiftWeek={dir=>shiftWeek(dir,setWeekBase,weekBase)}/>}
{mobileTab===“visits”&&<VisitsList/>}
{mobileTab===“employees”&&<EmployeesList/>}
</div>

```
    {bookingSlot&&<BookingModal slot={bookingSlot} employees={employees} isAvailable={isAvailable} isBooked={isBooked} onConfirm={confirmBooking} onClose={()=>setBookingSlot(null)}/>}
    {empModal&&<EmpModal emp={empModal} onSave={saveEmployee} onDelete={deleteEmployee} onClose={()=>setEmpModal(null)}/>}
    {viewVisit&&(()=>{const emp=employees.find(e=>e.id===viewVisit.empId);return <VisitPopup visit={viewVisit} emp={emp} onClose={()=>setViewVisit(null)} onCancel={id=>{cancelVisit(id);setViewVisit(null);}}/>;})()}
    {toast&&<Toast msg={toast} onDone={()=>setToast(null)}/>}
  </div>
);
```

}

// ── DESKTOP LAYOUT ─────────────────────────────────────────
return(
<div dir=“rtl” style={{height:“100vh”,display:“flex”,flexDirection:“column”,background:C.bgSoft,fontFamily:”‘Heebo’,sans-serif”,overflow:“hidden”}}>
<style>{CSS}</style>
<Header/>
<div style={{display:“flex”,flex:1,overflow:“hidden”}}>
{/* LEFT */}
<div style={{width:270,background:C.bg,borderLeft:`1.5px solid ${C.border}`,display:“flex”,flexDirection:“column”,overflow:“hidden”,flexShrink:0}}>
<VisitsList/>
</div>
{/* CENTER */}
<div style={{flex:1,overflow:“hidden”,minWidth:0}}>
<CalendarGrid weekDates={weekDates} employees={employees} isAvailable={isAvailable} isBooked={isBooked} isVisitStart={isVisitStart} onCellClick={handleAdminCell} weekBase={weekBase} onShiftWeek={dir=>shiftWeek(dir,setWeekBase,weekBase)}/>
</div>
{/* RIGHT */}
<div style={{width:220,background:C.bg,borderRight:`1.5px solid ${C.border}`,display:“flex”,flexDirection:“column”,overflow:“hidden”,flexShrink:0}}>
<EmployeesList/>
</div>
</div>
{bookingSlot&&<BookingModal slot={bookingSlot} employees={employees} isAvailable={isAvailable} isBooked={isBooked} onConfirm={confirmBooking} onClose={()=>setBookingSlot(null)}/>}
{empModal&&<EmpModal emp={empModal} onSave={saveEmployee} onDelete={deleteEmployee} onClose={()=>setEmpModal(null)}/>}
{viewVisit&&(()=>{const emp=employees.find(e=>e.id===viewVisit.empId);return <VisitPopup visit={viewVisit} emp={emp} onClose={()=>setViewVisit(null)} onCancel={id=>{cancelVisit(id);setViewVisit(null);}}/>;})()}
{toast&&<Toast msg={toast} onDone={()=>setToast(null)}/>}
</div>
);
}