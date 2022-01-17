import { SetStateAction, Dispatch } from 'react';
import { Node, NodeChange, Edge, EdgeChange } from '../types';
declare type OnChange<ChangesType> = (changes: ChangesType[]) => void;
export declare const useNodesState: (initialItems: Node<any>[]) => [Node<any>[], Dispatch<SetStateAction<Node<any>[]>>, OnChange<NodeChange>];
export declare const useEdgesState: (initialItems: Edge<any>[]) => [Edge<any>[], Dispatch<SetStateAction<Edge<any>[]>>, OnChange<EdgeChange>];
export {};
