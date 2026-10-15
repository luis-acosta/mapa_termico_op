const sources=[
 {id:'F1',name:'Vapor LP excedente',short:'Vapor LP',type:'Vapor',temp:'120–180 °C',power:12,continuity:'Alta',location:'Calderas / Utilities',risk:'Medio',x:31,y:58},
 {id:'F2',name:'Condensado caliente',short:'Condensado',type:'Líquido',temp:'80–110 °C',power:6,continuity:'Alta',location:'Retorno de condensado',risk:'Bajo',x:50,y:61},
 {id:'F3',name:'Gases calientes',short:'Gases calientes',type:'Gas',temp:'180–300 °C',power:15,continuity:'Media',location:'Hornos de proceso',risk:'Alto',x:39,y:43},
 {id:'F4',name:'Agua caliente de enfriamiento',short:'Agua enfriamiento',type:'Agua',temp:'35–55 °C',power:20,continuity:'Alta',location:'Torres de enfriamiento',risk:'Bajo',x:13,y:42},
 {id:'F5',name:'Purgas de vapor',short:'Purgas',type:'Vapor',temp:'100–160 °C',power:3,continuity:'Variable',location:'Red de vapor',risk:'Medio',x:57,y:45},
 {id:'F6',name:'Corriente líquida caliente',short:'Corriente caliente',type:'Líquido',temp:'100–150 °C',power:10,continuity:'Alta',location:'Unidad de proceso',risk:'Medio',x:61,y:32},
 {id:'F7',name:'Calor de compresores',short:'Compresores',type:'Aire / agua',temp:'60–90 °C',power:4,continuity:'Alta',location:'Servicios industriales',risk:'Bajo',x:68,y:70},
 {id:'F8',name:'Calor disperso de proceso',short:'Calor disperso',type:'Mixto',temp:'40–80 °C',power:8,continuity:'Variable',location:'Área de proceso',risk:'Medio',x:47,y:29}
];
const demands=[
 {id:'D1',name:'Agua helada para edificios',short:'Agua helada',power:2,temp:'7–12 °C',x:54,y:78},
 {id:'D2',name:'Salas de control',short:'Salas de control',power:1,temp:'7–12 °C',x:51,y:75},
 {id:'D3',name:'Subestaciones',short:'Subestaciones',power:.8,temp:'18–24 °C',x:84,y:79},
 {id:'D4',name:'Precalentamiento de agua',short:'Precalentamiento',power:4,temp:'60–90 °C',x:25,y:54},
 {id:'D5',name:'Corriente fría de proceso',short:'Corriente fría',power:8,temp:'100–150 °C',x:67,y:40}
];
const techs={
 F1:['Chiller de absorción','Intercambiador de calor','Sensórica clamp-on'],F2:['Intercambiador de calor','Recuperación de condensado','Bomba de calor industrial'],
 F3:['ORC','Economizador','Intercambiador de calor'],F4:['Bomba de calor industrial','Chiller de absorción'],F5:['Recuperación de condensado','Sensórica clamp-on'],
 F6:['Red de intercambiadores','Intercambiador de calor','Chiller de absorción'],F7:['Bomba de calor industrial','Intercambiador de calor'],F8:['Bomba de calor industrial','Dashboard energético']
};
const compat={F1:['D1','D2','D3','D4'],F2:['D4','D5'],F3:['D4','D5'],F4:['D1','D2','D3'],F5:['D4'],F6:['D4','D5'],F7:['D1','D3','D4'],F8:['D1','D3','D4']};
const models=['CAPEX directo','ESCO','BOOT','EaaS / CaaS','Pago por desempeño','Suscripción'];
const scenarioFactors={conservative:{eff:.5,hours:6800,cost:52,capex:1.16},base:{eff:.6,hours:8000,cost:65,capex:1},optimistic:{eff:.72,hours:8500,cost:82,capex:.92}};
const seedPortfolio=[
 {id:'OT-001',source:'Vapor LP',demand:'Agua helada salas control',tech:'Chiller absorción',model:'BOOT / CaaS',power:12,score:4.5,value:3.74},
 {id:'OT-002',source:'Condensado caliente',demand:'Precalentamiento agua',tech:'Intercambiador',model:'ESCO',power:6,score:4.4,value:1.62},
 {id:'OT-003',source:'Gases calientes',demand:'Aire combustión',tech:'Economizador',model:'EPC / ESCO',power:15,score:3.9,value:2.91},
 {id:'OT-004',source:'Agua enfriamiento',demand:'Calor valorizado',tech:'Bomba de calor',model:'BOOT',power:20,score:3.1,value:2.43},
 {id:'OT-005',source:'Purgas vapor',demand:'Retorno condensado',tech:'Recuperación condensado',model:'Pago por ahorro',power:3,score:4.0,value:.76},
 {id:'OT-006',source:'Corriente caliente',demand:'Corriente fría proceso',tech:'Red intercambiadores',model:'EPC / ESCO',power:10,score:4.2,value:1.74}
];
let selectedSource=sources[0],portfolio=[...seedPortfolio],scenario='base',energyUnit='PJ',satelliteMap=null,mapMode='illustration';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const fmt=(n,d=0)=>n.toLocaleString('es-CO',{minimumFractionDigits:d,maximumFractionDigits:d});
const mwhToPj=mwh=>mwh*3.6e-6;
const energyDisplay=mwh=>energyUnit==='PJ'?{value:fmt(mwhToPj(mwh),3),unit:'PJ'}:{value:fmt(mwh),unit:'MWh'};

