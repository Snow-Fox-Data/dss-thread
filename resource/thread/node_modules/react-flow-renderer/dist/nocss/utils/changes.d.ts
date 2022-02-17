import { Node, Edge, EdgeChange, NodeChange } from '../types';
export declare function applyNodeChanges(changes: NodeChange[], nodes: Node[]): Node[];
export declare function applyEdgeChanges(changes: EdgeChange[], edges: Edge[]): Edge[];
export declare const createSelectionChange: (id: string, selected: boolean) => {
    id: string;
    type: string;
    selected: boolean;
};
export declare function getSelectionChanges(items: any[], selectedIds: string[]): any;
