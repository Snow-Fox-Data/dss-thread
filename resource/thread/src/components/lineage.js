import React, { Component, useCallback } from 'react';
import ReactFlow, { addEdge, Controls, useNodesState, useEdgesState } from 'react-flow-renderer';
import customFlowNode from './customFlowNode.js';
import dagre from 'dagre';

class Lineage extends Component {

    // CONSTANT VALUES
    static containerHeight = 500;
    static containerWidth = 1030;

    static nodeWidth = 200;
    static nodeHeight = 60;

    static dagreGraph = new dagre.graphlib.Graph();
    
    constructor(props) {
        super(props);

        this.state = {
            elements: [],
            last_ds: '',
            // dagreGraph: new dagre.graphlib.Graph(),
            nodes: [],
            edges: []
        };

        this.nodeTypes = {
            customFlowNode: customFlowNode,
        };

        Lineage.dagreGraph.setDefaultEdgeLabel(() => ({}));
    }

    traverse = (lst, node, prop, ct = 0) => {
        var res = [];
        if (node[prop] != null && node[prop].length > 0) {
            ct = ct + 1;
            for (var x = 0; x < node[prop].length; x++) {
                this.traverse(lst, node[prop][x], prop, ct);
            }
        }
        else {
            lst[lst.length] = {
                'count': ct - 1,
                'name': node.name
            }
        }

        return res;
    }

    // STRUCTURE FOR NODES AND EDGES FOR AUTO LAYOUT
    // example = () => {
    //     const nodes = [{
    //         id: '1',
    //         type: 'input',
    //         data: { label: 'input' },
    //         position,
    //       }];

    //     const edges = [{ 
    //         id: 'e12', 
    //         source: '1', 
    //         target: '2', 
    //         type: edgeType, 
    //         animated: true 
    //     }];
    // }

    update = (st, base_elem) => {
        var base_splits = base_elem.name.split('.');

        // let basePositionX = (Lineage.containerWidth / 2) - (Lineage.nodeWidth / 2);
        // let basePositionY = (Lineage.containerHeight / 2) - (Lineage.nodeHeight / 2);

        let basePositionX = 0;
        let basePositionY = 0;

        console.log("basePositionX == ");
        console.log(basePositionX);
        console.log("basePositionY == ");
        console.log(basePositionY);

        Lineage.dagreGraph.setGraph({ rankdir: 'LR' });
        // this.state.dagreGraph.setGraph({ rankdir: 'LR' });

        var baseElementId = 'base';
        var baseNode = {
            id: baseElementId,
            type: 'customFlowNode',
            data: { project: base_splits[0], dataset: base_splits[1], },
            position: { x: basePositionX, y: basePositionY },
            // position: { x: 250, y: 140 },
            style: { backgroundColor: '#FFF', borderColor: 'red', borderWidth: '2px', fontWeight: 'bold', height: Lineage.nodeHeight, width: Lineage.nodeWidth },
            sourcePosition: 'right',
            targetPosition: 'left',
            draggable: false
        };

        var elements = [baseNode];
        var _nodes = [baseNode];
        var _edges = [];

        // find all the end-nodes
        var down_res = [];
        if (base_elem['lineage_downstream'] != null && base_elem['lineage_downstream'] != '') {
            if (base_elem['lineage_downstream'] != null)
                this.traverse(down_res, base_elem, 'lineage_downstream');
            else
                down_res = eval(base_elem['lineage_downstream']);
        }
        
        var up_res = [];
        if (base_elem['lineage_upstream'] != null && base_elem['lineage_upstream'] != '') {
            if (base_elem['lineage_upstream'] != null)
                this.traverse(up_res, base_elem, 'lineage_upstream');
            else
                up_res = eval(base_elem['lineage_upstream']);
        }

        for (var x = 0; x < down_res.length; x++) {
            var lbl = down_res[x];
            if (lbl.name != null)
                lbl = down_res[x].name;

            var splits = lbl.split('.');
            var project = splits[0];
            var dataset = '';
            var col = '';
            if (splits.length > 1)
                dataset = splits[1];
            if (splits.length > 2)
                col = splits[2];

            var elementId = 'down_' + x.toString();

            var downYPosition = ((x + 1) - Math.ceil(down_res.length * 0.5));
            console.log("downYPosition == ");
            console.log(downYPosition);

            // basePositionY + (nodeHeight * ((x + 1) - Math.ceil(down_res.length * 0.5))) // I believe this is the way to good, but untested.

            var node = {
                id: elementId,
                type: 'customFlowNode',
                data: { project: project, dataset: dataset, column: col },
                style: { backgroundColor: '#FFF', height: Lineage.nodeHeight, width: Lineage.nodeWidth },
                targetPosition: 'left',
                sourcePosition: 'right',
                position: { x: basePositionX, y: basePositionY },
                // position: { x: 500, y: ((300 / (down_res.length + 1)) * (x + 1)) }, // OG
                // position: { x: basePositionX + (Lineage.nodeWidth + 50), y: (200 / (down_res.length + 1) * (x + 1)) },
                // position: { x: basePositionX + (Lineage.nodeWidth + 50), y: (300 / (down_res.length + 1) * (x + 1)) },
                // position: { x: basePositionX + (Lineage.nodeWidth + 50), y: (250 / (x + 1) - (down_res.length / 2)) },
                
                draggable: false
            };

            elements[elements.length] = node;
            _nodes[_nodes.length] = node;

            var edgeId = 'edge_down_' + x.toString();
            var edge = { id: edgeId, source: baseElementId, target: elementId, arrowHeadType: 'arrow' };
            if (down_res[x].count > 0) {
                edge.label = '[' + down_res[x].count + ']';
                edge.animated = true;
            }

            elements[elements.length] = edge;
            _edges[_edges.length] = edge;
        }

        for (var x = 0; x < up_res.length; x++) {
            var lbl = up_res[x];
            if (lbl.name != null)
                lbl = up_res[x].name;

            var splits = lbl.split('.');
            var project = splits[0];
            var dataset = '';
            var col = '';
            if (splits.length > 1)
                dataset = splits[1];
            if (splits.length > 2)
                col = splits[2];

            // var upYPosition = (250 / (x + 1) - (down_res.length / 2));
            // console.log("upYPosition == ");
            // console.log(upYPosition);

            var elementId = 'up_' + x.toString();
            var node ={
                id: elementId,
                type: 'customFlowNode',
                data: { project: project, dataset: dataset, column: col },
                style: { backgroundColor: '#FFF', height: Lineage.nodeHeight, width: Lineage.nodeWidth },
                sourcePosition: 'right',
                targetPosition: 'left',
                position: { x: basePositionX, y: basePositionY },
                // position: { x: 0, y: (300 / (up_res.length + 1) * (x + 1)) },
                // position: { x: basePositionX - (Lineage.nodeWidth + 50), y: (300 / (up_res.length + 1) * (x + 1)) },
                // position: { x: basePositionX - (Lineage.nodeWidth + 50), y: (300 / (up_res.length + 1) * (x + 1)) },
                draggable: false
            };

            elements[elements.length] = node;
            _nodes[_nodes.length] = node;

            var edgeId = 'edge_up_' + x.toString();
            var edge = { id: edgeId, source: elementId, target: baseElementId, arrowHeadType: 'arrow' };
            if (up_res[x].count > 0) {
                edge.animated = true;
                edge.label = '[' + up_res[x].count + ']';
            }

            elements[elements.length] = edge;
            _edges[_edges.length] = edge;
        }        

        console.log('elements == ');
        console.log(elements);

        console.log('_nodes == ');
        console.log(_nodes);

        console.log('_edges == ');
        console.log(_edges);

        // const { dagreGraph } = this.state;
        
        // _nodes.forEach((node) => {
        //     Lineage.dagreGraph.setNode(node.id, { width: Lineage.nodeWidth, height: Lineage.nodeHeight });
        //     // dagreGraph.setNode(node.id, { width: Lineage.nodeWidth, height: Lineage.nodeHeight });
        // });

        // _edges.forEach((edge) => {
        //     Lineage.dagreGraph.setEdge(edge.source, edge.target);
        //     // dagreGraph.setEdge(edge.source, edge.target);
        // });

        // dagre.layout(Lineage.dagreGraph);
        // // dagre.layout(dagreGraph);

        // _nodes.forEach((node) => {
        //     const nodeWithPosition = Lineage.dagreGraph.node(node.id);
        //     // const nodeWithPosition = dagreGraph.node(node.id);
        //     node.targetPosition = 'left';
        //     node.sourcePosition = 'right';
        
        //     // We are shifting the dagre node position (anchor=center center) to the top left
        //     // so it matches the React Flow node anchor point (top left).
        //     node.position = {
        //       x: nodeWithPosition.x - Lineage.nodeWidth / 2,
        //       y: nodeWithPosition.y - Lineage.nodeHeight / 2,
        //     };
        
        //     return node;
        // });

        this.setState({
            nodes: _nodes,
            edges: _edges,
            elements: elements
        });

        // ELMENTS STATE UPDATE
        // var new_state = {}
        // new_state[st] = elements;
        // this.setState(new_state)
    }

