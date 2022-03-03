import React, { Component } from "react";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Table from 'react-bootstrap/Table';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import { Modal, Button, Form, Toast } from "react-bootstrap";
import eventBus from "../eventBus";
import ReactFlow, { Controls } from 'react-flow-renderer';
import customFlowNode from './customFlowNode.js';

// import EditColumnModal from "./editColumnModal";

class Dataset extends Component {

    constructor(props) {
        super(props);

        this.state = {
            modalDialog: false,
            selectedCol: { name: '', comment: '' },
            elements: [],
            col_elements: [],
            last_ds: '',
            showA: false
        };

        // this.toggleModal = this.toggleModal.bind(this);
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

        var elements = [{
            id: '-1',
            // type: 'customFlowNode',
            data: { label: base_elem.name },
            position: { x: 250, y: 140 },
            style: { width: '200px', borderColor: 'red', borderWidth: '2px', fontWeight: 'bold' },
            sourcePosition: 'right',
            targetPosition: 'left',
            draggable: false
        }];

        // find all the end-nodes
        var down_res = [];
        if (base_elem.lineage_downstream != null && base_elem.lineage_downstream != '') {
            if (base_elem.lineage_downstream_full != null)
                this.traverse(down_res, base_elem, 'lineage_downstream_full');
            else
                down_res = eval(base_elem.lineage_downstream);
        }

        var up_res = [];
        if (base_elem.lineage_upstream != null && base_elem.lineage_upstream != '') {
            if (base_elem.lineage_upstream_full != null)
                this.traverse(up_res, base_elem, 'lineage_upstream_full');
            else
                up_res = eval(base_elem.lineage_upstream);
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

            elements[elements.length] = {
                id: 'down_' + x,
                type: 'customFlowNode',
                data: { project: project, dataset: dataset, column: col },
                style: { width: '200px' },
                targetPosition: 'left',
                sourcePosition: 'right',
                position: { x: 500, y: ((300 / (down_res.length + 1)) * (x + 1)) },
                draggable: false
            }

            var edge = { id: '-1-down_' + x, source: '-1', target: 'down_' + x, arrowHeadType: 'arrow' };
            if (down_res[x].count > 0) {
                edge.label = '[' + down_res[x].count + ']';
                edge.animated = true;
            }

            elements[elements.length] = edge
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

            elements[elements.length] = {
                id: 'up_' + x,
                type: 'customFlowNode',
                data: { project: project, dataset: dataset, column: col },
                style: { width: '200px' },
                sourcePosition: 'right',
                targetPosition: 'left',
                position: { x: 0, y: (300 / (up_res.length + 1) * (x + 1)) },
                draggable: false
            }

            var edge = { id: '-1-up_' + x, source: 'up_' + x, target: '-1', arrowHeadType: 'arrow' };
            if (up_res[x].count > 0) {
                edge.animated = true;
                edge.label = '[' + up_res[x].count + ']';
            }

            elements[elements.length] = edge;
        }
        var new_state = {}
        new_state[st] = elements;

        this.setState(new_state)
    }

    openColumn(col) {
        // loading the column lineage
        fetch(window.getWebAppBackendUrl('column-lineage'), {
            method: 'POST', body: JSON.stringify({
                'column': this.createColName(col.name)
            })
        })
            .then(res => res.json())
            .then(
                (result) => {
                    col.lineage_downstream = result.downs;
                    col.lineage_upstream = result.ups;

                    this.update('col_elements', col);
                    this.setState({ modalDialog: true, selectedCol: col });
                    //eventBus.dispatch("dataRefresh", {});
                });
    };

    closeColumn = () => {
        this.modalClosed();
        // this.setState({ showA: true })
    }

    createColName(col) {
        return this.props.full_ds_name + '.' + col;
    }

    formatLineage(lin) {
        // for (var x = 0; x < lin.length; x++) {
        //     lin[x] = this.createDsLinkFull(lin[x].split('.')[0], lin[x].split('.')[1])
        // }

        if (lin != null)
            return lin.join(", ");

        return ''
    }

    modalClosed() {
        this.update('elements', this.props.deets);
        this.setState({ modalDialog: false });
    }

    saveColLineage() {
        var cols = [this.createColName(this.state.selectedCol.name)]
        for (var i = 0; i < this.state.selectedCol.lineage_upstream.length; i++) {
            cols[cols.length] = this.state.selectedCol.lineage_upstream[i]
        }
        for (var i = 0; i < this.state.selectedCol.lineage_downstream.length; i++) {
            cols[cols.length] = this.state.selectedCol.lineage_downstream[i]
        }
        this.modalClosed();

        fetch(window.getWebAppBackendUrl('update-col-desc'), {
            method: 'POST', body: JSON.stringify({
                'cols': cols,
                'desc': this.state.selectedCol.comment
            })
        })
            .then(res => res.json())
            .then(
                (result) => {
                    eventBus.dispatch("dataRefresh", {});
                });
    }

