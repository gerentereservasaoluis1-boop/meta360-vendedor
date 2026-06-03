/* eslint-disable */
import React, { useState, useEffect, useRef } from "react";

var G={bg:"#030304",card:"#0a0a0c",card2:"#111115",border:"#1c1c22",white:"#f4f4f6",muted:"#52525b",muted2:"#27272a",green:"#22c55e",amber:"#f59e0b",red:"#ef4444"};

function fR(v){ return "R$ "+Number(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2}); }
function fRk(v){ v=v||0; if(v>=1000) return "R$"+(v/1000).toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1})+"k"; return "R$"+Math.round(v); }
function pRS(s){ return parseFloat(((s||"")+"").replace(/\./g,"").replace(",","."))||0; }

var BONIF=[
  {id:"meta",label:"100%",color:"#22c55e",bonif:1000,medal:"🥇"},
  {id:"extra",label:"110%",color:"#cd7f32",bonif:1500,medal:"🥉"},
  {id:"super",label:"120%",color:"#94a3b8",bonif:2000,medal:"🥈"},
  {id:"ouro",label:"130%",color:"#fbbf24",bonif:2500,medal:"🏅"},
];

function getCascata(base){
  var m0=Math.round(base*100)/100;
  var m1=Math.round(m0*1.10*100)/100;
  var m2=Math.round(m1*1.10*100)/100;
  var m3=Math.round(m2*1.10*100)/100;
  return [m0,m1,m2,m3];
}

