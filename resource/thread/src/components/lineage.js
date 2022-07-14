import React, { Component } from 'react';
import ReactFlow, { Controls, ReactFlowProvider, useZoomPanHelper } from 'react-flow-renderer';
import customFlowNode from './customFlowNode.js';
import { createGraphLayout } from '../common/layout.js';
import Common from '../common/common.js';

class Lineage extends Component {

    // CONSTANT VALUES
    static DEFAULT_CONTAINER_HEIGHT = 500;
    static DEFAULT_CONTAINER_WIDTH = 1030;

    static DEFAULT_NODE_HEIGHT = 75;
    static DEFAULT_NODE_WIDTH = 250;

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
        var base_splits = base_elem.key.split('.');

        let basePositionX = 0; 
        let basePositionY = 0;

        var baseElementId = 'base';
        var baseNode = {
            id: baseElementId,
            className: 'thread-node-base',
            type: 'customFlowNode',
            data: { project: base_splits[0], dataset: base_splits[1], parentid: this.props.parentid },
            position: { x: basePositionX, y: basePositionY },
            style: { height: Lineage.DEFAULT_NODE_HEIGHT, width: Lineage.DEFAULT_NODE_WIDTH },
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
                className: 'thread-node',
                type: 'customFlowNode',
                data: { project: project, dataset: dataset, column: col, parentid: this.props.parentid },
                style: { height: Lineage.DEFAULT_NODE_HEIGHT, width: Lineage.DEFAULT_NODE_WIDTH },
                targetPosition: 'left',
                sourcePosition: 'right',
                position: { x: basePositionX, y: basePositionY },                     
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
                className: 'thread-node',
                type: 'customFlowNode',
                data: { project: project, dataset: dataset, column: col, parentid: this.props.parentid },
                style: { height: Lineage.DEFAULT_NODE_HEIGHT, width: Lineage.DEFAULT_NODE_WIDTH },
                sourcePosition: 'right',
                targetPosition: 'left',
                position: { x: basePositionX, y: basePositionY },         
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

        this.setState({
            edges: _edges,
            // elements: elements,
            nodes: _nodes
        });

        createGraphLayout(elements)
            .then((els) => this.setState({elements: els}))
            .catch((err) => console.error(err));
    }

    onLoad(rv) {
        setTimeout(() => rv.fitView(), 1000);
    }

    render() {
        if (this.props.deets.name != this.state.last_ds) {
            this.state.last_ds = this.props.deets.name;
            this.update('elements', this.props.deets);
        }

        return (            
            <div className='react-flow-container' style={{ backgroundColor: '#EEE', height: Lineage.DEFAULT_CONTAINER_HEIGHT, width: "100%" }}>
                {this.state._nodes && 
                <ReactFlowProvider>
                    <ReactFlow 
                        onLoad={this.onLoad} 
                        // elements={this.state.elements}
                        nodes={this.state.nodes}
                        edges={this.state.edges}
                        nodeTypes={this.nodeTypes} 
                        style={{ height: "100%", width: "100%" }}
                    >
                        <Controls showInteractive="false" />
                    </ReactFlow>
                </ReactFlowProvider>}
            </div>
        );        
    }
}

export default Lineage;