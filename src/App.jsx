import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAvrA9PcQ3mNZ61ybVH6InSF0JCzJL3uIc",
  authDomain: "agenda-mapit-b0a03.firebaseapp.com",
  projectId: "agenda-mapit-b0a03",
  storageBucket: "agenda-mapit-b0a03.firebasestorage.app",
  messagingSenderId: "608992104710",
  appId: "1:608992104710:web:075e3eb6e4a3da83de0e87"
};
const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp);



const PIN_CODE = "4321"; // ← mude aqui o código de acesso

function PinScreen({onUnlock}){
  const [pin,setPin]=useState("");
  const [err,setErr]=useState(false);
  const [shake,setShake]=useState(false);

  function handleDigit(d){
    if(pin.length>=4)return;
    const next=pin+d;
    setPin(next);
    setErr(false);
    if(next.length===4){
      if(next===PIN_CODE){
        setTimeout(()=>onUnlock(),200);
      } else {
        setShake(true);
        setErr(true);
        setTimeout(()=>{setPin("");setShake(false);},700);
      }
    }
  }

  function handleDel(){setPin(p=>p.slice(0,-1));setErr(false);}

  const digits=["1","2","3","4","5","6","7","8","9","","0","⌫"];

  return(
    <div dir="rtl" style={{minHeight:"100vh",background:"#F5F6FA",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Heebo',sans-serif",padding:24}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .pin-btn:active{transform:scale(.92);opacity:.8}
      `}</style>

      {/* Logo */}
      <div style={{marginBottom:32,animation:"fadeIn .4s ease"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:0,direction:"ltr"}}>
          <span style={{fontFamily:"'Nunito','Arial Rounded MT Bold',sans-serif",fontWeight:900,fontSize:42,color:"#2B3990",lineHeight:1}}>Map</span>
          <span style={{fontFamily:"'Nunito','Arial Rounded MT Bold',sans-serif",fontWeight:900,fontSize:42,color:"#1A7A4A",lineHeight:1}}>it</span>
          <svg width="28" height="40" viewBox="0 0 28 40" style={{marginLeft:2,marginBottom:-4}}><path d="M14 1C7.4 1 2 6.4 2 13c0 8.5 12 26 12 26S26 21.5 26 13C26 6.4 20.6 1 14 1z" fill="#F47920"/><circle cx="14" cy="13" r="5" fill="white"/></svg>
        </div>
        <div style={{textAlign:"center",fontSize:13,color:"#7A8499",marginTop:6,fontWeight:600}}>Agenda · מערכת ניהול ביקורים</div>
      </div>

      {/* PIN dots */}
      <div style={{animation:shake?"shake .6s ease":"none",marginBottom:28}}>
        <div style={{display:"flex",gap:16,justifyContent:"center"}}>
          {[0,1,2,3].map(i=>(
            <div key={i} style={{width:18,height:18,borderRadius:"50%",
              background:pin.length>i?(err?"#DC2626":"#2B3990"):"transparent",
              border:`2px solid ${pin.length>i?(err?"#DC2626":"#2B3990"):"#DDE1EE"}`,
              transition:"all .15s"}}/>
          ))}
        </div>
        {err&&<div style={{textAlign:"center",color:"#DC2626",fontSize:13,fontWeight:600,marginTop:12}}>קוד שגוי, נסה שוב</div>}
      </div>

      {/* Keypad */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,72px)",gap:12}}>
        {digits.map((d,i)=>(
          d===""?<div key={i}/>:
          <button key={i} className="pin-btn" onClick={()=>d==="⌫"?handleDel():handleDigit(d)}
            style={{width:72,height:72,borderRadius:36,border:"none",
              background:d==="⌫"?"transparent":"#FFFFFF",
              boxShadow:d==="⌫"?"none":"0 2px 8px #0001",
              fontSize:d==="⌫"?22:24,fontWeight:700,color:"#1a2340",
              cursor:"pointer",transition:"all .12s",fontFamily:"'Heebo',sans-serif"}}>
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}

const C = {
  navy:"#2B3990", green:"#1A7A4A", orange:"#F47920",
  bg:"#FFFFFF", bgSoft:"#F5F6FA", border:"#DDE1EE",
  text:"#1a2340", muted:"#7A8499", light:"#ECEEF6",
};
const INIT_EMPLOYEES = [
  { id:"emp1", name:"כרמל לוי",  color:C.navy,   initials:"כל" },
  { id:"emp2", name:"יואב כהן",  color:C.green,  initials:"יכ" },
  { id:"emp3", name:"מיכל דוד",  color:C.orange, initials:"מד" },
];
const HOURS=["07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00"];
const DAYS_HE=["ראשון","שני","שלישי","רביעי","חמישי","שישי"];
const MONTHS_HE=["ינו","פבר","מרץ","אפר","מאי","יונ","יול","אוג","ספט","אוק","נוב","דצמ"];
const SERVICES=["רק קירות","קירות, גבהים ופתחים","חשמל ואינסטלציה"];
const EMP_COLORS=[C.navy,C.green,C.orange,"#8B5CF6","#0891B2","#DC2626","#059669","#D97706"];

function todayStr(){return new Date().toISOString().slice(0,10);}
function getWeekDates(base){
  const d=new Date(base),sun=new Date(d);
  sun.setDate(d.getDate()-d.getDay());
  const r=[];
  for(let i=0;i<7;i++){const dd=new Date(sun);dd.setDate(sun.getDate()+i);if(dd.getDay()!==6)r.push(dd.toISOString().slice(0,10));}
  return r;
}
function fmtDate(str){const d=new Date(str+"T00:00:00");return `${d.getDate()} ${MONTHS_HE[d.getMonth()]}`;}
function getDayHe(str){return DAYS_HE[new Date(str+"T00:00:00").getDay()];}
function addH(hour,n){return `${String(parseInt(hour)+n).padStart(2,"0")}:00`;}
function hIdx(h){return HOURS.indexOf(h);}

function useIsMobile(){
  const [mob,setMob]=useState(window.innerWidth<768);
  useEffect(()=>{const h=()=>setMob(window.innerWidth<768);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);
  return mob;
}

function Avatar({emp,size=36}){
  return <div style={{width:size,height:size,borderRadius:"50%",background:emp.color+"18",border:`2px solid ${emp.color}`,display:"flex",alignItems:"center",justifyContent:"center",color:emp.color,fontSize:size*0.35,fontWeight:800,flexShrink:0,fontFamily:"'Heebo',sans-serif"}}>{emp.initials}</div>;
}
function Toast({msg,onDone}){
  useEffect(()=>{const t=setTimeout(onDone,3500);return()=>clearTimeout(t);},[]);
  return <div onClick={onDone} style={{position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",zIndex:9999,background:C.green,color:"#fff",fontFamily:"'Heebo',sans-serif",fontWeight:700,fontSize:14,padding:"13px 26px",borderRadius:12,cursor:"pointer",boxShadow:`0 6px 24px ${C.green}55`,animation:"slideUp .3s ease",maxWidth:"88vw",lineHeight:1.5,direction:"rtl",textAlign:"center",whiteSpace:"nowrap"}}>{msg}</div>;
}
function Spinner(){
  return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",flexDirection:"column",gap:16,fontFamily:"'Heebo',sans-serif",color:C.muted}}>
    <div style={{width:36,height:36,border:`3px solid ${C.border}`,borderTop:`3px solid ${C.navy}`,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
    <span style={{fontSize:14}}>טוען...</span>
  </div>;
}
const iStyle=(x={})=>({background:C.bgSoft,border:`1.5px solid ${C.border}`,borderRadius:8,color:C.text,padding:"10px 14px",width:"100%",fontFamily:"'Heebo',sans-serif",fontSize:14,direction:"rtl",outline:"none",...x});
const btn=(bg=C.green,col="#fff",x={})=>({background:bg,border:"none",borderRadius:8,cursor:"pointer",color:col,fontFamily:"'Heebo',sans-serif",fontWeight:700,fontSize:13,padding:"9px 14px",transition:"opacity .15s",...x});

// ── Visit Popup ──────────────────────────────────────────────
function VisitPopup({visit,emp,onClose,onCancel}){
  return(
    <div style={{position:"fixed",inset:0,background:"#00000060",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} dir="rtl" style={{background:C.bg,borderRadius:18,padding:24,width:"100%",maxWidth:380,boxShadow:"0 20px 60px #0004",fontFamily:"'Heebo',sans-serif",animation:"slideUp .25s ease",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
          <Avatar emp={emp} size={42}/>
          <div style={{flex:1}}><div style={{fontSize:16,fontWeight:800,color:C.text}}>{visit.contactName}</div><div style={{fontSize:12,color:C.muted}}>{emp.name}</div></div>
          <button onClick={onClose} style={{background:"transparent",border:"none",cursor:"pointer",color:C.muted,fontSize:22,lineHeight:1,padding:2}}>✕</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {[
            ["📅 תאריך",`${getDayHe(visit.date)} ${fmtDate(visit.date)}`],
            ["🕐 התחלה",visit.hour],
            ["🕕 סיום",addH(visit.hour,visit.duration)],
            ["⏱ משך",`${visit.duration} שע'`],
            ["🔧 שירות",visit.service],
            visit.city&&["🏙 עיר",visit.city],
            visit.address&&["📍 כתובת",visit.address],
            ["👤 איש קשר",visit.contactName],
            visit.phone&&["📞 טלפון",visit.phone],
            visit.note&&["📝 הערות",visit.note],
          ].filter(Boolean).map(([l,v])=>(
            <div key={l} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"8px 10px",background:C.bgSoft,borderRadius:8}}>
              <span style={{fontSize:12,color:C.muted,minWidth:84,flexShrink:0}}>{l}</span>
              <span style={{fontSize:13,fontWeight:600,color:C.text,wordBreak:"break-word"}}>{v}</span>
            </div>
          ))}
        </div>
        <button onClick={()=>{onCancel(visit.id);onClose();}} style={{marginTop:18,width:"100%",background:"#FEE2E2",border:"none",borderRadius:9,color:"#DC2626",fontFamily:"'Heebo',sans-serif",fontWeight:700,fontSize:14,padding:"12px",cursor:"pointer"}}>🗑 בטל ביקור</button>
      </div>
    </div>
  );
}

