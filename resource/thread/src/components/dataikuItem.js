import React, { Component, Fragment } from "react";
import { Col, Container, Row } from "react-bootstrap";
import Common from "../common/common";
import Table from 'react-bootstrap/Table';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import { Modal, Button, Form, Toast, ButtonGroup } from "react-bootstrap";
import eventBus from "../eventBus";
import { ArrowUpRightSquare } from 'react-bootstrap-icons'
import Lineage from "./lineage";
import Definition from "./definition"
import { AsyncTypeahead } from 'react-bootstrap-typeahead';

import { confirmAlert } from 'react-confirm-alert'; // Import
import 'react-confirm-alert/src/react-confirm-alert.css'; // Import css

class DataikuItem extends Component {
    constructor(props) {
        super(props);

        this.state = {
            newDefModal: false,
            selectedDef: {
                name: "New Definition",
                description: "",
                id: -1
            },
            newDefSelected: true,
            defSearchResults: []
        };

    }

    flattenArray(elem, key, orig = []) {
        for (var idx = 0; idx < elem[key].length; idx++) {
            let r = elem[key][idx];

            orig.push(r.name);
            if (r[key].length > 0) {
                orig = this.flattenArray(r, key, orig);
            }
        }

        return orig;
    }

    saveCol(applyUp, applyDown) {
        let applyTo = [this.props.item.key];
        if (applyUp)
            applyTo = applyTo.concat(this.flattenArray(this.props.item, 'lineage_upstream'))
        if (applyDown)
            applyTo = applyTo.concat(this.flattenArray(this.props.item, 'lineage_downstream'))

        confirmAlert({
            title: 'Confirm Save',
            message: 'Are you sure to apply this definition to ' + applyTo,
            buttons: [
                {
                    label: 'Apply',
                    onClick: () => {
                        let val = '';
                        if (this.state.selectedDef.description != null)
                            val = this.state.selectedDef.description;

                        const requestOptions = {
                            method: 'POST',
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                "name": this.state.selectedDef.name,
                                "description": val,
                                "applied_to": applyTo,
                                "id": this.state.selectedDef.id
                            })
                        }

                        eventBus.dispatch("loading", true);

                        fetch(window.getWebAppBackendUrl('update-desc'), requestOptions)
                            .then(res => res.json())
                            .then(
                                (result) => {
                                    this.props.item.definition = result.value;

                                    this.setState({
                                        newDefModal: false,
                                        selectedDef: result.value
                                    });

                                    eventBus.dispatch("loading", false);
                                });
                    }
                },
                {
                    label: 'Cancel',
                    onClick: () => { }
                }
            ]
        });
    };

    buildLineage() {
        return <Row>
            <Lineage deets={this.props.item} full_ds_name={this.props.item.name} type={this.props.type}></Lineage>
        </Row>
    }

    buildTagsString(arrayTags) {
        let tags = [];

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

    componentDidUpdate(prevProps) {
        if (this.props.type == 'column') {
            this.resetSelectedDef();
        }
    }

    newDef() {
        this.setState({ newDefModal: true });
    }

    resetSelectedDef() {
        if (this.props.item.definition.id == -1) {
            this.setState({
                selectedDef: {
                    name: this.props.item.name,
                    description: this.props.item.comment,
                    id: -1
                }
            })
        }
        else {
            this.setState({
                selectedDef: {
                    name: this.props.item.definition.name,
                    description: this.props.item.definition.description,
                    id: this.props.item.definition.id
                }
            })
        }
    }

    editDef() {
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

    defSearch = (term) => {
        const requestOptions = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        };

        let url = window.getWebAppBackendUrl('def-search') + '?term=' + term;
        this.setState({ loading: true });
        fetch(url, requestOptions)
            .then(res => res.json())
            .then((response) => {
                this.state.defSearchResults = response
            });

    }

    renderDefSearchMenuItem(option, props) {
        return <Fragment>
            <div style={{ fontWeight: 'bold' }}>{option.name}</div>
            <div>{option.description}</div>
        </Fragment>;
    }

    selectDef = (item) => {
        this.setState({
            selectDef: item
        })
    }

    toggleNew = (isNew) => {
        this.setState({
            newDefSelected: isNew
        })

        if (isNew) {
            this.setState({
                selectedDef: {
                    name: this.props.item.name,
                    description: this.props.item.comment,
                    id: -1
                }
            })
        }
        else {
            this.setState({
                selectedDef: {
                    name: this.props.item.definition.name,
                    description: this.props.item.definition.description,
                    id: this.props.item.definition.id
                }
            })
        }
    }

    renderColumn() {
        const filterBy = () => true;
        const { defSearchResults } = this.state;

        let lineage = this.buildLineage();
        const handleClose = () => this.setState({ newDefModal: false });

        // this.resetSelectedDef()

        return <Col>
            <Modal size="lg" show={this.state.newDefModal} animation={false} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Definition: {this.state.selectedDef.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Container>
                        <row>
                            <ButtonGroup>
                                <Button onClick={() => this.toggleNew(true)} variant={this.state.newDefSelected ? "primary" : "secondary"}>New Definition</Button>
                                <Button onClick={() => this.toggleNew(false)} variant={this.state.newDefSelected ? "secondary" : "primary"}>Existing Definition</Button>
                            </ButtonGroup>
                        </row>
                        {!this.state.newDefSelected &&
                            <Row style={{ paddingTop: "6px" }}>
                                <AsyncTypeahead
                                    // filterBy={filterBy}
                                    id="def-search"
                                    delay={300}
                                    labelKey="search_def"
                                    minLength={3}
                                    onChange={this.selectDef}
                                    onSearch={this.defSearch}
                                    options={defSearchResults}
                                    placeholder='Search'
                                    renderMenuItemChildren={this.renderDefSearchMenuItem}
                                    style={{ width: "97.5%" }}
                                />

                                <div style={{ paddingTop: "10px" }}>
                                    <Definition definition={this.state.selectedDef}></Definition>
                                </div>
                            </Row>
                        }
                        {this.state.newDefSelected &&
                            <Row>
                                <Form style={{ paddingTop: '10px' }}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Definition Name</Form.Label>
                                        <Form.Control type="text" defaultValue={this.state.selectedDef.name}
                                            onChange={e => this.state.selectedDef.name = e.target.value}
                                        />
                                        <div style={{ height: "10px" }}></div>
                                        <Form.Label>Definition Description</Form.Label>
                                        <Form.Control as="textarea" rows="3" defaultValue={this.state.selectedDef.description}
                                            onChange={e => this.state.selectedDef.description = e.target.value}
                                        />
                                        <Form.Text className="text-muted">
                                            Will appear in the Dataiku Dataset's column description.
                                        </Form.Text>
                                    </Form.Group>
                                </Form>
                            </Row>
                        }
                    </Container>
                </Modal.Body>
                <Modal.Footer>
                    {/* onClick={() => this.saveColLineage()} */}
                    <Button variant="secondary" onClick={() => this.saveCol(true, true)}>Save all Lineage</Button>
                    <Button variant="primary" onClick={() => this.saveCol(false, false)}>Save</Button>
                </Modal.Footer>
            </Modal>

            <h1>{this.props.item.name}</h1>
            <p class="name">
                <b>{this.props.item.type}</b> column in <span className='app-link' onClick={() => this.openProject(this.props.item.project)}>{this.props.item.project}</span>
                <span style={{ padding: "0px 3px" }}>/</span>
                <span className='app-link' onClick={() => this.openDataset(this.props.item.project + ' | ' + this.props.item.dataset)}>{this.props.item.dataset}</span>
            </p>
            <div style={{ paddingTop: '10px' }}>
                <Tabs defaultActiveKey="definition" className="mb-3">
                    <Tab eventKey="definition" title="Definition" def>
                        {
                            this.props.item.definition.id == -1 &&
                            <div>
                                <Button variant="primary"
                                    onClick={() => this.newDef()}
                                >Add Definition</Button>{' '}
                            </div>
                        }
                        {
                            this.props.item.definition.id > 0 &&
                            <div>
                                <Button variant="primary"
                                    onClick={() => this.editDef()}
                                >Edit Definition</Button>{' '}
                                <div style={{ padding: '10px' }}>
                                    <Definition definition={this.state.selectedDef}></Definition>
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
            <h1>{this.props.item.id}</h1>
            <p>Dataset in <span className='app-link' onClick={() => this.openProject(this.props.item.project)}>{this.props.item.project}</span></p>
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
                                    <th>Definition</th>
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
                <td class="cellLink" onClick={() => this.openDataset(col)}>{col}</td>
            </tr>
        );

        return <Col>
            <h1>{this.props.item.name}</h1>
            <p>Dataiku Project<span style={{ paddingLeft: '4px' }}>
                <a href={Common.createProjectLink(this.props.item.projectKey)} target="_blank"><ArrowUpRightSquare size={20} />
                </a></span></p>

            <div class="tags">{tags}</div>
            <div style={{ paddingTop: '10px' }}>
                <Tabs defaultActiveKey="datasets" className="mb-3" id='project-tabs'>
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
                {/* <p>No Item to display...</p> */}
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