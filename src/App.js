/* eslint-disable */
import React, { useState, useEffect, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from "recharts";

/* ── helpers ── */
const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const MS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
function dow(a,m,d){ return new Date(a,m,d).getDay(); }
function dim(a,m){ return new Date(a,m+1,0).getDate(); }
function fR(v){ return "R$ "+Number(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2}); }
function fRk(v){ v=v||0; if(v>=1000) return "R$"+(v/1000).toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1})+"k"; return "R$"+v.toLocaleString("pt-BR",{minimumFractionDigits:0,maximumFractionDigits:0}); }
function pRS(s){ return parseFloat(((s||"")+"").replace(/\./g,"").replace(",","."))||0; }
function dskey(a,m,d){ return a+"-"+String(m+1).padStart(2,"0")+"-"+String(d).padStart(2,"0"); }
function safeGet(obj, key, def){ return obj && obj[key] !== undefined ? obj[key] : def; }

/* ── feriados São Luís ── */
function getFeriados(ano){
  /* Cálculo da Páscoa (algoritmo de Meeus/Jones/Butcher) */
  var a2=ano%19,b2=Math.floor(ano/100),c2=ano%100,d2=Math.floor(b2/4),e2=b2%4;
  var f2=Math.floor((b2+8)/25),g2=Math.floor((b2-f2+1)/3);
  var h2=(19*a2+b2-d2-g2+15)%30;
  var ii2=Math.floor(c2/4),k2=c2%4,l2=(32+2*e2+2*ii2-h2-k2)%7;
  var mm2=Math.floor((a2+11*h2+22*l2)/451);
  var pMonth=Math.floor((h2+l2-7*mm2+114)/31);
  var pDay=((h2+l2-7*mm2+114)%31)+1;
  var pasc=new Date(ano,pMonth-1,pDay);
  function addD(dt,n){ var x=new Date(dt); x.setDate(x.getDate()+n); return x; }
  function fmt(dt){ return dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,"0")+"-"+String(dt.getDate()).padStart(2,"0"); }
  var map={};

  /* Nacionais fixos */
  var nacionais=[
    [ano+"-01-01","Confraternização Universal"],
    [ano+"-04-21","Tiradentes"],
    [ano+"-05-01","Dia do Trabalho"],
    [ano+"-09-07","Independência do Brasil"],
    [ano+"-10-12","Nossa Sra. Aparecida"],
    [ano+"-11-02","Finados"],
    [ano+"-11-15","Proclamação da República"],
    [ano+"-11-20","Consciência Negra"],
    [ano+"-12-25","Natal"],
  ];

  /* Municipais de São Luís - MA */
  var municipais=[
    [ano+"-01-20","São Sebastião — Padroeiro de SL"],
    [ano+"-07-28","Aniversário de São Luís"],
    [ano+"-08-28","São Luís Rei de França"],
    [ano+"-09-08","Nossa Sra. de Nazaré (SL)"],
    [ano+"-10-08","São Francisco de Assis (SL)"],
  ];

  /* Ponto facultativo SL */
  var facultativos=[
    [ano+"-01-02","Ponto Facultativo"],
    [ano+"-12-24","Véspera de Natal"],
    [ano+"-12-31","Véspera de Ano Novo"],
  ];

  /* Móveis baseados na Páscoa */
  var moveis=[
    [fmt(addD(pasc,-48)),"Segunda de Carnaval"],
    [fmt(addD(pasc,-47)),"Terça de Carnaval"],
    [fmt(addD(pasc,-46)),"Quarta de Cinzas"],
    [fmt(addD(pasc,-2)), "Sexta-Feira Santa"],
    [fmt(pasc),          "Páscoa — Ressurreição"],
    [fmt(addD(pasc,60)), "Corpus Christi"],
  ];

  var all=nacionais.concat(municipais).concat(facultativos).concat(moveis);
  for(var i=0;i<all.length;i++){ map[all[i][0]]=all[i][1]; }
  return map;
}

/* ── alto fluxo / sazonalidades 2026 ── */
function getAltoFluxo(ano){
  var map={};
  function mark(base,dias,lbl,nivel,emoji){
    for(var i=-dias;i<=0;i++){
      var d=new Date(base.getFullYear(),base.getMonth(),base.getDate()+i);
      var k=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
      if(!map[k]) map[k]={label:lbl,nivel:nivel,emoji:emoji||"⚡"};
    }
  }
  /* Janeiro */
  mark(new Date(ano,0,6),   3,"Dia de Reis 👑",        "medio","👑");
  /* Fevereiro */
  mark(new Date(ano,1,12),  7,"Carnaval 🎭",            "alto", "🎭");
  mark(new Date(ano,1,14),  7,"Dia dos Namorados 💕",   "alto", "💕");
  /* Março */
  mark(new Date(ano,2,8),   2,"Dia da Mulher 🌹",       "medio","🌹");
  /* Abril */
  mark(new Date(ano,3,5),   5,"Páscoa 🥚",              "critico","🥚");
  /* Maio */
  var diasMae2026=new Date(ano,4,10); /* segundo domingo de maio 2026 = 10/mai */
  mark(diasMae2026,        10,"Dia das Mães 💐",        "critico","💐");
  /* Junho */
  mark(new Date(ano,5,12), 10,"Dia dos Namorados 💕",   "critico","💕");
  mark(new Date(ano,5,13),  5,"Santo Antônio / Arraial","alto",  "🎪");
  mark(new Date(ano,5,24),  5,"São João 🎆",            "alto",  "🎆");
  /* Julho */
  mark(new Date(ano,6,28),  3,"Aniversário de SL 🏙️",  "medio", "🏙️");
  /* Agosto */
  var diasPai2026=new Date(ano,7,9); /* segundo domingo de agosto 2026 = 09/ago */
  mark(diasPai2026,        10,"Dia dos Pais 🎩",        "critico","🎩");
  mark(new Date(ano,7,28),  3,"São Luís Rei 👑",        "medio", "👑");
  /* Setembro */
  mark(new Date(ano,8,7),   2,"Independência 🇧🇷",     "medio", "🇧🇷");
  mark(new Date(ano,8,8),   3,"Nazaré (SL) ⛪",         "medio", "⛪");
  /* Outubro */
  mark(new Date(ano,9,12),  5,"Dia das Crianças 🎈",   "critico","🎈");
  /* Novembro */
  mark(new Date(ano,10,28), 7,"Black Friday 🔥",        "critico","🔥");
  mark(new Date(ano,10,29), 3,"Cyber Monday 💻",        "alto",  "💻");
  /* Dezembro */
  mark(new Date(ano,11,24),12,"Natal 🎄",               "critico","🎄");
  mark(new Date(ano,11,31), 5,"Reveillon 🎆",           "alto",  "🎆");
  return map;
}

/* ── levels ── */
var LEVELS=[
  {id:"meta",   label:"Meta",    com:0.02, color:"#22c55e"},
  {id:"extra",  label:"Extra",   com:0.022,color:"#cd7f32"},
  {id:"super",  label:"Super",   com:0.025,color:"#94a3b8"},
  {id:"ouro",   label:"Ouro",    com:0.03, color:"#fbbf24"},
];
var PERIODS=[{id:"semanal",label:"Semanal",dias:5},{id:"quinzenal",label:"Quinzenal",dias:10},{id:"mensal",label:"Mensal",dias:0}];
var FRASES=["Cada venda é um passo ao topo! 🏆","Foco, disciplina e resultados! ⚡","Hoje é o dia de superar ontem! 🚀","Sua atitude define seu resultado! 🎯","O sucesso é venda a venda! 💰"];

function barColor(pct){ if(pct>=100) return "#22c55e"; if(pct>=85) return "#22c55e"; if(pct>=65) return "#f59e0b"; return "#ef4444"; }
function getMetas(base){
  return LEVELS.map(function(g,i){
    var v=base; for(var j=0;j<i;j++) v=v*1.10; v=Math.round(v*100)/100;
    return {id:g.id,label:g.label,com:g.com,color:g.color,valorRS:v,comRS:v*g.com};
  });
}

function loadLS(key,def){ try{ var v=localStorage.getItem(key); return v?JSON.parse(v):def; }catch(e){ return def; } }
function saveLS(key,val){ try{ localStorage.setItem(key,JSON.stringify(val)); }catch(e){} }

var C={bg:"#060608",card:"#0f1015",card2:"#151720",border:"#1e2235",lime:"#22c55e",lime2:"#16a34a",green:"#22c55e",red:"#ef4444",amber:"#f59e0b",blue:"#3b82f6",purple:"#a855f7",text:"#f0f4ff",muted:"#5a6480",muted2:"#2a3040"};

