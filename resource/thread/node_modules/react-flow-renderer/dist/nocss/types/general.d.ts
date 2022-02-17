import { MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import { Selection as D3Selection, ZoomBehavior } from 'd3';
import { XYPosition, Rect, Transform, CoordinateExtent } from './utils';
import { NodeChange, EdgeChange } from './changes';
import { Node, NodeInternals, NodeDimensionUpdate, NodeDiffUpdate } from './nodes';
import { Edge } from './edges';
import { HandleType, StartHandle } from './handles';
export declare type FlowElement<T = any> = Node<T> | Edge<T>;
export declare type Elements<T = any> = Array<FlowElement<T>>;
export declare type NodeTypesType = {
    [key: string]: ReactNode;
};
export declare type EdgeTypesType = NodeTypesType;
export declare type FitView = (fitViewOptions?: FitViewParams) => void;
export declare type Project = (position: XYPosition) => XYPosition;
export declare type ToObject<T = any> = () => FlowExportObject<T>;
export declare type OnNodesChange = (nodes: NodeChange[]) => void;
export declare type OnEdgesChange = (nodes: EdgeChange[]) => void;
export declare type ZoomInOut = (options?: ZoomPanHelperFunctionOptions) => void;
export declare type ZoomTo = (zoomLevel: number, options?: ZoomPanHelperFunctionOptions) => void;
export declare type GetZoom = () => number;
export declare type GetTransform = () => FlowTransform;
export declare type SetTransform = (transform: FlowTransform, options?: ZoomPanHelperFunctionOptions) => void;
export declare type SetCenter = (x: number, y: number, options?: SetCenterOptions) => void;
export declare type FitBounds = (bounds: Rect, options?: FitBoundsOptions) => void;
export declare type ReactFlowInstance<T = any> = {
    zoomIn: ZoomInOut;
    zoomOut: ZoomInOut;
    zoomTo: ZoomTo;
    getZoom: () => number;
    setCenter: SetCenter;
    fitView: FitView;
    project: Project;
    getNodes: () => Node<T>[];
    getEdges: () => Edge<T>[];
    setTransform: SetTransform;
    getTransform: () => FlowTransform;
    toObject: ToObject<T>;
};
export declare type OnPaneReady<T = any> = (reactFlowInstance: ReactFlowInstance<T>) => void;
export interface Connection {
    source: string | null;
    target: string | null;
    sourceHandle: string | null;
    targetHandle: string | null;
}
export declare enum ConnectionMode {
    Strict = "strict",
    Loose = "loose"
}
export declare type FlowExportObject<T = any> = {
    nodes: Node<T>[];
    edges: Edge<T>[];
    position: [number, number];
    zoom: number;
};
export declare type OnConnect = (connection: Connection) => void;
export declare type FitViewParams = {
    padding?: number;
    includeHiddenNodes?: boolean;
    minZoom?: number;
    maxZoom?: number;
    duration?: number;
};
export declare type OnConnectStartParams = {
    nodeId: string | null;
    handleId: string | null;
    handleType: HandleType | null;
};
export declare type OnConnectStart = (event: ReactMouseEvent, params: OnConnectStartParams) => void;
export declare type OnConnectStop = (event: MouseEvent) => void;
export declare type OnConnectEnd = (event: MouseEvent) => void;
export declare enum BackgroundVariant {
    Lines = "lines",
    Dots = "dots"
}
export declare type FlowTransform = {
    x: number;
    y: number;
    zoom: number;
};
export declare type KeyCode = string | Array<string>;
export declare type SnapGrid = [number, number];
export declare enum PanOnScrollMode {
    Free = "free",
    Vertical = "vertical",
    Horizontal = "horizontal"
}
export declare type ZoomPanHelperFunctionOptions = {
    duration?: number;
};
export declare type SetCenterOptions = ZoomPanHelperFunctionOptions & {
    zoom?: number;
};
export declare type FitBoundsOptions = ZoomPanHelperFunctionOptions & {
    padding?: number;
};
export interface ZoomPanHelperFunctions {
    zoomIn: ZoomInOut;
    zoomOut: ZoomInOut;
    zoomTo: ZoomTo;
    getZoom: GetZoom;
    setTransform: SetTransform;
    getTransform: GetTransform;
    fitView: FitView;
    setCenter: SetCenter;
    fitBounds: FitBounds;
    project: Project;
    initialized: boolean;
}
export declare type ReactFlowStore = {
    width: number;
    height: number;
    transform: Transform;
    nodeInternals: NodeInternals;
    edges: Edge[];
    selectedNodesBbox: Rect;
    onNodesChange: OnNodesChange | null;
    onEdgesChange: OnEdgesChange | null;
    d3Zoom: ZoomBehavior<Element, unknown> | null;
    d3Selection: D3Selection<Element, unknown, null, undefined> | null;
    d3ZoomHandler: ((this: Element, event: any, d: unknown) => void) | undefined;
    minZoom: number;
    maxZoom: number;
    translateExtent: CoordinateExtent;
    nodeExtent: CoordinateExtent;
    nodesSelectionActive: boolean;
    userSelectionActive: boolean;
    connectionNodeId: string | null;
    connectionHandleId: string | null;
    connectionHandleType: HandleType | null;
    connectionPosition: XYPosition;
    connectionMode: ConnectionMode;
    snapToGrid: boolean;
    snapGrid: SnapGrid;
    nodesDraggable: boolean;
    nodesConnectable: boolean;
    elementsSelectable: boolean;
    multiSelectionActive: boolean;
    reactFlowVersion: string;
    fitViewOnInit: boolean;
    fitViewOnInitDone: boolean;
    connectionStartHandle: StartHandle | null;
    onConnect?: OnConnect;
    onConnectStart?: OnConnectStart;
    onConnectStop?: OnConnectStop;
    onConnectEnd?: OnConnectEnd;
    connectOnClick: boolean;
};
export declare type ReactFlowActions = {
    setNodes: (nodes: Node[]) => void;
    setEdges: (edges: Edge[]) => void;
    updateNodeDimensions: (updates: NodeDimensionUpdate[]) => void;
    updateNodePosition: (update: NodeDiffUpdate) => void;
    resetSelectedElements: () => void;
    unselectNodesAndEdges: () => void;
    addSelectedNodes: (nodeIds: string[]) => void;
    addSelectedEdges: (edgeIds: string[]) => void;
    setMinZoom: (minZoom: number) => void;
    setMaxZoom: (maxZoom: number) => void;
    setTranslateExtent: (translateExtent: CoordinateExtent) => void;
    setNodeExtent: (nodeExtent: CoordinateExtent) => void;
    reset: () => void;
};
export declare type ReactFlowState = ReactFlowStore & ReactFlowActions;
export declare type UpdateNodeInternals = (nodeId: string) => void;
export declare type OnSelectionChangeParams = {
    nodes: Node[];
    edges: Edge[];
};
export declare type OnSelectionChangeFunc = (params: OnSelectionChangeParams) => void;
