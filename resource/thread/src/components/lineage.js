import React, { Component, useCallback, useState } from 'react';
import ReactFlow, { Controls } from 'react-flow-renderer';
import customFlowNode from './customFlowNode.js';
import { createGraphLayout } from '../common/layout.js';

class Lineage extends Component {

    // CONSTANT VALUES
    static containerHeight = 500;
    static containerWidth = 1030;

    static DEFAULT_NODE_HEIGHT = 60;
    static DEFAULT_NODE_WIDTH = 200;

    constructor(props) {
        super(props);

        this.state = {
            elements: [],
            last_ds: '',
            nodes: [],
            edges: []
        };

        this.nodeTypes = {
            customFlowNode: customFlowNode,
        };
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

    update = (st, base_elem) => {
        var base_splits = base_elem.name.split('.');

        let basePositionX = (Lineage.containerWidth / 2) - (Lineage.DEFAULT_NODE_WIDTH / 2);
        let basePositionY = (Lineage.containerHeight / 2) - (Lineage.DEFAULT_NODE_HEIGHT / 2);

        var baseElementId = 'base';
        var baseNode = {
            id: baseElementId,
            type: 'customFlowNode',
            data: { project: base_splits[0], dataset: base_splits[1], },
            position: { x: basePositionX, y: basePositionY },
            style: { backgroundColor: '#FFF', borderColor: 'red', borderWidth: '2px', fontWeight: 'bold', height: Lineage.DEFAULT_NODE_HEIGHT, width: Lineage.DEFAULT_NODE_WIDTH },
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
            var node = {
                id: elementId,
                type: 'customFlowNode',
                data: { project: project, dataset: dataset, column: col },
                style: { backgroundColor: '#FFF', height: Lineage.DEFAULT_NODE_HEIGHT, width: Lineage.DEFAULT_NODE_WIDTH },
                targetPosition: 'left',
                sourcePosition: 'right',
                // position: { x: basePositionX, y: basePositionY },
                // position: { x: 500, y: ((300 / (down_res.length + 1)) * (x + 1)) }, // OG
                position: { x: basePositionX + (Lineage.DEFAULT_NODE_WIDTH + 50), y: (200 / (down_res.length + 1) * (x + 1)) },
                // position: { x: basePositionX + (Lineage.DEFAULT_NODE_WIDTH + 50), y: (300 / (down_res.length + 1) * (x + 1)) },
                // position: { x: basePositionX + (Lineage.DEFAULT_NODE_WIDTH + 50), y: (250 / (x + 1) - (down_res.length / 2)) },
                
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

            var elementId = 'up_' + x.toString();
            var node ={
                id: elementId,
                type: 'customFlowNode',
                data: { project: project, dataset: dataset, column: col },
                style: { backgroundColor: '#FFF', height: Lineage.DEFAULT_NODE_HEIGHT, width: Lineage.DEFAULT_NODE_WIDTH },
                sourcePosition: 'right',
                targetPosition: 'left',
                // position: { x: basePositionX, y: basePositionY },
                // position: { x: 0, y: (300 / (up_res.length + 1) * (x + 1)) }, // OG
                position: { x: basePositionX - (Lineage.DEFAULT_NODE_WIDTH + 50), y: (200 / (up_res.length + 1) * (x + 1)) },
                // position: { x: basePositionX - (Lineage.DEFAULT_NODE_WIDTH + 50), y: (300 / (up_res.length + 1) * (x + 1)) },
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

        this.setState({
            edges: _edges,
            elements: elements,
            nodes: _nodes
        });

        createGraphLayout(elements)
            .then((els) => this.setState({elements: els}))
            .catch((err) => console.error(err));
    }

    onLoad(rv) {
        rv.fitView();
    }

    render() {      
        console.log('Render() :: this.state == ');
        console.log(this.state);

        // SEPARATED NODES AND EDGES
        if (this.props.deets.name != this.state.last_ds) {
            this.state.last_ds = this.props.deets.name;
            this.update('elements', this.props.deets);
        }        
        
        return (
            <div style={{ backgroundColor: '#EEE', height: Lineage.containerHeight, width: Lineage.containerWidth }}>
                {this.state.elements && 
                <ReactFlow 
                    onLoad={this.onLoad} 
                    elements={this.state.elements}
                    nodeTypes={this.nodeTypes} 
                    // onConnect={onConnect}
                    // onEdgesChange={onEdgesChange}
                    // onNodesChange={onNodesChange}
                    style={{ height: "100%", width: "100%" }}
                >
                    <Controls showInteractive="false" />
                </ReactFlow>}
            </div>
        );

        // SECOND RENDER
        // if (this.props.deets.name != this.state.last_ds) {
        //     this.state.last_ds = this.props.deets.name;
        //     this.update('elements', this.props.deets);
        // }
        
        // return (
        //     <div style={{ backgroundColor: '#EEE', height: Lineage.containerHeight, width: Lineage.containerWidth }}>
        //         {this.state.elements && 
        //         <ReactFlow onLoad={this.onLoad} elements={this.state.elements} nodeTypes={this.nodeTypes} style={{ height: "100%", width: "100%" }}>
        //             <Controls showInteractive="false" />
        //         </ReactFlow>}
        //     </div>
        // );
    }
}

export default Lineage;