// ── Booking Modal ────────────────────────────────────────────
function BookingModal({slot,employees,isAvailable,isBooked,onConfirm,onClose}){
  const emp=employees.find(e=>e.id===slot.empId);
  const [form,setForm]=useState({contactName:"",phone:"",city:"",address:"",note:"",service:"רק קירות",duration:1});
  const [err,setErr]=useState("");
  function handleConfirm(){
    if(!form.contactName.trim()){setErr("נא למלא שם איש קשר");return;}
    if(!form.city.trim()){setErr("נא למלא עיר");return;}
    if(!form.address.trim()){setErr("נא למלא כתובת");return;}
    setErr("");onConfirm({...slot,...form,client:form.contactName});
  }
  return(
    <div style={{position:"fixed",inset:0,background:"#00000060",zIndex:2000,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} dir="rtl" style={{background:C.bg,borderRadius:"18px 18px 0 0",padding:22,width:"100%",maxWidth:480,boxShadow:"0 -8px 40px #0003",fontFamily:"'Heebo',sans-serif",animation:"slideUp .3s ease",maxHeight:"92vh",overflowY:"auto"}}>
        <div style={{width:40,height:4,background:C.border,borderRadius:2,margin:"0 auto 16px"}}/>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
          <Avatar emp={emp} size={40}/>
          <div style={{flex:1}}><div style={{fontSize:15,fontWeight:800,color:C.text}}>קביעת ביקור</div><div style={{fontSize:11,color:C.muted}}>{emp.name} · {getDayHe(slot.date)} {fmtDate(slot.date)} · {slot.hour}</div></div>
          <button onClick={onClose} style={{background:"transparent",border:"none",cursor:"pointer",color:C.muted,fontSize:22}}>✕</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:11}}>
          <div>
            <label style={{fontSize:12,color:C.muted,display:"block",marginBottom:5,fontWeight:600}}>🔧 שירות</label>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {SERVICES.map(s=>(
                <label key={s} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"9px 14px",borderRadius:9,border:`1.5px solid ${form.service===s?emp.color:C.border}`,background:form.service===s?emp.color+"10":C.bgSoft,transition:"all .15s"}}>
                  <input type="radio" name="service" value={s} checked={form.service===s} onChange={()=>setForm(p=>({...p,service:s}))} style={{accentColor:emp.color,width:16,height:16}}/>
                  <span style={{fontSize:14,fontWeight:form.service===s?700:400,color:form.service===s?emp.color:C.text}}>{s}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label style={{fontSize:12,color:C.muted,display:"block",marginBottom:5,fontWeight:600}}>⏱ משך · {slot.hour} – {addH(slot.hour,form.duration)}</label>
            <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
              {[1,2,3,4,5].map(n=>{
                let ok=true;
                if(n>1){for(let i=1;i<n;i++){const h=addH(slot.hour,i);if(!isAvailable(slot.empId,slot.date,h)||isBooked(slot.empId,slot.date,h)){ok=false;break;}}}
                if(!HOURS.includes(addH(slot.hour,n))&&n>1)ok=false;
                return(<button key={n} disabled={!ok} onClick={()=>ok&&setForm(p=>({...p,duration:n}))} style={{padding:"8px 14px",borderRadius:8,fontSize:13,fontWeight:700,cursor:ok?"pointer":"not-allowed",background:form.duration===n?emp.color:ok?C.bgSoft:"#f0f0f0",color:form.duration===n?"#fff":ok?C.text:C.muted,border:`1.5px solid ${form.duration===n?emp.color:ok?C.border:"#e0e0e0"}`,opacity:ok?1:0.4}}>{n}h</button>);
              })}
            </div>
          </div>
          <div><label style={{fontSize:12,color:C.muted,display:"block",marginBottom:4,fontWeight:600}}>👤 שם איש קשר *</label><input placeholder="שם מלא" value={form.contactName} onChange={e=>setForm(p=>({...p,contactName:e.target.value}))} style={iStyle()}/></div>
          <div><label style={{fontSize:12,color:C.muted,display:"block",marginBottom:4,fontWeight:600}}>📞 טלפון</label><input placeholder="מספר טלפון" value={form.phone} type="tel" onChange={e=>setForm(p=>({...p,phone:e.target.value}))} style={iStyle()}/></div>
          <div><label style={{fontSize:12,color:C.muted,display:"block",marginBottom:4,fontWeight:600}}>🏙 עיר *</label><input placeholder="שם העיר" value={form.city} onChange={e=>setForm(p=>({...p,city:e.target.value}))} style={iStyle()}/></div>
          <div><label style={{fontSize:12,color:C.muted,display:"block",marginBottom:4,fontWeight:600}}>📍 כתובת *</label><input placeholder="רחוב ומספר" value={form.address} onChange={e=>setForm(p=>({...p,address:e.target.value}))} style={iStyle()}/></div>
          <div><label style={{fontSize:12,color:C.muted,display:"block",marginBottom:4,fontWeight:600}}>📝 הערות</label><input placeholder="הערות (אופציונלי)" value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))} style={iStyle()}/></div>
          {err&&<div style={{color:"#DC2626",fontSize:13,fontWeight:600,textAlign:"center"}}>{err}</div>}
        </div>
        <div style={{display:"flex",gap:10,marginTop:16}}>
          <button onClick={handleConfirm} style={{flex:1,background:C.green,border:"none",borderRadius:9,color:"#fff",fontFamily:"'Heebo',sans-serif",fontWeight:700,fontSize:15,padding:"13px",cursor:"pointer"}}>✓ אשר ביקור</button>
          <button onClick={onClose} style={{background:C.light,border:"none",borderRadius:9,color:C.navy,fontFamily:"'Heebo',sans-serif",fontWeight:700,fontSize:14,padding:"13px 16px",cursor:"pointer"}}>ביטול</button>
        </div>
      </div>
    </div>
  );
}

