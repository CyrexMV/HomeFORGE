import type { BuildingProject } from './model';
export function createBuildingProject(name='Neues Bauprojekt'):BuildingProject {
  const now=new Date().toISOString();
  return {
    schemaVersion:1,id:globalThis.crypto?.randomUUID?.()??`project-${Date.now()}`,name,units:'m',
    plot:{boundary:{id:'plot-boundary',name:'Grundstücksgrenze',vertices:[{x:0,y:0},{x:25,y:0},{x:25,y:20},{x:0,y:20}],setbackM:3},terrain:{slopePercent:0,slopeDirectionDeg:0,northAngleDeg:0,elevationM:0}},
    floors:[{id:'basement',name:'Keller',kind:'basement',elevationM:-2.8,heightM:2.5,order:0},{id:'ground',name:'Erdgeschoss',kind:'ground',elevationM:0,heightM:2.7,order:1},{id:'upper-1',name:'Obergeschoss',kind:'upper',elevationM:2.7,heightM:2.6,order:2},{id:'attic',name:'Dachgeschoss',kind:'attic',elevationM:5.3,heightM:2.4,order:3},{id:'roof',name:'Dach',kind:'roof',elevationM:7.7,heightM:0,order:4}],
    activeFloorId:'ground',rooms:[],walls:[],openings:[],furniture:[],electricalDevices:[],cableRoutes:[],automationRules:[],
    roof:{kind:'gable',pitchDeg:35,overhangM:.5,ridgeDirectionDeg:0},createdAt:now,updatedAt:now
  };
}
