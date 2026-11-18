import { useMemo, useState } from 'react';
import { Home, MousePointer2, Square, DoorOpen, PanelsTopLeft, Armchair, Lamp, Lightbulb, Layers, Save, Download, Undo2, Redo2, Grid3X3, Settings, Plus, Minus, Move3D, Ruler, Trash2, PanelLeftClose, PanelRightClose, X } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';

type Room = { id: number; name: string; x: number; y: number; w: number; h: number; color: string };
type PlacedObject = { id: number; kind: 'door' | 'window' | 'furniture' | 'light'; x: number; y: number; name: string };
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
  { id: 'room', label: 'Raum zeichnen', icon: Square },
  { id: 'door', label: 'Tür platzieren', icon: DoorOpen },
  { id: 'window', label: 'Fenster platzieren', icon: PanelsTopLeft },
  { id: 'furniture', label: 'Möbel platzieren', icon: Armchair },
  { id: 'light', label: 'Licht platzieren', icon: Lightbulb }
] as const;
function House3D({ rooms }: { rooms: Room[] }) {
  return <Canvas camera={{ position: [12, 13, 16], fov: 42 }}>
    <ambientLight intensity={1.2}/><directionalLight position={[8,14,8]} intensity={2}/><Environment preset="city"/>
    <Grid infiniteGrid sectionColor="#8b9aaa" cellColor="#45515e" fadeDistance={35}/><OrbitControls makeDefault/>
    <mesh rotation={[-Math.PI/2,0,0]} position={[5,0,5]}><planeGeometry args={[16,16]}/><meshStandardMaterial color="#303a43"/></mesh>
    {rooms.map(r => <group key={r.id} position={[r.x+r.w/2,0.06,r.y+r.h/2]}>
      <mesh><boxGeometry args={[r.w,.12,r.h]}/><meshStandardMaterial color={r.color}/></mesh>
      {[[0,r.h/2,r.w,.18],[0,-r.h/2,r.w,.18],[-r.w/2,0,.18,r.h],[r.w/2,0,.18,r.h]].map((v,i)=><mesh key={i} position={[v[0],1.35,v[1]]}><boxGeometry args={[v[2],2.7,v[3]]}/><meshStandardMaterial color="#e8edf0"/></mesh>)}
    </group>)}
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
  const [view,setView] = useState<'2d'|'3d'>('2d');
  const [zoom,setZoom] = useState(1);
  const [pinchStart,setPinchStart] = useState<{distance:number;zoom:number}|null>(null);
  const [floor,setFloor] = useState('Erdgeschoss');
  const [showLeft,setShowLeft] = useState(true);
  const [showRight,setShowRight] = useState(true);
  const [anchor,setAnchor] = useState<{x:number;y:number}|null>(null);
  const [drag,setDrag] = useState<{x:number;y:number;roomX:number;roomY:number}|null>(null);
  const [notice,setNotice] = useState('');
  const total = useMemo(()=>rooms.reduce((s,r)=>s+r.w*r.h,0),[rooms]);
  const room = rooms.find(r=>r.id===active) || rooms[0];
  const update = (key:keyof Room,value:string|number) => setRooms(rs=>rs.map(r=>r.id===active?{...r,[key]:value}:r));
  const save = () => { localStorage.setItem('homeforge-project',JSON.stringify({rooms,objects,floor})); setNotice('Projekt lokal gespeichert'); };
  const exportJson = () => { const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({rooms,objects,floor},null,2)],{type:'application/json'}));a.download='homeforge-projekt.json';a.click();URL.revokeObjectURL(a.href); };
  const addRoom = () => { const id=Math.max(0,...rooms.map(r=>r.id))+1;const r={id,name:'Neuer Raum',x:2+(id%3),y:2+(id%2)*4,w:3.5,h:3,color:'#d7c9ae'};setRooms([...rooms,r]);setActive(id);setTool('select'); };
  const clampZoom = (value:number) => Math.max(.35,Math.min(2.5,value));
  const handleWheelZoom = (e:React.WheelEvent<HTMLDivElement>) => { e.preventDefault(); setZoom(z=>clampZoom(z*Math.exp(-e.deltaY*.001))); };
  const touchDistance = (touches:React.TouchList) => Math.hypot(touches[0].clientX-touches[1].clientX,touches[0].clientY-touches[1].clientY);
  const handleTouchStart = (e:React.TouchEvent<HTMLDivElement>) => { if(e.touches.length===2)setPinchStart({distance:touchDistance(e.touches),zoom}); };
  const handleTouchMove = (e:React.TouchEvent<HTMLDivElement>) => { if(e.touches.length===2&&pinchStart){setZoom(clampZoom(pinchStart.zoom*touchDistance(e.touches)/pinchStart.distance));} };
  const handleTouchEnd = (e:React.TouchEvent<HTMLDivElement>) => { if(e.touches.length<2)setPinchStart(null); };
  const point = (e: React.PointerEvent<HTMLDivElement>) => { const rect=(e.currentTarget.closest('.plan') as HTMLElement).getBoundingClientRect();return {x:Math.max(0,Math.min(12,(e.clientX-rect.left)/zoom/48)),y:Math.max(0,Math.min(11,(e.clientY-rect.top)/zoom/48))}; };
  const onPlanDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.room')) return;
    const p=point(e);
    if(tool==='room'){
      if(!anchor){setAnchor(p);setNotice('Startpunkt gesetzt – tippe jetzt den gegenüberliegenden Eckpunkt.');}
      else { const x=Math.min(anchor.x,p.x),y=Math.min(anchor.y,p.y),w=Math.max(.5,Math.abs(p.x-anchor.x)),h=Math.max(.5,Math.abs(p.y-anchor.y));const id=Math.max(0,...rooms.map(r=>r.id))+1;setRooms(rs=>[...rs,{id,name:'Neuer Raum',x,y,w,h,color:'#d7c9ae'}]);setActive(id);setAnchor(null);setTool('select');setNotice('Raum erstellt.'); }
    } else if(['door','window','furniture','light'].includes(tool)){
      const kind=tool as PlacedObject['kind'];const names={door:'Tür',window:'Fenster',furniture:'Möbel',light:'Licht'};setObjects(os=>[...os,{id:Date.now(),kind,x:p.x,y:p.y,name:names[kind]}]);setNotice(names[kind]+' platziert.');
    } else { setActive(rooms[0]?.id||1); }
  };
  const onRoomDown = (e: React.PointerEvent<HTMLDivElement>,r:Room) => {
    e.stopPropagation();setActive(r.id);
    if(tool==='select'){const p=point(e);setDrag({x:p.x,y:p.y,roomX:r.x,roomY:r.y});(e.currentTarget.parentElement as HTMLElement)?.setPointerCapture?.(e.pointerId);}
  };
  const onPlanMove = (e: React.PointerEvent<HTMLDivElement>) => { if(!drag)return;const p=point(e);setRooms(rs=>rs.map(r=>r.id===active?{...r,x:Math.max(0,drag.roomX+p.x-drag.x),y:Math.max(0,drag.roomY+p.y-drag.y)}:r)); };
  const removeSelected = () => { if(rooms.length>1){const next=rooms.filter(r=>r.id!==active);setRooms(next);setActive(next[0].id);} };
  const objectIcon = (o:PlacedObject) => o.kind==='door'?'🚪':o.kind==='window'?'▥':o.kind==='furniture'?'🛋️':'💡';
  return <div className="app">
    <header className="top"><div className="brand"><div className="brandIcon"><Home size={21}/></div><div><b>HomeForge</b><small>STUDIO · EARLY ACCESS</small></div></div><div className="project"><span className="liveDot"/> Mein Traumhaus <span className="saved">{notice||'Änderungen lokal'}</span></div><div className="topActions"><button className="iconBtn" onClick={save} title="Speichern"><Save/></button><button className="iconBtn" onClick={exportJson} title="Exportieren"><Download/></button><button className="share" onClick={exportJson}>Projekt exportieren <Download size={15}/></button></div></header>
    <div className="workspace">
      <aside className={'left '+(!showLeft?'hide':'')}><div className="sideHead"><span>WERKZEUGE</span><button onClick={()=>setShowLeft(false)}><PanelLeftClose size={16}/></button></div><div className="toolList">{tools.map(t=><button key={t.id} className={'tool '+(tool===t.id?'chosen':'')} onClick={()=>{setTool(t.id);setAnchor(null);setNotice(t.id==='room'?'Tippe zwei Eckpunkte, um einen Raum zu zeichnen.':'Werkzeug: '+t.label);}}><t.icon size={19}/><span>{t.label}</span></button>)}</div><div className="sideDivider"/><div className="sideHead"><span>OBJEKTE</span><button onClick={()=>setTool('furniture')}><Plus size={16}/></button></div>{['Möbel & Einrichtung','Türen & Fenster','Beleuchtung','Smart Home','Treppen'].map((v,i)=><button className="category" key={v} onClick={()=>setTool(i===0?'furniture':i===2?'light':'door')}><span>{[<Armchair/>,<DoorOpen/>,<Lamp/>,<Lightbulb/>,<Layers/>][i]}</span>{v}<Plus size={14}/></button>)}<div className="sideDivider"/><div className="sideHead"><span>GESCHOSSE</span><button onClick={()=>setFloor('Obergeschoss')}><Plus size={16}/></button></div>{['Erdgeschoss','Obergeschoss','Dachgeschoss'].map((f,i)=><button key={f} className={'floor '+(floor===f?'activeFloor':'')} onClick={()=>setFloor(f)}><Layers size={16}/>{f}<span>0{i+1}</span></button>)}</aside>
      <main className="main"><div className="canvasHead"><div className="crumb"><span>PROJEKT</span><b>/</b><strong>{floor}</strong></div><div className="viewSwitch"><button className={view==='2d'?'on':''} onClick={()=>setView('2d')}><Grid3X3 size={15}/> 2D-Plan</button><button className={view==='3d'?'on':''} onClick={()=>setView('3d')}><Move3D size={15}/> 3D-Ansicht</button></div><div className="canvasTools"><button onClick={()=>setZoom(clampZoom(zoom-.1))}><Minus size={16}/></button><span title="Mausrad oder Zwei-Finger-Geste">{Math.round(zoom*100)}%</span><button onClick={()=>setZoom(clampZoom(zoom+.1))}><Plus size={16}/></button><i/><button onClick={()=>setShowRight(!showRight)}><Settings size={17}/></button></div></div>
        <div className="canvasArea">{!showLeft&&<button className="reopen leftReopen" onClick={()=>setShowLeft(true)}><PanelLeftClose/></button>}
          {view==='2d'?<div className="planViewport" onWheel={handleWheelZoom} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}><div className="plan" style={{transform:'scale('+zoom+')'}} onPointerDown={onPlanDown} onPointerMove={onPlanMove} onPointerUp={()=>setDrag(null)} onPointerCancel={()=>setDrag(null)}>
            <div className="dimension topDim">Grundriss · Mausrad / Pinch zum Zoomen</div><div className="dimension leftDim">Maße in m</div>
            {rooms.map(r=><div key={r.id} onPointerDown={e=>onRoomDown(e,r)} className={'room '+(active===r.id?'selectedRoom':'')} style={{left:r.x*48,top:r.y*48,width:r.w*48,height:r.h*48,background:r.color}}><span className="roomName">{r.name}</span><small>{(r.w*r.h).toFixed(1)} m²</small></div>)}
            {objects.map(o=><button key={o.id} className={'placedObject '+o.kind} title={o.name+' – antippen zum Löschen'} style={{left:o.x*48-13,top:o.y*48-13}} onPointerDown={e=>e.stopPropagation()} onClick={()=>setObjects(os=>os.filter(x=>x.id!==o.id))}>{objectIcon(o)}</button>)}
            {anchor&&<div className="drawAnchor" style={{left:anchor.x*48-5,top:anchor.y*48-5}}/>}
          </div></div>:<div className="threeView"><House3D rooms={rooms}/><span className="threeLabel">3D-VORSCHAU · MIT MAUS ODER TOUCH DREHEN</span></div>}
          <div className="canvasFooter"><span><span className="liveDot"/> {rooms.length} Räume · {total.toFixed(1)} m²</span><span><Ruler size={14}/> Raster 0,25 m</span><span>{objects.length} Objekte</span></div>
        </div><div className="bottomBar"><div><button title="Rückgängig (demnächst)"><Undo2 size={17}/></button><button title="Wiederholen (demnächst)"><Redo2 size={17}/></button></div><span>HomeForge Studio <b>0.2.0</b></span><span className="sync"><span className="liveDot"/> Lokal bereit</span></div></main>
      <aside className={'right '+(!showRight?'hide':'')}><div className="sideHead"><span>INSPEKTOR</span><button onClick={()=>setShowRight(false)}><PanelRightClose size={16}/></button></div><section className="inspector"><label>AKTIVE AUSWAHL</label><h3>{room?.name||'Kein Raum'}</h3><p>Raum · {floor}</p><div className="field"><label>RAUMNAME</label><input value={room?.name||''} onChange={e=>update('name',e.target.value)}/></div><div className="fieldGrid"><div className="field"><label>BREITE (M)</label><input type="number" step=".1" value={room?.w||0} onChange={e=>update('w',Math.max(.5,+e.target.value))}/></div><div className="field"><label>LÄNGE (M)</label><input type="number" step=".1" value={room?.h||0} onChange={e=>update('h',Math.max(.5,+e.target.value))}/></div></div><div className="fieldGrid"><div className="field"><label>POSITION X</label><input type="number" step=".1" value={room?.x||0} onChange={e=>update('x',+e.target.value)}/></div><div className="field"><label>POSITION Y</label><input type="number" step=".1" value={room?.y||0} onChange={e=>update('y',+e.target.value)}/></div></div><div className="areaCard"><span>RAUMFLÄCHE</span><b>{(room?.w*room?.h||0).toFixed(2)} m²</b></div><button className="delete" onClick={removeSelected}><Trash2 size={15}/> Raum löschen</button></section><div className="sideDivider"/><section className="inspector"><label>PROJEKTÜBERSICHT</label><div className="stat"><span>Gesamtfläche</span><b>{total.toFixed(1)} m²</b></div><div className="stat"><span>Räume</span><b>{rooms.length}</b></div><div className="stat"><span>Objekte</span><b>{objects.length}</b></div></section><div className="sideDivider"/><section className="inspector"><label>SCHNELLZUGRIFF</label><button className="quick" onClick={addRoom}><Plus size={16}/> Raum hinzufügen</button><button className="quick" onClick={()=>{setTool('room');setAnchor(null);}}><Square size={16}/> Raum frei zeichnen</button><button className="quick" onClick={save}><Save size={16}/> Jetzt speichern</button></section></aside>
      {!showRight&&<button className="reopen rightReopen" onClick={()=>setShowRight(true)}><PanelRightClose/></button>}
    </div>
  </div>;
}
