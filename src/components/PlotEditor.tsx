import { useEffect, useMemo, useState } from 'react';
import { ArrowDownRight, ArrowLeft, ArrowUp, Check, ChevronDown, Crosshair, Grid3X3, Layers3, Minus, MousePointer2, Plus, RotateCcw, Ruler, Scan, Settings2, Trash2, Undo2 } from 'lucide-react';
import { distance, offsetPolygonInward, polygonArea, snapPoint } from '../engine/geometry';
import { useBuildingProject } from '../engine/projectStore';
import type { ToolMode, Vec2 } from '../engine/model';

type Props={onNavigate:(stage:'draw'|'design'|'furnish'|'electrical')=>void};
const VIEW_W=32,VIEW_H=24,CENTER_X=12.5,CENTER_Y=10,EDGE_SNAP_M=.32;
const modes:{id:ToolMode;label:string;icon:typeof Crosshair;hint:string}[]=[
  {id:'select',label:'Auswählen',icon:MousePointer2,hint:'Objekte und Grundstückspunkte auswählen.'},
  {id:'plot',label:'Grundstück',icon:Crosshair,hint:'Klicke auf die Zeichenfläche, um Grenzpunkte zu setzen.'},
  {id:'walls',label:'Wände',icon:Layers3,hint:'Wechsle zurück zur Gebäudeplanung, um Wände zu zeichnen.'},
];