export default function App(){
  /* state */
  var [cfg,setCfgRaw]=useState({nome:"Gerente",metaLoja:350000,diasTrab:22,foto:null});
  function setCfg(p){ setCfgRaw(function(prev){ return Object.assign({},prev,p); }); }

  var [vendasG,setVendasGRaw]=useState({});
  function setVendasG(fn){ setVendasGRaw(function(p){ return typeof fn==="function"?fn(p):fn; }); }

  var [page,setPage]=useState("home");
  var [editando,setEditando]=useState(false);
  var [inputVal,setInputVal]=useState("");
  var inputRef=useRef(null);
  useEffect(function(){ if(editando&&inputRef.current) inputRef.current.focus(); },[editando]);

  var [showAtu,setShowAtu]=useState(false);
  var [atuDia,setAtuDia]=useState("");
  var [atuQtd,setAtuQtd]=useState("");

  var [mediasG,setMediasGRaw]=useState({});
  function setMediasG(fn){ setMediasGRaw(function(p){ return typeof fn==="function"?fn(p):fn; }); }
  var [mediaEdit,setMediaEdit]=useState(null);
  var [mediaVal,setMediaVal]=useState("");

  /* calcs */
  var hoje=new Date();
  var anoG=hoje.getFullYear(); var mesG=hoje.getMonth();
  var diasNoMesG=new Date(anoG,mesG+1,0).getDate();
  var prefixG=anoG+"-"+String(mesG+1).padStart(2,"0");

  var totalVendasG=Object.keys(vendasG).filter(function(k){ return k.indexOf(prefixG)===0; }).reduce(function(a,k){ return a+(vendasG[k]||0); },0);

  var metaLoja=cfg.metaLoja||350000;
  var diasEf=cfg.diasTrab||22;
  var vendido=totalVendasG||0;
  var cascata=getCascata(metaLoja);
  var pct=metaLoja>0?(vendido/metaLoja)*100:0;
  var comissao=vendido*0.01;

  var nivelAtual=null;
  for(var ni=cascata.length-1;ni>=0;ni--){ if(vendido>=cascata[ni]){nivelAtual=BONIF[ni];break;} }
  var proxNivel=null;
  for(var pi=0;pi<cascata.length;pi++){ if(vendido<cascata[pi]){proxNivel=BONIF[pi];break;} }

  var projecao=(function(){
    var trab=Math.min(hoje.getDate(),diasNoMesG); if(trab===0) return 0;
    return (vendido/trab)*diasEf;
  })();

  /* medias */
  var MS=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  var mediaAnual=MS.map(function(_m,i){
    var key=anoG+"-"+i;
    var entry=mediasG[key]||{};
    var metaM=entry.meta!=null?entry.meta:null;
    var vendeuM=i===mesG&&totalVendasG>0?totalVendasG:(entry.vendeu!=null?entry.vendeu:null);
    var metaBase=metaM!=null?metaM:metaLoja;
    var resultado=vendeuM!=null?vendeuM-metaBase:null;
    var pctM=metaBase>0&&vendeuM!=null?(vendeuM/metaBase)*100:null;
    var diasP=i===mesG?Math.max(1,hoje.getDate()):new Date(anoG,i+1,0).getDate();
    var mediaDia=vendeuM!=null?vendeuM/diasP:null;
    return {mes:i,metaM:metaM,vendeuM:vendeuM,resultado:resultado,pctM:pctM,mediaDia:mediaDia,key:key,isAuto:i===mesG&&totalVendasG>0};
  });
  var comV=mediaAnual.filter(function(m){ return m.vendeuM!=null; });
  var fatAnual=comV.reduce(function(a,m){ return a+(m.vendeuM||0); },0);
  var metaAnualT=comV.reduce(function(a,m){ return a+(m.metaM!=null?m.metaM:metaLoja); },0)||metaLoja;
  var pctAnual=metaAnualT>0?(fatAnual/metaAnualT)*100:0;

  function commitMedia(){
    if(!mediaEdit) return;
    var v=pRS(mediaVal);
    setMediasG(function(p){
      var prev=p[mediaEdit.key]||{};
      var upd=Object.assign({},prev);
      if(mediaVal==="") delete upd[mediaEdit.field]; else upd[mediaEdit.field]=v;
      var r=Object.assign({},p); r[mediaEdit.key]=upd; return r;
    });
    setMediaEdit(null);
  }

  var S={
    page,
    bg:{minHeight:"100vh",background:G.bg,color:G.white,fontFamily:"'Sora',sans-serif",paddingBottom:90,maxWidth:420,margin:"0 auto",position:"relative",overflow:"hidden"},
  };

  return (
    <div style={S.bg}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&display=swap'); *{box-sizing:border-box;margin:0;padding:0} button{cursor:pointer;font-family:inherit} input{font-family:inherit;} input:focus{outline:none} .tap:active{transform:scale(.96)} @keyframes fUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}} .fu{animation:fUp .3s ease}"}</style>

      {/* ══ HOME ══ */}
      {page==="home"&&(
        <div className="fu" style={{position:"relative",zIndex:1}}>
          {/* header */}
          <div style={{padding:"48px 20px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}} onClick={function(){setPage("config");}}>
              <div style={{width:44,height:44,borderRadius:"50%",background:"#111",border:"2px solid rgba(255,255,255,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:900,color:"rgba(255,255,255,.5)",cursor:"pointer"}}>
                {(cfg.nome||"G").charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{fontSize:10,color:G.muted}}>Gerencial 👋</div>
                <div style={{fontSize:16,fontWeight:900}}>{cfg.nome||"Gerente"}</div>
                <div style={{fontSize:10,color:"rgba(255,255,255,.3)"}}>Gerente de Vendas</div>
              </div>
            </div>
            <div style={{background:G.card2,border:"1px solid "+(nivelAtual?nivelAtual.color+"44":G.border),borderRadius:10,padding:"5px 10px",fontSize:10,fontWeight:700,color:nivelAtual?nivelAtual.color:G.muted}}>
              {nivelAtual?nivelAtual.medal+" "+nivelAtual.label+" ✅":"Sem nivel"}
            </div>
          </div>

          {/* HERO CARD */}
          <div style={{margin:"0 20px",borderRadius:22,padding:"20px",background:"linear-gradient(135deg,#111115,#0a0a0c)",border:"1.5px solid rgba(255,255,255,.1)",boxShadow:"0 16px 48px rgba(0,0,0,.8)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{fontSize:9,color:"rgba(255,255,255,.35)",fontWeight:700,letterSpacing:1}}>FATURAMENTO DA LOJA</div>
              <div style={{position:"relative",width:52,height:52}}>
                <svg width="52" height="52" viewBox="0 0 52 52" style={{transform:"rotate(-90deg)"}}>
                  <circle cx="26" cy="26" r="20" fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="5"/>
                  <circle cx="26" cy="26" r="20" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="5"
                    strokeDasharray={String(2*Math.PI*20*Math.min(100,pct)/100)+" "+String(2*Math.PI*20)} strokeLinecap="round"/>
                </svg>
                <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,color:"rgba(255,255,255,.8)"}}>{Math.round(pct)}%</div>
              </div>
            </div>
            <div style={{fontSize:9,color:"rgba(255,255,255,.3)",fontWeight:600,marginBottom:2}}>META DA LOJA</div>
            <div style={{fontSize:30,fontWeight:900,color:"#fff",letterSpacing:-1,marginBottom:6}}>{fR(metaLoja)}</div>
            <div style={{height:1,background:"rgba(255,255,255,.08)",marginBottom:8}}/>
            <div style={{fontSize:9,color:"rgba(255,255,255,.3)",fontWeight:600,marginBottom:2}}>VENDIDO</div>
            <div style={{fontSize:20,fontWeight:900,color:"#fff",marginBottom:6}}>
              {vendido>0?fR(vendido):<span style={{color:"rgba(255,255,255,.25)",fontSize:15}}>Toque 🔄 para lancar por dia</span>}
            </div>
            <div style={{height:5,background:"rgba(255,255,255,.07)",borderRadius:3,overflow:"hidden",marginBottom:5}}>
              <div style={{height:"100%",width:Math.min(100,pct)+"%",background:"rgba(255,255,255,.65)",borderRadius:3,transition:"width .8s"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:10}}>
              <span style={{color:"rgba(255,255,255,.4)",fontWeight:700}}>{pct.toFixed(1)}%</span>
              <span style={{color:projecao>=metaLoja?"rgba(255,255,255,.6)":"rgba(255,100,100,.6)"}}>{projecao>=metaLoja?"✅ Vai bater":"⚠️ Abaixo"}</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
              {[["FALTA META",vendido>=metaLoja?"✅":fR(metaLoja-vendido)],["DIARIA",fR(metaLoja/diasEf)],["PROJECAO",fR(projecao)]].map(function(item,i){
                return <div key={i} style={{background:"rgba(255,255,255,.05)",borderRadius:10,padding:"8px 9px"}}>
                  <div style={{fontSize:7,color:"rgba(255,255,255,.3)",fontWeight:700,marginBottom:2}}>{item[0]}</div>
                  <div style={{fontSize:12,fontWeight:900,color:"#fff"}}>{item[1]}</div>
                </div>;
              })}
            </div>
          </div>

          {/* COMISSAO */}
          <div style={{margin:"10px 20px 0",background:"linear-gradient(135deg,#052012,#081810)",border:"1px solid rgba(34,197,94,.35)",borderRadius:18,padding:"16px"}}>
            <div style={{fontSize:9,color:G.green,fontWeight:700,letterSpacing:2,marginBottom:8}}>💰 COMISSÃO ACUMULADA</div>
            <div style={{fontSize:9,color:"rgba(255,255,255,.4)",marginBottom:4}}>1% SOBRE O FATURAMENTO</div>
            <div style={{fontSize:52,fontWeight:900,color:"#4ade80",lineHeight:1,letterSpacing:-2,textShadow:"0 0 40px rgba(74,222,128,.9)",marginBottom:6}}>{fR(comissao)}</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,.4)",marginBottom:10}}>sobre {fR(vendido)} vendido</div>
            <div style={{height:5,background:"rgba(34,197,94,.1)",borderRadius:3,overflow:"hidden",marginBottom:6}}>
              <div style={{height:"100%",width:Math.min(100,pct)+"%",background:"linear-gradient(90deg,#22c55e,#16a34a)",borderRadius:3,boxShadow:"0 0 10px rgba(34,197,94,.4)",transition:"width .8s"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"rgba(255,255,255,.4)"}}>
              <span>{pct.toFixed(1)}% da meta</span>
              <span style={{color:"rgba(34,197,94,.7)",fontWeight:700}}>{vendido>=metaLoja?"✅ Meta batida!":proxNivel?"Proximo: "+proxNivel.label+" +R$"+proxNivel.bonif:"🏆"}</span>
            </div>
          </div>

          {/* METAS CASCATA */}
          <div style={{margin:"12px 20px 0"}}>
            <div style={{fontSize:12,fontWeight:800,marginBottom:8}}>Metas em Cascata</div>
            <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:6}}>
              {cascata.map(function(metaN,i){
                var b=BONIF[i];
                var atingiu=vendido>=metaN;
                var pctN=metaN>0?Math.min(100,(vendido/metaN)*100):0;
                return <div key={i} style={{flexShrink:0,width:152,background:G.card,border:"1px solid "+(atingiu?b.color+"55":G.border),borderRadius:16,padding:"14px"}}>
                  <div style={{fontSize:22}}>{b.medal}</div>
                  <div style={{fontSize:11,fontWeight:800,color:atingiu?b.color:G.muted,marginTop:4}}>{b.label}</div>
                  <div style={{fontSize:15,fontWeight:900,color:"#fff",marginTop:2}}>{fRk(metaN)}</div>
                  <div style={{fontSize:8,color:G.muted,marginTop:6,marginBottom:2}}>Ganhos</div>
                  <div style={{fontSize:13,fontWeight:900,color:atingiu?G.green:G.muted2}}>{fRk(metaN*0.01+b.bonif)}</div>
                  <div style={{marginTop:8,height:3,background:G.muted2,borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",width:pctN+"%",background:atingiu?b.color:"rgba(255,255,255,.2)",borderRadius:2}}/>
                  </div>
                  <div style={{fontSize:8,color:G.muted,marginTop:2}}>{pctN.toFixed(0)}%{!atingiu?" — falta "+fRk(metaN-vendido):""}</div>
                </div>;
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══ MEDIAS ══ */}
      {page==="medias"&&(
        <div className="fu" style={{position:"relative",zIndex:1,padding:"52px 20px 0"}}>
          <div style={{fontSize:22,fontWeight:900,marginBottom:2}}>📊 Planilha de Médias</div>
          <div style={{fontSize:11,color:G.muted,marginBottom:12}}>{anoG} · Toque para editar</div>

          {/* resumo */}
          <div style={{background:"linear-gradient(135deg,#052012,#081810)",border:"1px solid rgba(34,197,94,.4)",borderRadius:18,padding:"14px",marginBottom:12}}>
            <div style={{fontSize:10,color:G.green,fontWeight:700,letterSpacing:2,marginBottom:10}}>RESUMO ANUAL {anoG}</div>
            <div style={{textAlign:"center",marginBottom:10}}>
              <div style={{fontSize:9,color:G.muted,marginBottom:4}}>% ANUAL ({comV.length} meses)</div>
              <div style={{fontSize:40,fontWeight:900,color:pctAnual>=100?G.green:pctAnual>=65?G.amber:G.red,lineHeight:1,letterSpacing:-1}}>{pctAnual.toFixed(1)}%</div>
            </div>
            <div style={{height:6,background:"rgba(255,255,255,.08)",borderRadius:3,overflow:"hidden",marginBottom:8}}>
              <div style={{height:"100%",width:Math.min(100,pctAnual)+"%",background:pctAnual>=100?G.green:G.amber,borderRadius:3}}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
              {[["TOTAL META",fRk(metaAnualT),G.muted],["FATURADO",fRk(fatAnual),G.green],["MEDIA/MES",comV.length>0?fRk(fatAnual/comV.length):"—",G.green]].map(function(item,i){
                return <div key={i} style={{background:"rgba(0,0,0,.3)",borderRadius:10,padding:"8px"}}>
                  <div style={{fontSize:7,color:G.muted,fontWeight:600,marginBottom:2}}>{item[0]}</div>
                  <div style={{fontSize:12,fontWeight:900,color:item[2]}}>{item[1]}</div>
                </div>;
              })}
            </div>
          </div>

          {/* tabela */}
          <div style={{display:"grid",gridTemplateColumns:"38px 1fr 1fr 48px 48px",gap:3,padding:"6px 10px",background:G.card2,borderRadius:"10px 10px 0 0",border:"1px solid "+G.border,borderBottom:"none"}}>
            {["MES","META","VENDIDO","MD/DIA","RES."].map(function(h,hi){
              return <div key={hi} style={{fontSize:7,color:G.muted,fontWeight:700,textAlign:hi>0?"center":"left"}}>{h}</div>;
            })}
          </div>
          <div style={{background:G.card,border:"1px solid "+G.border,borderRadius:"0 0 18px 18px",overflow:"hidden",marginBottom:8}}>
            {mediaAnual.map(function(m,i){
              var isAtual=i===mesG;
              var futuro=i>mesG;
              var pc=m.pctM!=null?(m.pctM>=100?G.green:m.pctM>=65?G.amber:G.red):G.muted2;
              var rc=m.resultado!=null?(m.resultado>=0?G.green:G.red):G.muted2;
              var eM=mediaEdit&&mediaEdit.key===m.key&&mediaEdit.field==="meta";
              var eV=mediaEdit&&mediaEdit.key===m.key&&mediaEdit.field==="vendeu";
              return (
                <div key={i} style={{borderBottom:i<11?"1px solid "+G.border+"55":"none",background:isAtual?"rgba(34,197,94,.05)":"transparent"}}>
                  <div style={{display:"grid",gridTemplateColumns:"38px 1fr 1fr 48px 48px",gap:3,padding:"8px 10px",alignItems:"center"}}>
                    <div style={{fontSize:11,fontWeight:700,color:isAtual?G.green:futuro?G.muted2:G.white}}>{MS[i]}</div>
                    {/* META */}
                    <div style={{textAlign:"center"}}>
                      {eM
                        ? <input autoFocus type="text" inputMode="decimal" value={mediaVal} onChange={function(e){setMediaVal(e.target.value);}} onBlur={commitMedia} onKeyDown={function(e){if(e.key==="Enter")commitMedia();}} style={{width:"100%",background:G.card2,border:"1px solid #3b82f6",borderRadius:6,padding:"3px 4px",fontSize:10,fontWeight:700,color:"#3b82f6",textAlign:"center"}}/>
                        : <button onClick={function(){setMediaEdit({key:m.key,field:"meta"});setMediaVal(m.metaM!=null?String(m.metaM):"");}} style={{background:"transparent",border:"1px solid "+(m.metaM!=null?"rgba(255,255,255,.15)":G.border),borderRadius:6,padding:"4px",color:m.metaM!=null?"rgba(255,255,255,.6)":G.muted2,fontSize:9,fontWeight:700,width:"100%"}}>
                            {m.metaM!=null?fRk(m.metaM):"—"}
                          </button>
                      }
                    </div>
                    {/* VENDIDO */}
                    <div style={{textAlign:"center"}}>
                      {m.isAuto
                        ? <div style={{background:pc+"15",border:"1px solid "+pc+"44",borderRadius:6,padding:"4px",color:pc,fontSize:9,fontWeight:900}}>
                            {fRk(m.vendeuM)}<div style={{fontSize:5,color:pc+"88",marginTop:1}}>auto</div>
                          </div>
                        : eV
                          ? <input autoFocus type="text" inputMode="decimal" value={mediaVal} onChange={function(e){setMediaVal(e.target.value);}} onBlur={commitMedia} onKeyDown={function(e){if(e.key==="Enter")commitMedia();}} style={{width:"100%",background:G.card2,border:"1px solid rgba(34,197,94,.5)",borderRadius:6,padding:"3px 4px",fontSize:10,fontWeight:700,color:G.green,textAlign:"center"}}/>
                          : <button onClick={function(){setMediaEdit({key:m.key,field:"vendeu"});setMediaVal(m.vendeuM!=null?String(m.vendeuM):"");}} style={{background:m.vendeuM!=null?pc+"15":"transparent",border:"1px solid "+(m.vendeuM!=null?pc+"44":G.border),borderRadius:6,padding:"4px",color:m.vendeuM!=null?pc:G.muted2,fontSize:9,fontWeight:700,width:"100%"}}>
                              {m.vendeuM!=null?fRk(m.vendeuM):"—"}
                            </button>
                      }
                    </div>
                    {/* MEDIA DIA */}
                    <div style={{textAlign:"center"}}>
                      {m.mediaDia!=null
                        ? <div style={{fontSize:9,fontWeight:900,color:"rgba(255,255,255,.55)"}}>{fRk(m.mediaDia).replace("R$","")}<div style={{fontSize:5,color:G.muted}}>/dia</div></div>
                        : <div style={{fontSize:9,color:G.muted2}}>—</div>}
                    </div>
                    {/* RESULTADO */}
                    <div style={{textAlign:"center"}}>
                      {m.resultado!=null
                        ? <div style={{fontSize:9,fontWeight:900,color:rc}}>{m.resultado>=0?"+":""}{fRk(m.resultado)}</div>
                        : <div style={{fontSize:9,color:G.muted2}}>—</div>}
                    </div>
                  </div>
                  {m.pctM!=null&&(
                    <div style={{padding:"0 10px 6px"}}>
                      <div style={{height:2,background:G.muted2,borderRadius:1,overflow:"hidden"}}>
                        <div style={{height:"100%",width:Math.min(100,m.pctM)+"%",background:pc,borderRadius:1}}/>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{fontSize:9,color:G.muted,textAlign:"center",marginBottom:6}}>Mes atual preenchido automaticamente · Toque para editar outros meses</div>
        </div>
      )}

      {/* ══ CONFIG ══ */}
      {page==="config"&&(
        <div className="fu" style={{position:"relative",zIndex:1,padding:"52px 20px 0"}}>
          <div style={{fontSize:22,fontWeight:900,marginBottom:16}}>⚙️ Configurações</div>

          {/* ATALHO ATUALIZAR */}
          <div onClick={function(){setShowAtu(true);setAtuDia("");setAtuQtd("");setPage("home");}}
            style={{background:"linear-gradient(135deg,#0a1a0a,#0f1f0f)",border:"1px solid rgba(34,197,94,.35)",borderRadius:16,padding:"14px 16px",marginBottom:12,display:"flex",alignItems:"center",gap:14,cursor:"pointer"}}>
            <div style={{width:42,height:42,borderRadius:12,background:"rgba(34,197,94,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🔄</div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:800,color:G.green}}>Atualizar Faturamento</div>
              <div style={{fontSize:10,color:G.muted,marginTop:2}}>Lançar ou corrigir vendas por dia</div>
            </div>
            <div style={{fontSize:20,color:G.muted}}>›</div>
          </div>

          {/* PERFIL */}
          <div style={{background:G.card,border:"1px solid rgba(255,255,255,.1)",borderRadius:18,padding:"16px",marginBottom:10}}>
            <div style={{fontSize:9,color:G.muted,fontWeight:600,marginBottom:10}}>PERFIL</div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:9,color:G.muted,fontWeight:600,marginBottom:5}}>NOME</div>
              <input value={cfg.nome||""} onChange={function(e){setCfg({nome:e.target.value});}}
                style={{width:"100%",background:G.card2,border:"1px solid "+G.border,borderRadius:10,padding:"10px 12px",fontSize:14,color:G.white,fontWeight:700}}/>
            </div>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:9,color:G.muted,fontWeight:600,marginBottom:5}}>META DA LOJA (R$)</div>
              <div style={{position:"relative"}}>
                <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:14,fontWeight:800,color:G.white,pointerEvents:"none"}}>R$</div>
                <input type="text" inputMode="decimal" value={cfg.metaLoja?String(cfg.metaLoja):""}
                  onChange={function(e){var v=pRS(e.target.value)||350000;setCfg({metaLoja:v});}}
                  placeholder="350000"
                  style={{width:"100%",background:G.card2,border:"1px solid rgba(255,255,255,.12)",borderRadius:12,padding:"12px 12px 12px 38px",fontSize:20,fontWeight:900,color:G.white}}/>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:12,fontWeight:700}}>Dias Úteis</div>
                <div style={{fontSize:9,color:G.muted}}>no período</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <button onClick={function(){setCfg({diasTrab:Math.max(1,diasEf-1)});}}
                  style={{width:32,height:32,borderRadius:8,border:"1px solid "+G.border,background:G.card2,color:G.muted,fontSize:16,fontWeight:700}}>−</button>
                <span style={{fontSize:20,fontWeight:900,color:G.white,minWidth:32,textAlign:"center"}}>{diasEf}</span>
                <button onClick={function(){setCfg({diasTrab:diasEf+1});}}
                  style={{width:32,height:32,borderRadius:8,border:"1px solid "+G.border,background:G.card2,color:G.muted,fontSize:16,fontWeight:700}}>+</button>
              </div>
            </div>
          </div>

          {/* CASCATA */}
          <div style={{background:G.card,border:"1px solid rgba(255,255,255,.1)",borderRadius:18,overflow:"hidden"}}>
            <div style={{padding:"12px 16px",borderBottom:"1px solid "+G.border,display:"flex",justifyContent:"space-between"}}>
              <div style={{fontSize:11,fontWeight:800}}>Metas em Cascata</div>
              <div style={{fontSize:9,color:G.muted}}>+10% cada nível</div>
            </div>
            {cascata.map(function(metaN,i){
              var b=BONIF[i];
              var atingiu=vendido>=metaN;
              var pctN=metaN>0?Math.min(100,(vendido/metaN)*100):0;
              var com=metaN*0.01+b.bonif;
              return (
                <div key={i} style={{borderBottom:i<3?"1px solid "+G.border:"none",background:atingiu?b.color+"08":"transparent"}}>
                  <div style={{padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:38,height:38,borderRadius:10,background:atingiu?b.color+"20":G.card2,border:"1px solid "+(atingiu?b.color+"55":G.border),display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{b.medal}</div>
                      <div>
                        <div style={{fontSize:12,fontWeight:800,color:atingiu?b.color:G.muted}}>{b.label} {atingiu?"✅":""}</div>
                        <div style={{fontSize:10,color:"rgba(255,255,255,.7)"}}>{fR(metaN)}</div>
                      </div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:8,color:G.muted,marginBottom:2}}>comissão + bônus</div>
                      <div style={{fontSize:9,color:"rgba(255,255,255,.5)"}}>{fR(metaN*0.01)} + {fR(b.bonif)}</div>
                      <div style={{fontSize:22,fontWeight:900,color:atingiu?"#4ade80":"#22c55e",lineHeight:1,marginTop:3,textShadow:atingiu?"0 0 20px rgba(74,222,128,.6)":"none"}}>{fR(com)}</div>
                    </div>
                  </div>
                  <div style={{padding:"0 16px 8px"}}>
                    <div style={{height:3,background:"rgba(255,255,255,.05)",borderRadius:2,overflow:"hidden",marginBottom:3}}>
                      <div style={{height:"100%",width:pctN+"%",background:atingiu?b.color:"rgba(255,255,255,.2)",borderRadius:2}}/>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:8,color:G.muted}}>
                      <span>{pctN.toFixed(1)}%</span>
                      {!atingiu&&<span>Falta {fR(metaN-vendido)}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ MODAL LANÇAR ══ */}
      {editando&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.9)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,backdropFilter:"blur(12px)",padding:"0 24px"}} onClick={function(){setEditando(false);}}>
          <div className="fu" style={{background:G.card,borderRadius:24,padding:"24px 22px 22px",width:"100%",maxWidth:380,border:"1px solid rgba(255,255,255,.1)"}} onClick={function(e){e.stopPropagation();}}>
            <div style={{width:34,height:4,background:G.muted2,borderRadius:2,margin:"0 auto 16px"}}/>
            <div style={{fontSize:9,color:G.muted,fontWeight:600,marginBottom:4}}>LANÇAR TOTAL DO MÊS</div>
            <div style={{fontSize:20,fontWeight:900,marginBottom:12}}>Faturamento direto</div>
            <div style={{position:"relative",marginBottom:8}}>
              <div style={{position:"absolute",left:16,top:"50%",transform:"translateY(-50%)",fontSize:22,fontWeight:900,color:G.white,pointerEvents:"none",zIndex:1}}>R$</div>
              <input ref={inputRef} type="text" inputMode="decimal" value={inputVal}
                onChange={function(e){setInputVal(e.target.value.replace(/[^0-9,.]/g,""));}}
                onKeyDown={function(e){if(e.key==="Enter"){var v=pRS(inputVal);if(inputVal!==""&&v>=0)setCfg({vendidoStr:String(v)});setEditando(false);}}}
                placeholder="0,00"
                style={{width:"100%",background:G.card2,border:"2px solid rgba(255,255,255,.2)",borderRadius:16,padding:"18px 16px 18px 56px",fontSize:36,fontWeight:900,color:G.white,letterSpacing:-1}}/>
            </div>
            <div style={{fontSize:10,color:G.muted,marginBottom:12,textAlign:"center"}}>💡 Use 🔄 Atualizar para lançar por dia</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={function(){setEditando(false);setInputVal("");}} style={{flex:1,padding:"13px",borderRadius:14,border:"1px solid "+G.border,background:G.card2,color:G.muted,fontWeight:700,fontSize:12}}>Cancelar</button>
              <button onClick={function(){var v=pRS(inputVal);if(inputVal!==""&&v>=0)setCfg({vendidoStr:String(v)});setEditando(false);setInputVal("");}}
                style={{flex:2,padding:"13px",borderRadius:14,border:"none",background:"#fff",color:"#000",fontWeight:900,fontSize:14}}>Confirmar ✓</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL ATUALIZAR POR DIA ══ */}
      {showAtu&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.92)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:250,backdropFilter:"blur(14px)"}} onClick={function(){setShowAtu(false);setAtuDia("");setAtuQtd("");}}>
          <div className="fu" style={{background:G.card,borderRadius:"24px 24px 0 0",padding:"16px 20px 44px",width:"100%",maxWidth:420,border:"1px solid rgba(255,255,255,.12)",borderBottom:"none"}} onClick={function(e){e.stopPropagation();}}>
            <div style={{width:34,height:4,background:G.muted2,borderRadius:2,margin:"0 auto 14px"}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div>
                <div style={{fontSize:9,color:G.muted,fontWeight:600,letterSpacing:1}}>FATURAMENTO POR DIA</div>
                <div style={{fontSize:20,fontWeight:900}}>{atuDia?"Dia "+parseInt(atuDia.split("-")[2])+" — "+MS[mesG]:"Selecione um dia"}</div>
              </div>
              {atuDia&&vendasG[atuDia]>0&&(
                <div style={{background:"rgba(34,197,94,.15)",border:"1px solid rgba(34,197,94,.3)",borderRadius:8,padding:"4px 10px",fontSize:10,color:G.green,fontWeight:700}}>
                  Atual: {fR(vendasG[atuDia])}
                </div>
              )}
            </div>

            {/* dias */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:9,color:G.muted,fontWeight:600,marginBottom:6}}>DIA DO MÊS — {MS[mesG]} {anoG}</div>
              <div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:4}}>
                {(function(){
                  var days=[];
                  for(var di=1;di<=diasNoMesG;di++){
                    var ds=prefixG+"-"+String(di).padStart(2,"0");
                    var sel=atuDia===ds;
                    var isHoje=di===hoje.getDate();
                    var temV=vendasG[ds]>0;
                    var semV=!temV&&di<hoje.getDate();
                    days.push(
                      <button key={di}
                        onClick={(function(k){ return function(){ setAtuDia(k); setAtuQtd(vendasG[k]>0?String(vendasG[k]):""); }; })(ds)}
                        style={{flexShrink:0,width:46,height:54,borderRadius:10,
                          border:"2px solid "+(sel?"#fff":isHoje?"rgba(255,255,255,.5)":temV?"rgba(34,197,94,.4)":semV?"rgba(239,68,68,.4)":"rgba(255,255,255,.1)"),
                          background:sel?"rgba(255,255,255,.2)":isHoje?"rgba(255,255,255,.08)":temV?"rgba(34,197,94,.08)":semV?"rgba(239,68,68,.08)":"transparent",
                          color:sel?"#fff":isHoje?"rgba(255,255,255,.9)":temV?"#4ade80":semV?"#ef4444":"rgba(255,255,255,.3)",
                          fontSize:13,fontWeight:700,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,cursor:"pointer"}}>
                        <span style={{lineHeight:1}}>{di}</span>
                        {temV&&<span style={{fontSize:6,fontWeight:600}}>{fRk(vendasG[ds]).replace("R$","")}</span>}
                        {semV&&!temV&&<span style={{fontSize:7,color:"#ef4444",fontWeight:800}}>!</span>}
                        {isHoje&&!sel&&<span style={{fontSize:5,color:"rgba(255,255,255,.4)"}}>hoje</span>}
                      </button>
                    );
                  }
                  return days;
                })()}
              </div>
            </div>

            {/* input */}
            {atuDia?(
              <div>
                <div style={{fontSize:9,color:G.muted,fontWeight:600,marginBottom:6}}>VALOR — DIA {parseInt(atuDia.split("-")[2])}</div>
                <div style={{position:"relative",marginBottom:8}}>
                  <div style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:20,fontWeight:900,color:G.white,pointerEvents:"none",zIndex:1}}>R$</div>
                  <input type="text" inputMode="decimal" value={atuQtd} autoFocus
                    onChange={function(e){setAtuQtd(e.target.value.replace(/[^0-9,.]/g,""));}}
                    placeholder="0,00"
                    style={{width:"100%",background:G.card2,border:"2px solid rgba(255,255,255,.25)",borderRadius:14,padding:"16px 14px 16px 50px",fontSize:36,fontWeight:900,color:G.white,letterSpacing:-1}}/>
                </div>
                {(function(){
                  var v=pRS(atuQtd); if(!v||v<=0) return null;
                  var novoTotal=totalVendasG-(vendasG[atuDia]||0)+v;
                  var p=metaLoja>0?(novoTotal/metaLoja)*100:0;
                  return <div style={{textAlign:"center",marginBottom:8,fontSize:11,fontWeight:700,color:p>=100?G.green:G.amber}}>
                    {p>=100?"✅ Meta batida!":"📌 Total: "+fR(novoTotal)+" ("+p.toFixed(1)+"%)"}
                  </div>;
                })()}
                <div style={{display:"flex",gap:8}}>
                  <button onClick={function(){setShowAtu(false);setAtuDia("");setAtuQtd("");}}
                    style={{flex:1,padding:"13px",borderRadius:14,border:"1px solid "+G.border,background:G.card2,color:G.muted,fontWeight:700,fontSize:12}}>Cancelar</button>
                  <button className="tap"
                    onClick={function(){
                      var v=pRS(atuQtd);
                      setVendasG(function(p){
                        var n=Object.assign({},p);
                        if(atuQtd===""){ delete n[atuDia]; } else { n[atuDia]=v; }
                        return n;
                      });
                      setShowAtu(false); setAtuDia(""); setAtuQtd("");
                    }}
                    style={{flex:2,padding:"13px",borderRadius:14,border:"none",background:"#fff",color:"#000",fontWeight:900,fontSize:14,boxShadow:"0 6px 20px rgba(255,255,255,.15)"}}>Confirmar ✓</button>
                </div>
              </div>
            ):(
              <div style={{textAlign:"center",padding:"16px 0",color:G.muted,fontSize:12}}>
                <div style={{fontSize:28,marginBottom:6}}>👆</div>
                Toque em um dia para lançar o faturamento
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ NAV ══ */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:420,zIndex:50}}>
        <div style={{background:G.card,borderTop:"1px solid "+G.border,display:"grid",gridTemplateColumns:"1fr 1fr 56px 1fr 1fr",alignItems:"center",padding:"6px 4px 20px",gap:0}}>
          <button onClick={function(){setPage("home");}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"5px",border:"none",background:page==="home"?"rgba(255,255,255,.08)":"transparent",borderRadius:8,color:page==="home"?G.white:G.muted}}>
            <span style={{fontSize:18,lineHeight:1}}>📊</span><span style={{fontSize:7,fontWeight:600}}>Home</span>
          </button>
          <button onClick={function(){setShowAtu(true);setAtuDia("");setAtuQtd("");}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"5px",border:"none",background:showAtu?"rgba(255,255,255,.08)":"transparent",borderRadius:8,color:showAtu?G.white:G.muted}}>
            <span style={{fontSize:18,lineHeight:1}}>🔄</span><span style={{fontSize:7,fontWeight:600}}>Atualizar</span>
          </button>
          <div style={{display:"flex",justifyContent:"center"}}>
            <button className="tap" onClick={function(){setEditando(true);setInputVal("");}}
              style={{width:46,height:46,borderRadius:"50%",background:"#fff",border:"none",fontSize:22,fontWeight:900,color:"#000",boxShadow:"0 4px 16px rgba(255,255,255,.25)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:6}}>+</button>
          </div>
          <button onClick={function(){setPage("medias");}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"5px",border:"none",background:page==="medias"?"rgba(255,255,255,.08)":"transparent",borderRadius:8,color:page==="medias"?G.white:G.muted}}>
            <span style={{fontSize:18,lineHeight:1}}>📊</span><span style={{fontSize:7,fontWeight:600}}>Médias</span>
          </button>
          <button onClick={function(){setPage("config");}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"5px",border:"none",background:page==="config"?"rgba(255,255,255,.08)":"transparent",borderRadius:8,color:page==="config"?G.white:G.muted}}>
            <span style={{fontSize:18,lineHeight:1}}>⚙️</span><span style={{fontSize:7,fontWeight:600}}>Config</span>
          </button>
        </div>
      </div>
    </div>
  );
}
