import React, { Component, useCallback, useState } from 'react';
import ReactFlow, { Controls } from 'react-flow-renderer';
import customFlowNode from './customFlowNode.js';
import { createGraphLayout } from '../common/layout.js';

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
        var base_splits = base_elem.name.split('.');

        let basePositionX = 0;
        let basePositionY = 0;

        var baseElementId = 'base';
        var baseNode = {
            id: baseElementId,
            className: 'thread-node-base',
            type: 'customFlowNode',
            data: { project: base_splits[0], dataset: base_splits[1], },
            position: { x: basePositionX, y: basePositionY },
            // style: {  minHeight: Lineage.DEFAULT_NODE_HEIGHT, minWidth: Lineage.DEFAULT_NODE_WIDTH },
            style: { height: Lineage.DEFAULT_NODE_HEIGHT, width: Lineage.DEFAULT_NODE_WIDTH },
            sourcePosition: 'right',
            targetPosition: 'left',
            draggable: false
        };

        // console.log('base-node :: base_splits[1].length == ' + base_splits[1].length);

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
                data: { project: project, dataset: dataset, column: col },
                // style: {  minHeight: Lineage.DEFAULT_NODE_HEIGHT, minWidth: Lineage.DEFAULT_NODE_WIDTH },
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
                data: { project: project, dataset: dataset, column: col },
                // style: {  minHeight: Lineage.DEFAULT_NODE_HEIGHT, minWidth: Lineage.DEFAULT_NODE_WIDTH },
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
            elements: elements,
            nodes: _nodes
        });

        createGraphLayout(elements)
            .then((els) => this.setState({elements: els}))
            .catch((err) => console.error(err));
    }

    onLoad(rv) {
        console.log('onLoad() :: ');
        setTimeout(() => rv.fitView(), 1000);
    }

    onInit(rv) {
        console.log('onInit() :: ');
    }

    render() {
        if (this.props.deets.name != this.state.last_ds) {
            this.state.last_ds = this.props.deets.name;
            this.update('elements', this.props.deets);
        }

        // TODO onNodesChange isn't trigger when changing the screen.
        // none of the event listens seem to trigger when changing view.
        // need to trigger the fitview when changing over.
        
        return (
            <div className='REACT-FLOW-CONTAINER' style={{ backgroundColor: '#EEE', height: Lineage.DEFAULT_CONTAINER_HEIGHT, width: "100%" }}>
                {this.state.elements && 
                <ReactFlow 
                    onLoad={this.onLoad} 
                    onInit={this.onInit}
                    elements={this.state.elements}
                    nodeTypes={this.nodeTypes} 
                    style={{ height: "100%", width: "100%" }}
                    fitView
                >
                    <Controls showInteractive="false" />
                </ReactFlow>}
            </div>
        );        
    }
}

export default Lineage;