    saveCol() {
        // alert(this.state.selectedCol.comment)

        for (var x = 0; x < this.props.deets.schema.length; x++) {
            if (this.props.deets.schema[x].name == this.state.selectedCol.name) {
                this.props.deets.schema[x].comment = this.state.selectedCol.comment;
                break;
            }
        }

        // for (var x = 0; x < this.props.deets.schema.columns.length; x++) {
        //     if (this.props.deets.schema.columns[x].name == this.state.selectedCol.name) {
        //         this.props.deets.schema.columns[x].comment = this.state.selectedCol.comment;
        //         break;
        //     }
        // }

        this.modalClosed();

        fetch(window.getWebAppBackendUrl('update-col-desc'), {
            method: 'POST', body: JSON.stringify({
                'cols': [this.createColName(this.state.selectedCol.name)],
                'desc': this.state.selectedCol.comment,
                'upstream': false,
                'downstream': false
            })
        })
            .then(res => res.json())
            .then(
                (result) => {
                    eventBus.dispatch("dataRefresh", {});
                });
    }

    createDsLink(ds) {
        return this.createDsLink2(ds.projectKey, ds.name)
    }

    createDsLink2(proj, ds) {
        return '/projects/' + proj + '/datasets/' + ds + '/explore/';
    }

    createDsLinkFull(proj, ds) {
        return '<a href="' + this.createDsLink2(proj, ds) + '" target="_blank">' + proj + '.' + ds + '</a>';
    }

    onLoad(rv) {
        rv.fitView();
    }

    render() {

        // setTimeout(() => {
        if (this.props.deets.name != this.state.last_ds) {
            this.state.last_ds = this.props.deets.name;
            this.update('elements', this.props.deets);
        }
        // }, 500);

        var listItems = this.props.deets.schema.map((col) =>
            <tr onClick={() => this.openColumn(col)}>
                <td>{col.name}</td>
                <td>{col.type}</td>
                <td>{col.comment}</td>
            </tr>
        );

        // var listItems = this.props.deets.schema.columns.map((col) =>
        //     <tr onClick={() => this.openColumn(col)}>
        //         <td>{col.name}</td>
        //         <td>{col.type}</td>
        //         <td>{col.comment}</td>
        //     </tr>
        // );

        return (
            <>

                <Modal size="lg" show={this.state.modalDialog} onHide={this.closeColumn} animation={false}>
                    <Modal.Header closeButton>
                        <Modal.Title>{this.state.selectedCol.name}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Container>
                            {/* <Row>
                                <b>Downstream:</b><div>{this.formatLineage(this.state.selectedCol.lineage_downstream)}</div>
                            </Row>
                            <Row>
                                <b>Upstream:</b><div>{this.formatLineage(this.state.selectedCol.lineage_upstream)}</div>
                            </Row> */}
                            <Row>
                                <div style={{ height: 300 }}>
                                    <ReactFlow onLoad={this.onLoad} elements={this.state.col_elements} nodeTypes={this.nodeTypes}>
                                        <Controls showInteractive="false" />
                                    </ReactFlow>
                                </div>
                            </Row>
                            <Row>
                                <Form style={{ paddingTop: '15px' }}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Description</Form.Label>
                                        <Form.Control type="text" defaultValue={this.state.selectedCol.comment}
                                            onChange={e => this.state.selectedCol.comment = e.target.value}
                                        />
                                        <Form.Text className="text-muted">
                                            Will be saved to the DSS Column name
                                        </Form.Text>
                                    </Form.Group>
                                </Form>
                            </Row>
                        </Container>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => this.saveColLineage()}>Save all Lineage</Button>
                        <Button variant="primary" onClick={() => this.saveCol()}>Save</Button>
                    </Modal.Footer>
                </Modal>

                <Container style={{ paddingTop: '20px' }}>
                    {/* <Row><h2><a href={this.createDsLink(this.props.deets)} target="_blank">{this.props.deets.name} ({this.props.deets.projectKey})</a></h2></Row> */}                    
                    {/* <Row><h4><b>Type:</b> {this.props.deets.type}</h4></Row> */}
                    {/* <Row><h4><b>Last Modified:</b> {this.props.deets.versionTag.lastModifiedBy.login} @ {this.props.deets.versionTag.lastModifiedOn}</h4></Row> */}
                    {/* <Row><h4><b>Short Desc:</b> {this.props.deets.shortDesc}</h4></Row> */}
                    <Row>
                        <Toast show={this.state.showA} delay={3000} autohide animation={false}>
                            <Toast.Header>
                                <img
                                    src="holder.js/20x20?text=%20"
                                    className="rounded me-2"
                                    alt=""
                                />
                                <strong className="me-auto">Bootstrap</strong>
                                <small>11 mins ago</small>
                            </Toast.Header>
                            <Toast.Body>Woohoo, you're reading this text in a Toast!</Toast.Body>
                        </Toast>
                    </Row>
                    <Row style={{ paddingTop: '20px' }}>
                        <Tabs defaultActiveKey="lineage" id="uncontrolled-tab-example" className="mb-3">
                            <Tab eventKey="lineage" title="Lineage">
                                <Row>
                                    <div style={{ height: 300 }}>
                                        {this.state.elements && <ReactFlow onLoad={this.onLoad} elements={this.state.elements} nodeTypes={this.nodeTypes}>
                                            <Controls showInteractive="false" />
                                        </ReactFlow>}
                                    </div>
                                </Row>
                            </Tab>
                            <Tab eventKey="columns" title="Columns" def>
                                <Table striped bordered hover>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Type</th>
                                            <th>Description</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {listItems}
                                    </tbody>
                                </Table>
                            </Tab>
                        </Tabs>
                    </Row>
                </Container>

            </>
        );
    }
}

export default Dataset;