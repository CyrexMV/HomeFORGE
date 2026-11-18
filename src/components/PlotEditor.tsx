import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, Crosshair, Grid3X3, MousePointer2, Plus, Trash2, Undo2 } from 'lucide-react';
import { distance, offsetPolygonInward, polygonArea, snapPoint } from '../engine/geometry';
import { useBuildingProject } from '../engine/projectStore';
import type { ToolMode, Vec2 } from '../engine/model';

type Props = { onBack: () => void };
const VIEW_W=32, VIEW_H=24, EDGE_SNAP_M=.32;
const toolModes: {id:ToolMode;label:string;icon:typeof Crosshair}[]=[
  {id:'plot',label:'Grundstück zeichnen',icon:Crosshair},
  {id:'walls',label:'Wände',icon:Plus},
  {id:'select',label:'Auswählen',icon:MousePointer2},
];

export default function PlotEditor({onBack}:Props){
  const {project,dispatch}=useBuildingProject();
  const [draft,setDraft]=useState<Vec2[]>(project.plot.boundary.vertices.map(p=>({...p})));
  const [draftBaseline,setDraftBaseline]=useState<Vec2[]>(project.plot.boundary.vertices.map(p=>({...p})));
  const [gridM,setGridM]=useState(.5);
  const [snapGrid,setSnapGrid]=useState(true);
  const [snapVertices,setSnapVertices]=useState(true);
  const [setbackM,setSetbackM]=useState(project.plot.boundary.setbackM);
  const [cursor,setCursor]=useState<Vec2|null>(null);
  const [drawing,setDrawing]=useState(false);
  const vertices= drawing ? draft : project.plot.boundary.vertices;
  const area=polygonArea(vertices);
  const perimeter=vertices.length>2?vertices.reduce((sum,p,i)=>sum+distance(p,vertices[(i+1)%vertices.length]),0):vertices.slice(1).reduce((sum,p,i)=>sum+distance(vertices[i],p),0);
  const inset=useMemo(()=>vertices.length>=3?offsetPolygonInward(vertices,setbackM):[],[vertices,setbackM]);

  useEffect(()=>{
    const save=()=>{try{localStorage.setItem('homeforge-building-project',JSON.stringify(project));}catch{}}
    save();
  },[project]);

  const toWorld=(event:{clientX:number;clientY:number;currentTarget:SVGElement}):Vec2=>{
    const svg=event.currentTarget.ownerSVGElement||event.currentTarget as SVGSVGElement,point=svg.createSVGPoint();
    point.x=event.clientX;point.y=event.clientY;
    const matrix=svg.getScreenCTM()?.inverse();
    if(!matrix)return {x:0,y:0};
    const world=point.matrixTransform(matrix);
    return {x:world.x,y:world.y};
  };
  const snapped=(point:Vec2)=>{
    let next=point;
    if(snapVertices){const target=[...project.plot.boundary.vertices,...draft].find(vertex=>distance(vertex,point)<EDGE_SNAP_M);if(target)next=target;}
    return snapGrid?snapPoint(next,gridM):next;
  };
  const addPoint=(point:Vec2)=>{
    if(project.toolMode!=='plot')return;
    const next=snapped(point);
    if(draft.length>=3&&distance(next,draft[0])<EDGE_SNAP_M){finish();return;}
    if(draft.length&&distance(next,draft[draft.length-1])<.02)return;
    setDraft(points=>[...points,next]);
  };
  const begin=()=>{setDraft([]);setDraftBaseline(project.plot.boundary.vertices.map(p=>({...p})));setDrawing(true);dispatch({type:'set-tool-mode',mode:'plot'});};
  const finish=()=>{
    if(draft.length<3)return;
    dispatch({type:'set-plot-boundary',boundary:{...project.plot.boundary,vertices:draft.map(p=>({...p})),setbackM}});
    setDraftBaseline(draft.map(p=>({...p})));setDrawing(false);setCursor(null);
  };
  const undo=()=>{if(!drawing)return;setDraft(points=>points.slice(0,-1));};
  const clear=()=>{setDraft([]);setDraftBaseline(project.plot.boundary.vertices.map(p=>({...p})));setDrawing(true);dispatch({type:'set-tool-mode',mode:'plot'});};
  const cancel=()=>{setDraft(draftBaseline.map(p=>({...p})));setDrawing(false);setCursor(null);};
  const keyHandler=(event:KeyboardEvent)=>{if(event.key==='Escape'&&drawing){event.preventDefault();cancel();}if((event.key==='Backspace'||event.key==='Delete')&&drawing){event.preventDefault();undo();}if(event.key==='Enter'&&drawing){event.preventDefault();finish();}};
  useEffect(()=>{window.addEventListener('keydown',keyHandler);return()=>window.removeEventListener('keydown',keyHandler);});

  const displayPoints=drawing?draft:project.plot.boundary.vertices;
  const pathPoints=displayPoints.map(p=>`${p.x},${p.y}`).join(' ');
  const activeFloor=project.floors.find(f=>f.id===project.activeFloorId);
  return <div className="plotEditor">
    <header className="plotTop"><div className="plotBrand"><span className="plotBrandMark">H</span><div><b>HomeForge</b><small>GRUNDSTÜCKSEDITOR</small></div></div><div className="plotProject"><span>PROJEKT</span><b>{project.name}</b></div><button className="plotBack" onClick={onBack}><ArrowLeft size={16}/> Zur Hausplanung</button></header>
    <div className="plotWorkspace">
      <aside className="plotSidebar"><div className="plotSection"><label>WERKZEUGMODUS</label>{toolModes.map(mode=><button key={mode.id} className={`plotMode ${project.toolMode===mode.id?'active':''}`} onClick={()=>dispatch({type:'set-tool-mode',mode:mode.id})}><mode.icon size={17}/>{mode.label}</button>)}{project.toolMode==='walls'&&<p className="plotHint">Der Wandmodus wird im Gebäudeeditor verwendet. Das Grundstück bleibt dabei erhalten.</p>}</div>
        <div className="plotSection"><label>RASTER & FANG</label><button className={`plotToggle ${snapGrid?'on':''}`} onClick={()=>setSnapGrid(value=>!value)}><Grid3X3 size={15}/>Rasterfang<span>{snapGrid?'An':'Aus'}</span></button><select aria-label="Rasterweite" value={gridM} onChange={event=>setGridM(Number(event.target.value))}><option value={.1}>10 cm</option><option value={.25}>25 cm</option><option value={.5}>50 cm</option><option value={1}>1 m</option></select><button className={`plotToggle ${snapVertices?'on':''}`} onClick={()=>setSnapVertices(value=>!value)}><Crosshair size={15}/>Eckpunktfang<span>{snapVertices?'An':'Aus'}</span></button></div>
        <div className="plotSection"><label>ABSTANDSFLÄCHE</label><div className="plotInput"><span>Grenzabstand</span><div><input type="number" min="0" max="20" step=".1" value={setbackM} onChange={event=>{const value=Math.max(0,Number(event.target.value));setSetbackM(value);if(!drawing)dispatch({type:'set-plot-boundary',boundary:{...project.plot.boundary,setbackM:value}});}}/><b>m</b></div></div><p className="plotHint">Gestrichelte Linie zeigt den gleichmäßigen Abstand zur Grundstücksgrenze.</p></div>
        <div className="plotSection plotActions"><label>GRUNDSTÜCK</label><button onClick={undo} disabled={!drawing||draft.length===0}><Undo2 size={16}/>Letzten Punkt zurück</button><button onClick={clear}><Trash2 size={16}/>Grundstück leeren</button>{drawing&&<button className="plotCancel" onClick={cancel}>Abbrechen</button>}<button className="plotFinish" onClick={finish} disabled={!drawing||draft.length<3}><Check size={16}/>Grundstück übernehmen</button></div>
        <div className="plotFloor"><label>AKTIVES GESCHOSS</label><select value={project.activeFloorId} onChange={event=>dispatch({type:'set-active-floor',floorId:event.target.value})}>{project.floors.map(floor=><option key={floor.id} value={floor.id}>{floor.name}</option>)}</select></div>
      </aside>
      <main className="plotMain"><div className="plotCanvasHeader"><div><span>PROJEKTFLÄCHE</span><h1>Grundstück planen</h1></div><div className="plotFloorBadge">{activeFloor?.name||'Erdgeschoss'}</div></div>
        <div className="plotCanvasWrap"><svg className="plotCanvas" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="application" aria-label="Grundstück zeichnen. Klicke, um Eckpunkte zu setzen.">
          <defs><pattern id="plot-grid-small" width={gridM} height={gridM} patternUnits="userSpaceOnUse"><path d={`M ${gridM} 0 L 0 0 0 ${gridM}`} fill="none" stroke="#26313a" strokeWidth=".018"/></pattern><pattern id="plot-grid-large" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="url(#plot-grid-small)"/><path d="M 5 0 L 0 0 0 5" fill="none" stroke="#35414a" strokeWidth=".035"/></pattern></defs>
          <rect width={VIEW_W} height={VIEW_H} fill="url(#plot-grid-large)"/>
          {displayPoints.length>=3&&<polygon points={pathPoints} className="plotFill"/>}
          {inset.length>=3&&<polygon points={inset.map(p=>`${p.x},${p.y}`).join(' ')} className="plotSetback"/>}
          {displayPoints.length>0&&<polyline points={drawing&&cursor?[...displayPoints,cursor].map(p=>`${p.x},${p.y}`).join(' '):pathPoints} className={`plotBoundary ${drawing?'drawing':''}`} />}
          {displayPoints.map((point,index)=><g key={`${index}-${point.x}-${point.y}`}><circle cx={point.x} cy={point.y} r=".18" className="plotVertex"/><text x={point.x+.32} y={point.y-.28} className="plotPointLabel">P{index+1}</text></g>)}
          {displayPoints.length>1&&displayPoints.map((point,index)=>{if(drawing&&displayPoints.length<3&&index===displayPoints.length-1)return null;if(drawing&&index===displayPoints.length-1&&displayPoints.length>=3)return null;const next=displayPoints[(index+1)%displayPoints.length],length=distance(point,next),mid={x:(point.x+next.x)/2,y:(point.y+next.y)/2};return <g key={`edge-${index}`}><rect x={mid.x-.55} y={mid.y-.27} width="1.1" height=".46" rx=".12" className="plotMeasureBg"/><text x={mid.x} y={mid.y+.07} textAnchor="middle" className="plotMeasure">{length.toFixed(2)} m</text></g>;})}
          {drawing&&<rect width={VIEW_W} height={VIEW_H} fill="transparent" onPointerMove={event=>setCursor(snapped(toWorld(event)))} onPointerLeave={()=>setCursor(null)} onPointerDown={event=>{event.preventDefault();addPoint(toWorld(event));}}/>}
        </svg><div className="plotCanvasHelp">{drawing?'Klicke ins Raster, um Eckpunkte zu setzen · Nähe zum ersten Punkt schließt das Grundstück':'Wähle „Neues Grundstück zeichnen“, um die Eckpunkte zu bearbeiten.'}</div></div>
        <div className="plotMetrics"><div><span>GRUNDSTÜCKSFLÄCHE</span><b>{area.toFixed(2)} <small>m²</small></b></div><div><span>GRENZLÄNGE</span><b>{perimeter.toFixed(2)} <small>m</small></b></div><div><span>ECKPUNKTE</span><b>{displayPoints.length}</b></div><button className="plotNew" onClick={begin}><Plus size={16}/>Neues Grundstück zeichnen</button></div>
      </main>
    </div>
  </div>;
}