function init(){renderHotspots();populateModels();selectSource('F1');$('#point-control').hidden=true;renderScores();renderPortfolio();bindEvents();loadMapbox();}
function demoCoordinate(item){return[-75.510+(item.x-50)*.00034,10.315-(item.y-50)*.00023]}
function loadMapbox(){
 const token=window.MAPBOX_PUBLIC_TOKEN;if(!token)return;
 const css=document.createElement('link');css.rel='stylesheet';css.href='https://api.mapbox.com/mapbox-gl-js/v3.8.0/mapbox-gl.css';document.head.appendChild(css);
 const script=document.createElement('script');script.src='https://api.mapbox.com/mapbox-gl-js/v3.8.0/mapbox-gl.js';script.onload=()=>initSatelliteMap(token);script.onerror=()=>console.warn('No fue posible cargar la vista satelital; se mantiene la ilustración.');document.head.appendChild(script);
}
function initSatelliteMap(token){
 mapboxgl.accessToken=token;satelliteMap=new mapboxgl.Map({container:'mapbox-map',style:'mapbox://styles/mapbox/satellite-streets-v12',center:[-75.510,10.315],zoom:14.25,pitch:52,bearing:-18,antialias:true,attributionControl:true});
 satelliteMap.addControl(new mapboxgl.NavigationControl({showCompass:true}),'bottom-right');
 satelliteMap.on('load',()=>{mapMode='satellite';$('.hero-map').classList.add('map-live');$('#map-mode').hidden=false;$('#mapbox-demo-tools').hidden=false;$('#map-insight').hidden=false;$('#map-mode').textContent='Ver ilustración';$('#image-note').textContent='Vista satelital Mapbox · Hotspots demostrativos, no representan coordenadas operativas reales';addMapboxDemoLayers();positionMapHotspots();drawFlow();updateMapDistance()});
 satelliteMap.on('move',()=>{if(mapMode==='satellite'){positionMapHotspots();drawFlow()}});
}
function thermalGeoJson(){return{type:'FeatureCollection',features:sources.map(s=>({type:'Feature',properties:{id:s.id,name:s.name,power:s.power},geometry:{type:'Point',coordinates:demoCoordinate(s)}}))}}
function routeGeoJson(){const features=[];sources.forEach(s=>compat[s.id].forEach(did=>{const d=demands.find(x=>x.id===did);features.push({type:'Feature',properties:{source:s.id,demand:d.id},geometry:{type:'LineString',coordinates:[demoCoordinate(s),demoCoordinate(d)]}})}));return{type:'FeatureCollection',features}}
function addMapboxDemoLayers(){
 satelliteMap.addSource('thermal-demo',{type:'geojson',data:thermalGeoJson()});
 satelliteMap.addLayer({id:'thermal-heat',type:'heatmap',source:'thermal-demo',layout:{visibility:'none'},paint:{'heatmap-weight':['interpolate',['linear'],['get','power'],1,0.15,20,1],'heatmap-intensity':1.25,'heatmap-radius':['interpolate',['linear'],['zoom'],12,24,16,58],'heatmap-opacity':.82,'heatmap-color':['interpolate',['linear'],['heatmap-density'],0,'rgba(30,55,64,0)',.2,'#2fb7c5',.45,'#f2cf66',.7,'#f26a3d',1,'#9d1e12']}});
 satelliteMap.addSource('thermal-routes',{type:'geojson',data:routeGeoJson()});
 satelliteMap.addLayer({id:'thermal-routes-glow',type:'line',source:'thermal-routes',layout:{visibility:'none'},paint:{'line-color':'#62d7df','line-width':5,'line-opacity':.22}});
 satelliteMap.addLayer({id:'thermal-routes-line',type:'line',source:'thermal-routes',layout:{visibility:'none'},paint:{'line-color':'#b8fbff','line-width':1.5,'line-opacity':.9,'line-dasharray':[2,2]}});
 const layers=satelliteMap.getStyle().layers||[],labelLayer=layers.find(l=>l.type==='symbol'&&l.layout&&l.layout['text-field']);
 if(satelliteMap.getSource('composite'))satelliteMap.addLayer({id:'demo-buildings-3d',source:'composite','source-layer':'building',filter:['==',['get','extrude'],'true'],type:'fill-extrusion',minzoom:14,layout:{visibility:'none'},paint:{'fill-extrusion-color':'#b5c4c3','fill-extrusion-height':['coalesce',['get','height'],8],'fill-extrusion-base':['coalesce',['get','min_height'],0],'fill-extrusion-opacity':.58}},labelLayer&&labelLayer.id);
}
function selectMapDemoLayer(mode){
 if(!satelliteMap||!satelliteMap.isStyleLoaded())return;['thermal-heat','thermal-routes-glow','thermal-routes-line','demo-buildings-3d'].forEach(id=>{if(satelliteMap.getLayer(id))satelliteMap.setLayoutProperty(id,'visibility','none')});
 $$('#mapbox-demo-tools button').forEach(b=>b.classList.toggle('active',b.dataset.mapLayer===mode));
 if(mode==='heat'){satelliteMap.setLayoutProperty('thermal-heat','visibility','visible');satelliteMap.easeTo({zoom:13.7,pitch:38,duration:900})}
 if(mode==='routes'){satelliteMap.setLayoutProperty('thermal-routes-glow','visibility','visible');satelliteMap.setLayoutProperty('thermal-routes-line','visibility','visible');satelliteMap.easeTo({zoom:14.1,pitch:48,duration:900})}
 if(mode==='3d'){if(satelliteMap.getLayer('demo-buildings-3d'))satelliteMap.setLayoutProperty('demo-buildings-3d','visibility','visible');satelliteMap.easeTo({zoom:15.2,pitch:72,bearing:-32,duration:1200})}
 if(mode==='satellite')satelliteMap.easeTo({center:[-75.510,10.315],zoom:14.25,pitch:52,bearing:-18,duration:900});
 if(mode==='tour')startMapTour();
}
function startMapTour(){let i=0;const stops=[sources[0],sources[2],sources[3],sources[5]];const visit=()=>{if(i>=stops.length){selectMapDemoLayer('satellite');return}const s=stops[i++];selectSource(s.id);satelliteMap.flyTo({center:demoCoordinate(s),zoom:16,pitch:65,bearing:-20+i*24,duration:1800,essential:true});setTimeout(visit,2500)};visit()}
function updateMapDistance(){if(!satelliteMap)return;const [a,b]=[demoCoordinate(selectedSource),demoCoordinate(currentDemand())],rad=x=>x*Math.PI/180,dLat=rad(b[1]-a[1]),dLon=rad(b[0]-a[0]),h=Math.sin(dLat/2)**2+Math.cos(rad(a[1]))*Math.cos(rad(b[1]))*Math.sin(dLon/2)**2,km=6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));$('#map-distance').textContent=km<1?`${Math.round(km*1000)} m`:`${fmt(km,2)} km`}
function positionMapHotspots(){if(!satelliteMap)return;[...sources,...demands].forEach(item=>{const p=satelliteMap.project(demoCoordinate(item)),el=document.querySelector(`.hotspot[data-id="${item.id}"]`);if(el){el.style.left=`${p.x}px`;el.style.top=`${p.y}px`}})}
function setMapMode(mode){mapMode=mode;const live=mode==='satellite';$('.hero-map').classList.toggle('map-live',live);$('#map-mode').textContent=live?'Ver ilustración':'Ver satélite';$('#image-note').textContent=live?'Vista satelital Mapbox · Hotspots demostrativos, no representan coordenadas operativas reales':'Imagen ilustrativa generada para el prototipo · La ubicación de activos no representa instalaciones reales';if(live){satelliteMap.resize();positionMapHotspots()}else{[...sources,...demands].forEach(item=>{const el=document.querySelector(`.hotspot[data-id="${item.id}"]`);el.style.left=item.x+'%';el.style.top=item.y+'%'})}drawFlow()}
function renderHotspots(){
 const box=$('#hotspots'); box.innerHTML='';
 [...sources.map(v=>({...v,kind:'source'})),...demands.map(v=>({...v,kind:'demand'}))].forEach(item=>{
  const b=document.createElement('button'); b.className=`hotspot ${item.kind}`; b.style.left=item.x+'%'; b.style.top=item.y+'%'; b.dataset.kind=item.kind;b.dataset.id=item.id;
  b.setAttribute('aria-label',`${item.kind==='source'?'Fuente':'Demanda'} ${item.name}`);b.innerHTML=`<span class="hotspot-ring"></span><span class="hotspot-label">${item.id} · ${item.short}</span>`;
  b.onclick=()=>item.kind==='source'?selectSource(item.id):selectDemand(item.id);box.appendChild(b);
 });
}
function selectSource(id){
 selectedSource=sources.find(s=>s.id===id)||sources[0];
 $$('.hotspot').forEach(h=>h.classList.toggle('selected',h.dataset.id===id));
 $('#source-id').textContent=`FUENTE ${selectedSource.id}`;$('#source-name').textContent=selectedSource.name;$('#source-location').textContent=selectedSource.location;
 $('#source-temp').textContent=selectedSource.temp;$('#source-power').textContent=`${fmt(selectedSource.power,selectedSource.power%1?1:0)} MWt`;$('#source-continuity').textContent=selectedSource.continuity;$('#source-risk').textContent=selectedSource.risk;
 const valid=demands.filter(d=>compat[id].includes(d.id)); const ds=$('#demand-select');ds.innerHTML=valid.map(d=>`<option value="${d.id}">${d.id} · ${d.name} (${d.power} MW)</option>`).join('');
 $('#technology-select').innerHTML=techs[id].map(t=>`<option>${t}</option>`).join('');showPointControl();updateAll();
}
function showPointControl(){
 const control=$('#point-control'),spot=document.querySelector(`.hotspot[data-id="${selectedSource.id}"]`),hero=$('.hero-map');control.hidden=false;control.style.left=`${Math.max(155,Math.min(hero.clientWidth-155,spot.offsetLeft))}px`;control.style.top=`${Math.max(160,Math.min(hero.clientHeight-125,spot.offsetTop))}px`;
 $('#point-control-id').textContent=`FUENTE ${selectedSource.id}`;$('#point-control-name').textContent=selectedSource.name;$('#point-power').value=selectedSource.power;$('#point-power-value').textContent=`${fmt(selectedSource.power,selectedSource.power%1?1:0)} MWt`;
}
function updateSourcePower(value){selectedSource.power=+value;$('#point-power-value').textContent=`${fmt(selectedSource.power,selectedSource.power%1?1:0)} MWt`;$('#source-power').textContent=$('#point-power-value').textContent;if(satelliteMap&&satelliteMap.getSource('thermal-demo'))satelliteMap.getSource('thermal-demo').setData(thermalGeoJson());updateAll()}
function selectDemand(id){
 const compatible=sources.filter(s=>compat[s.id].includes(id));if(!compatible.some(s=>s.id===selectedSource.id))selectSource(compatible[0].id);
 $('#demand-select').value=id;updateAll();
}
function populateModels(){$('#model-select').innerHTML=models.map(m=>`<option>${m}</option>`).join('');$('#model-select').value='BOOT';}
function currentDemand(){return demands.find(d=>d.id===$('#demand-select').value)||demands[0]}
function calculate(){
 const eff=+$('#efficiency').value/100,hours=+$('#hours').value,cost=+$('#energy-cost').value;
 const useful=selectedSource.power*eff,energy=useful*hours,savings=energy*cost,capex=selectedSource.power*.875*1e6*scenarioFactors[scenario].capex;
 const distance=Math.hypot(selectedSource.x-currentDemand().x,selectedSource.y-currentDemand().y);
 const scores={"Potencial energético":Math.min(5,2.4+selectedSource.power/6),"Calidad térmica":selectedSource.temp.includes('300')?4.8:selectedSource.power>8?4.5:3.8,"Continuidad":selectedSource.continuity==='Alta'?4.8:selectedSource.continuity==='Media'?3.8:3.1,"Cercanía física":Math.max(2.2,5-distance/18),"Retorno económico":Math.min(5,2.6+savings/2500000),"Facilidad ejecución":selectedSource.risk==='Bajo'?4.6:selectedSource.risk==='Medio'?3.8:3.1};
 const score=Object.values(scores).reduce((a,b)=>a+b,0)/6;
 return{eff,hours,cost,useful,energy,savings,capex,payback:capex/savings,co2:energy*.2,scores,score};
}
function updateAll(){
 const d=currentDemand(),c=calculate(),tech=$('#technology-select').value,model=$('#model-select').value;
 $('#efficiency-value').textContent=`${Math.round(c.eff*100)}%`;$('#hours-value').textContent=`${fmt(c.hours)} h/año`;$('#cost-value').textContent=`${fmt(c.cost)} USD/MWh`;
 const shownEnergy=energyDisplay(c.energy);
 $('#opportunity-title').textContent=`${selectedSource.short} → ${d.short}`;$('#useful-power').textContent=fmt(c.useful,1);$('#annual-energy').textContent=shownEnergy.value;$('#annual-energy-unit').textContent=shownEnergy.unit;$('#annual-energy-note').textContent=energyUnit==='PJ'?`potencial recuperable · ${fmt(c.energy)} MWh`:`equivale a ${fmt(mwhToPj(c.energy),3)} PJ`;$('#annual-savings').textContent=`$${fmt(c.savings/1e6,2)} M`;$('#payback').textContent=fmt(c.payback,1);$('#capex-label').textContent=`CAPEX estimado $${fmt(c.capex/1e6,1)} M`;$('#co2').textContent=fmt(c.co2);
 $('#flow-source').textContent=selectedSource.short;$('#flow-input').textContent=`${selectedSource.power} MWt`;$('#flow-tech').textContent=tech;$('#flow-demand').textContent=d.short;$('#flow-output').textContent=`${fmt(c.useful,1)} MW útiles`;$('#flow-eff').textContent=`${Math.round(c.eff*100)}% eficiencia`;
 const label=c.score>=4.2?'MUY ALTA':c.score>=3.5?'ALTA':c.score>=2.8?'MEDIA':'BAJA';$('#priority-pill').innerHTML=`<span></span> PRIORIDAD ${label} · <b>${fmt(c.score,1)}</b>`;
 $('#recommendation-text').textContent=recommendation(model,tech,c.payback);renderScores(c.scores);drawFlow();updateMapDistance();
}
function recommendation(model,tech,payback){if(model.includes('BOOT')||model.includes('CaaS'))return `Estructurar piloto ${model} para ${tech}, con medición de línea base y contrato por desempeño.`;if(model==='ESCO')return `Validar ahorro con sensórica temporal y estructurar un ESCO con retorno estimado de ${fmt(payback,1)} años.`;return `Avanzar a prefactibilidad de ${tech} y validar CAPEX mediante ingeniería conceptual.`}
function renderScores(scores=calculate().scores){$('#score-bars').innerHTML=Object.entries(scores).map(([k,v])=>`<div class="score-bar"><span>${k}</span><i><b style="width:${v/5*100}%"></b></i><strong>${fmt(v,1)}</strong></div>`).join('')}
function drawFlow(){const d=currentDemand(),path=$('#flow-line path'),hero=$('.hero-map');if(!path)return;const a=document.querySelector(`.hotspot[data-id="${selectedSource.id}"]`),b=document.querySelector(`.hotspot[data-id="${d.id}"]`),x1=a.offsetLeft/hero.clientWidth*1000,y1=a.offsetTop/hero.clientHeight*560,x2=b.offsetLeft/hero.clientWidth*1000,y2=b.offsetTop/hero.clientHeight*560;path.setAttribute('d',`M ${x1} ${y1} C ${(x1+x2)/2} ${y1}, ${(x1+x2)/2} ${y2}, ${x2} ${y2}`);$$('.hotspot').forEach(h=>h.classList.toggle('selected',h.dataset.id===selectedSource.id||h.dataset.id===d.id));}
function addCurrent(){
 const d=currentDemand(),c=calculate(),id=`OT-${String(portfolio.length+1).padStart(3,'0')}`;
 portfolio.push({id,source:selectedSource.short,demand:d.short,tech:$('#technology-select').value,model:$('#model-select').value,power:selectedSource.power,energy:c.energy,score:+c.score.toFixed(1),value:c.savings/1e6});
 $('#action-message').textContent=`${id} agregado al portafolio`;renderPortfolio();setTimeout(()=>$('#action-message').textContent='',3500);
}
function renderPortfolio(){
 const portfolioMwh=portfolio.reduce((a,o)=>a+(o.energy??o.power*.6*8000),0),shownEnergy=energyDisplay(portfolioMwh);
 $('#portfolio-count').textContent=Math.max(0,portfolio.length-seedPortfolio.length);$('#pf-count').textContent=portfolio.length;$('#pf-energy').textContent=shownEnergy.value;$('#pf-energy-unit').textContent=`${shownEnergy.unit}/año`;$('#pf-value').textContent=`$${fmt(portfolio.reduce((a,o)=>a+o.value,0),1)} M`;$('#pf-priority').textContent=portfolio.filter(o=>o.score>=4).length;
 const sorted=[...portfolio].sort((a,b)=>b.score-a.score);$('#ranking-table').innerHTML=`<div class="ranking-row header"><span>RANK</span><span>OPORTUNIDAD</span><span>TECNOLOGÍA</span><span>MWt</span><span>ÍNDICE</span></div>`+sorted.map((o,i)=>`<div class="ranking-row"><span class="rank">${String(i+1).padStart(2,'0')}</span><span><b>${o.id}</b> · ${o.source} → ${o.demand}</span><span>${o.tech}</span><span>${o.power}</span><span class="score">${fmt(o.score,1)}</span></div>`).join('');
 const grouped={};portfolio.forEach(o=>grouped[o.tech]=(grouped[o.tech]||0)+o.power);const max=Math.max(...Object.values(grouped));$('#tech-mix').innerHTML=Object.entries(grouped).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([k,v])=>`<div class="mix-row"><label><span>${k}</span><b>${v} MW</b></label><i><b style="width:${v/max*100}%"></b></i></div>`).join('');renderMatrix();
}
function renderMatrix(){
 let html=`<div class="matrix" style="grid-template-columns:180px repeat(${demands.length},1fr)"><div class="matrix-cell head">FUENTE / DEMANDA</div>${demands.map(d=>`<div class="matrix-cell head">${d.short}</div>`).join('')}`;
 sources.slice(0,6).forEach((s,si)=>{html+=`<div class="matrix-cell head">${s.short}</div>`+demands.map((d,di)=>{const ok=compat[s.id].includes(d.id),level=ok?((si+di)%3===0?'high':'medium'):'low';return `<div class="matrix-cell ${level}">${ok?(level==='high'?'Alta':'Media'):'Baja'}</div>`}).join('')});$('#compatibility-matrix').innerHTML=html+'</div>';
}
function exportCard(){
 const d=currentDemand(),c=calculate(),content=`CALOR RESCATADO — FICHA EJECUTIVA\n\nFuente: ${selectedSource.name}\nDemanda: ${d.name}\nTecnología: ${$('#technology-select').value}\nModelo: ${$('#model-select').value}\n\nPotencia disponible: ${selectedSource.power} MWt\nPotencia útil: ${fmt(c.useful,1)} MW\nEnergía anual: ${fmt(c.energy)} MWh/año\nAhorro estimado: USD ${fmt(c.savings)} / año\nCAPEX indicativo: USD ${fmt(c.capex)}\nPayback: ${fmt(c.payback,1)} años\nCO₂ evitado: ${fmt(c.co2)} t/año\nPuntaje: ${fmt(c.score,1)} / 5\n\nSupuestos: ${Math.round(c.eff*100)}% eficiencia, ${fmt(c.hours)} h/año, ${fmt(c.cost)} USD/MWh.\n\nDocumento demostrativo. Requiere medición e ingeniería conceptual.`;
 const blob=new Blob([content],{type:'text/plain;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`ficha-${selectedSource.id}-${d.id}.txt`;a.click();URL.revokeObjectURL(a.href);
}
function bindEvents(){
 $$('.nav-link').forEach(b=>b.onclick=()=>{$$('.nav-link').forEach(x=>x.classList.toggle('active',x===b));$$('.view').forEach(v=>v.classList.toggle('active-view',v.id===b.dataset.view));window.scrollTo(0,0)});
 $$('.filter').forEach(b=>b.onclick=()=>{$$('.filter').forEach(x=>x.classList.toggle('active',x===b));$$('.hotspot').forEach(h=>h.style.display=b.dataset.filter==='all'||h.dataset.kind===b.dataset.filter?'block':'none')});
 ['demand-select','technology-select','model-select','efficiency','hours','energy-cost'].forEach(id=>$('#'+id).addEventListener('input',updateAll));
 $$('.segmented button').forEach(b=>b.onclick=()=>{scenario=b.dataset.scenario;$$('.segmented button').forEach(x=>x.classList.toggle('active',x===b));const s=scenarioFactors[scenario];$('#efficiency').value=s.eff*100;$('#hours').value=s.hours;$('#energy-cost').value=s.cost;updateAll()});
 $('#add-portfolio').onclick=addCurrent;$('#export-card').onclick=exportCard;$('#close-selection').onclick=()=>document.querySelector('.hero-map').scrollIntoView({behavior:'smooth'});
 $('#point-power').addEventListener('input',e=>updateSourcePower(e.target.value));$('#point-control-close').onclick=()=>$('#point-control').hidden=true;
 $('#map-mode').onclick=()=>setMapMode(mapMode==='satellite'?'illustration':'satellite');
 $$('#mapbox-demo-tools button').forEach(b=>b.onclick=()=>selectMapDemoLayer(b.dataset.mapLayer));
 $$('.unit-toggle button').forEach(b=>b.onclick=()=>{energyUnit=b.dataset.unit;$$('.unit-toggle button').forEach(x=>x.classList.toggle('active',x.dataset.unit===energyUnit));updateAll();renderPortfolio()});
}
document.addEventListener('DOMContentLoaded',init);
