import React from 'react';import{createRoot}from'react-dom/client';import App from './App';import'./style.css';
import {createBuildingProject} from './engine/createProject';
import {ProjectProvider} from './engine/projectStore';
import type {BuildingProject} from './engine/model';

function loadProject():BuildingProject{
  const fallback=createBuildingProject('Mein Traumhaus');
  try{
    const saved=JSON.parse(localStorage.getItem('homeforge-building-project')||'null') as Partial<BuildingProject>|null;
    if(!saved)return fallback;
    return {...fallback,...saved,toolMode:saved.toolMode==='plot'||saved.toolMode==='walls'?saved.toolMode:'select',plot:{...fallback.plot,...saved.plot,boundary:{...fallback.plot.boundary,...saved.plot?.boundary},terrain:{...fallback.plot.terrain,...saved.plot?.terrain}},floors:Array.isArray(saved.floors)&&saved.floors.length?saved.floors:fallback.floors};
  }catch{return fallback;}
}

const initialProject=loadProject();
createRoot(document.getElementById('root')!).render(<React.StrictMode><ProjectProvider initialProject={initialProject}><App/></ProjectProvider></React.StrictMode>);

