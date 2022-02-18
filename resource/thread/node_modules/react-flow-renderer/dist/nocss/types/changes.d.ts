import { XYPosition, Dimensions } from './utils';
import { NodeHandleBounds } from './nodes';
export declare type NodeDimensionChange = {
    id: string;
    type: 'dimensions';
    dimensions?: Dimensions;
    position?: XYPosition;
    handleBounds?: NodeHandleBounds;
    dragging?: boolean;
};
export declare type NodeSelectionChange = {
    id: string;
    type: 'select';
    selected: boolean;
};
export declare type NodeRemoveChange = {
    id: string;
    type: 'remove';
};
export declare type NodeChange = NodeDimensionChange | NodeSelectionChange | NodeRemoveChange;
export declare type EdgeSelectionChange = NodeSelectionChange;
export declare type EdgeRemoveChange = NodeRemoveChange;
export declare type EdgeChange = EdgeSelectionChange | EdgeRemoveChange;