// ── Employee Modal ───────────────────────────────────────────
function EmpModal({emp,onSave,onDelete,onClose}){
  const isNew=!emp.id;
  const [form,setForm]=useState({name:emp.name||"",color:emp.color||C.navy});
  const [confirmDelete,setConfirmDelete]=useState(false);
  const hb="'Heebo',sans-serif";
  function handleSave(){
    if(!form.name.trim())return;
    const parts=form.name.trim().split(" ");
    const initials=(parts[0][0]+(parts[1]?.[0]||"")).slice(0,2);
    onSave({...emp,name:form.name.trim(),color:form.color,initials});
  }
  if(confirmDelete){
    return(
      <div style={{position:"fixed",inset:0,background:"#00000060",zIndex:4000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setConfirmDelete(false)}>
        <div onClick={e=>e.stopPropagation()} dir="rtl" style={{background:C.bg,borderRadius:18,padding:28,width:"100%",maxWidth:320,boxShadow:"0 20px 60px #0003",fontFamily:hb,animation:"slideUp .2s ease",textAlign:"center"}}>
          <div style={{fontSize:40,marginBottom:12}}>🗑️</div>
          <div style={{fontSize:16,fontWeight:800,color:C.text,marginBottom:8}}>מחיקת עובד</div>
          <div style={{fontSize:14,color:C.muted,marginBottom:24,lineHeight:1.6}}>האם למחוק את <strong style={{color:C.text}}>{emp.name}</strong>?<br/><span style={{fontSize:12}}>כל הביקורים והזמינות שלו יימחקו.</span></div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>onDelete(emp.id)} style={{flex:1,background:"#DC2626",border:"none",borderRadius:9,color:"#fff",fontFamily:hb,fontWeight:700,fontSize:14,padding:"13px",cursor:"pointer"}}>כן, מחק</button>
            <button onClick={()=>setConfirmDelete(false)} style={{flex:1,background:C.light,border:"none",borderRadius:9,color:C.navy,fontFamily:hb,fontWeight:700,fontSize:14,padding:"13px",cursor:"pointer"}}>ביטול</button>
          </div>
        </div>
      </div>
    );
  }
  return(
    <div style={{position:"fixed",inset:0,background:"#00000060",zIndex:4000,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} dir="rtl" style={{background:C.bg,borderRadius:"18px 18px 0 0",padding:24,width:"100%",maxWidth:480,boxShadow:"0 -8px 40px #0003",fontFamily:hb,animation:"slideUp .25s ease"}}>
        <div style={{width:40,height:4,background:C.border,borderRadius:2,margin:"0 auto 16px"}}/>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <div style={{width:48,height:48,borderRadius:"50%",background:form.color+"18",border:`2px solid ${form.color}`,display:"flex",alignItems:"center",justifyContent:"center",color:form.color,fontSize:20,fontWeight:800,fontFamily:hb,flexShrink:0}}>{form.name[0]||"?"}</div>
          <div style={{flex:1,fontSize:16,fontWeight:800,color:C.text}}>{isNew?"עובד חדש":"עריכת עובד"}</div>
          <button onClick={onClose} style={{background:"transparent",border:"none",cursor:"pointer",color:C.muted,fontSize:22,lineHeight:1}}>✕</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div><label style={{fontSize:12,color:C.muted,display:"block",marginBottom:4,fontWeight:600}}>👤 שם *</label><input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&handleSave()} placeholder="שם מלא" style={iStyle()} autoFocus/></div>
          <div>
            <label style={{fontSize:12,color:C.muted,display:"block",marginBottom:8,fontWeight:600}}>🎨 צבע</label>
            <div style={{display:"flex",gap:9,flexWrap:"wrap"}}>{EMP_COLORS.map(c=>(<button key={c} onClick={()=>setForm(p=>({...p,color:c}))} style={{width:34,height:34,borderRadius:"50%",background:c,border:form.color===c?`3px solid ${C.text}`:"3px solid transparent",cursor:"pointer"}}/>))}</div>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:22}}>
          <button onClick={handleSave} disabled={!form.name.trim()} style={{width:"100%",background:C.green,border:"none",borderRadius:10,color:"#fff",fontFamily:hb,fontWeight:700,fontSize:15,padding:"13px",cursor:"pointer",opacity:form.name.trim()?1:0.45}}>{isNew?"+ הוסף עובד":"✓ שמור שינויים"}</button>
          {!isNew&&(<button onClick={()=>setConfirmDelete(true)} style={{width:"100%",background:"#FEE2E2",border:"1.5px solid #FECACA",borderRadius:10,color:"#DC2626",fontFamily:hb,fontWeight:700,fontSize:14,padding:"12px",cursor:"pointer"}}>🗑 מחק עובד</button>)}
          <button onClick={onClose} style={{width:"100%",background:"transparent",border:"none",color:C.muted,fontFamily:hb,fontWeight:600,fontSize:13,padding:"8px",cursor:"pointer"}}>ביטול</button>
        </div>
      </div>
    </div>
  );
}