/* ════════ GoalAnimation (outside App) ════════ */
function GoalAnimation(props){
  var level=props.level, onClose=props.onClose, nome=props.nome, metas=props.metas;
  var stageState=useState(0); var stage=stageState[0]; var setStage=stageState[1];
  var countState=useState(0); var count=countState[0]; var setCount=countState[1];

  var IDS=["meta","extra","super","ouro"];
  var MEDALS=["🥇","🥉","🥈","🏅"];
  var PCTS=["100%","110%","120%","130%"];
  var lidx=IDS.indexOf(level.id); if(lidx<0) lidx=0;
  var medal=MEDALS[lidx];

  var allDone=metas&&metas.every(function(g){return g.atingiu;});
  var nextLevel=metas?metas.filter(function(g){return !g.atingiu;})[0]:null;
  var nextMedal=nextLevel?MEDALS[IDS.indexOf(nextLevel.id)]||"🎯":"";

  /* cores por nível */
  var COLORS={meta:"#22c55e",extra:"#cd7f32",super:"#94a3b8",ouro:"#fbbf24"};
  var lvColor=COLORS[level.id]||level.color||"#22c55e";

  useEffect(function(){
    var t1=setTimeout(function(){setStage(1);},500);
    var t2=setTimeout(function(){setStage(2);},1400);
    var t3=setTimeout(function(){setStage(3);},3600);
    return function(){clearTimeout(t1);clearTimeout(t2);clearTimeout(t3);};
  },[]);

  /* contagem animada da comissão */
  useEffect(function(){
    if(stage!==2) return;
    var target=allDone&&metas&&metas[3]?metas[3].comRS:(level.comRS||0);
    var dur=1800; var steps=60; var step=target/steps; var cur=0; var ti;
    ti=setInterval(function(){
      cur+=step;
      if(cur>=target){ setCount(target); clearInterval(ti); }
      else setCount(Math.round(cur));
    }, dur/steps);
    return function(){clearInterval(ti);};
  },[stage]);

  /* ══ PICA PAU — tela especial só com dinheiro + frase ══ */
  if(allDone) return (
    <div style={{position:"fixed",inset:0,zIndex:500,background:"#000",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
      <style>{" @keyframes moneyRain{0%{transform:translateY(-80px) rotate(0) scale(1);opacity:1}100%{transform:translateY(110vh) rotate(720deg) scale(0.5);opacity:0}} @keyframes moneyGrow{0%{transform:scale(0);opacity:0}40%{transform:scale(1.15);}70%{transform:scale(0.95);}100%{transform:scale(1);opacity:1}} @keyframes glowGold{0%,100%{text-shadow:0 0 30px #fbbf24,0 0 60px #fbbf2444}50%{text-shadow:0 0 60px #fbbf24,0 0 120px #fbbf2488}} @keyframes pikaFade{from{opacity:0;transform:translateY(30px) scale(.9)}to{opacity:1;transform:translateY(0) scale(1)}} @keyframes coinSpin{0%{transform:rotateY(0)}100%{transform:rotateY(360deg)}}"}</style>

      {/* chuva densa de dinheiro */}
      {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29].map(function(i){
        var syms=["💵","💰","💸","💎","🤑","💵","💰","💵"];
        var sz=i%5===0?32:i%3===0?24:18;
        return <div key={i} style={{position:"absolute",top:0,left:(i*13%101)+"%",fontSize:sz,
          animation:"moneyRain "+(1.2+i%6*.25)+"s "+(i*.11%2)+"s linear infinite",zIndex:1,opacity:.9}}>
          {syms[i%syms.length]}
        </div>;
      })}

      {/* conteúdo central */}
      <div style={{position:"relative",zIndex:10,textAlign:"center",padding:"0 28px",width:"100%",maxWidth:380}}>
        {/* valor grande se formando */}
        <div style={{animation:"moneyGrow .9s ease both",marginBottom:12}}>
          <div style={{fontSize:11,color:"rgba(255,215,0,.6)",fontWeight:700,letterSpacing:4,marginBottom:8}}>💰 COMISSÃO TOTAL</div>
          <div style={{fontSize:56,fontWeight:900,color:"#fbbf24",lineHeight:1,animation:"glowGold 1.5s ease-in-out infinite",letterSpacing:-2}}>
            {fR(count)}
          </div>
          <div style={{fontSize:13,color:"rgba(255,215,0,.5)",marginTop:6}}>130% — {(metas&&metas[3]?metas[3].com*100:3).toFixed(1)}% de comissão</div>
        </div>

        {/* dinheiros grandes lado a lado */}
        <div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:16,animation:"pikaFade .6s .8s both"}}>
          {["💵","💰","💸","💵","💰"].map(function(s,i){
            return <span key={i} style={{fontSize:36,animation:"coinSpin "+(2+i*.3)+"s "+(i*.2)+"s linear infinite",display:"inline-block"}}>{s}</span>;
          })}
        </div>

        {/* FRASE */}
        <div style={{animation:"pikaFade .7s 1.2s both"}}>
          <div style={{fontSize:14,color:"rgba(255,255,255,.5)",fontWeight:600,letterSpacing:2,marginBottom:6}}>VOCÊ É</div>
          <div style={{fontSize:52,fontWeight:900,color:"#fbbf24",lineHeight:1,animation:"glowGold 1s ease-in-out infinite",letterSpacing:-1}}>
            PIKAAA
          </div>
          <div style={{fontSize:18,fontWeight:700,color:"#fff",marginTop:8}}>{nome?nome.toUpperCase():"CAMPEÃO"}! 🎉</div>
        </div>

        <button onClick={onClose} style={{marginTop:24,padding:"14px 48px",borderRadius:20,
          background:"linear-gradient(135deg,#fbbf24,#d97706)",border:"none",color:"#000",fontWeight:900,
          fontSize:16,cursor:"pointer",boxShadow:"0 8px 32px rgba(251,191,36,.5)",animation:"pikaFade .5s 1.8s both",letterSpacing:.5}}>
          FECHAR
        </button>
      </div>
    </div>
  );

  /* ══ ANIMAÇÃO NORMAL — cor e medalha por nível ══ */
  var BG_COLORS={
    meta:  "radial-gradient(ellipse at 50% 0%,#052012,#000)",
    extra: "radial-gradient(ellipse at 50% 0%,#1a0c02,#000)",
    super: "radial-gradient(ellipse at 50% 0%,#0f1318,#000)",
    ouro:  "radial-gradient(ellipse at 50% 0%,#1a1200,#000)",
  };
  var bgGrad=BG_COLORS[level.id]||BG_COLORS.meta;

  return (
    <div style={{position:"fixed",inset:0,zIndex:500,background:bgGrad,display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
      <style>{" @keyframes bIn{0%{transform:scale(0) rotate(-15deg);opacity:0}65%{transform:scale(1.15) rotate(4deg);}100%{transform:scale(1) rotate(0);opacity:1}} @keyframes cUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}} @keyframes sUp{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}} @keyframes rainLv{0%{transform:translateY(-60px) rotate(0);opacity:1}100%{transform:translateY(105vh) rotate(360deg);opacity:0}} @keyframes countPop{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}} @keyframes glowLv{0%,100%{box-shadow:0 0 20px var(--lc)}50%{box-shadow:0 0 50px var(--lc),0 0 80px var(--lc)}} @keyframes shimmer{0%,100%{opacity:.85}50%{opacity:1}}"}</style>

      {/* chuva de moedas na cor do nível */}
      {stage>=1&&[0,1,2,3,4,5,6,7].map(function(i){
        var sym=level.id==="ouro"?"💛":level.id==="super"?"🩶":level.id==="extra"?"🟤":"💚";
        var fallback=["💰","💵","✨","⭐"][i%4];
        return <div key={i} style={{position:"absolute",top:0,left:(i*13%100)+"%",fontSize:i%2===0?22:15,
          animation:"rainLv "+(1.3+i*.35)+"s "+(i*.2)+"s linear infinite",opacity:.7,zIndex:0}}>
          {i%2===0?sym:fallback}
        </div>;
      })}

      <div style={{textAlign:"center",padding:"0 26px",width:"100%",maxWidth:360,position:"relative",zIndex:2}}>
        {/* medalha grande com glow da cor do nível */}
        {stage>=0&&<div style={{fontSize:110,animation:"bIn .7s ease both",marginBottom:8,
          filter:"drop-shadow(0 0 32px "+lvColor+") drop-shadow(0 0 64px "+lvColor+"88)"}}>{medal}</div>}

        {/* faturamento */}
        {stage>=1&&<div style={{animation:"cUp .5s ease both",marginBottom:8}}>
          <div style={{fontSize:12,color:lvColor,fontWeight:800,letterSpacing:3,marginBottom:5}}>META {PCTS[lidx]} BATIDA! 🎉</div>
          <div style={{fontSize:40,fontWeight:900,color:"#fff",letterSpacing:-1,lineHeight:1,animation:"shimmer 2s ease-in-out infinite"}}>{fRk(level.valorRS)}</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,.4)",marginTop:4}}>faturamento atingido</div>
        </div>}

        {/* comissão com cor do nível */}
        {stage>=2&&<div style={{"--lc":lvColor+"88",background:lvColor+"20",border:"2px solid "+lvColor,
          borderRadius:20,padding:"18px 24px",animation:"glowLv 1.5s ease-in-out infinite",marginBottom:10}}>
          <div style={{fontSize:10,color:"rgba(255,255,255,.6)",fontWeight:600,letterSpacing:1,marginBottom:6}}>💰 COMISSÃO DESBLOQUEADA</div>
          <div style={{fontSize:46,fontWeight:900,color:lvColor,lineHeight:1,animation:"countPop .3s ease",letterSpacing:-1}}>{fR(count)}</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,.4)",marginTop:5}}>{(level.com*100).toFixed(1)}% sobre {fRk(level.valorRS)}</div>
        </div>}

        {/* próximo nível */}
        {stage>=3&&<div style={{animation:"sUp .5s ease both",width:"100%"}}>
          <div style={{fontSize:22,fontWeight:900,color:"#fff",marginBottom:12}}>✅ 100% CONCLUÍDO!</div>
          {nextLevel&&<div style={{background:COLORS[nextLevel.id]+"20",border:"2px solid "+COLORS[nextLevel.id]+"66",
            borderRadius:18,padding:"16px",marginBottom:12,textAlign:"left"}}>
            <div style={{fontSize:10,color:"rgba(255,255,255,.5)",marginBottom:6,letterSpacing:1}}>PRÓXIMO DESTINO</div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <span style={{fontSize:28,filter:"drop-shadow(0 0 12px "+COLORS[nextLevel.id]+")"}}>{nextMedal}</span>
              <div>
                <div style={{fontSize:16,fontWeight:900,color:COLORS[nextLevel.id]}}>{nextLevel.label} — {PCTS[IDS.indexOf(nextLevel.id)]||""}</div>
                <div style={{fontSize:22,fontWeight:900,color:"#fff",lineHeight:1,marginTop:2}}>{fR(nextLevel.valorRS)}</div>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"rgba(255,255,255,.5)"}}>
              <span>+{fRk(nextLevel.valorRS-level.valorRS)} acima</span>
              <span style={{color:COLORS[nextLevel.id],fontWeight:700}}>💰 {fR(nextLevel.comRS)}</span>
            </div>
          </div>}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {nextLevel&&<button onClick={function(){onClose(); if(props.onGoHome) props.onGoHome();}} style={{padding:"15px",borderRadius:14,
              background:"linear-gradient(135deg,"+COLORS[nextLevel.id]+","+COLORS[nextLevel.id]+"bb)",
              border:"none",color:"#000",fontWeight:900,fontSize:15,cursor:"pointer",
              boxShadow:"0 6px 24px "+COLORS[nextLevel.id]+"55"}}>
              🚀 RUMO A {nextLevel.label.toUpperCase()}!
            </button>}
            <button onClick={onClose} style={{padding:"12px",borderRadius:14,background:"rgba(255,255,255,.06)",
              border:"1px solid rgba(255,255,255,.1)",color:"rgba(255,255,255,.45)",fontWeight:600,fontSize:12,cursor:"pointer"}}>
              Fechar
            </button>
          </div>
        </div>}
      </div>
    </div>
  );
}
/* ════════ App ════════ */
export default function App(){
  var hoje=new Date();
  var anoAtual=hoje.getFullYear();

  /* ── AUTH STATE ── */
  var authState=useState(function(){
    var saved=loadLS("m360auth",null);
    return saved&&saved.logado?{logado:true,nome:saved.nome,cargo:saved.cargo}:null;
  });
  var auth=authState[0]; var setAuth=authState[1];
  /* splash shown on first login */
  var splashState=useState(false); var showSplash=splashState[0]; var setShowSplash=splashState[1];
  var authScreenState=useState("login"); /* "login" | "register" | "recover" */
  var recTelState=useState(""); var recTel=recTelState[0]; var setRecTel=recTelState[1];
  var recCodeGenState=useState(""); var recCodeGen=recCodeGenState[0]; var setRecCodeGen=recCodeGenState[1];
  var recCodeState=useState(""); var recCode=recCodeState[0]; var setRecCode=recCodeState[1];
  var recNewSenhaState=useState(""); var recNewSenha=recNewSenhaState[0]; var setRecNewSenha=recNewSenhaState[1];
  var recStepState=useState(1); var recStep=recStepState[0]; var setRecStep=recStepState[1];
  var authScreen=authScreenState[0]; var setAuthScreen=authScreenState[1];
  /* campos login */
  var loginNomeState=useState(""); var loginNome=loginNomeState[0]; var setLoginNome=loginNomeState[1];
  var loginSenhaState=useState(""); var loginSenha=loginSenhaState[0]; var setLoginSenha=loginSenhaState[1];
  /* campos cadastro */
  var regNomeState=useState(""); var regNome=regNomeState[0]; var setRegNome=regNomeState[1];
  var regCargoState=useState(""); var regCargo=regCargoState[0]; var setRegCargo=regCargoState[1];
  var regSenhaState=useState(""); var regSenha=regSenhaState[0]; var setRegSenha=regSenhaState[1];
  var regSenha2State=useState(""); var regSenha2=regSenha2State[0]; var setRegSenha2=regSenha2State[1];
  var authErrState=useState(""); var authErr=authErrState[0]; var setAuthErr=authErrState[1];
  var showPassState=useState(false); var showPass=showPassState[0]; var setShowPass=showPassState[1];

  function doLogin(){
    var saved=loadLS("m360auth",null);
    if(!saved||!saved.nome){ setAuthErr("Nenhuma conta cadastrada. Faça o cadastro primeiro."); return; }
    if(loginNome.trim().toLowerCase()!==saved.nome.toLowerCase()){ setAuthErr("Nome incorreto."); return; }
    if(loginSenha!==saved.senha){ setAuthErr("Senha incorreta."); return; }
    var a={logado:true,nome:saved.nome,cargo:saved.cargo};
    saveLS("m360auth",Object.assign({},saved,{logado:true}));
    setShowSplash(true);
    setTimeout(function(){ setShowSplash(false); setAuth(a); }, 2800);
  }
  function doRegister(){
    if(!regNome.trim()){ setAuthErr("Digite seu nome."); return; }
    if(!regSenha||regSenha.length<4){ setAuthErr("Senha deve ter pelo menos 4 caracteres."); return; }
    if(regSenha!==regSenha2){ setAuthErr("As senhas não coincidem."); return; }
    var data={nome:regNome.trim(),cargo:regCargo.trim()||"Vendedor",senha:regSenha,tel:recTel.trim(),logado:true};
    saveLS("m360auth",data);
    saveLS("m360cfg",Object.assign(loadLS("m360cfg",{}),{nome:data.nome,cargo:data.cargo||"Vendedor"}));
    setShowSplash(true);
    setTimeout(function(){ setShowSplash(false); setAuth({logado:true,nome:data.nome,cargo:data.cargo}); }, 3200);
  }
  function doLogout(){
    var saved=loadLS("m360auth",null);
    if(saved) saveLS("m360auth",Object.assign({},saved,{logado:false}));
    setAuth(null);
  }

  /* state */
  var cfgState=useState(function(){ return loadLS("m360cfg",{nome:"Vendedor",cargo:"Vendedor",foto:null,metaStr:"10000",periodId:"mensal",diasTrab:22,mes:hoje.getMonth(),ano:anoAtual}); });
  var cfg=cfgState[0]; var setCfgRaw=cfgState[1];
  function setCfg(patch){ setCfgRaw(function(p){ var n=Object.assign({},p,patch); saveLS("m360cfg",n); return n; }); }

  var nome=cfg.nome, cargo=cfg.cargo, foto=cfg.foto, metaStr=cfg.metaStr, periodId=cfg.periodId, diasTrab=cfg.diasTrab, mes=cfg.mes, ano=cfg.ano;
  var metaBase=pRS(metaStr)||10000;
  var period=PERIODS.filter(function(p){return p.id===periodId;})[0]||PERIODS[2];
  var diasNoMes=dim(ano,mes);
  var diasEf=period.id==="mensal"?diasTrab:(period.dias||5);
  var metas=getMetas(metaBase);

  var vendasState=useState(function(){return loadLS("m360vendas",{});});
  var vendas=vendasState[0]; var setVendasRaw=vendasState[1];
  function setVendas(fn){ setVendasRaw(function(p){ var n=typeof fn==="function"?fn(p):fn; saveLS("m360vendas",n); return n; }); }

  var folgasState=useState(function(){return loadLS("m360folgas",{});});
  var folgas=folgasState[0]; var setFolgasRaw=folgasState[1];
  function setFolgas(fn){ setFolgasRaw(function(p){ var n=typeof fn==="function"?fn(p):fn; saveLS("m360folgas",n); return n; }); }

  var mediasState=useState(function(){return loadLS("m360medias",{});});
  var medias=mediasState[0]; var setMediasRaw=mediasState[1];
  function setMedias(fn){ setMediasRaw(function(p){ var n=typeof fn==="function"?fn(p):fn; saveLS("m360medias",n); return n; }); }

  var corrState=useState(function(){return loadLS("m360corr",[{id:1,titulo:"Corridinha Trim.",descricao:"3 meses",premio:700,meta:9000,atual:0,ativo:true}]);});
  var corridinhas=corrState[0]; var setCorrRaw=corrState[1];
  function setCorr(fn){ setCorrRaw(function(p){ var n=typeof fn==="function"?fn(p):fn; saveLS("m360corr",n); return n; }); }

  var trimState=useState([{meta:"",vendeu:""},{meta:"",vendeu:""},{meta:"",vendeu:""}]);
  var trimMeses=trimState[0]; var setTrimMeses=trimState[1];

  var pageState=useState("home"); var page=pageState[0]; var setPage=pageState[1];
  var editState=useState(null); var editando=editState[0]; var setEditando=editState[1];
  var inputState=useState(""); var inputVal=inputState[0]; var setInputVal=inputState[1];
  var goalAnimState=useState(null); var goalAnim=goalAnimState[0]; var setGoalAnim=goalAnimState[1];
  var modoFolgaState=useState(false); var modoFolga=modoFolgaState[0]; var setModoFolga=modoFolgaState[1];
  var showVDState=useState(false); var showVD=showVDState[0]; var setShowVD=showVDState[1];
  var showAtuState=useState(false); var showAtu=showAtuState[0]; var setShowAtu=showAtuState[1];
  var showSimState=useState(false); var showSim=showSimState[0]; var setShowSim=showSimState[1];
  var showAddCState=useState(false); var showAddC=showAddCState[0]; var setShowAddC=showAddCState[1];
  var atuDiaState=useState(""); var atuDia=atuDiaState[0]; var setAtuDia=atuDiaState[1];
  var atuQtdState=useState(""); var atuQtd=atuQtdState[0]; var setAtuQtd=atuQtdState[1];
  var simVState=useState("0"); var simV=simVState[0]; var setSimV=simVState[1];
  var simDState=useState(String(diasEf)); var simD=simDState[0]; var setSimD=simDState[1];
  var editPerfilState=useState(false); var editPerfil=editPerfilState[0]; var setEditPerfil=editPerfilState[1];
  var nomeEditState=useState(nome); var nomeEdit=nomeEditState[0]; var setNomeEdit=nomeEditState[1];
  var cargoEditState=useState(cargo); var cargoEdit=cargoEditState[0]; var setCargoEdit=cargoEditState[1];
  var mediaEditState=useState(null); var mediaEdit=mediaEditState[0]; var setMediaEdit=mediaEditState[1];
  var mediaValState=useState(""); var mediaVal=mediaValState[0]; var setMediaVal=mediaValState[1];
  var corrEditState=useState({titulo:"",descricao:"",premio:"",meta:""}); var corrEdit=corrEditState[0]; var setCorrEdit=corrEditState[1];
  var corrTrimEditState=useState(null); var corrTrimEdit=corrTrimEditState[0]; var setCorrTrimEdit=corrTrimEditState[1];
  var corrTrimValState=useState(""); var corrTrimVal=corrTrimValState[0]; var setCorrTrimVal=corrTrimValState[1];
  var ferModalState=useState(null); var ferModal=ferModalState[0]; var setFerModal=ferModalState[1];
  var fotoRef=useRef(null);
  var inputRef=useRef(null);

  /* feriados */
  var feriados=Object.assign({},getFeriados(ano-1),getFeriados(ano),getFeriados(ano+1));
  var altoFluxo=getAltoFluxo(ano);

  /* helpers */
  function dsk(d){ return dskey(ano,mes,d); }
  var todasDatas=[]; for(var _d=1;_d<=diasNoMes;_d++) todasDatas.push(dsk(_d));
  function isDom(ds){ var p=ds.split("-"); return new Date(+p[0],+p[1]-1,+p[2]).getDay()===0; }
  function isSab(ds){ var p=ds.split("-"); return new Date(+p[0],+p[1]-1,+p[2]).getDay()===6; }
  function isFolga(ds){ return folgas[ds]===true; }
  function isFer(ds){ return feriados[ds]!==undefined; }
  function isNT(ds){ return isDom(ds)||isSab(ds)||isFolga(ds)||isFer(ds); }

  /* totais */
  var limHoje=dsk(Math.min(hoje.getDate(),diasNoMes));
  var prefix=ano+"-"+String(mes+1).padStart(2,"0");
  /* vendas agora armazena R$ diretamente */
  var totalRS=0;
  var vkeys=Object.keys(vendas);
  for(var vi=0;vi<vkeys.length;vi++){
    if(vkeys[vi].indexOf(prefix)===0) totalRS+=parseFloat(vendas[vkeys[vi]])||0;
  }
  var totalQtd=totalRS; /* alias para compatibilidade */
  var m0=metas[0];
  var valorVnd=1; /* valor já em R$, multiplicador = 1 */

  var diasDecor=0;
  for(var di=0;di<todasDatas.length;di++){
    if(todasDatas[di]<=limHoje&&!isNT(todasDatas[di])) diasDecor++;
  }
  var diasRest=0;
  for(var di2=0;di2<todasDatas.length;di2++){
    if(todasDatas[di2]>limHoje&&!isNT(todasDatas[di2])) diasRest++;
  }

  /* ── METAS CALCULADAS ──
     Lógica correta:
     diarRS    = meta / diasEf (diária original baseada em dias configurados)
     diasDecorEf = dias já trabalhados, limitado a diasEf
     restRS    = meta - totalRS (quanto falta)
     diasRestEf = dias restantes = diasEf - diasDecorEf
     novaDRS   = restRS / diasRestEf (diária redistribuída)
     Se aumentar diasEf → diarRS cai → novaDRS cai (menos urgência)
     Se diminuir diasEf → diarRS sobe → novaDRS sobe (mais urgência)
  */
  var diasDecorEf=Math.min(diasDecor, diasEf); /* dias trabalhados, capped pelo configurado */
  var diasRestEfCalc=Math.max(0, diasEf - diasDecorEf); /* dias restantes do período configurado */
  var metasCalc=metas.map(function(g){
    var diarRS=diasEf>0?g.valorRS/diasEf:0; /* diária original = meta / total dias */
    var restRS=Math.max(0,g.valorRS-totalRS); /* quanto falta vender */
    /* diária hoje = falta / dias restantes configurados */
    var novaDRS=diasRestEfCalc>0?restRS/diasRestEfCalc:0;
    var pctG=g.valorRS>0?Math.min(100,(totalRS/g.valorRS)*100):0;
    var atingiu=totalRS>=g.valorRS;
    /* desvio: o que deveria ter vendido até hoje vs o que vendeu */
    var deviaRS=diarRS*diasDecorEf;
    var difG=totalRS-deviaRS;
    return Object.assign({},g,{diarRS:diarRS,restRS:restRS,novaDRS:novaDRS,pctG:pctG,atingiu:atingiu,difG:difG,diasRest:diasRestEfCalc});
  });

  var bc=barColor(metasCalc[0].pctG);
  var difRS=metasCalc[0].difG;
  var projecao=diasDecor>0?(totalRS/diasDecor)*diasEf:0;

  /* COMISSAO ESCALONADA:
     Antes de bater 100% da meta: 1% sobre tudo vendido
     Depois de bater 100% da meta: 2% sobre tudo vendido
  */
  var meta100RS=metasCalc[0].valorRS;
  var comissaoAtual=0;
  var taxaAtual=0.01;
  if(totalRS<=0){
    comissaoAtual=0; taxaAtual=0.01;
  } else if(totalRS<meta100RS){
    comissaoAtual=totalRS*0.01;
    taxaAtual=0.01;
  } else {
    comissaoAtual=totalRS*0.02;
    taxaAtual=0.02;
  }
  var nivelAtingido=null;
  for(var ni=metasCalc.length-1;ni>=0;ni--){ if(metasCalc[ni].atingiu){ nivelAtingido=metasCalc[ni]; break; } }
  var proxNivel=null;
  for(var pi=0;pi<metasCalc.length;pi++){ if(!metasCalc[pi].atingiu){ proxNivel=metasCalc[pi]; break; } }
  var pct100=metasCalc[0].pctG;

  /* streak */
  var streak=0;
  for(var si=Math.min(hoje.getDate(),diasNoMes);si>=1;si--){
    var sk=dsk(si); if(isNT(sk)) continue;
    if((vendas[sk]||0)>0) streak++; else break;
  }

  /* track prev level to avoid re-triggering */
  var prevLevRef=useRef(-1);
  useEffect(function(){
    var cur=metasCalc.filter(function(g){return g.atingiu;}).length;
    prevLevRef.current=cur;
  },[totalRS]);

  useEffect(function(){ if(editando&&inputRef.current) inputRef.current.focus(); },[editando]);

  function handleFoto(e){
    var f=e.target.files[0]; if(!f) return;
    var r=new FileReader();
    r.onload=function(ev){
      /* redimensionar a foto para max 300x300px e qualidade 0.7 */
      var img=new Image();
      img.onload=function(){
        var canvas=document.createElement("canvas");
        var MAX=300;
        var w=img.width, h=img.height;
        if(w>h){ if(w>MAX){h=Math.round(h*MAX/w);w=MAX;} } else { if(h>MAX){w=Math.round(w*MAX/h);h=MAX;} }
        canvas.width=w; canvas.height=h;
        var ctx=canvas.getContext("2d");
        ctx.drawImage(img,0,0,w,h);
        var resized=canvas.toDataURL("image/jpeg",0.72);
        setCfg({foto:resized});
      };
      img.src=ev.target.result;
    };
    r.readAsDataURL(f);
  }
  function abrirEd(ds){ if(isNT(ds)) return; setEditando(ds); setInputVal(vendas[ds]!==undefined?String(vendas[ds]):""); }
  function togFolga(ds){ if(isDom(ds)||isSab(ds)) return; setFolgas(function(p){ var n=Object.assign({},p); if(n[ds]) delete n[ds]; else n[ds]=true; saveLS("m360folgas",n); return n; }); }
  function salvar(){
    if(!editando) return;
    /* agora o inputVal é em R$ direto */
    var vRS=pRS(inputVal);
    if(inputVal!==""&&vRS>=0) setVendas(function(p){ var n=Object.assign({},p); n[editando]=vRS; return n; });
    else if(inputVal==="") setVendas(function(p){ var n=Object.assign({},p); delete n[editando]; return n; });
    setEditando(null);
    /* verificar meta após 5 segundos */
    setTimeout(function(){
      setVendas(function(current){
        var prefix=ano+"-"+String(mes+1).padStart(2,"0");
        var tot=0;
        Object.keys(current).forEach(function(k){ if(k.indexOf(prefix)===0) tot+=parseFloat(current[k])||0; });
        var totalAtual=tot; /* já em R$ */
        var prevNivels=metasCalc.filter(function(g){return totalAtual>=g.valorRS;}).length;
        /* dispara animação se bateu algum nível que não tinha batido */
        if(prevNivels>0){
          var lv=metasCalc[prevNivels-1];
          if(lv) setGoalAnim(lv);
        }
        return current;
      });
    }, 5000);
  }

  /* planilha médias */
  var mediaAnual=MESES.map(function(_m,i){
    var key=ano+"-"+i;
    var entry=medias[key]||null;
    var metaM=entry&&entry.meta!=null?entry.meta:null;
    var vendeuM=entry&&entry.vendeu!=null?entry.vendeu:null;
    var resultado=metaM!=null&&vendeuM!=null?vendeuM-metaM:null;
    var pctM=metaM!=null&&metaM>0&&vendeuM!=null?(vendeuM/metaM)*100:null;
    return {mes:i,metaM:metaM,vendeuM:vendeuM,resultado:resultado,pctM:pctM,key:key};
  });
  var mediasComV=mediaAnual.filter(function(m){return m.vendeuM!=null;});
  var mediasComM=mediaAnual.filter(function(m){return m.metaM!=null;});
  /* % anual: para cada mês com vendeu, pega a meta daquele mês (ou metaBase se não tiver)
     pctM individual = vendeuM / metaM * 100
     pctAnual = média das pctM de todos os meses que têm vendeu */
  var fatAnual=mediasComV.reduce(function(a,m){return a+(m.vendeuM||0);},0);
  /* metaAnualTotal = soma das metas apenas dos meses que têm vendeu cadastrado
     (para comparar maçã com maçã: só meses que o vendedor já registrou) */
  var metaAnualTotal=mediasComV.reduce(function(a,m){
    return a+(m.metaM!=null?m.metaM:metaBase);
  },0);
  /* % anual = total vendido / total meta (dos meses com registro) × 100 — CÁLCULO CORRETO */
  var pctAnual=metaAnualTotal>0?(fatAnual/metaAnualTotal)*100:0;
  /* resultado anual = diferença */
  var resultadoAnual=fatAnual-metaAnualTotal;
  var mediaGeral=mediasComV.length>0?fatAnual/mediasComV.length:0;
  var metaAnual=metaAnualTotal;

  function commitMedia(){
    if(!mediaEdit) return;
    var v=pRS(mediaVal);
    setMedias(function(p){
      var prev=p[mediaEdit.key]||{};
      var n=Object.assign({},p);
      if(mediaVal==="") { var updated=Object.assign({},prev); delete updated[mediaEdit.field]; n[mediaEdit.key]=updated; }
      else { n[mediaEdit.key]=Object.assign({},prev,{}); n[mediaEdit.key][mediaEdit.field]=isNaN(v)?0:v; }
      return n;
    });
    setMediaEdit(null);
  }

  /* corridinha trimestral */
  var totalTrimV=trimMeses.reduce(function(a,m){return a+pRS(m.vendeu);},0);
  var totalTrimM=trimMeses.reduce(function(a,m){return a+pRS(m.meta);},0);
  var pctTrim=totalTrimM>0?Math.min(100,(totalTrimV/totalTrimM)*100):0;

  function commitCorrTrim(){
    if(!corrTrimEdit) return;
    var arr=trimMeses.map(function(m){return Object.assign({},m);});
    arr[corrTrimEdit.slot][corrTrimEdit.field]=corrTrimVal;
    setTrimMeses(arr);
    setCorrTrimEdit(null);
  }

  /* bar data */
  var barData=[];
  for(var bd=1;bd<=diasNoMes;bd++){
    var bds=dsk(bd);
    if(isNT(bds)) continue;
    barData.push({dia:String(bd),rs:vendas[bds]||0,meta:Math.round(metasCalc[0].diarRS)});
  }
  if(barData.length>14) barData=barData.slice(barData.length-14);

  var frase=FRASES[hoje.getDate()%FRASES.length];
  var BG_SYMS=[{s:"💰",x:6,y:5,op:.055},{s:"📊",x:80,y:4,op:.04},{s:"🏆",x:88,y:22,op:.04},{s:"💵",x:12,y:54,op:.035},{s:"📈",x:74,y:57,op:.05},{s:"💸",x:58,y:78,op:.035},{s:"🎯",x:82,y:84,op:.04}];

  function TT(props){
    if(!props.active||!props.payload||!props.payload.length) return null;
    return React.createElement("div",{style:{background:C.card2,border:"1px solid "+C.border,borderRadius:10,padding:"8px 12px",fontSize:11,color:C.text}},
      React.createElement("div",{style:{color:C.muted,fontSize:9,marginBottom:2}},"Dia "+props.label),
      props.payload.map(function(p,i){ return React.createElement("div",{key:i,style:{color:p.color,fontWeight:700}},p.name+": "+fRk(p.value)); })
    );
  }

  /* ── SPLASH SCREEN ── */
  if(showSplash){
    var splashNome=loadLS("m360auth",{}).nome||"Campeão";
    return (
      <div style={{minHeight:"100vh",background:"#050508",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Sora',sans-serif",overflow:"hidden",position:"relative"}}>
        <style>{"@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;700;800;900&display=swap'); *{box-sizing:border-box;margin:0;padding:0} @keyframes zoomIn{0%{transform:scale(0.3);opacity:0}60%{transform:scale(1.08);}100%{transform:scale(1);opacity:1}} @keyframes fadeUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}} @keyframes moneyRain{0%{transform:translateY(-60px) rotate(0);opacity:1}100%{transform:translateY(100vh) rotate(540deg);opacity:0}} @keyframes glowPulse{0%,100%{box-shadow:0 0 30px #22c55e66}50%{box-shadow:0 0 70px #22c55ecc}} @keyframes countUp{from{opacity:0;transform:scale(.5)}to{opacity:1;transform:scale(1)}} @keyframes slideIn{from{opacity:0;transform:translateX(-30px)}to{opacity:1;transform:translateX(0)}}"}</style>
        {/* chuva de dinheiro */}
        {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14].map(function(i){
          var syms=["💵","💰","🤑","💎","🏆","⭐","💸"];
          return <div key={i} style={{position:"absolute",top:0,left:(i*7%100)+"%",fontSize:i%3===0?28:18,animation:"moneyRain "+(1.5+i%4*.4)+"s "+(i*.18)+"s linear infinite",opacity:.7}}>{syms[i%7]}</div>;
        })}
        {/* grid bg */}
        <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(34,197,94,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,.04) 1px,transparent 1px)",backgroundSize:"28px 28px",pointerEvents:"none"}}/>
        {/* glow radial */}
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 40%,rgba(34,197,94,.18),transparent 60%)",pointerEvents:"none"}}/>
        <div style={{position:"relative",zIndex:2,textAlign:"center",padding:"0 30px"}}>
          {/* logo animado */}
          <div style={{width:100,height:100,borderRadius:"50%",background:"linear-gradient(135deg,#22c55e,#16a34a)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",animation:"zoomIn .7s ease both, glowPulse 2s 1s ease-in-out infinite",fontSize:44}}>🎯</div>
          {/* nome app */}
          <div style={{fontSize:38,fontWeight:900,color:"#fff",letterSpacing:-1,lineHeight:1,animation:"fadeUp .5s .3s both"}}>
            meta<span style={{color:"#22c55e"}}>360</span>
          </div>
          {/* saudação */}
          <div style={{fontSize:18,fontWeight:700,color:"#22c55e",marginTop:12,animation:"fadeUp .5s .7s both"}}>
            Bem-vindo, {splashNome}! 🚀
          </div>
          <div style={{fontSize:13,color:"#5a6480",marginTop:6,animation:"fadeUp .5s .9s both"}}>
            Preparado para bater metas hoje?
          </div>
          {/* barra de loading */}
          <div style={{marginTop:32,width:200,height:4,background:"#1e2235",borderRadius:2,overflow:"hidden",margin:"32px auto 0",animation:"fadeUp .5s 1s both"}}>
            <div style={{height:"100%",background:"linear-gradient(90deg,#22c55e,#16a34a)",borderRadius:2,animation:"slideIn 2.2s 1.1s ease both",width:"100%"}}/>
          </div>
          <div style={{fontSize:10,color:"#2a3040",marginTop:8,animation:"fadeUp .5s 1.2s both",letterSpacing:2}}>CARREGANDO...</div>
        </div>
      </div>
    );
  }

  /* ── TELA DE LOGIN / CADASTRO ── */
  if(!auth||!auth.logado){
    return (
      <div style={{minHeight:"100vh",background:"#050508",display:"flex",flexDirection:"column",fontFamily:"'Sora',sans-serif",position:"relative",overflow:"hidden"}}>
        <style>{"@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&display=swap'); *{box-sizing:border-box;margin:0;padding:0} button{cursor:pointer;font-family:inherit} input{font-family:inherit;} input:focus{outline:none} @keyframes fadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}} @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}} @keyframes floatCoin{0%,100%{transform:translateY(0) rotate(var(--r,0))}50%{transform:translateY(-12px) rotate(var(--r,0))}} @keyframes glowBorder{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0)}50%{box-shadow:0 0 20px 2px rgba(34,197,94,.25)}} .fade{animation:fadeIn .5s ease forwards}"}</style>

        {/* BG */}
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 0%,rgba(34,197,94,.12),transparent 55%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(34,197,94,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,.02) 1px,transparent 1px)",backgroundSize:"28px 28px",pointerEvents:"none"}}/>
        {/* coins flutuando */}
        {[{s:"💰",x:8,y:15,r:-12},{s:"💵",x:85,y:25,r:8},{s:"🏆",x:5,y:65,r:15},{s:"📈",x:88,y:70,r:-8},{s:"💎",x:50,y:80,r:5}].map(function(c,i){
          return <div key={i} style={{position:"absolute",fontSize:22,opacity:.07,left:c.x+"%",top:c.y+"%",animation:"floatCoin "+(5+i)+"s ease-in-out infinite","--r":c.r+"deg",transform:"rotate("+c.r+"deg)",animationDelay:(i*.8)+"s"}}>{c.s}</div>;
        })}

        {/* hero topo */}
        <div style={{background:"linear-gradient(180deg,rgba(34,197,94,.08) 0%,transparent 100%)",padding:"52px 24px 28px",textAlign:"center",position:"relative",zIndex:1}}>
          <div style={{width:72,height:72,borderRadius:"50%",background:"linear-gradient(135deg,#22c55e,#16a34a)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",fontSize:32,boxShadow:"0 0 40px rgba(34,197,94,.4)",animation:"pulse 2.5s ease-in-out infinite"}}>🎯</div>
          <div style={{fontSize:28,fontWeight:900,color:"#fff",letterSpacing:-1,lineHeight:1}}>meta<span style={{color:"#22c55e"}}>360</span></div>
          <div style={{fontSize:11,color:"#5a6480",marginTop:4,letterSpacing:1}}>SEU DESEMPENHO EM 360°</div>
          {/* frases rotativas de motivação */}
          <div style={{marginTop:14,background:"rgba(34,197,94,.08)",border:"1px solid rgba(34,197,94,.2)",borderRadius:10,padding:"8px 16px",fontSize:11,color:"#22c55e",fontWeight:600,fontStyle:"italic"}}>
            "Cada venda é um passo rumo ao topo! 🚀"
          </div>
        </div>

        {/* form card */}
        <div style={{flex:1,padding:"0 20px 40px",position:"relative",zIndex:1}}>
          {/* tabs */}
          <div style={{display:"flex",background:"#0f1015",borderRadius:14,padding:4,marginBottom:18,border:"1px solid #1e2235",animation:"glowBorder 3s ease-in-out infinite"}}>
            <button onClick={function(){setAuthScreen("login");setAuthErr("");}}
              style={{flex:1,padding:"11px",borderRadius:11,border:"none",background:authScreen==="login"?"linear-gradient(135deg,#22c55e,#16a34a)":"transparent",color:authScreen==="login"?"#000":"#5a6480",fontWeight:800,fontSize:13,transition:"all .25s",boxShadow:authScreen==="login"?"0 4px 16px rgba(34,197,94,.4)":"none"}}>
              Entrar
            </button>
            <button onClick={function(){setAuthScreen("register");setAuthErr("");}}
              style={{flex:1,padding:"11px",borderRadius:11,border:"none",background:authScreen==="register"?"linear-gradient(135deg,#22c55e,#16a34a)":"transparent",color:authScreen==="register"?"#000":"#5a6480",fontWeight:800,fontSize:13,transition:"all .25s",boxShadow:authScreen==="register"?"0 4px 16px rgba(34,197,94,.4)":"none"}}>
              Cadastrar
            </button>
          </div>

          {/* FORM */}
          <div style={{background:"#0f1015",borderRadius:22,padding:"22px 20px",border:"1px solid #1e2235",boxShadow:"0 24px 64px rgba(0,0,0,.6)"}}>

            {authScreen==="login"&&(
              <div>
                <div style={{fontSize:16,fontWeight:800,color:"#f0f4ff",marginBottom:4}}>Bem-vindo de volta! 👋</div>
                <div style={{fontSize:11,color:"#5a6480",marginBottom:18}}>Entre com seu nome e senha</div>
                {/* nome */}
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:10,color:"#5a6480",fontWeight:700,marginBottom:5}}>SEU NOME</div>
                  <input value={loginNome} onChange={function(e){setLoginNome(e.target.value);setAuthErr("");}}
                    placeholder="Ex: Marcos"
                    style={{width:"100%",background:"#151720",border:"1px solid #1e2235",borderRadius:12,padding:"13px 14px",fontSize:15,color:"#f0f4ff",fontWeight:600}}/>
                </div>
                {/* senha */}
                <div style={{marginBottom:18}}>
                  <div style={{fontSize:10,color:"#5a6480",fontWeight:700,marginBottom:5}}>SENHA</div>
                  <div style={{position:"relative"}}>
                    <input type={showPass?"text":"password"} value={loginSenha} onChange={function(e){setLoginSenha(e.target.value);setAuthErr("");}}
                      onKeyDown={function(e){if(e.key==="Enter")doLogin();}}
                      placeholder="Sua senha"
                      style={{width:"100%",background:"#151720",border:"1px solid #1e2235",borderRadius:12,padding:"13px 44px 13px 14px",fontSize:15,color:"#f0f4ff",fontWeight:600}}/>
                    <button onClick={function(){setShowPass(!showPass);}} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"transparent",border:"none",fontSize:16,color:"#5a6480"}}>
                      {showPass?"🙈":"👁"}
                    </button>
                  </div>
                </div>
                {authErr&&<div style={{background:"#ef444422",border:"1px solid #ef444455",borderRadius:10,padding:"8px 12px",fontSize:11,color:"#ef4444",marginBottom:12}}>{authErr}</div>}
                <button onClick={doLogin}
                  style={{width:"100%",padding:"14px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#22c55e,#16a34a)",color:"#000",fontWeight:900,fontSize:15,boxShadow:"0 6px 24px rgba(34,197,94,.4)"}}>
                  Entrar →
                </button>
                <button onClick={function(){setAuthScreen("register");setAuthErr("");}}
                  style={{width:"100%",marginTop:10,padding:"10px",borderRadius:12,border:"none",background:"transparent",color:"#5a6480",fontSize:11}}>
                  Não tem conta? <span style={{color:"#22c55e",fontWeight:700}}>Cadastre-se grátis</span>
                </button>
                <button onClick={function(){setAuthScreen("recover");setAuthErr("");setRecStep(1);setRecCode("");setRecNewSenha("");}}
                  style={{width:"100%",marginTop:4,padding:"8px",borderRadius:10,border:"none",background:"transparent",color:"#5a6480",fontSize:11}}>
                  🔑 Esqueci minha senha
                </button>
              </div>
            )}

            {authScreen==="register"&&(
              <div>
                <div style={{fontSize:16,fontWeight:800,color:"#f0f4ff",marginBottom:4}}>Criar sua conta 🚀</div>
                <div style={{fontSize:11,color:"#5a6480",marginBottom:18}}>Preencha para começar</div>
                {/* nome */}
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:10,color:"#5a6480",fontWeight:700,marginBottom:5}}>SEU NOME *</div>
                  <input value={regNome} onChange={function(e){setRegNome(e.target.value);setAuthErr("");}}
                    placeholder="Ex: Marcos Silva"
                    style={{width:"100%",background:"#151720",border:"1px solid #1e2235",borderRadius:12,padding:"12px 14px",fontSize:14,color:"#f0f4ff",fontWeight:600}}/>
                </div>
                {/* telefone para recuperação */}
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:10,color:"#5a6480",fontWeight:700,marginBottom:5}}>TELEFONE (WhatsApp)</div>
                  <input type="tel" value={recTel} onChange={function(e){setRecTel(e.target.value);setAuthErr("");}}
                    placeholder="Ex: 98 99999-9999"
                    style={{width:"100%",background:"#151720",border:"1px solid #1e2235",borderRadius:12,padding:"12px 14px",fontSize:14,color:"#f0f4ff",fontWeight:600}}/>
                  <div style={{fontSize:9,color:"#5a6480",marginTop:4}}>Usado para recuperar sua senha via WhatsApp</div>
                </div>
                {/* cargo */}
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:10,color:"#5a6480",fontWeight:700,marginBottom:5}}>CARGO / FUNÇÃO</div>
                  <input value={regCargo} onChange={function(e){setRegCargo(e.target.value);setAuthErr("");}}
                    placeholder="Ex: Vendedor, Consultor..."
                    style={{width:"100%",background:"#151720",border:"1px solid #1e2235",borderRadius:12,padding:"12px 14px",fontSize:14,color:"#f0f4ff",fontWeight:600}}/>
                </div>
                {/* senha */}
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:10,color:"#5a6480",fontWeight:700,marginBottom:5}}>SENHA *</div>
                  <div style={{position:"relative"}}>
                    <input type={showPass?"text":"password"} value={regSenha} onChange={function(e){setRegSenha(e.target.value);setAuthErr("");}}
                      placeholder="Mínimo 4 caracteres"
                      style={{width:"100%",background:"#151720",border:"1px solid #1e2235",borderRadius:12,padding:"12px 44px 12px 14px",fontSize:14,color:"#f0f4ff",fontWeight:600}}/>
                    <button onClick={function(){setShowPass(!showPass);}} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"transparent",border:"none",fontSize:16,color:"#5a6480"}}>{showPass?"🙈":"👁"}</button>
                  </div>
                </div>
                {/* confirmar senha */}
                <div style={{marginBottom:18}}>
                  <div style={{fontSize:10,color:"#5a6480",fontWeight:700,marginBottom:5}}>CONFIRMAR SENHA *</div>
                  <input type={showPass?"text":"password"} value={regSenha2} onChange={function(e){setRegSenha2(e.target.value);setAuthErr("");}}
                    onKeyDown={function(e){if(e.key==="Enter")doRegister();}}
                    placeholder="Repita a senha"
                    style={{width:"100%",background:"#151720",border:"1px solid "+(regSenha2&&regSenha!==regSenha2?"#ef4444":"#1e2235"),borderRadius:12,padding:"12px 14px",fontSize:14,color:"#f0f4ff",fontWeight:600}}/>
                  {regSenha2&&regSenha!==regSenha2&&<div style={{fontSize:10,color:"#ef4444",marginTop:4}}>As senhas não coincidem</div>}
                </div>
                {authErr&&<div style={{background:"#ef444422",border:"1px solid #ef444455",borderRadius:10,padding:"8px 12px",fontSize:11,color:"#ef4444",marginBottom:12}}>{authErr}</div>}
                <button onClick={doRegister}
                  style={{width:"100%",padding:"14px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#22c55e,#16a34a)",color:"#000",fontWeight:900,fontSize:15,boxShadow:"0 6px 24px rgba(34,197,94,.4)"}}>
                  Criar conta ✓
                </button>
                <button onClick={function(){setAuthScreen("login");setAuthErr("");}}
                  style={{width:"100%",marginTop:10,padding:"10px",borderRadius:12,border:"none",background:"transparent",color:"#5a6480",fontSize:11}}>
                  Já tem conta? <span style={{color:"#22c55e",fontWeight:700}}>Entrar</span>
                </button>
              </div>
            )}
          </div>

          {/* ── RECUPERAR SENHA ── */}
          {authScreen==="recover"&&(
            <div style={{background:"#0f1015",borderRadius:22,padding:"22px 20px",border:"1px solid #1e2235",boxShadow:"0 24px 64px rgba(0,0,0,.6)"}}>
              <div style={{fontSize:16,fontWeight:800,color:"#f0f4ff",marginBottom:4}}>Recuperar Senha 🔑</div>
              {recStep===1&&(
                <div>
                  <div style={{fontSize:11,color:"#5a6480",marginBottom:16}}>Informe seu WhatsApp cadastrado</div>
                  <div style={{marginBottom:14}}>
                    <div style={{fontSize:10,color:"#5a6480",fontWeight:700,marginBottom:5}}>SEU WHATSAPP</div>
                    <input type="tel" value={recTel} onChange={function(e){setRecTel(e.target.value);setAuthErr("");}}
                      placeholder="Ex: 98 99999-9999"
                      style={{width:"100%",background:"#151720",border:"1px solid #1e2235",borderRadius:12,padding:"13px 14px",fontSize:15,color:"#f0f4ff",fontWeight:600}}/>
                  </div>
                  {authErr&&<div style={{background:"#ef444422",border:"1px solid #ef444455",borderRadius:10,padding:"8px 12px",fontSize:11,color:"#ef4444",marginBottom:12}}>{authErr}</div>}
                  <button onClick={function(){
                    var saved=loadLS("m360auth",null);
                    if(!saved||!saved.tel){ setAuthErr("Telefone não encontrado. Cadastre-se primeiro."); return; }
                    var tel1=recTel.replace(/[^0-9]/g,"");
                    var tel2=(saved.tel||"").replace(/[^0-9]/g,"");
                    if(tel1!==tel2){ setAuthErr("Telefone não confere com o cadastro."); return; }
                    var code=String(Math.floor(1000+Math.random()*9000));
                    setRecCodeGen(code);
                    setRecStep(2);
                    /* link WhatsApp com o código */
                    var msg=encodeURIComponent("meta360 - Codigo de recuperacao: "+code+". Use este codigo para redefinir sua senha.");
                    var waTel=tel1.length===11?"55"+tel1:"55"+tel1;
                    window.open("https://wa.me/"+waTel+"?text="+msg,"_blank");
                  }}
                    style={{width:"100%",padding:"13px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#22c55e,#16a34a)",color:"#000",fontWeight:900,fontSize:14,boxShadow:"0 6px 20px rgba(34,197,94,.35)"}}>
                    Enviar código no WhatsApp 💬
                  </button>
                  <button onClick={function(){setAuthScreen("login");setAuthErr("");setRecStep(1);}}
                    style={{width:"100%",marginTop:8,padding:"9px",borderRadius:10,border:"none",background:"transparent",color:"#5a6480",fontSize:11}}>← Voltar</button>
                </div>
              )}
              {recStep===2&&(
                <div>
                  <div style={{fontSize:11,color:"#5a6480",marginBottom:16}}>Digite o código recebido no WhatsApp</div>
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:10,color:"#5a6480",fontWeight:700,marginBottom:5}}>CÓDIGO DE 4 DÍGITOS</div>
                    <input type="text" inputMode="numeric" value={recCode} onChange={function(e){setRecCode(e.target.value.replace(/[^0-9]/g,"").slice(0,4));setAuthErr("");}}
                      placeholder="1234" maxLength={4}
                      style={{width:"100%",background:"#151720",border:"1px solid #22c55e44",borderRadius:12,padding:"13px 14px",fontSize:28,color:"#22c55e",fontWeight:900,textAlign:"center",letterSpacing:12}}/>
                  </div>
                  <div style={{marginBottom:14}}>
                    <div style={{fontSize:10,color:"#5a6480",fontWeight:700,marginBottom:5}}>NOVA SENHA</div>
                    <input type="password" value={recNewSenha} onChange={function(e){setRecNewSenha(e.target.value);setAuthErr("");}}
                      placeholder="Mínimo 4 caracteres"
                      style={{width:"100%",background:"#151720",border:"1px solid #1e2235",borderRadius:12,padding:"13px 14px",fontSize:14,color:"#f0f4ff",fontWeight:600}}/>
                  </div>
                  {authErr&&<div style={{background:"#ef444422",border:"1px solid #ef444455",borderRadius:10,padding:"8px 12px",fontSize:11,color:"#ef4444",marginBottom:12}}>{authErr}</div>}
                  <button onClick={function(){
                    if(recCode!==recCodeGen){ setAuthErr("Código incorreto. Verifique o WhatsApp."); return; }
                    if(!recNewSenha||recNewSenha.length<4){ setAuthErr("Senha deve ter pelo menos 4 caracteres."); return; }
                    var saved=loadLS("m360auth",null);
                    if(saved){ saveLS("m360auth",Object.assign({},saved,{senha:recNewSenha})); }
                    setAuthErr(""); setAuthScreen("login"); setRecStep(1); setRecCode(""); setRecNewSenha("");
                    setAuthErr(""); setAuthScreen("login");
                  }}
                    style={{width:"100%",padding:"13px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#22c55e,#16a34a)",color:"#000",fontWeight:900,fontSize:14}}>
                    Salvar nova senha ✓
                  </button>
                  <div style={{display:"flex",gap:8,marginTop:8}}>
                    <button onClick={function(){setRecStep(1);setRecCode("");}}
                      style={{flex:1,padding:"9px",borderRadius:10,border:"none",background:"transparent",color:"#5a6480",fontSize:11}}>← Reenviar</button>
                    <button onClick={function(){setAuthScreen("login");setAuthErr("");setRecStep(1);}}
                      style={{flex:1,padding:"9px",borderRadius:10,border:"none",background:"transparent",color:"#5a6480",fontSize:11}}>Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* rodapé */}
          <div style={{textAlign:"center",marginTop:20,fontSize:10,color:"#2a3040"}}>meta360 · Seu desempenho em 360° 🎯</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'Sora',sans-serif",paddingBottom:120,maxWidth:420,margin:"0 auto",position:"relative",overflow:"hidden"}}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&display=swap'); *{box-sizing:border-box;margin:0;padding:0} button{cursor:pointer;font-family:inherit} input{font-family:inherit} input:focus{outline:none} .tap{transition:transform .1s} .tap:active{transform:scale(.95)} @keyframes fUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}} @keyframes fSym{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}} .fu{animation:fUp .3s ease forwards} .sym{animation:fSym 6s ease-in-out infinite}"}</style>

      {/* BG */}
      <div style={{position:"fixed",inset:0,maxWidth:420,left:"50%",transform:"translateX(-50%)",pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,background:C.bg}}/>
        <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(34,197,94,.015) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,.015) 1px,transparent 1px)",backgroundSize:"28px 28px"}}/>
        {BG_SYMS.map(function(s,i){ return <div key={i} className="sym" style={{position:"absolute",left:s.x+"%",top:s.y+"%",fontSize:22,opacity:s.op,userSelect:"none",animationDelay:(i*.7%4)+"s"}}>{s.s}</div>; })}
      </div>

      {/* Goal anim */}
      {goalAnim && <GoalAnimation level={goalAnim} onClose={function(){setGoalAnim(null);}} onGoHome={function(){setPage("home");}} nome={nome} metas={metasCalc} />}

      {/* ══ HOME ══ */}
      {page==="home" && (
        <div className="fu" style={{position:"relative",zIndex:1}}>
          {/* topbar */}
          <div style={{padding:"48px 20px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer"}} onClick={function(){setPage("config");}}>
              {foto
                ? <img src={foto} alt="f" style={{width:46,height:46,borderRadius:"50%",objectFit:"cover",border:"2.5px solid "+bc}}/>
                : <div style={{width:46,height:46,borderRadius:"50%",background:"linear-gradient(135deg,#16a34a,#22c55e)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:900,color:"#000",border:"2.5px solid "+bc}}>{nome.charAt(0).toUpperCase()}</div>
              }
              <div>
                <div style={{fontSize:10,color:C.muted}}>Olá 👋</div>
                <div style={{fontSize:16,fontWeight:800,lineHeight:1.2}}>{nome}</div>
                <div style={{fontSize:10,color:bc,fontWeight:600}}>{cargo}</div>
              </div>
            </div>
            <div style={{background:C.card2,border:"1px solid "+(nivelAtingido||metasCalc[0]).color+"44",borderRadius:10,padding:"5px 10px",fontSize:10,fontWeight:700,color:(nivelAtingido||metasCalc[0]).color}}>
              {(nivelAtingido||metasCalc[0]).label}
            </div>
          </div>



          {/* hero */}
          <div style={{margin:"0 20px",borderRadius:22,padding:"20px",background:"linear-gradient(135deg,"+bc+" 0%,"+bc+"cc 100%)",position:"relative",overflow:"hidden",boxShadow:"0 14px 40px "+bc+"44"}}>
            <div style={{position:"absolute",right:-30,top:-30,width:130,height:130,borderRadius:"50%",background:"rgba(255,255,255,.12)"}}/>
            <div style={{position:"relative"}}>
              {/* topo: % ring + label período */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{fontSize:9,color:"rgba(0,0,0,.55)",fontWeight:700,letterSpacing:1}}>FATURAMENTO {period.label.toUpperCase()}</div>
                {/* ring compacto */}
                <div style={{position:"relative",width:50,height:50,flexShrink:0}}>
                  <svg width="50" height="50" viewBox="0 0 50 50" style={{transform:"rotate(-90deg)"}}>
                    <circle cx="25" cy="25" r="19" fill="none" stroke="rgba(0,0,0,.15)" strokeWidth="5"/>
                    <circle cx="25" cy="25" r="19" fill="none" stroke="rgba(0,0,0,.38)" strokeWidth="5"
                      strokeDasharray={String(2*Math.PI*19*pct100/100)+" "+String(2*Math.PI*19)}
                      strokeLinecap="round" style={{transition:"stroke-dasharray 1s ease"}}/>
                  </svg>
                  <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                    <div style={{fontSize:11,fontWeight:900,color:"rgba(0,0,0,.75)",lineHeight:1}}>{Math.round(pct100)}%</div>
                  </div>
                </div>
              </div>

              {/* META em destaque grande */}
              <div style={{marginBottom:6}}>
                <div style={{fontSize:9,color:"rgba(0,0,0,.5)",fontWeight:600,letterSpacing:1,marginBottom:2}}>META DO PERÍODO</div>
                <div style={{fontSize:36,fontWeight:900,color:"rgba(0,0,0,.85)",letterSpacing:-1,lineHeight:1}}>{fR(metasCalc[0].valorRS)}</div>
              </div>

              {/* divisor */}
              <div style={{height:1,background:"rgba(0,0,0,.15)",marginBottom:8}}/>

              {/* VENDIDO em tamanho médio */}
              <div style={{marginBottom:6}}>
                <div style={{fontSize:9,color:"rgba(0,0,0,.5)",fontWeight:600,letterSpacing:1,marginBottom:2}}>VENDIDO</div>
                <div style={{display:"flex",alignItems:"baseline",gap:8}}>
                  <div style={{fontSize:22,fontWeight:900,color:"#000",letterSpacing:-0.5,lineHeight:1}}>{fR(totalRS)}</div>
                  <div style={{fontSize:11,fontWeight:700,color:"rgba(0,0,0,.5)"}}>de {fRk(metasCalc[0].valorRS)}</div>
                </div>
              </div>
              {/* bar */}
              <div style={{marginTop:10,height:5,background:"rgba(0,0,0,.15)",borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",width:pct100+"%",background:"rgba(0,0,0,.35)",borderRadius:3,transition:"width .8s"}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:5}}>
                <span style={{fontSize:10,fontWeight:800,color:"rgba(0,0,0,.6)"}}>{pct100.toFixed(1)}%{proxNivel?" → "+proxNivel.label:" 🏆"}</span>
                <span style={{fontSize:10,fontWeight:700,color:"rgba(0,0,0,.5)"}}>{difRS>=0?"▲":"▼"} {fRk(Math.abs(difRS))}</span>
              </div>
              {/* 3 cards: falta + diária + projeção */}
              <div style={{marginTop:10,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                <div style={{background:"rgba(0,0,0,.18)",borderRadius:11,padding:"8px 9px"}}>
                  <div style={{fontSize:7,color:"rgba(0,0,0,.5)",fontWeight:700,marginBottom:2}}>FALTA META</div>
                  <div style={{fontSize:14,fontWeight:900,color:"rgba(0,0,0,.8)",lineHeight:1}}>{metasCalc[0].restRS>0?fRk(metasCalc[0].restRS):"✅"}</div>
                </div>
                <div style={{background:"rgba(0,0,0,.18)",borderRadius:11,padding:"8px 9px"}}>
                  <div style={{fontSize:7,color:"rgba(0,0,0,.5)",fontWeight:700,marginBottom:2}}>DIÁRIA ↺</div>
                  <div style={{fontSize:14,fontWeight:900,color:"rgba(0,0,0,.8)",lineHeight:1}}>{diasRest>0?fRk(metasCalc[0].novaDRS):"—"}</div>
                </div>
                <div style={{background:"rgba(0,0,0,.25)",borderRadius:11,padding:"8px 9px",border:"1px solid rgba(0,0,0,.15)"}}>
                  <div style={{fontSize:7,color:"rgba(0,0,0,.55)",fontWeight:700,marginBottom:2}}>PROJEÇÃO</div>
                  <div style={{fontSize:12,fontWeight:900,color:"rgba(0,0,0,.9)",lineHeight:1}}>{fRk(projecao)}</div>
                  <div style={{fontSize:7,color:"rgba(0,0,0,.45)",marginTop:2}}>{projecao>=metasCalc[0].valorRS?"✅ vai bater":"⚠️ abaixo"}</div>
                </div>
              </div>
            </div>
          </div>



          {/* períodos */}
          <div style={{margin:"10px 20px 0",display:"flex",gap:8}}>
            {PERIODS.map(function(p){ return (
              <button key={p.id} onClick={function(){setCfg({periodId:p.id});}}
                style={{flex:1,padding:"8px 4px",borderRadius:11,border:"1px solid "+(periodId===p.id?C.lime:C.border),background:periodId===p.id?C.lime:C.card2,color:periodId===p.id?"#000":C.muted,fontSize:10,fontWeight:700}}>
                {p.label}
              </button>
            ); })}
          </div>

          {/* 4 metas — layout horizontal scroll */}
          <div style={{margin:"12px 0 0"}}>
            <div style={{fontSize:12,fontWeight:800,marginBottom:8,display:"flex",justifyContent:"space-between",padding:"0 20px"}}>
              <span>Metas em Cascata</span><span style={{fontSize:9,color:C.muted}}>+10% cada nível</span>
            </div>
            {/* scroll horizontal */}
            <div style={{display:"flex",gap:10,overflowX:"auto",paddingLeft:20,paddingRight:20,paddingBottom:6}}>
              {metasCalc.map(function(g,i){
                var eA=proxNivel&&proxNivel.id===g.id;
                var medalhas=["🥇","🥉","🥈","🏅"];
                var pctLabels=["100%","110%","120%","130%"];
                var medalha=medalhas[i];
                var pctLabel=pctLabels[i];
                return (
                  <div key={g.id} style={{flexShrink:0,width:160,background:g.atingiu?g.color+"16":C.card,border:"2px solid "+(g.atingiu?g.color:eA?g.color+"55":C.border),borderRadius:18,padding:"13px 13px 10px",position:"relative",overflow:"hidden"}}>
                    {/* glow de fundo quando atingido */}
                    {g.atingiu&&<div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 80% 20%,"+g.color+"18,transparent 70%)",pointerEvents:"none"}}/>}
                    {/* badge ATUAL ou ✅ */}
                    {g.atingiu&&<div style={{position:"absolute",top:8,right:8,fontSize:14}}>✅</div>}
                    {eA&&!g.atingiu&&<div style={{position:"absolute",top:7,right:7,fontSize:8,color:g.color,fontWeight:800,background:g.color+"25",padding:"2px 6px",borderRadius:5,letterSpacing:.5}}>ATUAL</div>}

                    {/* medalha + label */}
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                      <div style={{fontSize:22,lineHeight:1}}>{medalha}</div>
                      <div>
                        <div style={{fontSize:11,fontWeight:800,color:g.atingiu?g.color:eA?g.color:C.muted,lineHeight:1}}>{g.label}</div>
                        <div style={{fontSize:9,color:C.muted,fontWeight:600}}>{pctLabel}</div>
                      </div>
                    </div>

                    {/* valor meta */}
                    <div style={{fontSize:17,fontWeight:900,color:g.atingiu?g.color:C.text,letterSpacing:-0.5,lineHeight:1,marginBottom:8}}>{fRk(g.valorRS)}</div>

                    {/* diária orig */}
                    <div style={{background:C.card2,borderRadius:8,padding:"5px 8px",border:"1px solid "+C.border,marginBottom:4}}>
                      <div style={{fontSize:7,color:C.muted,fontWeight:600,marginBottom:1}}>DIÁRIA</div>
                      <div style={{fontSize:11,fontWeight:800,color:C.muted}}>{fRk(g.diarRS)}</div>
                    </div>

                    {/* diária hoje redistribuída */}
                    {!g.atingiu&&(
                      <div style={{background:g.color+"12",borderRadius:8,padding:"5px 8px",border:"1px solid "+g.color+"33",marginBottom:4}}>
                        <div style={{fontSize:7,color:g.color,fontWeight:700,marginBottom:1}}>↺ HOJE</div>
                        <div style={{fontSize:11,fontWeight:900,color:g.novaDRS>g.diarRS?C.red:C.green}}>{diasRest>0?fRk(g.novaDRS):"—"}</div>
                      </div>
                    )}

                    {/* comissão */}
                    <div style={{marginTop:2}}>
                      <div style={{fontSize:7,color:C.muted,fontWeight:600}}>COMISSÃO {(g.com*100).toFixed(1)}%</div>
                      <div style={{fontSize:13,fontWeight:900,color:g.atingiu?g.color:g.color+"99",lineHeight:1,marginTop:1}}>{fR(g.comRS)}</div>
                    </div>

                    {/* barra progresso */}
                    <div style={{height:3,background:C.muted2,borderRadius:2,overflow:"hidden",marginTop:7}}>
                      <div style={{height:"100%",width:g.pctG+"%",background:g.color,borderRadius:2,transition:"width .5s"}}/>
                    </div>
                    <div style={{fontSize:8,color:g.atingiu?g.color:C.muted,fontWeight:700,textAlign:"right",marginTop:2}}>{g.pctG.toFixed(0)}%</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* comissão destaque + streak */}
          <div style={{margin:"12px 20px 0",background:C.card,border:"1px solid "+(taxaAtual===0.02?C.lime+"55":C.border),borderRadius:18,padding:"16px",position:"relative",overflow:"hidden"}}>
            {taxaAtual===0.02&&<div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 90% 10%,"+C.lime+"10,transparent 60%)",pointerEvents:"none"}}/>}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div>
                <div style={{fontSize:9,color:C.muted,fontWeight:700,letterSpacing:1}}>COMISSÃO ATUAL</div>
                <div style={{fontSize:28,fontWeight:900,color:C.lime,lineHeight:1,marginTop:4,letterSpacing:-0.5}}>{fR(comissaoAtual)}</div>
                <div style={{display:"flex",alignItems:"center",gap:6,marginTop:6}}>
                  <div style={{background:taxaAtual===0.02?C.lime+"22":C.muted2,borderRadius:6,padding:"3px 9px",fontSize:10,fontWeight:900,color:taxaAtual===0.02?C.lime:C.muted}}>{(taxaAtual*100).toFixed(0)}%</div>
                  <div style={{fontSize:10,color:taxaAtual===0.02?C.lime:C.muted,fontWeight:600}}>{taxaAtual===0.01?"→ 2% ao bater a meta":"🏆 Meta batida!"}</div>
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{display:"flex",alignItems:"center",gap:6,justifyContent:"flex-end"}}>
                  <div style={{fontSize:22}}>🔥</div>
                  <div><div style={{fontSize:20,fontWeight:900,color:C.amber,lineHeight:1}}>{streak}</div><div style={{fontSize:8,color:C.muted}}>dias seguidos</div></div>
                </div>
              </div>
            </div>
            <div style={{height:5,background:C.muted2,borderRadius:3,overflow:"hidden",marginBottom:5}}>
              <div style={{height:"100%",width:Math.min(100,pct100)+"%",background:taxaAtual===0.02?"linear-gradient(90deg,"+C.lime+",#16a34a)":"linear-gradient(90deg,"+C.amber+",#d97706)",borderRadius:3,transition:"width .8s",boxShadow:"0 0 8px "+(taxaAtual===0.02?C.lime:C.amber)+"66"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:C.muted}}>
              <span>{pct100.toFixed(1)}% da meta</span>
              <span>{taxaAtual===0.01?"Faltam "+fRk(metasCalc[0].restRS)+" para 2%":diasRest+"d restantes"}</span>
            </div>
          </div>


        </div>
      )}

      {/* ══ CALENDAR ══ */}
      {page==="calendar"&&(
        <div className="fu" style={{position:"relative",zIndex:1,padding:"52px 20px 0"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
            <div><div style={{fontSize:22,fontWeight:800}}>{MESES[mes]}</div><div style={{fontSize:9,color:C.muted,marginTop:1}}>Toque = Lançar · Segure = Folga</div></div>
            <button onClick={function(){setModoFolga(!modoFolga);}} style={{background:modoFolga?C.amber:C.card2,border:"1px solid "+(modoFolga?C.amber:C.border),borderRadius:10,padding:"6px 10px",fontSize:10,fontWeight:700,color:modoFolga?"#000":C.muted}}>
              {modoFolga?"✓ Folgas":"🗓 Folga"}
            </button>
          </div>
          <div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:4,marginBottom:10}}>
            {MS.map(function(m,i){ return <button key={i} onClick={function(){setCfg({mes:i});}} style={{flexShrink:0,padding:"4px 10px",borderRadius:16,border:"1px solid "+(mes===i?C.lime:C.border),background:mes===i?C.lime:"transparent",color:mes===i?"#000":C.muted,fontSize:9,fontWeight:700}}>{m}</button>; })}
          </div>
          {modoFolga&&<div style={{background:C.amber+"14",border:"1px solid "+C.amber+"44",borderRadius:12,padding:"9px 13px",marginBottom:10,fontSize:11,color:C.amber}}>🗓 Modo folga ativo</div>}
          <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:18,padding:12}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:6}}>
              {["D","S","T","Q","Q","S","S"].map(function(d,i){ return <div key={i} style={{textAlign:"center",fontSize:8,color:i===0?"#b45309":C.muted,fontWeight:700,padding:"3px 0"}}>{d}</div>; })}
            </div>
            {(function(){
              var cells=[];
              var off=dow(ano,mes,1);
              for(var oi=0;oi<off;oi++) cells.push(<div key={"o"+oi}/>);
              for(var cd=1;cd<=diasNoMes;cd++){
                var ds=dsk(cd);
                var isDomD=isDom(ds),isSabD=isSab(ds),isFolgaD=isFolga(ds),isFerD=isFer(ds);
                var af=altoFluxo[ds]||null;
                var rs=vendas[ds]; /* já em R$ */
                var isH=cd===hoje.getDate()&&mes===hoje.getMonth()&&ano===hoje.getFullYear();
                var ntrab=isDomD||isSabD||isFolgaD||isFerD;
                var bg=C.card2,bdr="1px solid "+C.border,numC=C.muted;
                if(af&&!ntrab){ bg=af.nivel==="critico"?"#ef444418":C.amber+"14"; bdr="1px solid "+(af.nivel==="critico"?"#ef444455":C.amber+"44"); numC=af.nivel==="critico"?C.red:C.amber; }
                if(isDomD){bg="#1a0800";numC="#b45309";bdr="1px solid #2a1200";}
                else if(isFerD){bg="#190a20";numC="#a855f7";bdr="1px solid #2d1040";}
                else if(isSabD){bg="#0d0d18";numC="#4338ca";bdr="1px solid #1a1830";}
                else if(isFolgaD){bg="#1a1400";numC=C.amber;bdr="1px solid "+C.amber+"40";}
                else if(rs!==undefined){
                  if(rs>=metasCalc[0].diarRS){bg=C.lime+"16";bdr="1px solid "+C.lime+"44";numC=C.lime;}
                  else{bg=C.amber+"10";bdr="1px solid "+C.amber+"30";numC=C.amber;}
                }
                if(isH){bg=C.lime;bdr="2px solid "+C.lime;numC="#000";}
                var capD=cd; /* capture */
                cells.push(
                  <div key={cd} className="tap"
                    onClick={function(){
                      if(modoFolga&&!isDomD&&!isSabD){ togFolga(ds); return; }
                      if(isFerD){ setFerModal({dia:cd,nome:feriados[ds],af:altoFluxo[ds]||null}); return; }
                      abrirEd(ds);
                    }}
                    onContextMenu={function(e){e.preventDefault();if(!isDomD&&!isSabD)togFolga(ds);}}
                    style={{background:bg,border:bdr,borderRadius:8,padding:"4px 2px",textAlign:"center",minHeight:46,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:(ntrab&&!modoFolga)?"default":"pointer",position:"relative"}}>
                    {isFerD&&<div style={{position:"absolute",top:1,right:2,width:4,height:4,borderRadius:"50%",background:"#a855f7"}}/>}
                    {af&&!ntrab&&<div style={{position:"absolute",top:1,left:2,fontSize:7}}>{af.nivel==="critico"?"🔥":"⚡"}</div>}
                    <div style={{fontSize:10,fontWeight:isH?800:500,color:numC,lineHeight:1}}>{cd}</div>
                    {isDomD&&<div style={{fontSize:6,color:"#b45309"}}>DOM</div>}
                    {isSabD&&!isDomD&&<div style={{fontSize:6,color:"#4338ca"}}>SAB</div>}
                    {isFerD&&!isDomD&&!isSabD&&<div style={{fontSize:6,color:"#a855f7"}}>FER</div>}
                    {isFolgaD&&!isDomD&&!isSabD&&<div style={{fontSize:6,color:C.amber}}>FOLGA</div>}
                    {rs!==undefined&&!ntrab&&(
                      <div style={{textAlign:"center"}}>
                        <div style={{fontSize:8,fontWeight:900,color:numC,lineHeight:1,marginTop:1}}>{fRk(rs).replace("R$","")}</div>
                        <div style={{fontSize:6,color:numC,fontWeight:700,marginTop:1}}>{rs>=metasCalc[0].diarRS?"✓":""}</div>
                      </div>
                    )}
                    {rs===undefined&&!ntrab&&ds<=limHoje&&(
                      <div style={{fontSize:6,fontWeight:800,color:"#ef4444",marginTop:2,background:"#ef444420",borderRadius:3,padding:"1px 3px",lineHeight:1.3}}>FALTA</div>
                    )}
                    {/* emoji de sazonalidade no dia */}
                    {altoFluxo[ds]&&altoFluxo[ds].emoji&&(
                      <div style={{fontSize:8,lineHeight:1,marginTop:1,textAlign:"center"}}>{altoFluxo[ds].emoji}</div>
                    )}
                  </div>
                );
              }
              return <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>{cells}</div>;
            })()}
            <div style={{display:"flex",gap:8,flexWrap:"wrap",fontSize:8,marginTop:10,color:C.muted}}>
              <span style={{color:C.lime}}>■ Meta</span><span style={{color:C.amber}}>■ Abaixo</span><span style={{color:"#b45309"}}>■ Dom</span><span style={{color:"#4338ca"}}>■ Sáb</span><span style={{color:"#a855f7"}}>■ Feriado</span><span>🔥 Alto fluxo</span>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL FERIADO — com opções de folga e lançar venda ═══ */}
      {ferModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,backdropFilter:"blur(10px)",padding:"0 28px"}}
          onClick={function(){setFerModal(null);}}>
          <div className="fu" style={{background:C.card,borderRadius:24,padding:"24px 22px 20px",width:"100%",maxWidth:340,border:"1px solid #2d1040",boxShadow:"0 24px 64px rgba(0,0,0,.8)"}}
            onClick={function(e){e.stopPropagation();}}>
            {/* ícone + nome */}
            <div style={{textAlign:"center",marginBottom:16}}>
              <div style={{width:56,height:56,borderRadius:"50%",background:"#190a20",border:"2px solid #a855f7",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,margin:"0 auto 12px"}}>
                {(function(){
                  var n=ferModal.nome||"";
                  if(n.indexOf("Natal")>=0) return "🎄";
                  if(n.indexOf("Páscoa")>=0) return "🥚";
                  if(n.indexOf("Carnaval")>=0) return "🎭";
                  if(n.indexOf("Independência")>=0) return "🇧🇷";
                  if(n.indexOf("Trabalho")>=0) return "⚒️";
                  if(n.indexOf("Tiradentes")>=0) return "⚔️";
                  if(n.indexOf("Corpus")>=0) return "✝️";
                  if(n.indexOf("Finados")>=0) return "🕯️";
                  if(n.indexOf("República")>=0) return "🏛️";
                  if(n.indexOf("Consciência")>=0) return "✊";
                  if(n.indexOf("Aparecida")>=0||n.indexOf("Nazaré")>=0||n.indexOf("São")>=0) return "⛪";
                  if(n.indexOf("Confraternização")>=0) return "🎉";
                  return "🏛️";
                })()}
              </div>
              <div style={{fontSize:10,color:"#a855f7",fontWeight:700,letterSpacing:2,marginBottom:5}}>FERIADO · DIA {ferModal.dia}</div>
              <div style={{fontSize:22,fontWeight:900,color:C.text,lineHeight:1.2}}>{ferModal.nome}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:4}}>{MESES[mes]} de {ano}</div>
            </div>
            {/* alto fluxo */}
            {ferModal.af&&(
              <div style={{marginBottom:14,background:ferModal.af.nivel==="critico"?"#ef444416":C.amber+"16",border:"1px solid "+(ferModal.af.nivel==="critico"?"#ef444444":C.amber+"44"),borderRadius:12,padding:"9px 12px",display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:16}}>{ferModal.af.nivel==="critico"?"🔥":"⚡"}</span>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:ferModal.af.nivel==="critico"?C.red:C.amber}}>{ferModal.af.label}</div>
                  <div style={{fontSize:9,color:C.muted}}>Data de alto fluxo no varejo</div>
                </div>
              </div>
            )}
            {/* ações */}
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {/* marcar/desmarcar folga */}
              <button onClick={function(){
                var ds2=dsk(ferModal.dia);
                togFolga(ds2);
                setFerModal(null);
              }} style={{padding:"13px",borderRadius:14,border:"1px solid "+C.amber+"55",background:isFolga(dsk(ferModal.dia))?C.amber+"22":C.card2,color:isFolga(dsk(ferModal.dia))?C.amber:C.muted,fontWeight:700,fontSize:13}}>
                {isFolga(dsk(ferModal.dia))?"✓ Folga marcada — remover":"🗓 Marcar como Folga"}
              </button>
              {/* lançar venda (mesmo sendo feriado, pode ter trabalhado) */}
              <button onClick={function(){
                var ds2=dsk(ferModal.dia);
                setFerModal(null);
                setEditando(ds2);
                setInputVal(vendas[ds2]!==undefined?String(vendas[ds2]):"");
              }} style={{padding:"13px",borderRadius:14,border:"1px solid "+C.lime+"44",background:C.lime+"12",color:C.lime,fontWeight:700,fontSize:13}}>
                📋 Lançar vendas neste dia
              </button>
              <button onClick={function(){setFerModal(null);}}
                style={{padding:"11px",borderRadius:14,border:"1px solid "+C.border,background:"transparent",color:C.muted,fontWeight:600,fontSize:12}}>
                Fechar
              </button>
            </div>
          </div>

          {/* sazonalidades do mês */}
          {(function(){
            var eventos={};
            for(var di=1;di<=diasNoMes;di++){
              var ds2=dsk(di);
              if(altoFluxo[ds2]&&altoFluxo[ds2].emoji&&!eventos[altoFluxo[ds2].label]){
                eventos[altoFluxo[ds2].label]=altoFluxo[ds2];
              }
            }
            var evList=Object.keys(eventos);
            if(evList.length===0) return null;
            return <div style={{margin:"10px 20px 6px",background:C.card,border:"1px solid "+C.border,borderRadius:14,padding:"12px 14px"}}>
              <div style={{fontSize:9,color:C.muted,fontWeight:700,marginBottom:8,letterSpacing:1}}>SAZONALIDADES ESTE MÊS</div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {evList.map(function(lbl,i){
                  var ev=eventos[lbl];
                  var cor=ev.nivel==="critico"?"#ef4444":ev.nivel==="alto"?"#f59e0b":"#3b82f6";
                  return <div key={i} style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:18}}>{ev.emoji}</span>
                    <span style={{fontSize:11,fontWeight:700,color:C.text}}>{lbl}</span>
                    <span style={{fontSize:9,color:cor,fontWeight:700,marginLeft:"auto",background:cor+"20",padding:"2px 8px",borderRadius:6}}>
                      {ev.nivel==="critico"?"🔥 ALTO FLUXO":ev.nivel==="alto"?"⚡ Alta":"📌 Sazonalidade"}
                    </span>
                  </div>;
                })}
              </div>
            </div>;
          })()}
        </div>
      )}

      {/* ══ MÉDIAS ══ */}
      {page==="medias"&&(
        <div className="fu" style={{position:"relative",zIndex:1,padding:"52px 20px 0"}}>

          {/* header */}
          <div style={{marginBottom:16}}>
            <div style={{fontSize:22,fontWeight:900,color:C.text,letterSpacing:-0.5}}>📊 Planilha de Médias</div>
            <div style={{fontSize:11,color:C.muted,marginTop:2}}>{ano} · Meta · Vendido · Resultado por mês</div>
          </div>

          {/* ── RESUMO ANUAL CARD ── */}
          <div style={{background:"linear-gradient(135deg,#0d1f12 0%,#0a1a10 100%)",border:"1px solid "+C.lime+"44",borderRadius:20,padding:"18px",marginBottom:14,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",right:-20,top:-20,width:100,height:100,borderRadius:"50%",background:C.lime+"08",pointerEvents:"none"}}/>
            <div style={{fontSize:10,color:C.lime,fontWeight:700,letterSpacing:2,marginBottom:14}}>RESUMO ANUAL {ano}</div>

            {/* % anual em destaque */}
            <div style={{textAlign:"center",marginBottom:12}}>
              <div style={{fontSize:8,color:C.muted,fontWeight:600,marginBottom:4,letterSpacing:1}}>% ANUAL ({mediasComV.length} meses registrados)</div>
              <div style={{fontSize:44,fontWeight:900,color:barColor(pctAnual),lineHeight:1,letterSpacing:-1}}>{pctAnual.toFixed(1)}%</div>
              <div style={{fontSize:11,color:resultadoAnual>=0?C.lime:C.red,fontWeight:700,marginTop:6}}>
                {resultadoAnual>=0?"▲ ":"▼ "}{fR(Math.abs(resultadoAnual))} {resultadoAnual>=0?"acima":"abaixo"} da meta
              </div>
            </div>

            {/* barra anual */}
            <div style={{height:8,background:"rgba(255,255,255,.08)",borderRadius:4,overflow:"hidden",marginBottom:12}}>
              <div style={{height:"100%",width:Math.min(100,pctAnual)+"%",background:"linear-gradient(90deg,"+barColor(pctAnual)+","+barColor(pctAnual)+"bb)",borderRadius:4,transition:"width 1s ease",boxShadow:"0 0 12px "+barColor(pctAnual)+"55"}}/>
            </div>

            {/* 3 totais menores */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
              <div style={{background:"rgba(0,0,0,.25)",borderRadius:10,padding:"9px 8px"}}>
                <div style={{fontSize:7,color:C.muted,fontWeight:600,marginBottom:2}}>TOTAL META</div>
                <div style={{fontSize:14,fontWeight:900,color:C.muted,lineHeight:1}}>{fRk(metaAnualTotal)}</div>
                <div style={{fontSize:7,color:C.muted,marginTop:2}}>{mediasComV.length} meses</div>
              </div>
              <div style={{background:"rgba(0,0,0,.25)",borderRadius:10,padding:"9px 8px"}}>
                <div style={{fontSize:7,color:C.muted,fontWeight:600,marginBottom:2}}>TOTAL VENDIDO</div>
                <div style={{fontSize:14,fontWeight:900,color:C.lime,lineHeight:1}}>{fRk(fatAnual)}</div>
                <div style={{fontSize:7,color:C.muted,marginTop:2}}>{mediasComV.length} meses</div>
              </div>
              <div style={{background:"rgba(0,0,0,.25)",borderRadius:10,padding:"9px 8px"}}>
                <div style={{fontSize:7,color:C.muted,fontWeight:600,marginBottom:2}}>MÉDIA/MÊS</div>
                <div style={{fontSize:14,fontWeight:900,color:C.lime,lineHeight:1}}>{fRk(mediaGeral)}</div>
                <div style={{fontSize:7,color:C.muted,marginTop:2}}>proj. {fRk(mediaGeral*12)}/ano</div>
              </div>
            </div>
          </div>

          {/* ── CABEÇALHO TABELA ── */}
          <div style={{display:"grid",gridTemplateColumns:"46px 1fr 1fr 72px",gap:4,padding:"8px 14px",background:C.card2,borderRadius:"12px 12px 0 0",border:"1px solid "+C.border,borderBottom:"none"}}>
            <div style={{fontSize:8,color:C.muted,fontWeight:700}}>MÊS</div>
            <div style={{fontSize:8,color:C.muted,fontWeight:700,textAlign:"center"}}>META</div>
            <div style={{fontSize:8,color:C.muted,fontWeight:700,textAlign:"center"}}>VENDIDO</div>
            <div style={{fontSize:8,color:C.muted,fontWeight:700,textAlign:"center"}}>RESULT.</div>
          </div>

          {/* ── LINHAS MESES ── */}
          <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:"0 0 18px 18px",overflow:"hidden",marginBottom:10}}>
            {mediaAnual.map(function(m,i){
              var isAtual=i===hoje.getMonth()&&ano===anoAtual;
              var futuro=i>hoje.getMonth()&&ano===anoAtual;
              var pc=m.pctM!=null?barColor(m.pctM):C.muted2;
              var rc=m.resultado!=null?(m.resultado>=0?C.green:C.red):C.muted2;
              var eM=mediaEdit&&mediaEdit.key===m.key&&mediaEdit.field==="meta";
              var eV=mediaEdit&&mediaEdit.key===m.key&&mediaEdit.field==="vendeu";
              return (
                <div key={i} style={{borderBottom:i<11?"1px solid "+C.border+"66":"none",background:isAtual?C.lime+"07":"transparent"}}>
                  <div style={{display:"grid",gridTemplateColumns:"46px 1fr 1fr 72px",gap:4,padding:"10px 14px",alignItems:"center"}}>

                    {/* mês */}
                    <div>
                      <div style={{fontSize:12,fontWeight:700,color:isAtual?C.lime:futuro?C.muted2:C.text,lineHeight:1}}>{MS[i]}</div>
                      {m.pctM!=null&&<div style={{fontSize:9,fontWeight:800,color:pc,marginTop:2}}>{m.pctM.toFixed(0)}%</div>}
                    </div>

                    {/* META — toque para editar */}
                    <div style={{textAlign:"center"}}>
                      {eM
                        ? <input autoFocus type="text" inputMode="decimal" value={mediaVal}
                            onChange={function(e){setMediaVal(e.target.value);}}
                            onBlur={commitMedia}
                            onKeyDown={function(e){if(e.key==="Enter")commitMedia();if(e.key==="Escape")setMediaEdit(null);}}
                            style={{width:"100%",background:C.card2,border:"1px solid "+C.blue+"66",borderRadius:8,padding:"6px 5px",fontSize:12,fontWeight:800,color:C.blue,textAlign:"center"}}/>
                        : <button onClick={function(){setMediaEdit({key:m.key,field:"meta"});setMediaVal(m.metaM!=null?String(m.metaM):"");}}
                            style={{width:"100%",background:m.metaM!=null?"rgba(255,255,255,.05)":"transparent",border:"1px solid "+(m.metaM!=null?C.muted2+"55":C.border+"66"),borderRadius:8,padding:"7px 5px",color:m.metaM!=null?C.muted:C.muted2,fontSize:11,fontWeight:700,textAlign:"center"}}>
                            {m.metaM!=null?fRk(m.metaM):"—"}
                          </button>
                      }
                    </div>

                    {/* VENDIDO — toque para editar */}
                    <div style={{textAlign:"center"}}>
                      {eV
                        ? <input autoFocus type="text" inputMode="decimal" value={mediaVal}
                            onChange={function(e){setMediaVal(e.target.value);}}
                            onBlur={commitMedia}
                            onKeyDown={function(e){if(e.key==="Enter")commitMedia();if(e.key==="Escape")setMediaEdit(null);}}
                            style={{width:"100%",background:C.card2,border:"1px solid "+C.lime+"66",borderRadius:8,padding:"6px 5px",fontSize:12,fontWeight:800,color:C.lime,textAlign:"center"}}/>
                        : <button onClick={function(){setMediaEdit({key:m.key,field:"vendeu"});setMediaVal(m.vendeuM!=null?String(m.vendeuM):"");}}
                            style={{width:"100%",background:m.vendeuM!=null?pc+"14":"transparent",border:"1px solid "+(m.vendeuM!=null?pc+"44":C.border+"66"),borderRadius:8,padding:"7px 5px",color:m.vendeuM!=null?pc:C.muted2,fontSize:11,fontWeight:700,textAlign:"center"}}>
                            {m.vendeuM!=null?fRk(m.vendeuM):"—"}
                          </button>
                      }
                    </div>

                    {/* RESULTADO */}
                    <div style={{textAlign:"center"}}>
                      {m.resultado!=null
                        ? <div style={{fontSize:11,fontWeight:900,color:rc,lineHeight:1}}>{m.resultado>=0?"+":""}{fRk(m.resultado)}</div>
                        : <div style={{fontSize:10,color:C.muted2,textAlign:"center"}}>—</div>
                      }
                    </div>
                  </div>

                  {/* barra por linha */}
                  {m.pctM!=null&&(
                    <div style={{padding:"0 14px 8px"}}>
                      <div style={{height:3,background:C.muted2,borderRadius:2,overflow:"hidden"}}>
                        <div style={{height:"100%",width:Math.min(100,m.pctM)+"%",background:pc,borderRadius:2,transition:"width .5s"}}/>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* rodapé */}
          <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:14,padding:"12px 16px",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:9,color:C.muted,fontWeight:600}}>MÉDIA MENSAL ({mediasComV.length} meses)</div>
              <div style={{fontSize:20,fontWeight:900,color:C.lime,marginTop:2,lineHeight:1}}>{fR(mediaGeral)}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:9,color:C.muted,fontWeight:600}}>PROJEÇÃO ANUAL</div>
              <div style={{fontSize:16,fontWeight:700,color:C.muted,marginTop:2}}>{fR(mediaGeral*12)}</div>
            </div>
          </div>
          <div style={{fontSize:9,color:C.muted,textAlign:"center",marginBottom:8}}>Toque em META ou VENDIDO para editar · {ano}</div>
        </div>
      )}
      {/* ══ CORRIDINHA ══ */}
      {page==="corridinha"&&(
        <div className="fu" style={{position:"relative",zIndex:1,padding:"52px 20px 0"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div><div style={{fontSize:22,fontWeight:800}}>🏃 Corridinhas</div><div style={{fontSize:11,color:C.muted}}>Metas com premiação</div></div>
            <button onClick={function(){setShowAddC(true);}} style={{padding:"7px 14px",borderRadius:10,background:C.lime,border:"none",color:"#000",fontWeight:800,fontSize:11}}>+ Nova</button>
          </div>

          {/* Trimestral */}
          <div style={{background:C.card,border:"1px solid "+C.purple+"55",borderRadius:18,overflow:"hidden",marginBottom:14}}>
            <div style={{padding:"14px 16px",borderBottom:"1px solid "+C.border,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontSize:13,fontWeight:800,color:C.purple}}>🏃 Corridinha Trimestral</div><div style={{fontSize:10,color:C.muted,marginTop:1}}>Prêmio: <span style={{color:C.purple,fontWeight:700}}>R$ 700,00</span></div></div>
              <div style={{textAlign:"right"}}><div style={{fontSize:9,color:C.muted}}>TOTAL VENDIDO</div><div style={{fontSize:17,fontWeight:900,color:pctTrim>=100?C.lime:C.purple,lineHeight:1}}>{fR(totalTrimV)}</div></div>
            </div>
            <div style={{padding:"12px 16px 8px"}}>
              <div style={{height:7,background:C.muted2,borderRadius:3,overflow:"hidden",marginBottom:6}}>
                <div style={{height:"100%",width:pctTrim+"%",background:barColor(pctTrim),borderRadius:3,transition:"width .8s"}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:C.muted,marginBottom:10}}>
                <span>Progresso: <span style={{fontWeight:700,color:barColor(pctTrim)}}>{pctTrim.toFixed(1)}%</span></span>
                <span>Falta: {fRk(Math.max(0,(totalTrimM||9000)-totalTrimV))}</span>
              </div>
              {/* cols header */}
              <div style={{display:"grid",gridTemplateColumns:"55px 1fr 1fr 70px",gap:4,padding:"6px 0",borderBottom:"1px solid "+C.border,marginBottom:4}}>
                {["MÊS","META","VENDEU","RESULT."].map(function(h,i){ return <div key={i} style={{fontSize:8,color:C.muted,fontWeight:700,textAlign:i>0?"center":"left"}}>{h}</div>; })}
              </div>
              {[0,1,2].map(function(slot){
                var tm=trimMeses[slot];
                var mv=pRS(tm.meta); var vv=pRS(tm.vendeu);
                var res=mv>0&&vv>0?vv-mv:null;
                var ptc=mv>0&&vv>0?Math.min(200,(vv/mv)*100):null;
                var pc2=ptc!=null?barColor(ptc):C.muted2;
                var eTM=corrTrimEdit&&corrTrimEdit.slot===slot&&corrTrimEdit.field==="meta";
                var eTV=corrTrimEdit&&corrTrimEdit.slot===slot&&corrTrimEdit.field==="vendeu";
                return (
                  <div key={slot} style={{borderBottom:slot<2?"1px solid "+C.border+"66":"none"}}>
                    <div style={{display:"grid",gridTemplateColumns:"55px 1fr 1fr 70px",gap:4,padding:"8px 0",alignItems:"center"}}>
                      <div style={{fontSize:11,fontWeight:700,color:C.text}}>Mês {slot+1}</div>
                      <div style={{textAlign:"center"}}>
                        {eTM
                          ? <input autoFocus type="text" inputMode="decimal" value={corrTrimVal} onChange={function(e){setCorrTrimVal(e.target.value);}}
                              onBlur={commitCorrTrim} onKeyDown={function(e){if(e.key==="Enter")commitCorrTrim();if(e.key==="Escape")setCorrTrimEdit(null);}}
                              style={{width:"100%",background:C.card2,border:"1px solid "+C.blue+"55",borderRadius:6,padding:"4px 5px",fontSize:11,fontWeight:700,color:C.blue,textAlign:"center"}}/>
                          : <button onClick={function(){setCorrTrimEdit({slot:slot,field:"meta"});setCorrTrimVal(tm.meta||"");}}
                              style={{background:"transparent",border:"1px solid "+(tm.meta?C.muted2+"88":C.border),borderRadius:6,padding:"4px 6px",color:tm.meta?C.muted:C.muted2,fontSize:10,fontWeight:700,width:"100%"}}>
                              {tm.meta?fRk(pRS(tm.meta)):"—"}
                            </button>
                        }
                      </div>
                      <div style={{textAlign:"center"}}>
                        {eTV
                          ? <input autoFocus type="text" inputMode="decimal" value={corrTrimVal} onChange={function(e){setCorrTrimVal(e.target.value);}}
                              onBlur={commitCorrTrim} onKeyDown={function(e){if(e.key==="Enter")commitCorrTrim();if(e.key==="Escape")setCorrTrimEdit(null);}}
                              style={{width:"100%",background:C.card2,border:"1px solid "+C.lime+"55",borderRadius:6,padding:"4px 5px",fontSize:11,fontWeight:700,color:C.lime,textAlign:"center"}}/>
                          : <button onClick={function(){setCorrTrimEdit({slot:slot,field:"vendeu"});setCorrTrimVal(tm.vendeu||"");}}
                              style={{background:tm.vendeu?pc2+"15":"transparent",border:"1px solid "+(tm.vendeu?pc2+"44":C.border),borderRadius:6,padding:"4px 6px",color:tm.vendeu?pc2:C.muted2,fontSize:10,fontWeight:700,width:"100%"}}>
                              {tm.vendeu?fRk(pRS(tm.vendeu)):"—"}
                            </button>
                        }
                      </div>
                      <div style={{textAlign:"center"}}>
                        {res!=null
                          ? <div style={{fontSize:11,fontWeight:800,color:res>=0?C.green:C.red}}>{res>=0?"+":""}{fRk(res)}</div>
                          : <div style={{fontSize:10,color:C.muted2}}>—</div>
                        }
                      </div>
                    </div>
                    {ptc!=null&&<div style={{padding:"0 0 6px"}}><div style={{height:3,background:C.muted2,borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:Math.min(100,ptc)+"%",background:pc2,borderRadius:2}}/></div></div>}
                  </div>
                );
              })}
              {pctTrim>=100&&<div style={{padding:"10px",background:C.lime+"18",borderTop:"1px solid "+C.lime+"44",textAlign:"center",fontSize:13,fontWeight:800,color:C.lime}}>🎉 CORRIDINHA BATIDA! Prêmio: R$ 700,00</div>}
              <div style={{fontSize:9,color:C.muted,textAlign:"center",padding:"6px 0 2px"}}>Toque em META ou VENDEU para editar</div>
            </div>
          </div>

          {/* outras corridinhas */}
          {corridinhas.map(function(c,ci){
            return (
              <div key={c.id} style={{background:C.card,border:"1px solid "+(c.ativo?C.lime+"44":C.border),borderRadius:18,padding:"16px",marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div style={{flex:1,paddingRight:8}}><div style={{fontSize:13,fontWeight:800,color:c.ativo?C.lime:C.muted}}>{c.titulo}</div><div style={{fontSize:10,color:C.muted,marginTop:1}}>{c.descricao}</div></div>
                  <div style={{textAlign:"right",flexShrink:0}}><div style={{fontSize:8,color:C.muted}}>PRÊMIO</div><div style={{fontSize:18,fontWeight:900,color:C.lime}}>{fR(c.premio)}</div></div>
                </div>
                <div style={{height:6,background:C.muted2,borderRadius:3,overflow:"hidden",marginBottom:4}}>
                  <div style={{height:"100%",width:Math.min(100,(c.atual/Math.max(1,c.meta))*100)+"%",background:c.ativo?barColor((c.atual/Math.max(1,c.meta))*100):C.muted,borderRadius:3}}/>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.muted,marginBottom:8}}>
                  <span>Vendido: <span style={{color:C.lime,fontWeight:700}}>{fR(c.atual)}</span></span>
                  <span style={{fontWeight:700,color:barColor((c.atual/Math.max(1,c.meta))*100)}}>{((c.atual/Math.max(1,c.meta))*100).toFixed(0)}%</span>
                  <span>Meta: {fR(c.meta)}</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:8}}>
                  <input type="text" inputMode="decimal" placeholder="+ Lançar..."
                    onKeyDown={function(e){ if(e.key==="Enter"){ var v=pRS(e.target.value); if(v>0){ setCorr(function(p){ return p.map(function(x,j){ return j===ci?Object.assign({},x,{atual:x.atual+v}):x; }); }); e.target.value=""; } } }}
                    style={{background:C.card2,border:"1px solid "+C.border,borderRadius:10,padding:"8px 12px",fontSize:12,color:C.text}}/>
                  <button onClick={function(){ setCorr(function(p){ return p.map(function(x,j){ return j===ci?Object.assign({},x,{atual:0}):x; }); }); }}
                    style={{padding:"8px 10px",borderRadius:10,border:"1px solid "+C.border,background:C.card2,color:C.muted,fontSize:9,fontWeight:600}}>Reset</button>
                  <button onClick={function(){ setCorr(function(p){ return p.map(function(x,j){ return j===ci?Object.assign({},x,{ativo:!x.ativo}):x; }); }); }}
                    style={{padding:"8px 10px",borderRadius:10,border:"1px solid "+C.border,background:c.ativo?C.amber+"20":C.card2,color:c.ativo?C.amber:C.muted,fontSize:9,fontWeight:600}}>{c.ativo?"Pausar":"Ativar"}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══ STATS ══ */}
      {page==="stats"&&(
        <div className="fu" style={{position:"relative",zIndex:1,padding:"52px 20px 0"}}>
          <div style={{fontSize:22,fontWeight:800,marginBottom:14}}>Analytics</div>
          <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:18,padding:"16px",marginBottom:10}}>
            <div style={{fontSize:9,color:C.muted,fontWeight:600,marginBottom:4}}>FATURAMENTO TOTAL</div>
            <div style={{fontSize:28,fontWeight:900,color:bc,lineHeight:1}}>{fR(totalRS)}</div>
            <div style={{fontSize:11,color:difRS>=0?C.green:C.red,fontWeight:700,marginTop:5}}>
              <span style={{background:difRS>=0?C.green+"22":C.red+"22",padding:"2px 10px",borderRadius:6}}>{difRS>=0?"▲":"▼"} {fRk(Math.abs(difRS))}</span>
              <span style={{color:C.muted,fontWeight:400,fontSize:10,marginLeft:6}}>vs esperado</span>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
            {metasCalc.map(function(g){
              var p=Math.min(100,(totalRS/g.valorRS)*100);
              return (
                <div key={g.id} style={{background:g.atingiu?g.color+"12":C.card,border:"1px solid "+(g.atingiu?g.color+"55":C.border),borderRadius:14,padding:"11px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                    <span style={{fontSize:10,fontWeight:700,color:g.atingiu?g.color:C.muted}}>{g.label}</span>
                    <span style={{fontSize:8,color:C.muted}}>{(g.com*100).toFixed(1)}%</span>
                  </div>
                  <div style={{fontSize:16,fontWeight:900,color:g.atingiu?g.color:C.muted2}}>{fR(g.id==="meta"?comissaoAtual:g.atingiu?totalRS*g.com:g.comRS)}</div>
                  <div style={{fontSize:8,color:C.muted,marginTop:1}}>{g.atingiu?"✅ "+fRk(g.valorRS):"⏳ "+fRk(g.valorRS)}</div>
                  <div style={{marginTop:5,height:3,background:C.muted2,borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:p+"%",background:g.color,borderRadius:2}}/></div>
                </div>
              );
            })}
          </div>
          {barData.length>2&&(
            <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:16,padding:"14px 12px 8px"}}>
              <div style={{fontSize:11,fontWeight:700,marginBottom:8}}>Faturamento por Dia</div>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={barData} margin={{top:0,right:4,left:-20,bottom:0}}>
                  <XAxis dataKey="dia" tick={{fontSize:9,fill:C.muted}} axisLine={false} tickLine={false} interval={1}/>
                  <YAxis tick={{fontSize:9,fill:C.muted}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<TT/>}/>
                  <Bar dataKey="rs" name="Fat." radius={[4,4,0,0]} maxBarSize={18}>
                    {barData.map(function(e,i){ return <Cell key={i} fill={e.rs>=e.meta?C.lime:e.rs>0?C.blue:C.muted2}/>; })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ══ CONFIG ══ */}
      {page==="config"&&(
        <div className="fu" style={{position:"relative",zIndex:1,padding:"52px 20px 0"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{fontSize:22,fontWeight:800}}>Configurações</div>
            <button onClick={doLogout} style={{padding:"6px 12px",borderRadius:10,border:"1px solid #ef444444",background:"#ef444412",color:"#ef4444",fontSize:10,fontWeight:700}}>Sair</button>
          </div>
          {/* perfil */}
          <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:18,overflow:"hidden",marginBottom:10}}>
            <div style={{padding:"12px 16px",borderBottom:"1px solid "+C.border,fontSize:11,fontWeight:800}}>Perfil</div>
            <div style={{padding:"16px"}}>
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
                <div style={{position:"relative",flexShrink:0}}>
                  {foto
                    ? <img src={foto} alt="f" style={{width:66,height:66,borderRadius:"50%",objectFit:"cover",border:"3px solid "+C.lime}}/>
                    : <div style={{width:66,height:66,borderRadius:"50%",background:"linear-gradient(135deg,#16a34a,#22c55e)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:900,color:"#000",border:"3px solid "+C.lime}}>{nome.charAt(0).toUpperCase()}</div>
                  }
                  <button onClick={function(){fotoRef.current&&fotoRef.current.click();}} style={{position:"absolute",bottom:0,right:0,width:22,height:22,borderRadius:"50%",background:C.lime,border:"2px solid "+C.card,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#000",fontWeight:700}}>📷</button>
                  <input ref={fotoRef} type="file" accept="image/*" onChange={handleFoto} style={{display:"none"}}/>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:17,fontWeight:800}}>{nome}</div>
                  <div style={{fontSize:12,color:C.lime,fontWeight:600,marginTop:1}}>{cargo}</div>
                  <button onClick={function(){setEditPerfil(true);setNomeEdit(nome);setCargoEdit(cargo);}} style={{marginTop:6,padding:"4px 10px",borderRadius:8,border:"1px solid "+C.border,background:C.card2,color:C.muted,fontSize:10,fontWeight:600}}>✏️ Editar</button>
                </div>
              </div>
              {editPerfil&&(
                <div style={{borderTop:"1px solid "+C.border,paddingTop:12}}>
                  <div style={{fontSize:9,color:C.muted,fontWeight:600,marginBottom:4}}>NOME</div>
                  <input value={nomeEdit} onChange={function(e){setNomeEdit(e.target.value);}} style={{width:"100%",background:C.card2,border:"1px solid "+C.lime+"44",borderRadius:10,padding:"9px 12px",fontSize:14,fontWeight:700,color:C.text,marginBottom:8}}/>
                  <div style={{fontSize:9,color:C.muted,fontWeight:600,marginBottom:4}}>CARGO</div>
                  <input value={cargoEdit} onChange={function(e){setCargoEdit(e.target.value);}} style={{width:"100%",background:C.card2,border:"1px solid "+C.lime+"33",borderRadius:10,padding:"9px 12px",fontSize:13,color:C.text,marginBottom:10}}/>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={function(){setEditPerfil(false);}} style={{flex:1,padding:"9px",borderRadius:10,border:"1px solid "+C.border,background:C.card2,color:C.muted,fontWeight:700,fontSize:12}}>Cancelar</button>
                    <button onClick={function(){setCfg({nome:nomeEdit,cargo:cargoEdit});setEditPerfil(false);}} style={{flex:2,padding:"9px",borderRadius:10,background:C.lime,border:"none",color:"#000",fontWeight:800,fontSize:12}}>Salvar</button>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* meta base */}
          <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:18,overflow:"hidden",marginBottom:10}}>
            <div style={{padding:"12px 16px",borderBottom:"1px solid "+C.border,fontSize:11,fontWeight:800}}>Meta Base (R$)</div>
            <div style={{padding:"14px 16px"}}>
              <div style={{position:"relative"}}>
                <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:14,fontWeight:800,color:C.lime,pointerEvents:"none"}}>R$</div>
                <input type="text" inputMode="decimal" value={metaStr} onChange={function(e){setCfg({metaStr:e.target.value.replace(/[^0-9,.]/g,"")});}}
                  placeholder="10000" style={{width:"100%",background:C.card2,border:"1px solid "+C.lime+"44",borderRadius:12,padding:"12px 12px 12px 38px",fontSize:20,fontWeight:900,color:C.lime}}/>
              </div>
              <div style={{fontSize:10,color:C.muted,marginTop:6}}>Valor: <span style={{color:C.lime,fontWeight:700}}>{fR(metaBase)}</span></div>
            </div>
          </div>
          {/* período */}
          <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:18,overflow:"hidden",marginBottom:10}}>
            <div style={{padding:"12px 16px",borderBottom:"1px solid "+C.border,fontSize:11,fontWeight:800}}>Período</div>
            {PERIODS.map(function(p,i){ return (
              <button key={p.id} onClick={function(){setCfg({periodId:p.id});}}
                style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",border:"none",borderBottom:i<2?"1px solid "+C.border:"none",background:periodId===p.id?C.lime+"10":C.card,cursor:"pointer",textAlign:"left"}}>
                <div style={{fontSize:12,fontWeight:700,color:periodId===p.id?C.lime:C.muted}}>{p.label}</div>
                <div style={{width:18,height:18,borderRadius:"50%",border:"2px solid "+(periodId===p.id?C.lime:C.muted2),display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {periodId===p.id&&<div style={{width:9,height:9,borderRadius:"50%",background:C.lime}}/>}
                </div>
              </button>
            ); })}
          </div>
          {/* dias */}
          <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:18,padding:"14px 16px",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div style={{fontSize:12,fontWeight:700}}>Dias de Trabalho</div><div style={{fontSize:9,color:C.muted}}>dias úteis no período</div></div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <button onClick={function(){setCfg({diasTrab:Math.max(1,diasTrab-1)});}} style={{width:32,height:32,borderRadius:8,border:"1px solid "+C.border,background:C.card2,color:C.muted,fontSize:16,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
              <span style={{fontSize:20,fontWeight:900,color:C.blue,minWidth:32,textAlign:"center"}}>{diasTrab}</span>
              <button onClick={function(){setCfg({diasTrab:diasTrab+1});}} style={{width:32,height:32,borderRadius:8,border:"1px solid "+C.border,background:C.card2,color:C.muted,fontSize:16,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
            </div>
          </div>
          {/* metas calculadas */}
          <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:18,overflow:"hidden",marginBottom:10}}>
            <div style={{padding:"12px 16px",borderBottom:"1px solid "+C.border,fontSize:11,fontWeight:800}}>Metas Calculadas</div>
            {metasCalc.map(function(g,i){ return (
              <div key={g.id} style={{padding:"12px 16px",borderBottom:i<3?"1px solid "+C.border:"none",display:"flex",justifyContent:"space-between",alignItems:"center",background:g.color+"05"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:36,height:36,borderRadius:10,background:g.color+"20",border:"1px solid "+g.color+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{"🎯⚡🚀🏅"[i]}</div>
                  <div><div style={{fontSize:12,fontWeight:800,color:g.color}}>{g.label}</div><div style={{fontSize:9,color:C.muted}}>{(g.diarRS).toFixed(0)} R$/dia</div></div>
                </div>
                <div style={{textAlign:"right"}}><div style={{fontSize:16,fontWeight:900,color:g.color}}>{fR(g.valorRS)}</div><div style={{fontSize:10,color:C.green,fontWeight:700}}>{fR(g.comRS)}</div></div>
              </div>
            ); })}
          </div>
          {/* mês/ano */}
          <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:18,padding:"14px",marginBottom:10}}>
            <div style={{fontSize:11,fontWeight:800,marginBottom:10}}>Mês / Ano</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
              {[2024,2025,2026,2027].map(function(a){ return <button key={a} onClick={function(){setCfg({ano:a});}} style={{padding:"4px 12px",borderRadius:8,border:"1px solid "+(ano===a?C.lime:C.border),background:ano===a?C.lime:"transparent",color:ano===a?"#000":C.muted,fontSize:10,fontWeight:700}}>{a}</button>; })}
            </div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {MS.map(function(m,i){ return <button key={i} onClick={function(){setCfg({mes:i});}} style={{padding:"3px 8px",borderRadius:8,border:"1px solid "+(mes===i?C.lime:C.border),background:mes===i?C.lime:"transparent",color:mes===i?"#000":C.muted,fontSize:9,fontWeight:700}}>{m}</button>; })}
            </div>
          </div>
        </div>
      )}

      {/* ══ BOTTOM NAV — barra única 7 itens ══ */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:420,zIndex:50}}>
        <div style={{background:C.card,borderTop:"1px solid "+C.border,display:"grid",gridTemplateColumns:"1fr 1fr 1fr 52px 1fr 1fr 1fr",alignItems:"center",padding:"6px 4px 20px",gap:0}}>

          {/* 1 Home */}
          <button onClick={function(){setPage("home");}}
            style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"5px 2px",border:"none",background:"transparent",color:page==="home"?C.lime:C.muted}}>
            <span style={{fontSize:18,lineHeight:1}}>⌂</span>
            <span style={{fontSize:7,fontWeight:600}}>Home</span>
          </button>

          {/* 2 Atualizar */}
          <button onClick={function(){setShowAtu(true);}}
            style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"5px 2px",border:"none",background:"transparent",color:showAtu?C.lime:C.muted}}>
            <span style={{fontSize:18,lineHeight:1}}>🔄</span>
            <span style={{fontSize:7,fontWeight:600}}>Atualizar</span>
          </button>

          {/* 3 Simular */}
          <button onClick={function(){setShowSim(true);}}
            style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"5px 2px",border:"none",background:"transparent",color:showSim?C.lime:C.muted}}>
            <span style={{fontSize:18,lineHeight:1}}>📈</span>
            <span style={{fontSize:7,fontWeight:600}}>Simular</span>
          </button>

          {/* 4 FAB central */}
          <div style={{display:"flex",justifyContent:"center",alignItems:"center"}}>
            <button className="tap" onClick={function(){setEditando(dsk(Math.min(hoje.getDate(),diasNoMes)));}}
              style={{width:46,height:46,borderRadius:"50%",background:C.lime,border:"none",fontSize:22,fontWeight:900,color:"#000",boxShadow:"0 0 20px "+C.lime+"88",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:6}}>
              +
            </button>
          </div>

          {/* 5 Agenda */}
          <button onClick={function(){setPage("calendar");}}
            style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"5px 2px",border:"none",background:"transparent",color:page==="calendar"?C.lime:C.muted}}>
            <span style={{fontSize:18,lineHeight:1}}>▦</span>
            <span style={{fontSize:7,fontWeight:600}}>Agenda</span>
          </button>

          {/* 6 Médias */}
          <button onClick={function(){setPage("medias");}}
            style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"5px 2px",border:"none",background:"transparent",color:page==="medias"?C.lime:C.muted}}>
            <span style={{fontSize:18,lineHeight:1}}>📊</span>
            <span style={{fontSize:7,fontWeight:600}}>Médias</span>
          </button>

          {/* 7 Config */}
          <button onClick={function(){setPage("config");}}
            style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"5px 2px",border:"none",background:"transparent",color:page==="config"?C.lime:C.muted}}>
            <span style={{fontSize:18,lineHeight:1}}>◎</span>
            <span style={{fontSize:7,fontWeight:600}}>Config</span>
          </button>

        </div>
      </div>

      {/* ══ MODAL LANÇAR — centralizado ══ */}
      {editando&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,backdropFilter:"blur(12px)",padding:"0 24px"}} onClick={function(){setEditando(null);}}>
          <div className="fu" style={{background:C.card,borderRadius:24,padding:"24px 22px 22px",width:"100%",maxWidth:380,border:"1px solid "+C.border,boxShadow:"0 24px 64px rgba(0,0,0,.7)"}} onClick={function(e){e.stopPropagation();}}>
            <div style={{width:34,height:4,background:C.muted2,borderRadius:2,margin:"0 auto 16px"}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div>
                <div style={{fontSize:9,color:C.muted,fontWeight:600,letterSpacing:1}}>LANÇAR VENDAS</div>
                <div style={{fontSize:22,fontWeight:900}}>Dia {editando.split("-")[2]} · {MS[mes]}</div>
                <div style={{fontSize:10,color:C.muted,marginTop:2}}>Meta: <span style={{color:C.lime,fontWeight:800}}>{fR(metasCalc[0].diarRS)}</span></div>
              </div>
              <div style={{fontSize:28}}>📋</div>
            </div>
            {/* input em R$ diretamente */}
            <div style={{position:"relative",marginBottom:4}}>
              <div style={{position:"absolute",left:16,top:"50%",transform:"translateY(-50%)",fontSize:22,fontWeight:900,color:C.lime,pointerEvents:"none",zIndex:1}}>R$</div>
              <input ref={inputRef} type="text" inputMode="decimal" value={inputVal}
                onChange={function(e){
                  var raw=e.target.value.replace(/[^0-9,.]/g,"");
                  setInputVal(raw);
                }}
                onKeyDown={function(e){if(e.key==="Enter")salvar();}}
                placeholder="0,00"
                style={{width:"100%",background:C.card2,border:"2px solid "+C.lime+"66",borderRadius:16,
                  padding:"18px 16px 18px 56px",fontSize:38,fontWeight:900,textAlign:"left",
                  color:C.lime,letterSpacing:-1}}/>
            </div>
            {(function(){
              var vRS=pRS(inputVal);
              if(!vRS||vRS<=0) return null;
              var pct=metasCalc[0].diarRS>0?(vRS/metasCalc[0].diarRS)*100:0;
              var cor=pct>=100?C.lime:pct>=70?C.amber:C.red;
              return <div style={{marginTop:6,marginBottom:2,textAlign:"center"}}>
                <span style={{fontSize:11,color:cor,fontWeight:700}}>
                  {pct>=100?"✅ Meta do dia batida!":pct>=70?"⚡ Quase lá! "+pct.toFixed(0)+"%":"📌 "+pct.toFixed(0)+"% da meta do dia"}
                </span>
              </div>;
            })()}
            <div style={{display:"flex",gap:8,marginTop:12}}>
              <button onClick={function(){setEditando(null);}} style={{flex:1,padding:"13px",borderRadius:14,border:"1px solid "+C.border,background:C.card2,color:C.muted,fontWeight:700,fontSize:12}}>Cancelar</button>
              <button className="tap" onClick={salvar} style={{flex:2,padding:"13px",borderRadius:14,border:"none",background:C.lime,color:"#000",fontWeight:900,fontSize:14,boxShadow:"0 6px 20px "+C.lime+"55"}}>Confirmar ✓</button>
            </div>
            <button onClick={function(){togFolga(editando);setEditando(null);}} style={{width:"100%",marginTop:7,padding:"9px",borderRadius:14,border:"1px solid "+C.amber+"44",background:C.amber+"10",color:C.amber,fontWeight:700,fontSize:11}}>🗓 Marcar Folga</button>
          </div>
        </div>
      )}

      {/* ══ MODAL VENDAS DIA ══ */}
      {showVD&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:250,backdropFilter:"blur(10px)"}} onClick={function(){setShowVD(false);}}>
          <div className="fu" style={{background:C.card,borderRadius:"26px 26px 0 0",padding:"16px 22px 44px",width:"100%",maxWidth:420,border:"1px solid "+C.border,borderBottom:"none",maxHeight:"78vh",overflowY:"auto"}} onClick={function(e){e.stopPropagation();}}>
            <div style={{width:34,height:4,background:C.muted2,borderRadius:2,margin:"0 auto 16px"}}/>
            <div style={{fontSize:22,fontWeight:800,marginBottom:14}}>📅 Vendas do Dia</div>
            {(function(){
              var kh=dsk(Math.min(hoje.getDate(),diasNoMes));
              var rsh=vendas[kh]||0; var okh=rsh>=metasCalc[0].diarRS;
              return (
                <div style={{background:okh?C.lime+"16":C.card2,border:"2px solid "+(okh?C.lime:C.border),borderRadius:16,padding:"16px",marginBottom:12}}>
                  <div style={{fontSize:10,color:C.muted,fontWeight:600,marginBottom:4}}>HOJE — {hoje.getDate()} {MS[hoje.getMonth()]}</div>
                  <div style={{fontSize:30,fontWeight:900,color:okh?C.lime:C.text}}>{fR(rsh)}</div>
                  <div style={{fontSize:16,fontWeight:700,color:okh?C.lime:C.muted,marginTop:2}}>{fR(rsh)}</div>
                  <div style={{fontSize:10,color:C.muted,marginTop:4}}>{okh?"✅ Meta atingida!":"Meta: "+fR(metasCalc[0].diarRS)}</div>
                  <div style={{marginTop:8,height:4,background:C.muted2,borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",width:Math.min(100,metasCalc[0].diarRS>0?rsh/metasCalc[0].diarRS*100:0)+"%",background:okh?C.lime:C.amber,borderRadius:2}}/>
                  </div>
                </div>
              );
            })()}
            {todasDatas.slice().reverse().filter(function(ds){return !isNT(ds)&&vendas[ds]!==undefined;}).slice(0,5).map(function(ds){
              var rs=vendas[ds]||0; var ok=rs>=metasCalc[0].diarRS;
              return (
                <div key={ds} style={{background:C.card2,border:"1px solid "+C.border,borderRadius:12,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:30,height:30,borderRadius:8,background:ok?C.lime+"22":C.amber+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>{ok?"✅":"📌"}</div>
                    <div><div style={{fontSize:12,fontWeight:700}}>Dia {parseInt(ds.split("-")[2])}</div><div style={{fontSize:9,color:C.muted}}>{fR(rs)}</div></div>
                  </div>
                  <div style={{fontSize:14,fontWeight:900,color:ok?C.lime:C.amber}}>{fRk(rs)}</div>
                </div>
              );
            })}
            <button onClick={function(){setShowVD(false);}} style={{width:"100%",marginTop:10,padding:"13px",borderRadius:14,border:"none",background:C.lime,color:"#000",fontWeight:900,fontSize:14}}>Fechar</button>
          </div>
        </div>
      )}

      {/* ══ MODAL ATUALIZAR ══ */}
      {showAtu&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:250,backdropFilter:"blur(10px)"}} onClick={function(){setShowAtu(false);}}>
          <div className="fu" style={{background:C.card,borderRadius:"26px 26px 0 0",padding:"16px 20px 44px",width:"100%",maxWidth:420,border:"1px solid "+C.border,borderBottom:"none"}} onClick={function(e){e.stopPropagation();}}>
            <div style={{width:34,height:4,background:C.muted2,borderRadius:2,margin:"0 auto 14px"}}/>
            {/* header */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div>
                <div style={{fontSize:9,color:C.muted,fontWeight:600,letterSpacing:1}}>LANÇAR VENDAS</div>
                <div style={{fontSize:20,fontWeight:900}}>{atuDia?"Dia "+parseInt(atuDia.split("-")[2])+" · "+MS[mes]:"Selecione um dia"}</div>
              </div>
              {atuDia&&vendas[atuDia]!=null&&(
                <div style={{background:C.lime+"20",border:"1px solid "+C.lime+"44",borderRadius:10,padding:"5px 10px",fontSize:10,fontWeight:700,color:C.lime}}>
                  Atual: {vendas[atuDia]}v
                </div>
              )}
            </div>

            {/* dias — grid compacto com dias do mês */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:9,color:C.muted,fontWeight:600,marginBottom:6}}>DIA DO MÊS</div>
              <div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:4}}>
                {todasDatas.filter(function(ds){return !isNT(ds);}).map(function(ds){
                  var d=parseInt(ds.split("-")[2]);
                  var sel=atuDia===ds;
                  var tv=vendas[ds]!==undefined;
                  var isToday=d===hoje.getDate()&&mes===hoje.getMonth()&&ano===hoje.getFullYear();
                  var semVenda=!tv&&ds<=limHoje;
                  return (
                    <button key={ds} onClick={function(){setAtuDia(ds); setAtuQtd(vendas[ds]!=null?String(vendas[ds]):"");}}
                      style={{flexShrink:0,width:42,height:52,borderRadius:12,
                        border:"2px solid "+(sel?C.lime:isToday?C.lime+"88":semVenda?"#ef444444":tv?C.lime+"44":C.border),
                        background:sel?C.lime:isToday?"rgba(34,197,94,.1)":semVenda?"rgba(239,68,68,.08)":tv?C.lime+"10":"transparent",
                        color:sel?"#000":isToday?C.lime:semVenda?"#ef4444":tv?C.lime:C.muted,
                        fontSize:11,fontWeight:700,
                        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2}}>
                      <span style={{lineHeight:1}}>{d}</span>
                      {tv&&<span style={{fontSize:6,lineHeight:1,color:sel?"#000":C.lime,fontWeight:800}}>{fRk(vendas[ds]).replace("R$","")}</span>}
                      {!tv&&semVenda&&<span style={{fontSize:6,lineHeight:1,color:"#ef4444",fontWeight:800}}>!</span>}
                      {isToday&&!sel&&<span style={{fontSize:6,lineHeight:1,color:C.lime}}>hoje</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* input de quantidade */}
            {atuDia&&(
              <div>
                <div style={{fontSize:9,color:C.muted,fontWeight:600,marginBottom:6}}>VALOR EM R$ — DIA {parseInt(atuDia.split("-")[2])}</div>
                <div style={{position:"relative",marginBottom:6}}>
                  <div style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:20,fontWeight:900,color:C.lime,pointerEvents:"none",zIndex:1}}>R$</div>
                  <input type="text" inputMode="decimal" value={atuQtd}
                    onChange={function(e){setAtuQtd(e.target.value.replace(/[^0-9,.]/g,""));}}
                    autoFocus placeholder="0,00"
                    style={{width:"100%",background:C.card2,border:"2px solid "+C.lime+"66",borderRadius:16,
                      padding:"16px 14px 16px 50px",fontSize:38,fontWeight:900,color:C.lime,letterSpacing:-1}}/>
                </div>
                {(function(){
                  var vRS2=pRS(atuQtd);
                  if(!vRS2||vRS2<=0) return null;
                  var ok=vRS2>=metasCalc[0].diarRS;
                  return <div style={{textAlign:"center",marginBottom:8,fontSize:11,fontWeight:700,color:ok?C.lime:C.amber}}>
                    {ok?"✅ Meta do dia batida!":"Meta: "+fR(metasCalc[0].diarRS)}
                  </div>;
                })()}
                <div style={{display:"flex",gap:8}}>
                  <button onClick={function(){setShowAtu(false);setAtuDia("");setAtuQtd("");}}
                    style={{flex:1,padding:"14px",borderRadius:14,border:"1px solid "+C.border,background:C.card2,color:C.muted,fontWeight:700,fontSize:13}}>
                    Cancelar
                  </button>
                  <button className="tap" onClick={function(){
                    var v=parseFloat((atuQtd+"").replace(",","."));
                    if(!isNaN(v)&&v>=0) setVendas(function(p){ var n=Object.assign({},p); n[atuDia]=v; return n; });
                    else if(atuQtd==="") setVendas(function(p){ var n=Object.assign({},p); delete n[atuDia]; return n; });
                    setAtuQtd(""); setAtuDia(""); setShowAtu(false);
                  }} style={{flex:2,padding:"14px",borderRadius:14,border:"none",background:C.lime,color:"#000",fontWeight:900,fontSize:14,boxShadow:"0 6px 20px "+C.lime+"55"}}>
                    Salvar ✓
                  </button>
                </div>
              </div>
            )}
            {!atuDia&&(
              <div style={{textAlign:"center",padding:"16px 0",color:C.muted,fontSize:12}}>
                <div style={{fontSize:28,marginBottom:8}}>👆</div>
                Toque em um dia acima para lançar vendas
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ MODAL SIMULAR ══ */}
      {showSim&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:250,backdropFilter:"blur(10px)",padding:"0 20px"}} onClick={function(){setShowSim(false);}}>
          <div className="fu" style={{background:"#fff",borderRadius:24,padding:"24px 22px 22px",width:"100%",maxWidth:400,boxShadow:"0 24px 64px rgba(0,0,0,.4)"}} onClick={function(e){e.stopPropagation();}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <div style={{fontSize:20,fontWeight:900,color:"#111"}}>📈 Simulador</div>
              <button onClick={function(){setShowSim(false);}} style={{background:"#f3f4f6",border:"none",borderRadius:10,width:32,height:32,fontSize:18,color:"#6b7280",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>

            {/* input faturamento simulado */}
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,color:"#6b7280",fontWeight:600,marginBottom:6}}>QUANTO QUER VENDER NO MÊS (R$)</div>
              <input type="text" inputMode="decimal" value={simV}
                onChange={function(e){setSimV(e.target.value.replace(/[^0-9,.]/g,""));}}
                placeholder="Ex: 350000"
                style={{width:"100%",background:"#f9fafb",border:"2px solid #e5e7eb",borderRadius:14,padding:"14px",fontSize:28,fontWeight:900,color:"#111",textAlign:"center",letterSpacing:-1}}/>
            </div>

            {(function(){
              var fat=pRS(simV)||0;
              if(fat<=0) return <div style={{textAlign:"center",padding:"20px 0",color:"#9ca3af",fontSize:13}}>Digite um valor para simular</div>;

              var meta=metasCalc[0].valorRS;
              /* comissão escalonada vendedor: 1% antes da meta, 2% depois */
              var com=fat<meta?fat*0.01:fat*0.02;
              var taxa=fat>=meta?2:1;
              /* média diária */
              var mediaDia=diasEf>0?fat/diasEf:0;

              return (
                <div>
                  {/* resultado limpo */}
                  <div style={{background:"#f0fdf4",border:"2px solid #22c55e44",borderRadius:18,padding:"18px",marginBottom:12}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
                      <div>
                        <div style={{fontSize:9,color:"#6b7280",fontWeight:600,marginBottom:3}}>FATURAMENTO</div>
                        <div style={{fontSize:22,fontWeight:900,color:"#111",lineHeight:1}}>{fR(fat)}</div>
                      </div>
                      <div>
                        <div style={{fontSize:9,color:"#6b7280",fontWeight:600,marginBottom:3}}>MÉDIA/DIA</div>
                        <div style={{fontSize:22,fontWeight:900,color:"#111",lineHeight:1}}>{fR(mediaDia)}</div>
                        <div style={{fontSize:9,color:"#9ca3af",marginTop:2}}>{diasEf} dias úteis</div>
                      </div>
                    </div>
                    {/* comissão destaque */}
                    <div style={{background:"#fff",borderRadius:14,padding:"14px",border:"1px solid #e5e7eb"}}>
                      <div style={{fontSize:10,color:"#6b7280",fontWeight:600,marginBottom:4}}>💰 COMISSÃO ({taxa}%{fat>=meta?" — meta batida!":""})</div>
                      <div style={{fontSize:36,fontWeight:900,color:"#22c55e",lineHeight:1}}>{fR(com)}</div>
                      {fat<meta&&<div style={{fontSize:11,color:"#f59e0b",marginTop:6}}>
                        🎯 Batendo a meta → <strong>{fR(meta*0.02)}</strong> (2%)
                      </div>}
                    </div>
                  </div>

                  {/* % da meta */}
                  <div style={{background:"#f9fafb",borderRadius:14,padding:"14px",border:"1px solid #e5e7eb"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                      <span style={{fontSize:11,color:"#6b7280",fontWeight:600}}>% DA META</span>
                      <span style={{fontSize:13,fontWeight:900,color:fat>=meta?"#22c55e":"#f59e0b"}}>{(fat/meta*100).toFixed(1)}%</span>
                    </div>
                    <div style={{height:8,background:"#e5e7eb",borderRadius:4,overflow:"hidden",marginBottom:8}}>
                      <div style={{height:"100%",width:Math.min(100,(fat/meta*100))+"%",background:fat>=meta?"#22c55e":"#f59e0b",borderRadius:4,transition:"width .6s"}}/>
                    </div>
                    {fat<meta&&<div style={{fontSize:11,color:"#9ca3af"}}>Falta <strong style={{color:"#111"}}>{fR(meta-fat)}</strong> para a meta</div>}
                    {fat>=meta&&<div style={{fontSize:11,color:"#22c55e",fontWeight:700}}>✅ Meta batida! Comissão em 2%</div>}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ══ MODAL ADD CORRIDINHA ══ */}
      {showAddC&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:250,backdropFilter:"blur(10px)"}} onClick={function(){setShowAddC(false);}}>
          <div className="fu" style={{background:C.card,borderRadius:"26px 26px 0 0",padding:"16px 22px 44px",width:"100%",maxWidth:420,border:"1px solid "+C.border,borderBottom:"none"}} onClick={function(e){e.stopPropagation();}}>
            <div style={{width:34,height:4,background:C.muted2,borderRadius:2,margin:"0 auto 16px"}}/>
            <div style={{fontSize:20,fontWeight:800,marginBottom:14}}>+ Nova Corridinha</div>
            {[{label:"Título",key:"titulo",ph:"Ex: Corridinha de Julho"},{label:"Descrição",key:"descricao",ph:"Regras"},{label:"Prêmio (R$)",key:"premio",ph:"700"},{label:"Meta (R$)",key:"meta",ph:"9000"}].map(function(f){
              return (
                <div key={f.key} style={{marginBottom:10}}>
                  <div style={{fontSize:9,color:C.muted,fontWeight:600,marginBottom:4}}>{f.label.toUpperCase()}</div>
                  <input value={corrEdit[f.key]} onChange={function(e){ var v=e.target.value; setCorrEdit(function(p){ var n=Object.assign({},p); n[f.key]=v; return n; }); }} placeholder={f.ph}
                    style={{width:"100%",background:C.card2,border:"1px solid "+C.border,borderRadius:10,padding:"9px 12px",fontSize:13,color:C.text}}/>
                </div>
              );
            })}
            <div style={{display:"flex",gap:8,marginTop:4}}>
              <button onClick={function(){setShowAddC(false);}} style={{flex:1,padding:"12px",borderRadius:12,border:"1px solid "+C.border,background:C.card2,color:C.muted,fontWeight:700,fontSize:12}}>Cancelar</button>
              <button className="tap" onClick={function(){
                if(!corrEdit.titulo||!corrEdit.meta) return;
                setCorr(function(p){ return p.concat([{id:Date.now(),titulo:corrEdit.titulo,descricao:corrEdit.descricao,premio:pRS(corrEdit.premio),meta:pRS(corrEdit.meta),atual:0,ativo:true}]); });
                setCorrEdit({titulo:"",descricao:"",premio:"",meta:""});
                setShowAddC(false);
              }} style={{flex:2,padding:"12px",borderRadius:12,border:"none",background:C.lime,color:"#000",fontWeight:900,fontSize:13}}>Criar ✓</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}