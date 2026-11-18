import type { Vec2 } from './model';
export const distance = (a: Vec2, b: Vec2): number => Math.hypot(b.x-a.x,b.y-a.y);
export const polygonArea = (points: Vec2[]): number => { if(points.length<3)return 0;let sum=0;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];sum+=a.x*b.y-b.x*a.y;}return Math.abs(sum)/2; };
export const polygonPerimeter = (points: Vec2[]): number => points.length<2?0:points.reduce((sum,p,i)=>sum+distance(p,points[(i+1)%points.length]),0);
export const snapCoordinate = (value: number, gridM: number): number => gridM>0?Math.round(value/gridM)*gridM:value;
export const snapPoint = (point: Vec2, gridM: number): Vec2 => ({x:snapCoordinate(point.x,gridM),y:snapCoordinate(point.y,gridM)});
export const segmentMetrics = (start: Vec2,end: Vec2) => ({lengthM:distance(start,end),angleDeg:Math.atan2(end.y-start.y,end.x-start.x)*180/Math.PI});
export const pointInPolygon = (point: Vec2, polygon: Vec2[]): boolean => {let inside=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];const crosses=(a.y>point.y)!==(b.y>point.y)&&point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y||Number.EPSILON)+a.x;if(crosses)inside=!inside;}return inside;};
export const clampPointToBounds = (point: Vec2,width: number,height: number): Vec2 => ({x:Math.max(0,Math.min(width,point.x)),y:Math.max(0,Math.min(height,point.y))});
export const closestPointOnSegment = (p:Vec2,a:Vec2,b:Vec2):Vec2 => {const dx=b.x-a.x,dy=b.y-a.y,len=dx*dx+dy*dy;if(!len)return a;const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/len));return {x:a.x+t*dx,y:a.y+t*dy};};

/** Intersect adjacent inward-offset edge lines to create a mitered setback boundary. */
export function offsetPolygonInward(vertices: Vec2[], offsetM: number): Vec2[] {
  if(vertices.length<3||offsetM<=0)return vertices.map(point=>({...point}));
  const orientation=vertices.reduce((sum,p,i)=>sum+p.x*vertices[(i+1)%vertices.length].y-vertices[(i+1)%vertices.length].x*p.y,0);
  if(Math.abs(orientation)<1e-8)return [];
  const sign=orientation>0?1:-1;
  const shifted=vertices.map((start,i)=>{
    const end=vertices[(i+1)%vertices.length],dx=end.x-start.x,dy=end.y-start.y,len=Math.hypot(dx,dy)||1;
    return {point:{x:start.x-sign*dy/len*offsetM,y:start.y+sign*dx/len*offsetM},direction:{x:dx,y:dy}};
  });
  return vertices.map((_,i)=>{
    const a=shifted[(i+vertices.length-1)%vertices.length],b=shifted[i];
    const cross=a.direction.x*b.direction.y-a.direction.y*b.direction.x;
    if(Math.abs(cross)<1e-8)return b.point;
    const dx=b.point.x-a.point.x,dy=b.point.y-a.point.y;
    const t=(dx*b.direction.y-dy*b.direction.x)/cross;
    return {x:a.point.x+t*a.direction.x,y:a.point.y+t*a.direction.y};
  });
}

