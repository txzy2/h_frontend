// types/floor-plan/index.ts

export type FloorPlanTableShape = 'round' | 'rect';

export interface FloorPlanTable {
    id: string;
    tableId?: number | null;
    name: string;
    seats: number;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    shape: FloorPlanTableShape;
    color?: string | null;
}

export interface FloorPlanLayout {
    version: number;
    canvas: {
        width: number;
        height: number;
    };
    tables: FloorPlanTable[];
    zones?: unknown[];
    objects?: unknown[];
}

export interface FloorPlanResponse {
    locationId: number;
    locationName: string;
    version: number;
    layout: FloorPlanLayout;
}

export type FloorPlanApi =
    | {success: true; data: FloorPlanResponse}
    | {success: false; data: string};