    onLoad(rv) {
        rv.fitView();
    }

    render() {      
        console.log('Render() :: this.state == ');
        console.log(this.state);

        // SEPARATED NODES AND EDGES
        // if (this.props.deets.name != this.state.last_ds) {
        //     this.state.last_ds = this.props.deets.name;
        //     this.update('elements', this.props.deets);
        // }

        // // const [nodes, setNodes, onNodesChange] = useNodesState(this.state.nodes);
        // // const [edges, setEdges, onEdgesChange] = useEdgesState(this.state.edges);

        // // const onConnect = useCallback(
        // //     (params) => setEdges((eds) => addEdge({ ...params, type: 'smoothstep', animated: true }, eds)),
        // //     []
        // // );
        
        // return (
        //     <div style={{ backgroundColor: '#EEE', height: Lineage.containerHeight, width: Lineage.containerWidth }}>
        //         {this.state.elements && 
        //         <ReactFlow                     
        //             nodes={this.state.nodes}
        //             edges={this.state.edges} 
        //             nodeTypes={this.nodeTypes} 
        //             // onConnect={onConnect}
        //             onLoad={this.onLoad} 
        //             // onEdgesChange={onEdgesChange}
        //             // onNodesChange={onNodesChange}                    
        //             connectionLineType="smoothstep"
        //             style={{ height: "100%", width: "100%" }}
        //         >
        //             <Controls showInteractive="false" />
        //         </ReactFlow>}
        //     </div>
        // );

        // WORKING RENDER
        if (this.props.deets.name != this.state.last_ds) {
            this.state.last_ds = this.props.deets.name;
            this.update('elements', this.props.deets);
        }
        
        return (
            <div style={{ backgroundColor: '#EEE', height: Lineage.containerHeight, width: Lineage.containerWidth }}>
                {this.state.elements && 
                <ReactFlow 
                    connectionLineType="smoothstep"                    
                    elements={this.state.elements} 
                    nodeTypes={this.nodeTypes} 
                    onLoad={this.onLoad} 
                    style={{ height: "100%", width: "100%" }}
                >
                    <Controls showInteractive="false" />
                </ReactFlow>}
            </div>
        );
    }
}

export default Lineage;