import { useEffect, useMemo, useRef, useState } from 'react';
import { Home, MousePointer2, Square, DoorOpen, PanelsTopLeft, Armchair, Lamp, Lightbulb, Layers, Save, Download, Undo2, Redo2, Grid3X3, Settings, Plus, Minus, Move3D, Ruler, Trash2, PanelLeftClose, PanelRightClose, X } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { Shape } from 'three';
import { OrbitControls, Grid, Environment } from '@react-three/drei';

type Room = { id: number; name: string; x: number; y: number; w: number; h: number; color: string; polygon?: {x:number;y:number}[] };
type FurnitureModelId = 'sofa'|'armchair'|'bed'|'dining-table'|'dining-chair'|'coffee-table'|'wardrobe'|'desk'|'bookshelf'|'fridge'|'kitchen-unit'|'toilet'|'bathtub'|'washbasin'|'floor-lamp'|'plant';
type WallSide = 'north'|'south'|'east'|'west';
type PlacedObject = { id: number; kind: 'door' | 'window' | 'furniture' | 'light'; x: number; y: number; name: string; model?: FurnitureModelId; rotation?: number; wall?: WallSide; offsetMm?: number; widthMm?: number; heightMm?: number; sillMm?: number };
type Project = { rooms: Room[]; objects: PlacedObject[]; floor: string };
const initial: Room[] = [
  { id: 1, name: 'Wohnzimmer', x: 1, y: 1, w: 5.2, h: 4.2, color: '#d8c7a5' },
  { id: 2, name: 'Küche', x: 6.2, y: 1, w: 3.5, h: 3, color: '#b9d4cb' },
  { id: 3, name: 'Schlafzimmer', x: 1, y: 5.7, w: 4.2, h: 3.3, color: '#c8c9e5' },
  { id: 4, name: 'Bad', x: 6.2, y: 4.5, w: 3.5, h: 2.5, color: '#b8dce5' },
  { id: 5, name: 'Flur', x: 5.2, y: 5.7, w: 1, h: 3.3, color: '#dedede' }
];
const tools = [
  { id: 'select', label: 'Auswählen', icon: MousePointer2 },
  { id: 'measure', label: 'Messen / Bemaßen', icon: Ruler },
  { id: 'room', label: 'Raum zeichnen', icon: Square },
  { id: 'door', label: 'Tür platzieren', icon: DoorOpen },
  { id: 'window', label: 'Fenster platzieren', icon: PanelsTopLeft },
  { id: 'furniture', label: 'Möbel platzieren', icon: Armchair },
  { id: 'light', label: 'Licht platzieren', icon: Lightbulb }
] as const;
function FurnitureModel({ object }: { object: PlacedObject }) {
  const wood = '#9b704b', darkWood = '#60432f', fabric = '#9aa9b5', fabricLight = '#c4cdd2', metal = '#414b53', white = '#e9e8e2';
  const part = (x:number,y:number,z:number,sx:number,sy:number,sz:number,color:string, radius=0) => <mesh position={[x,y,z]} castShadow receiveShadow><boxGeometry args={[sx,sy,sz]}/><meshStandardMaterial color={color} roughness={radius || .78}/></mesh>;
  const cyl = (x:number,y:number,z:number,r:number,h:number,color:string) => <mesh position={[x,y,z]} castShadow><cylinderGeometry args={[r,r,h,20]}/><meshStandardMaterial color={color} roughness={.7}/></mesh>;
  const model = object.model || 'sofa';
  return <group position={[object.x,0,object.y]} rotation={[0,object.rotation||0,0]}>
    {model==='sofa' && <>{part(0,.34,0,1.9,.42,.82,fabric)}{part(0,.72,-.32,1.92,.62,.2,fabric)}{part(-.78,.72,.02,.28,.72,.82,fabric)}{part(.78,.72,.02,.28,.72,.82,fabric)}{part(-.48,.58,-.03,.66,.2,.65,fabricLight)}{part(.48,.58,-.03,.66,.2,.65,fabricLight)}{[-.72,.72].map(x=>part(x,.14,.28,.09,.28,.09,darkWood))}</>}
    {model==='armchair' && <>{part(0,.35,0,.95,.42,.82,fabric)}{part(0,.72,-.31,.98,.72,.2,fabric)}{part(-.42,.63,.02,.18,.58,.82,fabric)}{part(.42,.63,.02,.18,.58,.82,fabric)}{part(0,.58,-.02,.65,.18,.62,fabricLight)}{[-.34,.34].flatMap(x=>[-.28,.28].map(z=>part(x,.14,z,.07,.28,.07,darkWood)))}</>}
    {model==='bed' && <>{part(0,.28,0,1.8,.3,2.05,darkWood)}{part(0,.48,.05,1.72,.18,1.92,white)}{part(0,.61,-.72,1.72,.25,.42,white)}{part(-.48,.65,-.68,.58,.18,.34,fabricLight)}{part(.48,.65,-.68,.58,.18,.34,fabricLight)}{part(0,.72,.94,1.86,1.35,.12,wood)}</>}
    {model==='dining-table'||model==='coffee-table'||model==='desk' ? <>{part(0,.78,0,model==='coffee-table'?1.05:1.6,.12,model==='desk'?.78:.95,wood)}{[-.68,.68].flatMap(x=>[-.35,.35].map(z=>part(x,.38,z,.09,.72,.09,darkWood)))}{model==='desk'&&part(0,.43,-.22,1.25,.62,.06,darkWood)}</> : null}
    {model==='dining-chair' && <>{part(0,.48,0,.52,.12,.52,wood)}{part(0,.92,-.22,.52,.85,.1,wood)}{[-.2,.2].flatMap(x=>[-.2,.2].map(z=>part(x,.24,z,.055,.48,.055,darkWood)))}</>}
    {model==='wardrobe' && <>{part(0,1.05,0,1.25,2.1,.62,wood)}{part(0,1.05,.33,.025,1.98,.025,darkWood)}{part(-.12,1.1,.35,.035,.09,.035,metal)}{part(.12,1.1,.35,.035,.09,.035,metal)}</>}
    {model==='bookshelf' && <>{part(0,1.05,0,1.2,2.1,.35,darkWood)}{[.35,.8,1.25,1.7].map(y=>part(0,y,.2,1.18,.06,.38,wood))}{[-.38,-.12,.14,.38].map((x,i)=>part(x,.58,.17,.17,.35,.12,['#b65f4d','#547b91','#d1a95e','#6f8b6d'][i]))}{[-.35,.1,.35].map(x=>part(x,1.1,.17,.17,.45,.12,'#9a604f'))}</>}
    {model==='fridge' && <>{part(0,1.05,0,.82,2.1,.78,'#c9d0d3')}{part(0,1.08,.4,.78,.025,.02,'#78858b')}{part(.27,1.55,.42,.035,.42,.035,metal)}{part(.27,.62,.42,.035,.3,.035,metal)}</>}
    {model==='kitchen-unit' && <>{part(0,.48,0,1.6,.92,.65,white)}{part(0,.98,0,1.7,.12,.72,'#777e82')}{[-.52,0,.52].map(x=>part(x,.5,.34,.025,.72,.025,metal))}{part(0,1.08,.05,.42,.025,.25,metal)}</>}
    {model==='toilet' && <>{cyl(0,.42,.05,.31,.52,white)}{part(0,.72,-.2,.62,.16,.72,white)}{part(0,.45,-.46,.5,.72,.16,white)}</>}
    {model==='bathtub' && <>{part(0,.3,0,1.75,.55,.78,white)}{part(0,.58,0,1.55,.12,.6,'#b8d9df')}</>}
    {model==='washbasin' && <>{part(0,.72,0,.85,.16,.58,white)}{cyl(0,.38,0,.12,.6,metal)}{part(0,.82,0,.35,.08,.25,'#b8d9df')}</>}
    {model==='floor-lamp' && <>{cyl(0,.08,0,.28,.12,metal)}{cyl(0,.85,0,.035,1.5,metal)}{cyl(0,1.62,0,.25,.32,'#e7d8ad')}</>}
    {model==='plant' && <>{cyl(0,.2,0,.24,.4,'#9a6044')}{[0,1,2,3,4].map(i=><mesh key={i} position={[Math.cos(i*1.25)*.17,.72+(i%2)*.12,Math.sin(i*1.25)*.17]} rotation={[0,0,(i-2)*.18]}><sphereGeometry args={[.28,12,10]}/><meshStandardMaterial color={i%2?'#477b58':'#5d9665'}/></mesh>)}</>}
  </group>;
}
function WallOpeningModel({ object }: { object: PlacedObject }) {
  const width=(object.widthMm||900)/1000;
  const height=(object.heightMm||(object.kind==='door'?2100:1200))/1000;
  const sill=object.kind==='window'?(object.sillMm??900)/1000:0;
  const rotation=object.wall==='east'||object.wall==='west'?Math.PI/2:0;
  return <group position={[object.x,0,object.y]} rotation={[0,rotation,0]}>
    {object.kind==='door' ? <><mesh position={[0,height/2,0]} castShadow><boxGeometry args={[width*.94,height*.98,.045]}/><meshStandardMaterial color="#825737"/></mesh><mesh position={[width*.36,height*.48,.05]}><sphereGeometry args={[.035,12,12]}/><meshStandardMaterial color="#d5b36d" metalness={.7}/></mesh></> :
    <><mesh position={[0,sill+height/2,0]}><boxGeometry args={[width,height,.09]}/><meshStandardMaterial color="#e7e9e8"/></mesh><mesh position={[0,sill+height/2,.052]}><boxGeometry args={[width-.12,height-.12,.025]}/><meshStandardMaterial color="#83c6df" transparent opacity={.58} metalness={.2} roughness={.12}/></mesh><mesh position={[0,sill+height/2,.07]}><boxGeometry args={[.045,height,.04]}/><meshStandardMaterial color="#f2f3ef"/></mesh><mesh position={[0,sill+height/2,.07]}><boxGeometry args={[width,.045,.04]}/><meshStandardMaterial color="#f2f3ef"/></mesh></>}
  </group>;
}
function WallWithOpening({ room, side, openings }: { room: Room; side: WallSide; openings: PlacedObject[] }) {
  const length=(side==='north'||side==='south'?room.w:room.h);
  const wallHeight=2.7, thickness=.18;
  const z=side==='north'?-room.h/2:side==='south'?room.h/2:0;
  const x=side==='west'?-room.w/2:side==='east'?room.w/2:0;
  const parts: {center:number;start:number;end:number;bottom:number;top:number;id:string}[]=[];
  const cuts=openings.map(o=>{const center=(o.offsetMm||0)/1000-length/2;const width=(o.widthMm||900)/1000;const bottom=o.kind==='window'?(o.sillMm??900)/1000:0;const top=Math.min(wallHeight,(o.kind==='door'?(o.heightMm||2100):(o.sillMm??900)+(o.heightMm||1200))/1000);return {start:Math.max(-length/2,center-width/2),end:Math.min(length/2,center+width/2),bottom,top,id:String(o.id)};}).filter(c=>c.end>c.start);
  let cursor=-length/2;
  cuts.sort((a,b)=>a.start-b.start).forEach(c=>{if(c.start>cursor)parts.push({center:(cursor+c.start)/2,start:cursor,end:c.start,bottom:0,top:wallHeight,id:'wall-'+cursor});if(c.bottom>0)parts.push({center:(c.start+c.end)/2,start:c.start,end:c.end,bottom:0,top:c.bottom,id:c.id+'-sill'});if(c.top<wallHeight)parts.push({center:(c.start+c.end)/2,start:c.start,end:c.end,bottom:c.top,top:wallHeight,id:c.id+'-lintel'});cursor=Math.max(cursor,c.end);});
  if(cursor<length/2)parts.push({center:(cursor+length/2)/2,start:cursor,end:length/2,bottom:0,top:wallHeight,id:'wall-end'});
  return <group>{parts.map(p=><mesh key={side+p.id} position={[side==='north'||side==='south'?p.center:x,(p.bottom+p.top)/2,side==='north'||side==='south'?z:p.center]} castShadow receiveShadow><boxGeometry args={[side==='north'||side==='south'?p.end-p.start:thickness,p.top-p.bottom,side==='north'||side==='south'?thickness:p.end-p.start]}/><meshStandardMaterial color="#e8edf0"/></mesh>)}</group>;
}
function House3D({ rooms, objects = [], focusRoomId }: { rooms: Room[]; objects?: PlacedObject[]; focusRoomId?: number }) {
  const visibleRooms = focusRoomId ? rooms.filter(r=>r.id===focusRoomId) : rooms;
  const focus = visibleRooms[0];
  return <Canvas camera={focus ? { position: [focus.x+focus.w/2, Math.max(focus.w,focus.h)*1.35, focus.y+focus.h*1.7], fov: 48 } : { position: [12, 13, 16], fov: 42 }}>
    <ambientLight intensity={1.2}/><directionalLight position={[8,14,8]} intensity={2}/><Environment preset="city"/>
    <Grid infiniteGrid sectionColor="#8b9aaa" cellColor="#45515e" fadeDistance={35}/><OrbitControls makeDefault/>
    <mesh rotation={[-Math.PI/2,0,0]} position={[5,0,5]}><planeGeometry args={[16,16]}/><meshStandardMaterial color="#303a43"/></mesh>
    {visibleRooms.map(r => <group key={r.id} position={[r.x+r.w/2,0.06,r.y+r.h/2]}>
      <mesh><boxGeometry args={[r.w,.12,r.h]}/><meshStandardMaterial color={r.color}/></mesh>
      {(['north','south','west','east'] as WallSide[]).map(side=><WallWithOpening key={side} room={r} side={side} openings={objects.filter(o=>(o.kind==='door'||o.kind==='window')&&o.wall===side&&o.x>=r.x-.01&&o.x<=r.x+r.w+.01&&o.y>=r.y-.01&&o.y<=r.y+r.h+.01)}/>)}
    </group>)}
    {visibleRooms.flatMap(r=>objects.filter(o=>o.x>=r.x-.01&&o.x<=r.x+r.w+.01&&o.y>=r.y-.01&&o.y<=r.y+r.h+.01).map(o=>o.kind==='furniture'?<FurnitureModel key={o.id} object={o}/>:o.kind==='door'||o.kind==='window'?<WallOpeningModel key={o.id} object={o}/>:<group key={o.id} position={[o.x,0,o.y]}><mesh position={[0,.35,0]}><boxGeometry args={[.7,.45,.12]}/><meshStandardMaterial color="#f2d27c"/></mesh></group>))}
  </Canvas>;
}
export default function App() {
  const [rooms,setRooms] = useState<Room[]>(() => {
    try { const raw=localStorage.getItem('homeforge-project'); if(raw){const p=JSON.parse(raw);if(Array.isArray(p.rooms)&&p.rooms.length)return p.rooms;} } catch {}
    return initial;
  });
  const [objects,setObjects] = useState<PlacedObject[]>(() => { try { const p=JSON.parse(localStorage.getItem('homeforge-project')||'{}'); return Array.isArray(p.objects)?p.objects:[]; } catch { return []; } });
  const [active,setActive] = useState(1);
  const [tool,setTool] = useState('select');
  const [view,setView] = useState<'2d'|'3d'|'room'>('2d');
  const [roomModeId,setRoomModeId] = useState<number|null>(null);
  const [zoom,setZoom] = useState(1);
  const [pinchStart,setPinchStart] = useState<{distance:number;zoom:number}|null>(null);
  const [floor,setFloor] = useState('Erdgeschoss');
  const [selectedFurniture,setSelectedFurniture] = useState<FurnitureModelId>('sofa');
  const [selectedObjectId,setSelectedObjectId] = useState<number|null>(null);
  const [showLeft,setShowLeft] = useState(true);
  const [showRight,setShowRight] = useState(true);
  const [anchor,setAnchor] = useState<{x:number;y:number}|null>(null);
  const [drawPoints,setDrawPoints] = useState<{x:number;y:number}[]>([]);
  const [drag,setDrag] = useState<{x:number;y:number;roomX:number;roomY:number}|null>(null);
  const [objectDrag,setObjectDrag] = useState<{id:number;startX:number;startY:number;originalX:number;originalY:number;originalOffset:number}|null>(null);
  const touchPlacementRef=useRef(false);
  const suppressTouchClickRef=useRef(false);
  const [notice,setNotice] = useState('');
  const [snapEnabled,setSnapEnabled] = useState(true);
  const [gridSize,setGridSize] = useState(.25);
  const [measurePoints,setMeasurePoints] = useState<{x:number;y:number}[]>([]);
  const [saveStatus,setSaveStatus] = useState<'saved'|'saving'>('saved');
  const historyRef=useRef<string[]>([]);
  const historyIndexRef=useRef(-1);
  const restoringHistoryRef=useRef(false);
  const total = useMemo(()=>rooms.reduce((s,r)=>{const p=r.polygon;if(!p)return s+r.w*r.h;let area=0;for(let i=0;i<p.length;i++){const q=p[(i+1)%p.length];area+=p[i].x*q.y-q.x*p[i].y;}return s+Math.abs(area)/2;},0),[rooms]);
  const snapValue=(v:number)=>snapEnabled?Math.round(v/gridSize)*gridSize:v;
  useEffect(()=>{
    const snapshot=JSON.stringify({rooms,objects,floor});
    if(restoringHistoryRef.current){restoringHistoryRef.current=false;historyRef.current[historyIndexRef.current]=snapshot;return;}
    const current=historyRef.current[historyIndexRef.current];
    if(current===snapshot)return;
    historyRef.current=historyRef.current.slice(0,historyIndexRef.current+1);
    historyRef.current.push(snapshot);
    if(historyRef.current.length>60)historyRef.current.shift();
    historyIndexRef.current=historyRef.current.length-1;
    setSaveStatus('saving');
    try{localStorage.setItem('homeforge-project',snapshot);setSaveStatus('saved');}catch{setSaveStatus('saving');}
  },[rooms,objects,floor]);
  const restoreHistory=(direction:-1|1)=>{
    const next=historyIndexRef.current+direction;
    if(next<0||next>=historyRef.current.length)return;
    historyIndexRef.current=next;restoringHistoryRef.current=true;
    const state=JSON.parse(historyRef.current[next]) as Project;
    setRooms(state.rooms);setObjects(state.objects);setFloor(state.floor);
    setSelectedObjectId(null);setNotice(direction<0?'Änderung rückgängig gemacht':'Änderung wiederhergestellt');
  };
  const undo=()=>restoreHistory(-1);
  const redo=()=>restoreHistory(1);
  const duplicateSelected=()=>{
    if(!selectedObject)return;
    const copy={...selectedObject,id:Date.now(),x:selectedObject.x+.25,y:selectedObject.y+.25,offsetMm:selectedObject.offsetMm===undefined?undefined:selectedObject.offsetMm+250};
    setObjects(os=>[...os,copy]);setSelectedObjectId(copy.id);setNotice(selectedObject.name+' dupliziert.');
  };
  useEffect(()=>{
    const onKeyDown=(event:KeyboardEvent)=>{
      const target=event.target as HTMLElement|null;
      if(target&&(['INPUT','TEXTAREA','SELECT'].includes(target.tagName)||target.isContentEditable))return;
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='s'){event.preventDefault();save();return;}
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();if(event.shiftKey)redo();else undo();return;}
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='y'){event.preventDefault();redo();return;}
      if((event.key==='Delete'||event.key==='Backspace')&&selectedObjectId!==null){event.preventDefault();setObjects(os=>os.filter(o=>o.id!==selectedObjectId));setSelectedObjectId(null);setNotice('Objekt gelöscht.');}
      if(event.key==='Escape'){setObjectDrag(null);setDrag(null);setSelectedObjectId(null);setTool('select');}
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='d'){event.preventDefault();duplicateSelected();}
    };
    window.addEventListener('keydown',onKeyDown);return()=>window.removeEventListener('keydown',onKeyDown);
  });

  const room = rooms.find(r=>r.id===active) || rooms[0];
  const enterRoom = () => { if(!room)return;setActive(room.id);setRoomModeId(room.id);setView('room');setTool('select');setNotice('Du bearbeitest jetzt nur: '+room.name); };
  const leaveRoom = () => { setRoomModeId(null);setView('2d');setNotice('Zurück zur 2D-Gesamtansicht'); };
  const update = (key:keyof Room,value:string|number) => setRooms(rs=>rs.map(r=>r.id===active?{...r,[key]:value}:r));
  const save = () => { try{localStorage.setItem('homeforge-project',JSON.stringify({rooms,objects,floor}));setSaveStatus('saved');setNotice('Projekt lokal gespeichert');}catch{setSaveStatus('saving');setNotice('Speichern fehlgeschlagen – bitte Projekt exportieren.');} };
  const exportJson = () => { const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({rooms,objects,floor},null,2)],{type:'application/json'}));a.download='homeforge-projekt.json';a.click();URL.revokeObjectURL(a.href); };
  const addRoom = () => { const id=Math.max(0,...rooms.map(r=>r.id))+1;const r={id,name:'Neuer Raum',x:2+(id%3),y:2+(id%2)*4,w:3.5,h:3,color:'#d7c9ae'};setRooms([...rooms,r]);setActive(id);setTool('select'); };
  const clampZoom = (value:number) => Math.max(.35,Math.min(2.5,value));
  const handleWheelZoom = (e:React.WheelEvent<HTMLDivElement>) => { e.preventDefault(); setZoom(z=>clampZoom(z*Math.exp(-e.deltaY*.001))); };
  const touchDistance = (touches:React.TouchList) => Math.hypot(touches[0].clientX-touches[1].clientX,touches[0].clientY-touches[1].clientY);
  const handleTouchStart = (e:React.TouchEvent<HTMLDivElement>) => { if(e.touches.length===2){setPinchStart({distance:touchDistance(e.touches),zoom});suppressTouchClickRef.current=true;} };
  const handleTouchMove = (e:React.TouchEvent<HTMLDivElement>) => { if(e.touches.length===2&&pinchStart){setZoom(clampZoom(pinchStart.zoom*touchDistance(e.touches)/pinchStart.distance));} };
  const handleTouchEnd = (e:React.TouchEvent<HTMLDivElement>) => { if(e.touches.length<2)setPinchStart(null); };
  const point = (e: React.PointerEvent<HTMLDivElement>) => { const rect=(e.currentTarget.closest('.plan') as HTMLElement).getBoundingClientRect();return {x:Math.max(0,Math.min(12,(e.clientX-rect.left)/zoom/48)),y:Math.max(0,Math.min(11,(e.clientY-rect.top)/zoom/48))}; };
  const placeAt = (p:{x:number;y:number}) => {
    if(tool==='measure'){const pnt={x:snapValue(p.x),y:snapValue(p.y)};setMeasurePoints(ps=>ps.length>=2?[pnt]:[...ps,pnt]);setNotice(measurePoints.length===0?'Messung: Startpunkt gesetzt.':'Messung abgeschlossen.');return;}
    if(tool==='room'){setDrawPoints(ps=>{const next=[...ps,p];setNotice(next.length+' Wandpunkte gesetzt.');return next;});return;}
    if(['door','window','furniture','light'].includes(tool)){
      const kind=tool as PlacedObject['kind'];const names={door:'Tür',window:'Fenster',furniture:'Möbel',light:'Licht'};const catalog:Record<FurnitureModelId,string>={sofa:'Sofa',armchair:'Sessel',bed:'Doppelbett','dining-table':'Esstisch','dining-chair':'Esszimmerstuhl','coffee-table':'Couchtisch',wardrobe:'Kleiderschrank',desk:'Schreibtisch',bookshelf:'Bücherregal',fridge:'Kühlschrank','kitchen-unit':'Küchenzeile',toilet:'Toilette',bathtub:'Badewanne',washbasin:'Waschbecken','floor-lamp':'Stehlampe',plant:'Zimmerpflanze'};
      if((kind==='door'||kind==='window')&&room){const sides=[{wall:'north' as WallSide,d:Math.abs(p.y-room.y),offset:(p.x-room.x)*1000,len:room.w*1000},{wall:'south' as WallSide,d:Math.abs(p.y-room.y-room.h),offset:(p.x-room.x)*1000,len:room.w*1000},{wall:'west' as WallSide,d:Math.abs(p.x-room.x),offset:(p.y-room.y)*1000,len:room.h*1000},{wall:'east' as WallSide,d:Math.abs(p.x-room.x-room.w),offset:(p.y-room.y)*1000,len:room.h*1000}].sort((a,b)=>a.d-b.d);const w=kind==='door'?900:1200;const side=sides[0];const mm=Math.max(w/2,Math.min(side.len-w/2,Math.round(side.offset)));const obj={id:Date.now(),kind,x:side.wall==='west'?room.x:side.wall==='east'?room.x+room.w:room.x+mm/1000,y:side.wall==='north'?room.y:side.wall==='south'?room.y+room.h:room.y+mm/1000,name:names[kind],wall:side.wall,offsetMm:mm,widthMm:w,heightMm:kind==='door'?2100:1200,sillMm:kind==='window'?900:0};setObjects(os=>[...os,obj]);setSelectedObjectId(obj.id);setNotice(names[kind]+' an Wand platziert.');}
      else{const obj={id:Date.now(),kind,x:snapValue(p.x),y:snapValue(p.y),name:kind==='furniture'?catalog[selectedFurniture]:names[kind],model:kind==='furniture'?selectedFurniture:undefined};setObjects(os=>[...os,obj]);setSelectedObjectId(obj.id);setNotice((kind==='furniture'?catalog[selectedFurniture]:names[kind])+' platziert.');}
    }
  };
  const onPlanDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if(e.pointerType==='touch'){touchPlacementRef.current=true;return;}
    if (tool==='select' && (e.target as HTMLElement).closest('.room')) return;
    placeAt(point(e));
  };
  const onPlanClick = (e:React.MouseEvent<HTMLDivElement>) => {
    if(suppressTouchClickRef.current){suppressTouchClickRef.current=false;touchPlacementRef.current=false;return;}
    if(!touchPlacementRef.current)return;
    touchPlacementRef.current=false;
    if(tool==='select'&&(e.target as HTMLElement).closest('.room'))return;
    const rect=(e.currentTarget.closest('.plan') as HTMLElement).getBoundingClientRect();
    placeAt({x:Math.max(0,Math.min(12,(e.clientX-rect.left)/zoom/48)),y:Math.max(0,Math.min(11,(e.clientY-rect.top)/zoom/48))});
  };
  const onRoomDown = (e: React.PointerEvent<HTMLDivElement>,r:Room) => {
    if(tool==='select'){e.stopPropagation();setActive(r.id);}
    if(tool==='select'){const p=point(e);setDrag({x:p.x,y:p.y,roomX:r.x,roomY:r.y});(e.currentTarget.parentElement as HTMLElement)?.setPointerCapture?.(e.pointerId);}
  };
  const onPlanMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if(objectDrag){const p=point(e),dx=p.x-objectDrag.startX,dy=p.y-objectDrag.startY;setObjects(os=>os.map(o=>{if(o.id!==objectDrag.id)return o;if(o.wall){const r=rooms.find(r=>o.x>=r.x-.02&&o.x<=r.x+r.w+.02&&o.y>=r.y-.02&&o.y<=r.y+r.h+.02);if(!r)return o;const delta=(o.wall==='north'||o.wall==='south'?dx:dy)*1000;const len=(o.wall==='north'||o.wall==='south'?r.w:r.h)*1000;const width=o.widthMm||900;const offset=Math.max(width/2,Math.min(len-width/2,objectDrag.originalOffset+delta));return {...o,offsetMm:offset,x:o.wall==='west'?r.x:o.wall==='east'?r.x+r.w:r.x+offset/1000,y:o.wall==='north'?r.y:o.wall==='south'?r.y+r.h:r.y+offset/1000};}return {...o,x:Math.max(0,snapValue(objectDrag.originalX+dx)),y:Math.max(0,snapValue(objectDrag.originalY+dy))};}));return;}
    if(!drag)return;const p=point(e);setRooms(rs=>rs.map(r=>r.id===active?{...r,x:Math.max(0,drag.roomX+p.x-drag.x),y:Math.max(0,drag.roomY+p.y-drag.y)}:r));
  };
  const finishRoom = () => { if(drawPoints.length<4){setNotice('Mindestens vier Wandpunkte setzen.');return;}const xs=drawPoints.map(p=>p.x),ys=drawPoints.map(p=>p.y),x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y;const id=Math.max(0,...rooms.map(r=>r.id))+1;setRooms(rs=>[...rs,{id,name:'Neuer Raum',x,y,w,h,color:'#d7c9ae'}]);setActive(id);setDrawPoints([]);setTool('select');setNotice('Raum erstellt.');};
  const removeSelected = () => { if(!room)return; if(rooms.length<=1){setNotice('Der letzte Raum kann nicht gelöscht werden.');return;} const removed=room;const next=rooms.filter(r=>r.id!==removed.id);setRooms(next);setObjects(os=>os.filter(o=>!(o.x>=removed.x&&o.x<=removed.x+removed.w&&o.y>=removed.y&&o.y<=removed.y+removed.h)));setActive(next[0].id);if(roomModeId===removed.id)leaveRoom();setNotice('Raum „'+removed.name+'“ und seine Objekte wurden gelöscht.'); };
  const selectedObject=objects.find(o=>o.id===selectedObjectId);
  const updateObject=(key:keyof PlacedObject,value:number|string)=>setObjects(os=>os.map(o=>o.id===selectedObjectId?{...o,[key]:value}:o));
  const selectedRoomForObject=selectedObject?rooms.find(r=>selectedObject.x>=r.x-.02&&selectedObject.x<=r.x+r.w+.02&&selectedObject.y>=r.y-.02&&selectedObject.y<=r.y+r.h+.02):undefined;
  const selectedWallLength=selectedObject&&selectedRoomForObject?(selectedObject.wall==='north'||selectedObject.wall==='south'?selectedRoomForObject.w:selectedRoomForObject.h)*1000:0;
  const updateOpeningPosition=(side:WallSide,offset:number)=>{if(!selectedObject||!selectedRoomForObject)return;const r=selectedRoomForObject;const max=side==='north'||side==='south'?r.w*1000:r.h*1000;const mm=Math.max(0,Math.min(max,offset));setObjects(os=>os.map(o=>o.id===selectedObject.id?{...o,wall:side,offsetMm:mm,x:side==='west'?r.x:side==='east'?r.x+r.w:r.x+mm/1000,y:side==='north'?r.y:side==='south'?r.y+r.h:r.y+mm/1000}:o));};
  const objectIcon = (o:PlacedObject) => o.kind==='door'?'🚪':o.kind==='window'?'▥':o.kind==='furniture'?({'sofa':'🛋️','armchair':'🪑','bed':'🛏️','dining-table':'🍽️','dining-chair':'🪑','coffee-table':'▰',wardrobe:'🚪',desk:'🖥️',bookshelf:'📚',fridge:'🧊','kitchen-unit':'🍳',toilet:'🚽',bathtub:'🛁',washbasin:'🚰','floor-lamp':'💡',plant:'🪴'} as Record<string,string>)[o.model||'sofa']:'💡';
  return <div className="app">
    <header className="top"><div className="brand"><div className="brandIcon"><Home size={21}/></div><div><b>HomeForge</b><small>STUDIO · EARLY ACCESS</small></div></div><div className="project"><span className="liveDot"/> Mein Traumhaus <span className="saved">{notice||'Änderungen lokal'}</span></div><div className="topActions"><button className="iconBtn" onClick={save} title="Speichern"><Save/></button><button className="iconBtn" onClick={exportJson} title="Exportieren"><Download/></button><button className="share" onClick={exportJson}>Projekt exportieren <Download size={15}/></button></div></header>
    <div className="workspace">
      <aside className={'left '+(!showLeft?'hide':'')}><div className="sideHead"><span>WERKZEUGE</span><button onClick={()=>setShowLeft(false)}><PanelLeftClose size={16}/></button></div><div className="toolList">{tools.map(t=><button key={t.id} className={'tool '+(tool===t.id?'chosen':'')} onClick={()=>{setTool(t.id);setAnchor(null);if(t.id==='room')setDrawPoints([]);setNotice(t.id==='room'?'Setze mindestens vier Wandpunkte und schließe den Raum ab.':'Werkzeug: '+t.label);}}><t.icon size={19}/><span>{t.label}</span></button>)}</div><div className="sideDivider"/><div className="sideHead"><span>OBJEKTE</span><button onClick={()=>setTool('furniture')}><Plus size={16}/></button></div>{['Möbel & Einrichtung','Türen & Fenster','Beleuchtung','Smart Home','Treppen'].map((v,i)=><button className="category" key={v} onClick={()=>setTool(i===0?'furniture':i===2?'light':'door')}><span>{[<Armchair/>,<DoorOpen/>,<Lamp/>,<Lightbulb/>,<Layers/>][i]}</span>{v}<Plus size={14}/></button>)}{tool==='furniture'&&<div className="furnitureCatalog"><small>3D-MÖBEL AUSWÄHLEN</small>{([['sofa','Sofa'],['armchair','Sessel'],['bed','Doppelbett'],['dining-table','Esstisch'],['dining-chair','Stuhl'],['coffee-table','Couchtisch'],['wardrobe','Kleiderschrank'],['desk','Schreibtisch'],['bookshelf','Bücherregal'],['fridge','Kühlschrank'],['kitchen-unit','Küchenzeile'],['toilet','Toilette'],['bathtub','Badewanne'],['washbasin','Waschbecken'],['floor-lamp','Stehlampe'],['plant','Pflanze']] as [FurnitureModelId,string][]).map(([id,label])=><button key={id} className={selectedFurniture===id?'selectedFurniture':''} onClick={()=>{setSelectedFurniture(id);setTool('furniture');setNotice(label+' ausgewählt – im Grundriss platzieren.')}}>{label}</button>)}</div>}<div className="sideDivider"/><div className="sideHead"><span>GESCHOSSE</span><button onClick={()=>setFloor('Obergeschoss')}><Plus size={16}/></button></div>{['Erdgeschoss','Obergeschoss','Dachgeschoss'].map((f,i)=><button key={f} className={'floor '+(floor===f?'activeFloor':'')} onClick={()=>setFloor(f)}><Layers size={16}/>{f}<span>0{i+1}</span></button>)}</aside>
      <main className="main"><div className="canvasHead"><div className="crumb"><span>PROJEKT</span><b>/</b><strong>{floor}</strong></div><div className="viewSwitch"><button className={view==='2d'?'on':''} onClick={()=>{setRoomModeId(null);setView('2d');}}><Grid3X3 size={15}/> 2D-Plan</button><button className={view==='3d'?'on':''} onClick={()=>{setRoomModeId(null);setView('3d');}}><Move3D size={15}/> 3D-Ansicht</button>{view==='room'&&<button className="on">Raum</button>}</div><div className="canvasTools"><button onClick={()=>setZoom(clampZoom(zoom-.1))} title="Verkleinern"><Minus size={16}/></button><span title="Mausrad oder Zwei-Finger-Geste">{Math.round(zoom*100)}%</span><button onClick={()=>setZoom(clampZoom(zoom+.1))} title="Vergrößern"><Plus size={16}/></button><i/><button className={snapEnabled?"snapActive":""} onClick={()=>setSnapEnabled(v=>!v)} title={snapEnabled?`Rasterfang aktiv · ${Math.round(gridSize*100)} cm`:'Rasterfang aus'}><Grid3X3 size={16}/></button><select className="gridSelect" aria-label="Rasterabstand" value={gridSize} onChange={e=>setGridSize(Number(e.target.value))}><option value={0.05}>5 cm</option><option value={0.1}>10 cm</option><option value={0.25}>25 cm</option><option value={0.5}>50 cm</option><option value={1}>1 m</option></select><button onClick={()=>setShowRight(!showRight)}><Settings size={17}/></button></div></div>
        <div className="canvasArea">{!showLeft&&<button className="reopen leftReopen" onClick={()=>setShowLeft(true)}><PanelLeftClose/></button>}
          {view==='2d'?<div className="planViewport" onWheel={handleWheelZoom} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}><div className="plan" style={{transform:'scale('+zoom+')'}} onPointerDown={onPlanDown} onClick={onPlanClick} onPointerMove={onPlanMove} onPointerUp={()=>{setDrag(null);setObjectDrag(null);}} onPointerCancel={()=>{setDrag(null);setObjectDrag(null);}}>
            <div className="dimension topDim">Grundriss · Mausrad / Pinch zum Zoomen</div><div className="dimension leftDim">Maße in m</div>
            {rooms.map(r=><div key={r.id} onPointerDown={e=>onRoomDown(e,r)} className={'room '+(active===r.id?'selectedRoom':'')} style={{left:r.x*48,top:r.y*48,width:r.w*48,height:r.h*48,background:r.color}}><span className="roomName">{r.name}</span><small>{(r.w*r.h).toFixed(1)} m²</small></div>)}
            {objects.map(o=><button key={o.id} className={'placedObject '+o.kind+(selectedObjectId===o.id?' selectedPlaced':'')} title={o.name+' – auswählen'} style={o.wall?{left:o.x*48-(o.wall==='north'||o.wall==='south'?(o.widthMm||900)/1000*24:5),top:o.y*48-(o.wall==='east'||o.wall==='west'?(o.widthMm||900)/1000*24:5),width:o.wall==='north'||o.wall==='south'?(o.widthMm||900)/1000*48:10,height:o.wall==='east'||o.wall==='west'?(o.widthMm||900)/1000*48:10}: {left:o.x*48-13,top:o.y*48-13}} onPointerDown={e=>{e.stopPropagation();setSelectedObjectId(o.id);const p=point(e as unknown as React.PointerEvent<HTMLDivElement>);setObjectDrag({id:o.id,startX:p.x,startY:p.y,originalX:o.x,originalY:o.y,originalOffset:o.offsetMm||0});(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);}} onClick={()=>setSelectedObjectId(o.id)}>{objectIcon(o)}</button>)}
            {drawPoints.map((p,i)=><div key={i} className="drawAnchor" style={{left:p.x*48-5,top:p.y*48-5}}/>)}
          </div></div> :<div className="threeView roomInterior"><div className="roomModeBar"><div><b>{view==='room'?'RAUMMODUS':'3D-GESAMTANSICHT'}</b><span>{view==='room'?(rooms.find(r=>r.id===roomModeId)?.name||'Raum'):'Alle Räume'}</span></div>{view==='room'&&<button onClick={leaveRoom}><X size={16}/> Raum verlassen · 2D-Plan</button>}</div><House3D rooms={rooms} objects={objects} focusRoomId={view==='room'?roomModeId||undefined:undefined}/><span className="threeLabel">{view==='room'?'RAUMANSICHT · NUR DIESER RAUM':'3D-VORSCHAU · MIT MAUS ODER TOUCH DREHEN'}</span></div>}
          {tool==='room'&&view==='2d'&&<div className="drawControls"><span>{drawPoints.length} Punkte</span><button onClick={()=>setDrawPoints(ps=>ps.slice(0,-1))}>Zurück</button><button onClick={finishRoom} disabled={drawPoints.length<4}>Raum abschließen</button></div>}
          <div className="canvasFooter"><span><span className="liveDot"/> {rooms.length} Räume · {total.toFixed(1)} m²</span><span><Ruler size={14}/> Raster {Math.round(gridSize*100)} cm</span><span>{objects.length} Objekte</span></div>
        </div><div className="bottomBar"><div><button title="Rückgängig · Strg+Z" onClick={undo} disabled={historyIndexRef.current<=0}><Undo2 size={17}/></button><button title="Wiederholen · Strg+Y" onClick={redo} disabled={historyIndexRef.current>=historyRef.current.length-1}><Redo2 size={17}/></button></div><span>HomeForge Studio <b>0.2.0</b></span><span className="sync"><span className="liveDot"/>{saveStatus==="saved"?"Automatisch gespeichert":"Speichern…"}</span></div></main>
      <aside className={'right '+(!showRight?'hide':'')}><div className="sideHead"><span>INSPEKTOR</span><button onClick={()=>setShowRight(false)}><PanelRightClose size={16}/></button></div><section className="inspector"><label>AKTIVE AUSWAHL</label><h3>{room?.name||'Kein Raum'}</h3><p>Raum · {floor}</p><div className="field"><label>RAUMNAME</label><input value={room?.name||''} onChange={e=>update('name',e.target.value)}/></div><div className="fieldGrid"><div className="field"><label>BREITE (M)</label><input type="number" step=".01" value={room?.w||0} onChange={e=>update('w',Math.max(.5,+e.target.value))}/></div><div className="field"><label>LÄNGE (M)</label><input type="number" step=".01" value={room?.h||0} onChange={e=>update('h',Math.max(.5,+e.target.value))}/></div></div><div className="fieldGrid"><div className="field"><label>POSITION X</label><input type="number" step=".01" value={room?.x||0} onChange={e=>update('x',+e.target.value)}/></div><div className="field"><label>POSITION Y</label><input type="number" step=".01" value={room?.y||0} onChange={e=>update('y',+e.target.value)}/></div></div><div className="areaCard"><span>RAUMFLÄCHE</span><b>{(room?.w*room?.h||0).toFixed(2)} m²</b></div><button className="quick enterRoom" onClick={enterRoom}><Move3D size={16}/> Diesen Raum betreten</button><button className="delete" onClick={removeSelected} disabled={rooms.length<=1}><Trash2 size={15}/> Diesen Raum löschen</button></section>{selectedObject&&(selectedObject.kind==='door'||selectedObject.kind==='window')&&<><div className="sideDivider"/><section className="inspector openingInspector"><label>WANDÖFFNUNG · EXAKTE MASSE</label><h3>{selectedObject.kind==='door'?'Tür bearbeiten':'Fenster bearbeiten'}</h3><p>Maße und Wandposition in Millimetern</p><div className="field"><label>WANDSEITE</label><select value={selectedObject.wall||'north'} onChange={e=>updateOpeningPosition(e.target.value as WallSide,selectedObject.offsetMm||0)}><option value="north">Nordwand</option><option value="south">Südwand</option><option value="west">Westwand</option><option value="east">Ostwand</option></select></div><div className="field"><label>ABSTAND VOM WANDANFANG (MM)</label><input type="number" min="0" max={selectedWallLength} step="1" value={selectedObject.offsetMm||0} onChange={e=>updateOpeningPosition(selectedObject.wall||'north',+e.target.value)}/><small>Wandlänge: {selectedWallLength.toFixed(0)} mm</small></div><div className="fieldGrid"><div className="field"><label>BREITE (MM)</label><input type="number" min="100" step="1" value={selectedObject.widthMm||900} onChange={e=>updateObject('widthMm',Math.max(100,+e.target.value))}/></div><div className="field"><label>HÖHE (MM)</label><input type="number" min="100" step="1" value={selectedObject.heightMm||(selectedObject.kind==='door'?2100:1200)} onChange={e=>updateObject('heightMm',Math.max(100,+e.target.value))}/></div></div>{selectedObject.kind==='window'&&<div className="field"><label>BRÜSTUNGSHÖHE (MM)</label><input type="number" min="0" step="1" value={selectedObject.sillMm??900} onChange={e=>updateObject('sillMm',Math.max(0,+e.target.value))}/></div>}<button className="delete" onClick={()=>{setObjects(os=>os.filter(o=>o.id!==selectedObject.id));setSelectedObjectId(null);}}><Trash2 size={15}/> Öffnung löschen</button></section></>}<div className="sideDivider"/><section className="inspector"><label>PROJEKTÜBERSICHT</label><div className="stat"><span>Gesamtfläche</span><b>{total.toFixed(1)} m²</b></div><div className="stat"><span>Räume</span><b>{rooms.length}</b></div><div className="stat"><span>Objekte</span><b>{objects.length}</b></div></section><div className="sideDivider"/><section className="inspector"><label>SCHNELLZUGRIFF</label><button className="quick" onClick={addRoom}><Plus size={16}/> Raum hinzufügen</button><button className="quick" onClick={()=>{setTool('room');setAnchor(null);setDrawPoints([]);}}><Square size={16}/> Raum frei zeichnen</button><button className="quick" onClick={save}><Save size={16}/> Jetzt speichern</button></section></aside>
      {!showRight&&<button className="reopen rightReopen" onClick={()=>setShowRight(true)}><PanelRightClose/></button>}
    </div>
  </div>;
}