// ── Calendar Grid ────────────────────────────────────────────
function CalendarGrid({weekDates,employees,isAvailable,isBooked,isVisitStart,onCellClick,weekBase,onShiftWeek}){
  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{padding:"10px 14px",borderBottom:`1px solid ${C.border}`,background:C.bg,display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <button onClick={()=>onShiftWeek(-1)} style={btn(C.light,C.navy,{padding:"8px 12px",fontSize:12})}>‹ קודם</button>
        <span style={{fontSize:12,color:C.navy,fontWeight:700,flex:1,textAlign:"center"}}>{fmtDate(weekDates[0])} – {fmtDate(weekDates[weekDates.length-1])}</span>
        <button onClick={()=>onShiftWeek(1)} style={btn(C.light,C.navy,{padding:"8px 12px",fontSize:12})}>הבא ›</button>
      </div>
      <div style={{padding:"6px 12px",background:C.bgSoft,borderBottom:`1px solid ${C.border}`,display:"flex",gap:10,flexWrap:"wrap",flexShrink:0}}>
        {employees.map(emp=>(<span key={emp.id} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:C.muted}}><span style={{width:8,height:8,borderRadius:2,background:emp.color,display:"inline-block"}}/>{emp.name}</span>))}
        <span style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:C.muted}}><span style={{width:8,height:8,borderRadius:2,background:"#FFF3E0",border:`1px solid ${C.orange}`,display:"inline-block"}}/>ביקור</span>
      </div>
      <div style={{flex:1,overflowY:"auto",overflowX:"auto",padding:"6px 8px 16px"}}>
        <table style={{borderCollapse:"separate",borderSpacing:"3px 3px",width:"100%"}}>
          <thead>
            <tr>
              <th style={{width:42,color:C.muted,fontSize:10,textAlign:"right",paddingRight:3,paddingBottom:2}}>שעה</th>
              {weekDates.map(date=>(<th key={date} colSpan={employees.length} style={{textAlign:"center",fontSize:10,fontWeight:700,padding:"3px 2px 5px",color:date===todayStr()?C.orange:C.navy,borderBottom:date===todayStr()?`2.5px solid ${C.orange}`:`1.5px solid ${C.border}`}}>{getDayHe(date)}<br/><span style={{fontWeight:400,color:C.muted,fontSize:9}}>{fmtDate(date)}</span></th>))}
            </tr>
            <tr><th/>{weekDates.map(date=>employees.map(emp=>(<th key={emp.id+date} style={{textAlign:"center",padding:"2px 1px 4px"}}><Avatar emp={emp} size={15}/></th>)))}</tr>
          </thead>
          <tbody>
            {HOURS.map(hour=>(
              <tr key={hour}>
                <td style={{color:C.muted,fontSize:10,textAlign:"right",paddingRight:3,verticalAlign:"middle"}}>{hour}</td>
                {weekDates.map(date=>employees.map(emp=>{
                  const avail=isAvailable(emp.id,date,hour);
                  const booked=isBooked(emp.id,date,hour);
                  const past=date<todayStr();
                  const isStart=isVisitStart(emp.id,date,hour);
                  return(
                    <td key={emp.id+date+hour} style={{padding:"1px"}}>
                      <button onClick={()=>onCellClick(emp.id,date,hour)} style={{width:"100%",height:28,borderRadius:5,border:"none",cursor:booked?"pointer":avail&&!past?"pointer":"default",background:booked?"#FFF3E0":avail?emp.color+"22":C.bgSoft,borderWidth:1.5,borderStyle:"solid",borderColor:booked?C.orange:avail?emp.color+"99":C.border,opacity:past&&!booked?0.3:1,fontSize:11,color:booked?C.orange:avail?emp.color:"transparent",fontWeight:700,transition:"all .12s"}}>
                        {booked?(isStart?"📍":"·"):avail?"✓":""}
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
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{padding:"9px 16px",display:"flex",gap:16,fontSize:11,color:C.muted,background:C.bgSoft,borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
        {[[emp.color+"18",emp.color,"זמין"],[C.light,C.border,"לא זמין"],["#FFF3E0",C.orange,"ביקור"]].map(([bg,bc,l])=>(<span key={l} style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:12,height:12,borderRadius:3,background:bg,border:`1.5px solid ${bc}`,display:"inline-block"}}/>{l}</span>))}
      </div>
      <div style={{padding:"8px 14px",display:"flex",alignItems:"center",gap:10,borderBottom:`1px solid ${C.border}`,background:C.bg,flexShrink:0}}>
        <button onClick={()=>onShiftWeek(-1)} style={btn(C.light,C.navy,{padding:"7px 12px",fontSize:12})}>‹ קודם</button>
        <span style={{fontSize:12,color:C.navy,fontWeight:700,flex:1,textAlign:"center"}}>{fmtDate(empWeekDates[0])} – {fmtDate(empWeekDates[empWeekDates.length-1])}</span>
        <button onClick={()=>onShiftWeek(1)} style={btn(C.light,C.navy,{padding:"7px 12px",fontSize:12})}>הבא ›</button>
      </div>
      <div style={{flex:1,overflowX:"auto",overflowY:"auto",padding:"10px 12px 40px"}}>
        <table style={{borderCollapse:"separate",borderSpacing:"4px 4px",minWidth:400}}>
          <thead>
            <tr>
              <th style={{width:48,color:C.muted,fontSize:10,textAlign:"right",paddingRight:5}}>שעה</th>
              {empWeekDates.map(date=>(<th key={date} style={{color:date===todayStr()?emp.color:C.navy,fontSize:11,fontWeight:700,padding:"5px 3px",textAlign:"center",minWidth:66,borderBottom:date===todayStr()?`2.5px solid ${emp.color}`:`1.5px solid ${C.border}`}}><div>{getDayHe(date)}</div><div style={{fontSize:9,fontWeight:400,color:C.muted}}>{fmtDate(date)}</div></th>))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map(hour=>(
              <tr key={hour}>
                <td style={{color:C.muted,fontSize:10,textAlign:"right",paddingRight:5,verticalAlign:"middle"}}>{hour}</td>
                {empWeekDates.map(date=>{
                  const booked=isBooked(emp.id,date,hour);
                  const avail=isAvailable(emp.id,date,hour);
                  const past=date<todayStr();
                  const isStart=isVisitStart(emp.id,date,hour);
                  return(<td key={date}><button onClick={()=>onCellClick(emp.id,date,hour)} style={{width:"100%",height:40,borderRadius:7,border:"none",cursor:past&&!booked?"default":booked?"pointer":"pointer",background:booked?"#FFF3E0":avail?emp.color+"22":C.light,borderWidth:1.5,borderStyle:"solid",borderColor:booked?C.orange:avail?emp.color:C.border,transition:"all .15s",opacity:past&&!booked?0.35:1,fontSize:14,color:booked?C.orange:avail?emp.color:C.border}}>{booked?(isStart?"📍":"·"):avail?"✓":""}</button></td>);
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
export default function MapitApp(){
  const [unlocked,setUnlocked]=useState(()=>sessionStorage.getItem("mapit_auth")==="1");
  function handleUnlock(){sessionStorage.setItem("mapit_auth","1");setUnlocked(true);}
  if(!unlocked)return <PinScreen onUnlock={handleUnlock}/>;
  return <MapitAgenda/>;
}

function MapitAgenda(){
  const isMobile=useIsMobile();
  const [mobileTab,setMobileTab]=useState("calendar"); // calendar | visits | employees
  const [view,setView]=useState("admin"); // admin | employee
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
  const [filterEmp,setFilterEmp]=useState("all");

  useEffect(()=>{
    let loaded={emps:false,visits:false,avail:false};
    function checkDone(){if(loaded.emps&&loaded.visits&&loaded.avail)setLoading(false);}
    const unsubEmps=onSnapshot(collection(db,"employees"),snap=>{
      const docs=snap.docs.map(d=>({...d.data(),id:d.id}));
      if(docs.length===0){
        const batch=writeBatch(db);
        INIT_EMPLOYEES.forEach(e=>batch.set(doc(db,"employees",e.id),e));
        batch.commit();setEmployees(INIT_EMPLOYEES);
      } else setEmployees(docs);
      loaded.emps=true;checkDone();
    });
    const unsubVisits=onSnapshot(collection(db,"visits"),snap=>{setVisits(snap.docs.map(d=>({...d.data(),id:d.id})));loaded.visits=true;checkDone();});
    const unsubAvail=onSnapshot(collection(db,"availability"),snap=>{const av={};snap.docs.forEach(d=>{av[d.id]=d.data();});setAvailability(av);loaded.avail=true;checkDone();});
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
    const newSlots=has?slots.filter(h=>h!==hour):[...slots,hour].sort();
    await setDoc(doc(db,"availability",empId),{...(availability[empId]||{}),[date]:newSlots});
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
    const id="v_"+Date.now();
    await setDoc(doc(db,"visits",id),{...data,id});
    setToast(`✅ ביקור נקבע! ${emp.name} קיבל הודעה.`);
    setBookingSlot(null);
  }
  async function cancelVisit(id){
    const v=visits.find(x=>x.id===id);
    const emp=employees.find(e=>e.id===v?.empId);
    await deleteDoc(doc(db,"visits",id));
    setToast(`🗑️ הביקור של ${emp?.name} בוטל.`);
  }
  async function saveEmployee(data){
    const empId=data.id||("emp_"+Date.now());
    await setDoc(doc(db,"employees",empId),{...data,id:empId});
    setToast(data.id?"✅ שם העובד עודכן.":"✅ עובד נוסף בהצלחה.");
    setEmpModal(null);
  }
  async function deleteEmployee(id){
    await deleteDoc(doc(db,"employees",id));
    for(const v of visits.filter(v=>v.empId===id))await deleteDoc(doc(db,"visits",v.id));
    await deleteDoc(doc(db,"availability",id));
    setToast("🗑️ עובד הוסר.");setEmpModal(null);
    if(view==="employee"&&selectedEmp?.id===id)setView("admin");
  }
  function shiftWeek(dir,setter,base){const d=new Date(base);d.setDate(d.getDate()+dir*7);setter(d.toISOString().slice(0,10));}

  const weekDates=getWeekDates(weekBase);
  const empWeekDates=getWeekDates(empWeekBase);
  const upcomingVisits=visits.filter(v=>v.date>=todayStr()&&(filterEmp==="all"||v.empId===filterEmp)).sort((a,b)=>a.date.localeCompare(b.date)||a.hour.localeCompare(b.hour));

  const CSS=`
    @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700;800&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    @keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes spin{to{transform:rotate(360deg)}}
    button:hover{opacity:.84}
    select:focus,input:focus{border-color:${C.navy}!important;outline:none}
  `;

  if(loading)return <div style={{fontFamily:"'Heebo',sans-serif"}}><style>{CSS}</style><Spinner/></div>;

  // ── Employee view (both mobile & desktop) ──────────────────
  if(view==="employee"&&selectedEmp){
    const emp=selectedEmp;
    return(
      <div dir="rtl" style={{height:"100vh",display:"flex",flexDirection:"column",background:C.bg,fontFamily:"'Heebo',sans-serif"}}>
        <style>{CSS}</style>
        <div style={{background:C.bg,borderBottom:`1.5px solid ${C.border}`,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,boxShadow:"0 2px 8px #0001"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <Avatar emp={emp} size={40}/>
            <div><div style={{fontSize:15,fontWeight:800}}>{emp.name}</div><div style={{fontSize:11,color:C.muted}}>✓ זמינות · 📍 ביקור</div></div>
          </div>
          <button onClick={()=>setView("admin")} style={btn(C.light,C.navy,{fontSize:12,padding:"7px 12px"})}>→ חזור</button>
        </div>
        <div style={{flex:1,overflow:"hidden"}}>
          <EmpGrid emp={emp} empWeekDates={empWeekDates} isAvailable={isAvailable} isBooked={isBooked} isVisitStart={isVisitStart} onCellClick={handleEmpCell} onShiftWeek={dir=>shiftWeek(dir,setEmpWeekBase,empWeekBase)}/>
        </div>
        {viewVisit&&(()=>{const e=employees.find(x=>x.id===viewVisit.empId);return <VisitPopup visit={viewVisit} emp={e} onClose={()=>setViewVisit(null)} onCancel={id=>{cancelVisit(id);setViewVisit(null);}}/>;})()}
        {toast&&<Toast msg={toast} onDone={()=>setToast(null)}/>}
      </div>
    );
  }

  // ── Shared header ──────────────────────────────────────────
  const Header=({showTabs=false})=>(
    <div style={{background:C.bg,borderBottom:`1.5px solid ${C.border}`,flexShrink:0,boxShadow:"0 2px 8px #0001"}}>
      <div style={{padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <img src="data:image/png;base64,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" alt="Mapit" style={{height:36,width:"auto",display:"block"}}/>
          <div style={{width:1,height:24,background:C.border}}/>
          <div><div style={{fontSize:12,fontWeight:800,color:C.navy}}>Agenda</div><div style={{fontSize:9,color:C.muted}}>מערכת ניהול ביקורים</div></div>
        </div>
        <div style={{fontSize:11,color:C.muted,fontWeight:600}}>{getDayHe(todayStr())} {fmtDate(todayStr())}</div>
      </div>
      {showTabs&&(
        <div style={{display:"flex",borderTop:`1px solid ${C.border}`}}>
          {[{id:"calendar",label:"לוח",icon:"📅"},{id:"visits",label:"ביקורים",icon:"📍"},{id:"employees",label:"עובדים",icon:"👥"}].map(t=>(
            <button key={t.id} onClick={()=>setMobileTab(t.id)} style={{flex:1,background:"transparent",border:"none",cursor:"pointer",padding:"8px 4px 6px",display:"flex",flexDirection:"column",alignItems:"center",gap:2,borderBottom:mobileTab===t.id?`2.5px solid ${C.navy}`:"2.5px solid transparent",transition:"all .15s"}}>
              <span style={{fontSize:18}}>{t.icon}</span>
              <span style={{fontSize:11,fontWeight:mobileTab===t.id?700:400,color:mobileTab===t.id?C.navy:C.muted,fontFamily:"'Heebo',sans-serif"}}>{t.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // ── Visits list (shared) ───────────────────────────────────
  const VisitsList=()=>(
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{padding:"12px 14px 8px",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
        <div style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:7}}>ביקורים קרובים</div>
        <select value={filterEmp} onChange={e=>setFilterEmp(e.target.value)} style={{...iStyle(),padding:"7px 10px",fontSize:12}}>
          <option value="all">כל העובדים</option>
          {employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"8px 12px"}}>
        {upcomingVisits.length===0&&<div style={{color:C.muted,fontSize:13,textAlign:"center",marginTop:50,opacity:.6}}>אין ביקורים</div>}
        {upcomingVisits.map(v=>{
          const emp=employees.find(e=>e.id===v.empId);
          return(<div key={v.id} onClick={()=>setViewVisit(v)} style={{background:C.bg,borderRadius:12,padding:"12px 14px",marginBottom:10,borderRight:`3px solid ${emp?.color||C.border}`,cursor:"pointer",boxShadow:"0 1px 8px #0001",animation:"fadeIn .3s"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <div style={{fontSize:14,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:"75%",wordBreak:"break-word",whiteSpace:"normal"}}>{v.contactName}</div>
              <button onClick={e=>{e.stopPropagation();cancelVisit(v.id);}} style={{background:"transparent",border:"none",cursor:"pointer",color:C.muted,fontSize:16,lineHeight:1,padding:2}}>✕</button>
            </div>
            <div style={{fontSize:12,color:C.muted}}><span style={{color:emp?.color,fontWeight:700}}>{emp?.name}</span>{" · "}{fmtDate(v.date)}{" · "}{v.hour}–{addH(v.hour,v.duration)}</div>
            {v.city&&<div style={{fontSize:12,color:C.muted,marginTop:2}}>{v.city}{v.address?`, ${v.address}`:""}</div>}
            <div style={{marginTop:6}}><span style={{background:"#EFF8F3",borderRadius:5,padding:"2px 8px",fontSize:11,color:C.green,fontWeight:600}}>{v.service}</span></div>
          </div>);
        })}
      </div>
    </div>
  );

  // ── Employees list (shared) ────────────────────────────────
  const EmployeesList=()=>(
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{padding:"12px 14px 8px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
        <div style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:1,textTransform:"uppercase"}}>עובדים</div>
        <button onClick={()=>setEmpModal({id:null,name:"",color:C.navy,initials:""})} style={btn(C.green,undefined,{fontSize:11,padding:"6px 12px"})}>+ חדש</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"8px 12px"}}>
        {employees.map(emp=>(
          <div key={emp.id} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 10px",borderRadius:12,marginBottom:6,background:C.bg,boxShadow:"0 1px 6px #0001"}}>
            <div onClick={()=>{setSelectedEmp(emp);setView("employee");}} style={{display:"flex",alignItems:"center",gap:10,flex:1,minWidth:0,cursor:"pointer"}}>
              <Avatar emp={emp} size={38}/>
              <div style={{minWidth:0}}>
                <div style={{fontSize:14,fontWeight:700,wordBreak:"break-word",lineHeight:1.3}}>{emp.name}</div>
                <div style={{fontSize:11,color:C.muted}}>{Object.values(availability[emp.id]||{}).flat().length} שע' זמינות</div>
              </div>
            </div>
            <button onClick={()=>setEmpModal(emp)} style={{background:C.light,border:"none",borderRadius:8,cursor:"pointer",padding:"6px 10px",fontSize:14}}>✏️</button>
          </div>
        ))}
      </div>
    </div>
  );

  // ── MOBILE LAYOUT ──────────────────────────────────────────
  if(isMobile){
    return(
      <div dir="rtl" style={{height:"100vh",display:"flex",flexDirection:"column",background:C.bgSoft,fontFamily:"'Heebo',sans-serif",overflow:"hidden"}}>
        <style>{CSS}</style>
        <Header showTabs={true}/>
        <div style={{flex:1,overflow:"hidden",background:C.bgSoft}}>
          {mobileTab==="calendar"&&<CalendarGrid weekDates={weekDates} employees={employees} isAvailable={isAvailable} isBooked={isBooked} isVisitStart={isVisitStart} onCellClick={handleAdminCell} weekBase={weekBase} onShiftWeek={dir=>shiftWeek(dir,setWeekBase,weekBase)}/>}
          {mobileTab==="visits"&&<VisitsList/>}
          {mobileTab==="employees"&&<EmployeesList/>}
        </div>

        {bookingSlot&&<BookingModal slot={bookingSlot} employees={employees} isAvailable={isAvailable} isBooked={isBooked} onConfirm={confirmBooking} onClose={()=>setBookingSlot(null)}/>}
        {empModal&&<EmpModal emp={empModal} onSave={saveEmployee} onDelete={deleteEmployee} onClose={()=>setEmpModal(null)}/>}
        {viewVisit&&(()=>{const emp=employees.find(e=>e.id===viewVisit.empId);return <VisitPopup visit={viewVisit} emp={emp} onClose={()=>setViewVisit(null)} onCancel={id=>{cancelVisit(id);setViewVisit(null);}}/>;})()}
        {toast&&<Toast msg={toast} onDone={()=>setToast(null)}/>}
      </div>
    );
  }

  // ── DESKTOP LAYOUT ─────────────────────────────────────────
  return(
    <div dir="rtl" style={{height:"100vh",display:"flex",flexDirection:"column",background:C.bgSoft,fontFamily:"'Heebo',sans-serif",overflow:"hidden"}}>
      <style>{CSS}</style>
      <Header/>
      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        {/* LEFT */}
        <div style={{width:270,background:C.bg,borderLeft:`1.5px solid ${C.border}`,display:"flex",flexDirection:"column",overflow:"hidden",flexShrink:0}}>
          <VisitsList/>
        </div>
        {/* CENTER */}
        <div style={{flex:1,overflow:"hidden",minWidth:0}}>
          <CalendarGrid weekDates={weekDates} employees={employees} isAvailable={isAvailable} isBooked={isBooked} isVisitStart={isVisitStart} onCellClick={handleAdminCell} weekBase={weekBase} onShiftWeek={dir=>shiftWeek(dir,setWeekBase,weekBase)}/>
        </div>
        {/* RIGHT */}
        <div style={{width:240,background:C.bg,borderRight:`1.5px solid ${C.border}`,display:"flex",flexDirection:"column",overflow:"hidden",flexShrink:0}}>
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
