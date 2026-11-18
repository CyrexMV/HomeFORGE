export type Vec2 = { x: number; y: number };
export type FloorKind = 'basement' | 'ground' | 'upper' | 'attic' | 'roof';
export type ToolMode = 'plot' | 'walls' | 'select';
export type FloorDefinition = { id: string; name: string; kind: FloorKind; elevationM: number; heightM: number; order: number };
export type PlotBoundary = { id: string; name: string; vertices: Vec2[]; setbackM: number };
export type TerrainSettings = { slopePercent: number; slopeDirectionDeg: number; northAngleDeg: number; elevationM: number };
export type MaterialFinish = 'plaster' | 'concrete' | 'brick' | 'wood' | 'oak' | 'stone' | 'tile';
export type RoomEntity = { id: string; floorId: string; name: string; vertices: Vec2[]; wallThicknessM: number; wallHeightM: number; floorFinish: MaterialFinish; wallFinish: MaterialFinish };
export type WallEntity = { id: string; floorId: string; start: Vec2; end: Vec2; thicknessM: number; heightM: number; role: 'exterior' | 'interior' | 'partition'; finish: MaterialFinish };
export type OpeningEntity = { id: string; wallId: string; kind: 'door' | 'window' | 'opening'; offsetM: number; widthM: number; heightM: number; sillHeightM: number; style: string };
export type FurnitureEntity = { id: string; floorId: string; roomId?: string; catalogId: string; position: Vec2; rotationDeg: number; widthM: number; depthM: number; heightM: number; material: MaterialFinish };
export type ElectricalDevice = { id: string; floorId: string; roomId?: string; kind: 'socket' | 'switch' | 'fusebox' | 'ceiling-light' | 'data-port' | 'sensor' | 'actuator'; position: Vec2; wallId?: string; label: string };
export type CableRoute = { id: string; floorId: string; deviceIds: string[]; points: Vec2[]; circuit: string };
export type AutomationRule = { id: string; name: string; triggerDeviceId: string; trigger: string; actionDeviceId: string; action: string; enabled: boolean };
export type RoofDefinition = { kind: 'gable' | 'hip' | 'flat' | 'shed'; pitchDeg: number; overhangM: number; ridgeDirectionDeg: number };
export type PlotDefinition = { boundary: PlotBoundary; terrain: TerrainSettings };
export type BuildingProject = { schemaVersion: 1; id: string; name: string; units: 'm'; toolMode: ToolMode; plot: PlotDefinition; floors: FloorDefinition[]; activeFloorId: string; rooms: RoomEntity[]; walls: WallEntity[]; openings: OpeningEntity[]; furniture: FurnitureEntity[]; electricalDevices: ElectricalDevice[]; cableRoutes: CableRoute[]; automationRules: AutomationRule[]; roof: RoofDefinition; createdAt: string; updatedAt: string };

