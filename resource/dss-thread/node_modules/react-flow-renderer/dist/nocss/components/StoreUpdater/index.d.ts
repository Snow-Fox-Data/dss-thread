import { Node, Edge, OnConnect, OnConnectStart, OnConnectStop, OnConnectEnd, CoordinateExtent, OnNodesChange, OnEdgesChange, ConnectionMode, SnapGrid } from '../../types';
interface StoreUpdaterProps {
    nodes: Node[];
    edges: Edge[];
    onConnect?: OnConnect;
    onConnectStart?: OnConnectStart;
    onConnectStop?: OnConnectStop;
    onConnectEnd?: OnConnectEnd;
    nodesDraggable?: boolean;
    nodesConnectable?: boolean;
    minZoom?: number;
    maxZoom?: number;
    nodeExtent?: CoordinateExtent;
    onNodesChange?: OnNodesChange;
    onEdgesChange?: OnEdgesChange;
    elementsSelectable?: boolean;
    connectionMode?: ConnectionMode;
    snapToGrid?: boolean;
    snapGrid?: SnapGrid;
    translateExtent?: CoordinateExtent;
    fitViewOnInit: boolean;
    connectOnClick: boolean;
}
declare const StoreUpdater: ({ nodes, edges, onConnect, onConnectStart, onConnectStop, onConnectEnd, nodesDraggable, nodesConnectable, minZoom, maxZoom, nodeExtent, onNodesChange, onEdgesChange, elementsSelectable, connectionMode, snapGrid, snapToGrid, translateExtent, fitViewOnInit, connectOnClick, }: StoreUpdaterProps) => null;
export default StoreUpdater;
