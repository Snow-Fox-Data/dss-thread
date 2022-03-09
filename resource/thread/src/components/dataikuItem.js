import React, { Component } from "react";
import { Col, Container, Row } from "react-bootstrap";
import Common from "../common/common";
// import Dataset from "./dataset";
import Table from 'react-bootstrap/Table';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import { Modal, Button, Form, Toast } from "react-bootstrap";
import eventBus from "../eventBus";
import { ArrowUpRightSquare } from 'react-bootstrap-icons'
import Lineage from "./lineage";

class DataikuItem extends Component {

    constructor(props) {
        super(props);

        this.state = {
            newDefModal: false,
            selectedDef: {
                name: "New Definition",
                value: ""
            }
        };
    }

    saveCol() {
        // this.setState({ newDefModal: false });
        // let formData = new FormData()
        // formData.append("name", this.state.selectedDef.name);
        // formData.append("description", this.state.selectedDef.value);
        // formData.append("applied_to", [this.props.item.key]);
        // formData.append("id", -1);

        // const requestOptions = {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'multipart/form-data'
        //     },
        //     body: formData
        // };
        const requestOptions = {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "name": this.state.selectedDef.name,
                "description": this.state.selectedDef.value,
                "applied_to": [this.props.item.key],
                "id": -1
            })
        }

        fetch(window.getWebAppBackendUrl('update-desc'), requestOptions)
            .then(res => res.json())
            .then(
                (result) => {
                    this.setState({ newDefModal: false });
                    // eventBus.dispatch("dataRefresh", {});
                });
    }

    buildLineage() {
        return <Row>
            <Lineage deets={this.props.item} full_ds_name={this.props.item.name} type={this.props.type}></Lineage>
            {/* <Dataset deets={this.props.item} full_ds_name={this.props.item.name} type={this.props.type}></Dataset> */}
        </Row>
    }

    buildTagsString(arrayTags) {
        let tags = [<span><b>Tags: </b></span>];

        arrayTags.forEach(element => {
            tags[tags.length] = <span>{element}</span>;
        });

        return tags;
    }

    openExternalProject(key) {
        alert(key)
    }

    renderItemDetailsByType() {
        switch (this.props.type) {
            case 'dataset':
                return this.renderDataset();
            case 'project':
                return this.renderProject();
            case 'column':
                return this.renderColumn();
            case 'dataset':
                return <Col>
                    <p>No rendering has been setup for this item.</p>
                </Col>;
        }
    }

    newDef() {
        this.setState({
            selectedDef: {
                name: 'New Definition',
                value: this.props.item.comment
            }
        })
        this.setState({ newDefModal: true });
    }

    openColumn(col) {
        eventBus.dispatch("columnSelected", col);
    };

    openDataset(ds) {
        eventBus.dispatch("datasetSelected", ds);
    }

    openProject(proj) {
        eventBus.dispatch("projectSelected", proj);
    }

    renderColumn() {
        let lineage = this.buildLineage();

        return <Col>
            {/* onHide={this.closeColumn}  */}
            <Modal size="lg" show={this.state.newDefModal} animation={false}>
                <Modal.Header closeButton>
                    <Modal.Title>{this.state.selectedDef.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Container>
                        <Row>
                            <Form style={{ paddingTop: '15px' }}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Description Name</Form.Label>
                                    <Form.Control type="text" defaultValue={this.state.selectedDef.name}
                                        onChange={e => this.state.selectedDef.name = e.target.value}
                                    />
                                    {/* <Form.Text className="text-muted">
                                        Will be saved to the DSS Column name
                                    </Form.Text> */}
                                    <Form.Label>Description Value</Form.Label>
                                    <Form.Control type="text" defaultValue={this.state.selectedDef.value}
                                        onChange={e => this.state.selectedDef.value = e.target.value}
                                    />
                                </Form.Group>
                            </Form>
                        </Row>
                    </Container>
                </Modal.Body>
                <Modal.Footer>
                    {/* onClick={() => this.saveColLineage()} */}
                    <Button variant="secondary" >Save all Lineage</Button>
                    <Button variant="primary" onClick={() => this.saveCol()}>Save</Button>
                </Modal.Footer>
            </Modal>

            <p class="name"><b>Project: </b>
                <span className='app-link' onClick={() => this.openProject(this.props.item.project)}>{this.props.item.project}</span>
            </p>
            <p class="name"><b>Dataset: </b>
                <span className='app-link' onClick={() => this.openDataset(this.props.item.project + '.' + this.props.item.dataset)}>{this.props.item.dataset}</span>
            </p>
            <p class="name"><b>Column Name: </b>{this.props.item.name}
            </p>
            <p class="name"><b>Type: </b>{this.props.item.type}</p>

            <div style={{ paddingTop: '10px' }}>
                <Tabs defaultActiveKey="definition" className="mb-3">
                    <Tab eventKey="definition" title="Definition" def>
                        {
                            this.props.item.definition.id == -1 &&
                            <div>
                                <Button variant="primary"
                                    onClick={() => this.newDef()}
                                >Add</Button>{' '}
                                <div style={{ padding: '10px' }}>
                                    {this.props.item.comment}
                                </div>
                            </div>
                        }
                        {
                            this.props.item.definition.id > 0 &&
                            <div>
                                <Button variant="primary"
                                    onClick={() => this.newDef()}
                                >Edit</Button>{' '}
                                <div style={{ padding: '10px' }}>
                                    {this.props.item.comment}
                                </div>
                            </div>
                        }
                    </Tab>
                    <Tab eventKey="lineage" title="Lineage" def>
                        <div class="lineage">{lineage}</div>
                    </Tab>
                </Tabs>
            </div>
        </Col>
    }

    renderDataset() {
        let tags = this.buildTagsString(this.props.item.meta.tags);
        let lineage = this.buildLineage();

        var listItems = this.props.item.schema.map((col) =>
            <tr onClick={() => this.openColumn(col.key)}>
                <td>{col.name}</td>
                <td>{col.type}</td>
                <td>{col.comment}</td>
            </tr>
        );

        return <Col>
            <p class="name"><b>Name: </b>{this.props.item.name}
                <span style={{ paddingLeft: '4px' }}>
                    <a href={Common.createDatasetLink(this.props.item.project, this.props.item.id)} target="_blank"><ArrowUpRightSquare size={20} />
                    </a></span>
            </p>
            <p class="project"><b>Project: </b>
                <span className='app-link' onClick={() => this.openProject(this.props.item.project)}>{this.props.item.project}</span></p>
            <p class="name"><b>Type: </b>{this.props.type}</p>

            <div class="tags">{tags}</div>

            <Row style={{ paddingTop: '20px' }}>
                <Tabs defaultActiveKey="lineage" id="uncontrolled-tab-example" className="mb-3">
                    <Tab eventKey="lineage" title="Lineage">
                        <div class="lineage">{lineage}</div>
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
        </Col>;
    }

    renderProject() {
        let tags = this.buildTagsString(this.props.item.tags);
        let dataSetRows = this.props.item.datasets.map((col) =>
            <tr>
                <td onClick={() => this.openDataset(col)}>{col}</td>
            </tr>
        );

        return <Col>
            <p class="name"><b>Name: </b><span>{this.props.item.name}</span><span style={{ paddingLeft: '4px' }}>
                <a href={Common.createProjectLink(this.props.item.projectKey)} target="_blank"><ArrowUpRightSquare size={20} />
                </a></span></p>
            <p class="name"><b>Type: </b>{this.props.type}</p>

            <div class="tags">{tags}</div>
            <div style={{ paddingTop: '10px' }}>
                <Tabs defaultActiveKey="datasets" className="mb-3">
                    <Tab eventKey="datasets" title="Datasets" def>
                        <Table striped bordered hover>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dataSetRows}
                            </tbody>
                        </Table>
                    </Tab>
                </Tabs>
            </div>
        </Col>;
    }

    render() {
        let item;
        let itemDetails = this.renderItemDetailsByType();
        if (this.props.item != null) {
            item = <Row className="align-items-start">
                <Col xs={1}>
                    {Common.getIconForDataikuItemType(this.props.type, "100%")}
                </Col>
                {itemDetails}
            </Row>
        } else {
            item = <Row>
                <p>No Item to display...</p>
            </Row>
        }

        return (
            <div class="dataiku-item">
                {item}
            </div>
        );
    }
}

export default DataikuItem;