import React,{useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {anatomy} from './data';

const palette={skeletal:'#e6d5b8',muscular:'#ac5047',organs:'#b58686',cardiovascular:'#a5323c',nervous:'#d8b46c',integumentary:'#d5ad92'};
export default function AnatomyScene({enabled,explode,selected,onSelect,region,command,showLabels}){
 const mount=useRef(),state=useRef(),props=useRef();props.current={enabled,explode,selected,onSelect,region,showLabels};
 const [labels,setLabels]=useState([]),[failed,setFailed]=useState(false);
 useEffect(()=>{
  const el=mount.current;
  let renderer;try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}catch(e){setFailed(true);return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0,0);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.32;
  el.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-label','Interactive three-dimensional human anatomy model. Drag to rotate, scroll to zoom, and click a structure to inspect it.');
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(32,1,.1,100);camera.position.set(.4,.2,19.8);
  const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.05,0);controls.enableDamping=true;controls.dampingFactor=.08;controls.minDistance=7;controls.maxDistance=30;controls.maxPolarAngle=Math.PI*.85;controls.minPolarAngle=Math.PI*.15;controls.enablePan=true;
  scene.add(new THREE.HemisphereLight(0xf5fcf7,0x687a70,3));const key=new THREE.DirectionalLight(0xfff4e9,4.3);key.position.set(-4,7,8);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-7,right:7,top:7,bottom:-7});key.shadow.bias=-.001;scene.add(key);
  const fill=new THREE.DirectionalLight(0xc7e6df,2);fill.position.set(4,2,-4);scene.add(fill);
  const body=new THREE.Group();scene.add(body);const groups=[],meshes=[];
  const material=(c,rough=.55)=>new THREE.MeshStandardMaterial({color:c,roughness:rough,metalness:.02});
  let current;
  function part(id,fn){const info=anatomy.find(a=>a.id===id);const g=new THREE.Group();g.userData={...info};body.add(g);groups.push(g);current=g;fn();g.userData.base=g.position.clone();}
  function add(geo,col,position=[0,0,0],scale=[1,1,1]){const mesh=new THREE.Mesh(geo,material(col||palette[current.userData.system]));mesh.position.set(...position);mesh.scale.set(...scale);mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.id=current.userData.id;current.add(mesh);meshes.push(mesh);return mesh;}
  function ell(p,s,col){return add(new THREE.SphereGeometry(1,32,24),col,p,s);}
  function tube(points,r,col){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));return add(new THREE.TubeGeometry(curve,Math.max(20,points.length*8),r,10,false),col);}
  function bone(a,b,r=.065){tube([a,b],r);ell(a,[r*1.55,r*1.55,r*1.55]);ell(b,[r*1.5,r*1.5,r*1.5]);}
  function muscle(a,b,w,d,col){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),length=av.distanceTo(bv);const points=[];for(let i=0;i<=24;i++){let t=i/24;points.push(new THREE.Vector2(.025+Math.pow(Math.sin(t*Math.PI),.75)*w,(t-.5)*length));}const mesh=add(new THREE.LatheGeometry(points,24),col||'#b66559');mesh.scale.z=d/w;mesh.position.copy(av).add(bv).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),bv.clone().sub(av).normalize());
   for(let j=-3;j<=3;j++){const pts=[];for(let i=2;i<=22;i++){const t=i/24,theta=Math.asin(j/4);const rad=(.025+Math.pow(Math.sin(t*Math.PI),.75)*w);const p=new THREE.Vector3(Math.sin(theta)*rad,(t-.5)*length,Math.cos(theta)*rad*d/w*1.012);p.applyQuaternion(mesh.quaternion).add(mesh.position);pts.push(p.toArray());}tube(pts,.007,j%2?'#c98a78':'#8f493f');}
  }
  // Axial skeleton
  part('skull',()=>{ell([0,4.18,0],[.43,.55,.38]);ell([0,3.97,.17],[.34,.25,.3]);for(const s of [-1,1]){ell([s*.17,4.13,.407],[.115,.12,.027],'#615449');ell([s*.17,4.14,.42],[.08,.085,.021],'#3a3930');ell([s*.31,3.97,.32],[.075,.12,.08]);}ell([0,3.98,.46],[.045,.075,.016],'#726454');});
  part('mandible',()=>{tube([[-.31,4,.05],[-.3,3.79,.25],[0,3.71,.34],[.3,3.79,.25],[.31,4,.05]],.057);for(let x=-.23;x<=.23;x+=.045)ell([x,3.84,.4],[.021,.04,.025],'#f9edcf');});
  part('vertebrae',()=>{for(let i=0;i<24;i++){let y=3.65-i*.178;ell([0,y,-.2+Math.sin(i*.19)*.07],[.12+i*.003,.071,.12]);ell([0,y,-.36],[.06,.05,.13]);}});
  part('spinalcord',()=>tube([[0,3.77,-.22],[0,2.9,-.22],[0,1.5,-.15],[0,.1,-.2]],.045));
  part('ribs',()=>{for(let i=0;i<10;i++){let y=2.89-i*.155;let w=.43+Math.sin((i+1)/12*Math.PI)*.47;for(const s of [-1,1])tube([[s*.09,y,-.24],[s*w*.76,y+.05,-.3],[s*w,y-.08,0],[s*w*.75,y-.27,.36],[s*.12,y-.31,.4]],.032);}});
  part('sternum',()=>{bone([0,2.91,.44],[0,1.72,.45],.066);ell([0,2.8,.44],[.12,.14,.045]);});
  part('clavicle',()=>{for(const s of [-1,1])tube([[s*.06,2.96,.29],[s*.45,3.02,.2],[s*.93,2.94,.04]],.055);});
  part('scapula',()=>{for(const s of [-1,1])ell([s*.65,2.65,-.35],[.35,.43,.065]);});
  part('pelvis',()=>{for(const s of [-1,1]){const m=ell([s*.44,-.42,-.04],[.39,.48,.23]);m.rotation.z=s*-.28;tube([[s*.55,-.54,.16],[s*.32,-1,.19],[s*.07,-.88,.21]],.065);}ell([0,-.54,-.18],[.23,.4,.13]);});
  for(const s of [-1,1]){
   part('humerus',()=>bone([s*1.03,2.69,0],[s*1.4,1.14,.02],.075));
   part('radius',()=>bone([s*1.44,1.04,.04],[s*1.83,-.31,.1],.045));
   part('ulna',()=>bone([s*1.35,1.08,-.025],[s*1.7,-.34,.05],.043));
   part('hand',()=>{ell([s*1.79,-.46,.1],[.13,.18,.065]);for(let j=0;j<5;j++){const x=s*(1.66+j*.065),endY=-1.03+Math.abs(j-2)*.07;bone([x,-.51,.11],[x+s*(j-2)*.025,endY,.13],.022);}});
   part('femur',()=>{bone([s*.38,-.77,0],[s*.47,-2.58,.02],.105);bone([s*.38,-.77,0],[s*.57,-.92,0],.08);});
   part('patella',()=>ell([s*.47,-2.58,.19],[.115,.14,.065]));
   part('tibia',()=>bone([s*.46,-2.76,.02],[s*.42,-4.44,0],.069));
   part('fibula',()=>bone([s*.61,-2.78,-.01],[s*.55,-4.43,-.01],.034));
   part('foot',()=>{ell([s*.46,-4.55,.09],[.16,.13,.24]);for(let j=0;j<5;j++)bone([s*(.31+j*.065),-4.57,.12],[s*(.3+j*.065),-4.64,.54-Math.abs(j-1)*.04],.028);});
   // Superficial muscle groups, each individually selectable
   part('deltoid',()=>muscle([s*.94,2.98,.01],[s*1.22,2.21,.09],.27,.23,'#af5d51'));
   part('pectoralis',()=>{for(let j=0;j<5;j++)muscle([s*.09,2.79-j*.095,.43],[s*.96,2.62-j*.07,.17],.095,.07,j%2?'#bb6b5a':'#ae5b4f');});
   part('biceps',()=>muscle([s*1.17,2.38,.12],[s*1.39,1.31,.13],.155,.14));
   part('triceps',()=>muscle([s*1.13,2.42,-.12],[s*1.38,1.3,-.1],.17,.14,'#a65a4f'));
   part('forearm',()=>{muscle([s*1.43,1.08,.06],[s*1.76,-.24,.1],.13,.12,'#ae6556');muscle([s*1.51,1.04,-.06],[s*1.82,-.26,0],.07,.07,'#b36d5b');});
   part('abdominals',()=>{for(let j=0;j<4;j++)ell([s*.19,1.24-j*.31,.39-j*.025],[.17,.16,.08],'#b46758');});
   part('obliques',()=>muscle([s*.7,1.64,.13],[s*.4,-.22,.23],.18,.12,'#aa6254'));
   part('quadriceps',()=>{muscle([s*.49,-.94,.21],[s*.48,-2.43,.18],.23,.19,'#b26958');muscle([s*.67,-.93,.04],[s*.59,-2.4,.14],.2,.17,'#a6584b');muscle([s*.28,-1.18,.12],[s*.36,-2.45,.17],.145,.135,'#c17b63');});
   part('sartorius',()=>muscle([s*.69,-.77,.32],[s*.29,-2.42,.26],.05,.03,'#d2997b'));
   part('gastrocnemius',()=>{muscle([s*.38,-2.76,-.16],[s*.4,-3.89,-.08],.18,.17);muscle([s*.61,-2.8,-.12],[s*.46,-3.95,-.08],.15,.14);tube([[s*.44,-3.75,-.09],[s*.43,-4.44,-.11]],.04,'#e4ccb0');});
   part('tibialis',()=>muscle([s*.55,-2.85,.14],[s*.48,-4.3,.13],.1,.07,'#ae6856'));
  }
  // Visceral structures, lifted slightly anteriorly for the educational cutaway
  part('lungs',()=>{for(const s of [-1,1]){const lung=ell([s*.43,2.13,.36],[.32,.68,.23],s===-1?'#ba9790':'#c3a29a');lung.rotation.z=s*-.12;tube([[s*.55,2.49,.55],[s*.34,2.22,.58],[s*.61,1.95,.52]],.012,'#977c75');}tube([[0,3.31,.22],[0,2.64,.3],[-.26,2.42,.4]],.07,'#d2bea4');tube([[0,2.64,.3],[.26,2.42,.4]],.06,'#d2bea4');});
  part('heart',()=>{const h=ell([.12,2.1,.68],[.23,.33,.19],'#a63d46');h.rotation.z=-.38;ell([-.06,2.29,.63],[.14,.14,.14],'#b45155');tube([[.04,2.27,.82],[.15,2.12,.86],[.19,1.87,.76]],.014,'#e2b08d');tube([[.12,2.32,.66],[.14,2.59,.61],[-.03,2.64,.59],[-.11,2.46,.53]],.071,'#ae4950');});
  part('liver',()=>{const l=ell([-.19,1.22,.51],[.55,.25,.24],'#8b5149');l.rotation.z=.12;});
  part('stomach',()=>{ell([.33,.99,.53],[.25,.31,.18],'#c59588');tube([[.2,1.57,.4],[.22,1.26,.5],[.43,.98,.56],[.3,.78,.55],[.1,.8,.52]],.08,'#cb9d8e');});
  part('kidneys',()=>{for(const s of [-1,1]){const k=ell([s*.43,.7,-.12],[.15,.26,.13],'#925a53');k.rotation.z=s*-.3;}});
  part('colon',()=>tube([[.48,-.3,.46],[.53,.05,.45],[.51,.55,.48],[.39,.67,.48],[0,.56,.56],[-.43,.61,.49],[-.53,.47,.46],[-.51,-.16,.49],[-.23,-.39,.46],[0,-.55,.4]],.095,'#bc9389'));
  part('intestines',()=>{for(let j=0;j<4;j++)tube([[-.36,.42-j*.18,.55],[-.16,.5-j*.18,.58],[.11,.35-j*.18,.58],[.35,.4-j*.18,.55],[.24,.26-j*.18,.58],[-.12,.3-j*.18,.6],[-.33,.2-j*.18,.56]],.055,'#ceafa0');});
  part('bladder',()=>ell([0,-.64,.4],[.2,.22,.16],'#bca68a'));
  part('aorta',()=>tube([[.04,2.54,.58],[-.14,2.73,.44],[-.24,2.51,.2],[-.13,1.4,.22],[-.1,.1,.24],[0,-.63,.2]],.05,'#a64445'));
  part('arteries',()=>{for(const s of [-1,1]){tube([[s*.03,2.65,.27],[s*.21,3.2,.22],[s*.18,3.73,.13]],.026);tube([[0,2.75,.23],[s*.9,2.81,.13],[s*1.3,1.55,.22],[s*1.64,.3,.21],[s*1.77,-.41,.19]],.024);tube([[0,-.55,.2],[s*.4,-1.03,.33],[s*.47,-2.46,.31],[s*.45,-3.49,.2],[s*.46,-4.4,.14]],.029);}});
  part('veins',()=>{for(const s of [-1,1]){tube([[s*.1,3.7,.09],[s*.26,3.15,.15],[s*.16,2.4,.24],[s*.04,-.52,.2],[s*.49,-1.04,.32],[s*.54,-2.52,.29],[s*.53,-4.35,.15]],.024,'#587d88');tube([[s*.17,2.7,.24],[s*1,2.78,.17],[s*1.36,1.5,.2],[s*1.7,.1,.17]],.02,'#587d88');}});
  part('brain',()=>{ell([0,4.31,.06],[.35,.34,.31],'#d0af9c');for(let i=0;i<15;i++){const t=i/15*Math.PI*2;tube([[Math.cos(t)*.25,4.32+Math.sin(t)*.23,.25],[Math.cos(t+.4)*.2,4.32+Math.sin(t+.4)*.21,.33],[Math.cos(t+.8)*.24,4.32+Math.sin(t+.8)*.23,.26]],.025,'#b99987');}});
  part('nerves',()=>{for(const s of [-1,1]){tube([[0,3.2,-.19],[s*.92,2.71,.21],[s*1.39,1.07,.21],[s*1.77,-.4,.22]],.017);tube([[0,.4,-.1],[s*.38,-.86,.3],[s*.5,-2.6,.31],[s*.48,-4.4,.21]],.019);for(let j=0;j<10;j++)tube([[0,2.8-j*.27,-.17],[s*.3,2.77-j*.27,.08],[s*.6,2.65-j*.27,.28]],.012);}});
  part('skin',()=>{ell([0,4.13,0],[.46,.63,.43]);ell([0,3.33,0],[.22,.35,.21]);ell([0,1.8,0],[.91,1.38,.53]);ell([0,-.29,0],[.8,.72,.44]);for(const s of [-1,1]){muscle([s*1.05,2.84,0],[s*1.46,1.08,0],.28,.25,palette.integumentary);muscle([s*1.46,1.08,0],[s*1.8,-.41,.04],.21,.2,palette.integumentary);ell([s*1.82,-.68,.08],[.17,.35,.09]);muscle([s*.44,-.52,0],[s*.48,-2.65,0],.4,.35,palette.integumentary);muscle([s*.48,-2.65,0],[s*.45,-4.46,0],.28,.24,palette.integumentary);ell([s*.46,-4.57,.21],[.2,.15,.37]);}current.children.forEach(m=>{m.material.transparent=true;m.material.opacity=.36;m.material.depthWrite=false;});});
  // Soft ground shadow
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.12}));ground.rotation.x=-Math.PI/2;ground.position.y=-4.83;ground.receiveShadow=true;scene.add(ground);
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let down;
  const onDown=e=>{down=[e.clientX,e.clientY];};
  const onClick=e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const rect=el.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);const found=ray.intersectObjects(meshes).find(x=>x.object.parent.visible);if(found)props.current.onSelect(found.object.userData.id);};
  renderer.domElement.addEventListener('pointerdown',onDown);renderer.domElement.addEventListener('click',onClick);
  let dirty=true;const resize=()=>{const {width,height}=el.getBoundingClientRect();renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();dirty=true;};const observer=new ResizeObserver(resize);observer.observe(el);resize();
  state.current={camera,controls,body,invalidate:()=>{dirty=true;}};let raf,signature='';controls.addEventListener('change',()=>{dirty=true;});
  const animate=(t)=>{raf=requestAnimationFrame(animate);const p=props.current;const nextSignature=JSON.stringify([p.enabled,p.explode,p.selected,p.region,p.showLabels]);if(signature!==nextSignature){dirty=true;signature=nextSignature;}body.scale.setScalar(1-p.explode*(camera.aspect<.9?.3:.06));
   groups.forEach(g=>{g.visible=p.enabled[g.userData.system];const sys=g.userData.system; // explosion moves each system in an anatomically readable direction
    let dx=0,dz=0;if(sys==='muscular'){const first=g.children[0];dx=p.explode*(1.15+(first?.position.x||0)*.28);dz=p.explode*.62;}if(sys==='skeletal'){dz=-p.explode*.55;dx=-p.explode*1.85;}if(sys==='organs')dz=p.explode*1.65;if(sys==='cardiovascular'){dz=p.explode*2.35;dx=p.explode*2.65;}if(sys==='nervous'){dz=-p.explode*1.25;dx=-p.explode*3.2;}if(sys==='integumentary'){dx=p.explode*4.8;dz=p.explode*.4;}const destination=new THREE.Vector3(dx,0,dz);if(g.position.distanceToSquared(destination)>.000001)dirty=true;g.position.lerp(destination,.1);
    const active=g.userData.id===p.selected;const dim=p.region!=='Whole body'&&g.userData.region!==p.region&&g.userData.region!=='Whole body';g.children.forEach(m=>{m.material.emissive.set(active?'#6b3025':'#000000');m.material.emissiveIntensity=active?.19:0;if(sys!=='integumentary'){m.material.transparent=dim;m.material.opacity=dim?.18:1;m.material.depthWrite=!dim;}});
   });controls.update();if(!dirty)return;renderer.render(scene,camera);dirty=false;
   {const markers=[['heart','Heart',[.2,2.1,.8]],['lungs','Left lung',[.6,2.25,.55]],['femur','Femur',[-.46,-1.65,.25]]];setLabels(markers.filter(([id])=>p.enabled[anatomy.find(a=>a.id===id).system]).map(([id,name,pos])=>{const v=new THREE.Vector3(...pos);const g=groups.find(g=>g.userData.id===id);if(g)v.add(g.position);v.applyMatrix4(body.matrixWorld);v.project(camera);return {id,name,x:(v.x*.5+.5)*el.clientWidth,y:(-v.y*.5+.5)*el.clientHeight};}));}
  };raf=requestAnimationFrame(animate);
  return()=>{cancelAnimationFrame(raf);observer.disconnect();controls.dispose();renderer.dispose();scene.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose();});el.removeChild(renderer.domElement);state.current=null;};
 },[]);
 useEffect(()=>{if(!state.current||!command)return;const {camera,controls,body}=state.current;state.current.invalidate();switch(command.type){case 'reset':camera.position.set(.4,.2,19.8);controls.target.set(0,.05,0);body.rotation.y=0;break;case 'zoomIn':camera.position.sub(controls.target).multiplyScalar(.85).add(controls.target);break;case 'zoomOut':camera.position.sub(controls.target).multiplyScalar(1.15).add(controls.target);break;case 'front':body.rotation.y=0;camera.position.set(0,.2,19.8);controls.target.set(0,.05,0);break;case 'back':body.rotation.y=Math.PI;camera.position.set(0,.2,19.8);controls.target.set(0,.05,0);break;case 'side':body.rotation.y=Math.PI/2;camera.position.set(0,.2,19.8);controls.target.set(0,.05,0);break;}controls.update();},[command]);
 return <div className="scene-container"><div ref={mount} className="three-mount"/>{failed&&<div className="webgl-error">3D rendering requires WebGL. Enable hardware acceleration in your browser to explore the model.</div>}{showLabels&&!failed&&labels.map(l=><button className={`anatomy-label ${selected===l.id?'selected':''} label-${l.id}`} style={{left:l.x,top:l.y}} key={l.id} onClick={()=>onSelect(l.id)}><span className="label-dot"/><span className="label-line"/><span className="label-text">{l.name}<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 17 17 7M7 7h10v10"/></svg></span></button>)}</div>;
}