export default function PlotEditor({onNavigate}:Props){
  const {project,dispatch}=useBuildingProject();
  const [draft,setDraft]=useState<Vec2[]>(project.plot.boundary.vertices.map(point=>({...point})));
  const [draftBaseline,setDraftBaseline]=useState<Vec2[]>(project.plot.boundary.vertices.map(point=>({...point})));
  const [gridM,setGridM]=useState(.5);
  const [gridVisible,setGridVisible]=useState(true);
  const [snapGrid,setSnapGrid]=useState(true);
  const [snapVertices,setSnapVertices]=useState(true);
  const [dimensionsVisible,setDimensionsVisible]=useState(true);
  const [setbackM,setSetbackM]=useState(project.plot.boundary.setbackM);
  const [cursor,setCursor]=useState<Vec2|null>(null);
  const [drawing,setDrawing]=useState(false);
  const [zoom,setZoom]=useState(1);
  const [selectedEdge,setSelectedEdge]=useState<number|null>(null);
  const vertices=drawing?draft:project.plot.boundary.vertices;
  const area=polygonArea(vertices);
  const perimeter=vertices.length>2?vertices.reduce((sum,point,index)=>sum+distance(point,vertices[(index+1)%vertices.length]),0):vertices.slice(1).reduce((sum,point,index)=>sum+distance(vertices[index],point),0);
  const inset=useMemo(()=>vertices.length>=3?offsetPolygonInward(vertices,setbackM):[],[vertices,setbackM]);
  const activeFloor=project.floors.find(floor=>floor.id===project.activeFloorId);
  const viewW=VIEW_W/zoom,viewH=VIEW_H/zoom,viewBox=`${CENTER_X-viewW/2} ${CENTER_Y-viewH/2} ${viewW} ${viewH}`;
  const edgeCount=drawing?(vertices.length>=3?vertices.length:Math.max(0,vertices.length-1)):vertices.length;

  useEffect(()=>{try{localStorage.setItem('homeforge-building-project',JSON.stringify(project));}catch{}},[project]);
  useEffect(()=>{
    const handler=(event:KeyboardEvent)=>{
      if(event.key==='Escape'&&drawing){event.preventDefault();cancel();}
      if((event.key==='Backspace'||event.key==='Delete')&&drawing){event.preventDefault();undo();}
      if(event.key==='Enter'&&drawing){event.preventDefault();finish();}
    };
    window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);
  });

  const toWorld=(event:{clientX:number;clientY:number;currentTarget:SVGElement}):Vec2=>{
    const svg=event.currentTarget.ownerSVGElement||event.currentTarget as SVGSVGElement,point=svg.createSVGPoint();
    point.x=event.clientX;point.y=event.clientY;
    const matrix=svg.getScreenCTM()?.inverse();
    if(!matrix)return {x:0,y:0};
    const world=point.matrixTransform(matrix);return {x:world.x,y:world.y};
  };
  const snap=(point:Vec2)=>{
    let result=point;
    if(snapVertices){const near=[...project.plot.boundary.vertices,...draft].find(vertex=>distance(vertex,point)<EDGE_SNAP_M);if(near)result=near;}
    return snapGrid?snapPoint(result,gridM):result;
  };
  const begin=()=>{setDraft([]);setDraftBaseline(project.plot.boundary.vertices.map(point=>({...point})));setDrawing(true);setSelectedEdge(null);dispatch({type:'set-tool-mode',mode:'plot'});};
  const finish=()=>{
    if(draft.length<3)return;
    dispatch({type:'set-plot-boundary',boundary:{...project.plot.boundary,vertices:draft.map(point=>({...point})),setbackM}});
    setDraftBaseline(draft.map(point=>({...point})));setDrawing(false);setCursor(null);setSelectedEdge(null);
  };
  const undo=()=>{if(drawing)setDraft(points=>points.slice(0,-1));};
  const clear=()=>{setDraft([]);setDraftBaseline(project.plot.boundary.vertices.map(point=>({...point})));setDrawing(true);setSelectedEdge(null);dispatch({type:'set-tool-mode',mode:'plot'});};
  const cancel=()=>{setDraft(draftBaseline.map(point=>({...point})));setDrawing(false);setCursor(null);};
  const addPoint=(point:Vec2)=>{
    if(project.toolMode!=='plot')return;
    const next=snap(point);
    if(draft.length>=3&&distance(next,draft[0])<EDGE_SNAP_M){finish();return;}
    if(draft.length&&distance(next,draft[draft.length-1])<.02)return;
    setDraft(points=>[...points,next]);
  };
  const updateSetback=(value:number)=>{
    const next=Math.max(0,Math.min(20,value));setSetbackM(next);
    if(!drawing)dispatch({type:'set-plot-boundary',boundary:{...project.plot.boundary,setbackM:next}});
  };
  const pointList=drawing?draft:project.plot.boundary.vertices;
  const pointString=pointList.map(point=>`${point.x},${point.y}`).join(' ');
  const mode=modes.find(item=>item.id===project.toolMode)||modes[0];
  const edgeRows=pointList.map((point,index)=>{
    const next=pointList[(index+1)%pointList.length];
    return {index,start:point,end:next,length:distance(point,next),bearing:(Math.atan2(next.x-point.x,point.y-next.y)*180/Math.PI+360)%360};
  });

  return <div className="plotStudio">
    <header className="psTopbar">
      <div className="psBrand"><span className="psBrandIcon">H</span><span><b>HOMEFORGE</b><small>DESIGN STUDIO</small></span></div>
      <div className="psTopDivider"/>
      <div className="psProject"><span className="psProjectLabel">PROJEKT</span><button className="psProjectName">{project.name}<ChevronDown size={14}/></button></div>
      <div className="psTopStatus"><span className="psStatusDot"/> Alle Änderungen gespeichert <span className="psStatusDivider"/> <span>{activeFloor?.name||'Erdgeschoss'}</span></div>
      <div className="psTopActions"><button className="psIconButton" title="Ansicht einpassen" onClick={()=>setZoom(1)}><Scan size={17}/></button><button className="psBackButton" onClick={()=>onNavigate('draw')}><ArrowLeft size={16}/> Gebäudeplanung</button></div>
    </header>
    <div className="psContextbar"><div className="psBreadcrumb"><span>PLANUNG</span><span className="psCrumbSlash">/</span><b>GRUNDSTÜCK</b></div><div className="psPhaseSteps"><div className="psPhase active"><span>01</span><b>Grundstück</b></div><i/><button className="psPhase" onClick={()=>onNavigate('draw')}><span>02</span><b>Gebäude</b></button><i/><button className="psPhase" onClick={()=>onNavigate('furnish')}><span>03</span><b>Möblierung</b></button><i/><button className="psPhase" onClick={()=>onNavigate('electrical')}><span>04</span><b>Technik</b></button></div><div className="psContextRight"><span className="psStatusPill"><span/> ENTWURF</span><button className="psExportButton" onClick={()=>onNavigate('design')}>Plan öffnen <ArrowDownRight size={14}/></button></div></div>

    <div className="psWorkspace">
      <aside className="psLeftPanel">
        <div className="psPanelHeading"><div><span>ARBEITSBEREICH 01</span><h1>Grundstück</h1></div><button className="psMiniButton" title="Werkzeugeinstellungen"><Settings2 size={16}/></button></div>
        <div className="psSection"><div className="psSectionTitle"><span>WERKZEUGE</span><span className="psShortcut">SPACE</span></div><div className="psModeList">{modes.map(item=><button key={item.id} className={`psMode ${project.toolMode===item.id?'active':''}`} onClick={()=>dispatch({type:'set-tool-mode',mode:item.id})}><span className="psModeIcon"><item.icon size={17}/></span><span>{item.label}</span><kbd>{item.id==='plot'?'P':item.id==='walls'?'W':'V'}</kbd></button>)}</div></div>
        <div className="psSection"><div className="psSectionTitle"><span>ZEICHENFLÄCHE</span><Grid3X3 size={14}/></div><div className="psControlRow"><button className={`psToggle ${gridVisible?'on':''}`} onClick={()=>setGridVisible(value=>!value)}><span className="psToggleIcon"><Grid3X3 size={15}/></span><span>Raster anzeigen</span><i className="psSwitch"/></button></div><label className="psFieldLabel" htmlFor="plot-grid-size">Rasterweite</label><div className="psSelectWrap"><select id="plot-grid-size" value={gridM} onChange={event=>setGridM(Number(event.target.value))}><option value={.1}>10 cm</option><option value={.25}>25 cm</option><option value={.5}>50 cm</option><option value={1}>1,00 m</option></select><ChevronDown size={14}/></div><button className={`psToggle ${snapGrid?'on':''}`} onClick={()=>setSnapGrid(value=>!value)}><span className="psToggleIcon"><Crosshair size={15}/></span><span>Am Raster einrasten</span><i className="psSwitch"/></button><button className={`psToggle ${snapVertices?'on':''}`} onClick={()=>setSnapVertices(value=>!value)}><span className="psToggleIcon"><Scan size={15}/></span><span>Eckpunkte fangen</span><i className="psSwitch"/></button><button className={`psToggle ${dimensionsVisible?'on':''}`} onClick={()=>setDimensionsVisible(value=>!value)}><span className="psToggleIcon"><Ruler size={15}/></span><span>Maße einblenden</span><i className="psSwitch"/></button></div>
        <div className="psSection"><div className="psSectionTitle"><span>GRENZABSTAND</span><span className="psDashedLegend"/></div><p className="psSectionCopy">Inward-Offset für Abstandsflächen visualisieren.</p><div className="psUnitInput"><input type="number" min="0" max="20" step=".1" value={setbackM} onChange={event=>updateSetback(Number(event.target.value))}/><span>m</span><button onClick={()=>updateSetback(Math.max(0,setbackM-.1))} aria-label="Grenzabstand verringern"><Minus size={13}/></button><button onClick={()=>updateSetback(setbackM+.1)} aria-label="Grenzabstand erhöhen"><Plus size={13}/></button></div></div>
        <div className="psSection psActions"><div className="psSectionTitle"><span>BEARBEITEN</span><span className="psShortcut">⌘ Z</span></div><button className="psActionButton" onClick={undo} disabled={!drawing||draft.length===0}><Undo2 size={16}/>Punkt zurücknehmen <kbd>⌫</kbd></button><button className="psActionButton danger" onClick={clear}><Trash2 size={16}/>Grundstück neu zeichnen</button>{drawing&&<button className="psActionButton muted" onClick={cancel}><RotateCcw size={15}/>Änderungen verwerfen</button>}<button className="psApplyButton" onClick={finish} disabled={!drawing||draft.length<3}><Check size={16}/>Grenze übernehmen</button></div>
        <div className="psLeftFooter"><span className="psAvatar">{project.name.slice(0,1).toUpperCase()}</span><span><b>{project.name}</b><small>{activeFloor?.name||'Erdgeschoss'} · Metrisch</small></span><button className="psMiniButton" title="Projekteinstellungen"><Settings2 size={15}/></button></div>
      </aside>

      <main className="psCanvasColumn">
        <div className="psCanvasToolbar"><div className="psCanvasTitle"><span className="psCanvasGlyph"><Scan size={16}/></span><span><b>Grundstücksplan</b><small>Grundstücksgrenze · {pointList.length} Eckpunkte</small></span></div><div className="psCanvasTools"><button className={`psCanvasTool ${project.toolMode==='select'?'active':''}`} title="Auswählen" onClick={()=>dispatch({type:'set-tool-mode',mode:'select'})}><MousePointer2 size={16}/></button><button className={`psCanvasTool ${project.toolMode==='plot'?'active':''}`} title="Grenze zeichnen" onClick={()=>{if(!drawing)begin();else dispatch({type:'set-tool-mode',mode:'plot'});}}><Crosshair size={16}/></button><span className="psToolDivider"/><button className={`psCanvasTool ${gridVisible?'active':''}`} title="Raster ein/aus" onClick={()=>setGridVisible(value=>!value)}><Grid3X3 size={16}/></button></div><div className="psZoom"><button onClick={()=>setZoom(value=>Math.max(.6,Number((value-.15).toFixed(2))))} aria-label="Verkleinern"><Minus size={15}/></button><span>{Math.round(zoom*100)}%</span><button onClick={()=>setZoom(value=>Math.min(1.75,Number((value+.15).toFixed(2))))} aria-label="Vergrößern"><Plus size={15}/></button><span className="psZoomDivider"/><button onClick={()=>setZoom(1)} title="Ansicht einpassen"><Scan size={15}/></button></div></div>
        <div className="psCanvasFrame"><div className="psCanvasSurface"><svg className="psCanvas" viewBox={viewBox} role="application" aria-label="Grundstücksplan. Klicke, um Eckpunkte zu setzen.">
          <defs><pattern id="ps-grid-small" width={gridM} height={gridM} patternUnits="userSpaceOnUse"><path d={`M ${gridM} 0 L 0 0 0 ${gridM}`} fill="none" stroke="#d8e0e5" strokeWidth=".018"/></pattern><pattern id="ps-grid-major" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M 5 0 L 0 0 0 5" fill="none" stroke="#bfccd4" strokeWidth=".038"/></pattern></defs>
          <rect x="-3" y="-2" width={VIEW_W} height={VIEW_H} fill={gridVisible?'url(#ps-grid-small)':'#f0f3f4'}/>{gridVisible&&<rect x="-3" y="-2" width={VIEW_W} height={VIEW_H} fill="url(#ps-grid-major)"/>}
          {gridVisible&&Array.from({length:8},(_,index)=>{const value=index*5;return <g key={`axis-x-${value}`}><line x1={value} y1="-2" x2={value} y2="22" className="psAxisLine"/><text x={value} y="-1.45" className="psAxisLabel">{value} m</text></g>})}
          {gridVisible&&Array.from({length:5},(_,index)=>{const value=index*5;return <g key={`axis-y-${value}`}><line x1="-3" y1={value} x2="29" y2={value} className="psAxisLine"/><text x="-2.65" y={value-.15} className="psAxisLabel">{value}</text></g>})}
          {pointList.length>=3&&<polygon points={pointString} className="psPlotFill"/>}
          {inset.length>=3&&<polygon points={inset.map(point=>`${point.x},${point.y}`).join(' ')} className="psSetback"/>}
          {pointList.length>=3&&<polygon points={pointString} className={`psBoundary ${drawing?'drawing':''}`}/>}
          {pointList.length>0&&<polyline points={drawing&&cursor?[...pointList,cursor].map(point=>`${point.x},${point.y}`).join(' '):pointString} className={`psBoundaryLine ${drawing?'drawing':''}`}/>}
          {pointList.map((point,index)=><g key={`point-${index}`}><circle cx={point.x} cy={point.y} r=".24" className="psVertexHalo"/><circle cx={point.x} cy={point.y} r=".105" className="psVertex"/><text x={point.x+.32} y={point.y-.25} className="psPointLabel">P{String(index+1).padStart(2,'0')}</text></g>)}
          {selectedEdge!==null&&edgeRows[selectedEdge]&&<line x1={edgeRows[selectedEdge].start.x} y1={edgeRows[selectedEdge].start.y} x2={edgeRows[selectedEdge].end.x} y2={edgeRows[selectedEdge].end.y} className="psSelectedEdge"/>}
          {dimensionsVisible&&edgeRows.slice(0,edgeCount).map(edge=>{const mid={x:(edge.start.x+edge.end.x)/2,y:(edge.start.y+edge.end.y)/2};return <g key={`measure-${edge.index}`} className={selectedEdge===edge.index?'selected':''}><rect x={mid.x-.66} y={mid.y-.25} width="1.32" height=".5" rx=".1" className="psMeasureBg"/><text x={mid.x} y={mid.y+.075} textAnchor="middle" className="psMeasure">{edge.length.toFixed(2)} m</text></g>;})}
          {drawing&&<rect x="-3" y="-2" width={VIEW_W} height={VIEW_H} fill="transparent" className="psDrawSurface" onPointerMove={event=>setCursor(snap(toWorld(event)))} onPointerLeave={()=>setCursor(null)} onPointerDown={event=>{event.preventDefault();addPoint(toWorld(event));}}/>}
        </svg><div className="psCompass"><span>N</span><ArrowUp size={20}/></div><div className="psCanvasLegend"><span><i className="legendBoundary"/>Grundstücksgrenze</span><span><i className="legendSetback"/>Abstandsfläche · {setbackM.toFixed(1)} m</span></div>{drawing&&project.toolMode==='plot'&&<div className="psDrawPrompt"><span className="psLiveDot"/>{draft.length<3?'Grenzpunkte setzen':`${draft.length} Punkte · in Nähe von P01 schließen`}</div>}</div></div>
        <div className="psStatusbar"><div><span className="psLiveDot"/>{drawing?mode.hint:'Grundstück auswählen oder neue Grenze zeichnen'}</div><div className="psCoordinates"><Crosshair size={13}/>{cursor?`${cursor.x.toFixed(2)} m  /  ${cursor.y.toFixed(2)} m`:'X —   Y —'}<span className="psStatusDivider"/><span>Maßeinheit <b>m</b></span></div><div className="psStatusRight"><span>{gridM===1?'1,00 m':`${Math.round(gridM*100)} cm`} Raster</span><span>Ebene {activeFloor?.name||'Erdgeschoss'}</span></div></div>
      </main>

      <aside className="psRightPanel"><div className="psRightHead"><div><span>OBJEKTINSPEKTOR</span><h2>Grundstück</h2></div><button className="psMiniButton" title="Inspektoroptionen"><Settings2 size={16}/></button></div>
        <div className="psAreaCard"><span className="psAreaIcon"><Scan size={16}/></span><div><small>GRUNDSTÜCKSFLÄCHE</small><b>{area.toFixed(2)} <i>m²</i></b></div><span className="psAreaTrend">FLÄCHE</span></div>
        <div className="psPropertyGroup"><div className="psPropertyHeading"><span>GRENZVERLAUF</span><span>{pointList.length} PUNKTE</span></div><div className="psPropertyLine"><span>Gesamtlänge</span><b>{perimeter.toFixed(2)} m</b></div><div className="psPropertyLine"><span>Grenzabstand</span><b>{setbackM.toFixed(2)} m</b></div><div className="psPropertyLine"><span>Flächenstatus</span><b className="psValidStatus"><i/> {pointList.length>=3?'Geschlossen':'Entwurf'}</b></div></div>
        <div className="psPropertyGroup psVertexGroup"><div className="psPropertyHeading"><span>GRENZSEGMENTE</span><button onClick={()=>setDimensionsVisible(value=>!value)}>{dimensionsVisible?'Ausblenden':'Einblenden'}</button></div><div className="psEdgeList">{edgeRows.slice(0,edgeCount).map(edge=><button key={edge.index} className={`psEdgeRow ${selectedEdge===edge.index?'selected':''}`} onClick={()=>setSelectedEdge(selectedEdge===edge.index?null:edge.index)}><span className="psEdgeBadge">{String(edge.index+1).padStart(2,'0')}</span><span className="psEdgeNames"><b>P{String(edge.index+1).padStart(2,'0')} <i>→</i> P{String((edge.index+1)%pointList.length+1).padStart(2,'0')}</b><small>X {edge.start.x.toFixed(2)} · Y {edge.start.y.toFixed(2)} m · Az {edge.bearing.toFixed(1)}°</small></span><strong>{edge.length.toFixed(2)} <i>m</i></strong></button>)}</div></div>
        <div className="psPropertyGroup psFloorGroup"><div className="psPropertyHeading"><span>PROJEKTEBENE</span><Layers3 size={14}/></div><label htmlFor="ps-floor">Aktives Geschoss</label><div className="psSelectWrap"><select id="ps-floor" value={project.activeFloorId} onChange={event=>dispatch({type:'set-active-floor',floorId:event.target.value})}>{project.floors.map(floor=><option key={floor.id} value={floor.id}>{floor.name}</option>)}</select><ChevronDown size={14}/></div></div>
        <div className="psInspectorFooter"><span className="psCheckIcon"><Check size={13}/></span><span>Projekt lokal synchronisiert<small>Änderung wird automatisch gesichert</small></span></div>
      </aside>
    </div>
  </div>;
}

