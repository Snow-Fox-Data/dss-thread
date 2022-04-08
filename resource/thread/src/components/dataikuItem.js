import React, { Component, Fragment, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import Common from "../common/common";
import Table from 'react-bootstrap/Table';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import { Modal, Button, Form, Card, Dropdown, Badge } from "react-bootstrap";
import eventBus from "../eventBus";
import { ArrowUpRightSquare, ThermometerSnow } from 'react-bootstrap-icons'
import Lineage from "./lineage";
import Definition from "./definition"
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import { FaTags } from "react-icons/fa";

const ReactTags = require('react-tag-autocomplete')

class DataikuItem extends Component {
    constructor(props) {
        super(props);

        this.state = {
            lineage: null,
            newDefModal: false,
            tempSelDef: {
            },
            newDefSelected: true,
            defSearchResults: [],
            isLineageVisible: false,
            applyLineageModal: false,
            applyToDataSets: [],
            dssSrc: '',
            columnTags: [],
            columnTagSuggestions: [
            ]
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

    saveCol() {
        let applyTo = this.state.applyToDataSets; // eval(this.state.tempSelDef.applied_to);
        applyTo.push(this.props.item.key);

        // de-dupe array
        applyTo = applyTo.filter(function (item, pos) {
            return applyTo.indexOf(item) == pos;
        })

        let val = '';
        if (this.state.tempSelDef.description != null)
            val = this.state.tempSelDef.description;

        if (val.length < 4 || this.state.tempSelDef.name.length < 4) {
            alert('Name and desription must be at least 4 characters');
            return;
        }

        var tagList = [];
        for (var x = 0; x < this.state.columnTags.length; x++) {
            tagList.push(this.state.columnTags[x].name);
        }

        const requestOptions = {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "name": this.state.tempSelDef.name,
                "description": val,
                "applied_to": applyTo,
                "id": this.state.tempSelDef.id,
                "column_key": this.props.item.key,
                "tags": tagList
            })
        }

        eventBus.dispatch("loading", true);

        fetch(window.getWebAppBackendUrl('update-desc'), requestOptions)
            .then(res => res.json())
            .then(
                (result) => {
                    this.props.item.definition = result.value;

                    this.setState({
                        newDefModal: false
                    });

                    eventBus.dispatch("loading", false);
                });
    };

    saveDef() {
        let applyTo = eval(this.props.item.applied_to);

        const requestOptions = {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "name": this.props.item.name,
                "description": this.props.item.description,
                "applied_to": applyTo,
                "id": this.props.item.id
            })
        }

        eventBus.dispatch("loading", true);

        fetch(window.getWebAppBackendUrl('update-desc'), requestOptions)
            .then(res => res.json())
            .then(
                (result) => {
                    this.props.item.definition = result.value;

                    this.setState({
                        newDefModal: false
                    });

                    eventBus.dispatch("loading", false);
                });
    };

    buildLineage() {
        return <Row>
            <Lineage deets={this.props.item} full_ds_name={this.props.item.key} type={this.props.object_type}></Lineage>
        </Row>
    }

    buildTagsString(arrayTags, variant = "primary", link = true) {
        if (arrayTags == null)
            return;

        let tags = [];

        arrayTags.forEach(element => {
            if (link) {
                tags[tags.length] = <Button onClick={() => this.openDataset(element)} style={{ marginRight: '6px', marginBottom: '5px' }} variant={variant} size="sm">
                    {element}
                </Button>
            }
            else
                tags[tags.length] = <Button style={{ marginRight: '6px', marginBottom: '5px' }} variant={variant} size="sm">
                    <FaTags></FaTags><span style={{ paddingLeft: '4px' }}>{element}</span>
                </Button>

        });

        return tags;
    }

    openExternalProject(key) {
        alert(key)
    }

    renderItemDetailsByType() {
        switch (this.props.object_type) {
            case 'dataset':
                return this.renderDataset();
            case 'project':
                return this.renderProject();
            case 'column':
                return this.renderColumn();
            case 'definition':
                return this.renderDefinition();
        }
    }

    componentDidMount() {
        switch (this.props.object_type) {
            case 'column':
                var tags = [];
                for (var x = 0; x < this.props.item.tag_list.length; x++) {
                    tags.push({ id: x, name: this.props.item.tag_list[x] })
                }
                this.setState({
                    columnTagSuggestions: tags
                })
                break;
            case 'definition':
                break;
        }
    }

    // componentDidUpdate(prevProps, prevState) {
    //     console.log('component update!')
    //     if (this.props.object_type == 'column') {
    //         if (prevProps.item == null && this.props.item != null) {
    //             this.props.item.applied_to = eval(this.props.item.applied_to);
    //             this.resetSelectedDef();
    //         } else {
    //             if ((prevProps.item != null && this.props.item != null) && (prevProps.item.id != this.props.item.id)) {
    //                 this.props.item.applied_to = eval(this.props.item.applied_to);
    //                 this.resetSelectedDef();
    //             }
    //         }
    //     }
    // }

    newDef() {
        this.setState({
            newDefModal: true,
            tempSelDef: {
                applied_to: [],
                description: this.props.item.comment,
                name: this.props.item.name,
                id: -1
            },
            columnTags: []
        });
    }

    editDef() {

        let tags = [];
        let tag_def = eval(this.props.item.definition.tags);
        for (var x = 0; x < tag_def.length; x++) {
            tags.push({ id: x, name: tag_def[x] })
        }
        this.setState({
            tempSelDef: {
                name: this.props.item.definition.name,
                description: this.props.item.definition.description,
                id: this.props.item.definition.id,
                applied_to: this.props.item.definition.applied_to
            },
            columnTags: tags,
            newDefModal: true
        })
    }

    openColumn(col) {
        eventBus.dispatch("columnSelected", col);
    };

    openDataset(ds) {
        eventBus.dispatch("datasetSelected", ds);
    }

    openDefinition(definition) {
        eventBus.dispatch("definitionSelected", definition);
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
            <div style={{ fontWeight: 'bold' }}>{option.name} ({option.id})</div>
            <div>{option.description}</div>
        </Fragment>;
    }

    cancelLineageSave() {
        this.setState({
            applyLineageModal: false,
            newDefModal: true
        })
    }

    showLineageSelection() {
        let app_to = [];
        let tags = [];
        if (this.props.item.definition.id > -1) {
            app_to = eval(this.props.item.definition.applied_to);
        }
        this.setState({
            applyLineageModal: true,
            newDefModal: false,
            applyToDataSets: app_to
        })
    }

    selectDef = (item) => {
        this.setState({
            tempSelDef: item[0],
            newDefSelected: true
        })
    }

    toggleNew = (isNew) => {
        this.setState({
            newDefSelected: isNew
        })

        if (isNew) {
            this.setState({
                tempSelDef: {
                    name: this.props.item.name,
                    description: this.props.item.comment,
                    applied_to: [],
                    id: -1,
                    tags: []
                }
            })
        }
        else {
            this.setState({
                tempSelDef: {
                    name: this.props.item.definition.name,
                    applied_to: this.props.item.definition.applied_to,
                    description: this.props.item.definition.description,
                    id: this.props.item.definition.id,
                    tags: this.props.item.definition.tags
                },
            })
        }
    }

    renderColumn() {
        const filterBy = () => true;
        const { defSearchResults } = this.state;

        const onDelete = (i) => {
            const columnTags = this.state.columnTags.slice(0)
            columnTags.splice(i, 1)
            this.setState({ columnTags })
        }

        const onAddition = (tag) => {
            if (!this.state.columnTags.some(e => e.name === tag.name)) {
                const columnTags = [].concat(this.state.columnTags, tag)
                this.setState({ columnTags })
            }
        }

        let lineage = this.buildLineage();
        const handleClose = () => this.setState({ newDefModal: false });
        const tabClicked = (e) => {
            if (e == 'flow')
                this.setState({
                    'dssSrc': Common.createDatasetLink(this.props.item.project, this.props.item.dataset)
                });

            this.setState({ isLineageVisible: (e === "lineage") })
        };
        const handleLineageCheck = (e) => {
            var cb = e.target;
            // var upstream = cb.id.indexOf('ul') > -1;
            if (cb.checked) {
                this.state.applyToDataSets.push(cb.id.substr(3));
            }
            else {
                this.state.applyToDataSets = this.state.applyToDataSets.filter(item => item == cb.id.substr(3));
            }
        }

        let downstreams = [];
        let upstreams = [];
        let applieds = [];
        if (this.props.item.definition.id > -1) {
            applieds = eval(this.props.item.definition.applied_to)
        }

        let down_flat = this.flattenArray(this.props.item, 'lineage_downstream')
        down_flat.map((type) => {
            if (!applieds.includes(type))
                downstreams.push(type)
        });

        let up_flat = this.flattenArray(this.props.item, 'lineage_upstream')
        up_flat.map((type) => {
            if (!applieds.includes(type))
                upstreams.push(type)
        });

        return <Col>
            <Modal size="lg" show={this.state.applyLineageModal} animation={false} onHide={() => this.cancelLineageSave()}>
                <Modal.Header closeButton>
                    <Modal.Title>Apply Definition To Lineage</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Container>
                        <div style={{ paddingBottom: '10px' }}>Select the up and downstream datasets to apply this definition</div>
                        <span style={{ fontWeight: 'bold' }}>This Column</span>
                        <Form.Check className='lineage-check' disabled='true' checked='true' type='switch' id='this-cb' label={this.props.item.name}></Form.Check>

                        {upstreams.length > 0 &&
                            <span style={{ fontWeight: 'bold' }}>Upstream</span>
                        }
                        {upstreams.map((type) => (
                            <Form.Check className='lineage-check' type='switch' onChange={handleLineageCheck} id={'ul-' + type} label={type}></Form.Check>
                        ))}
                        {downstreams.length > 0 &&
                            <span style={{ fontWeight: 'bold' }}>Downstream</span>
                        }
                        {downstreams.map((type) => (
                            <Form.Check className='lineage-check' type='switch' onChange={handleLineageCheck} id={'dl-' + type} label={type}></Form.Check>
                        ))}

                        {(this.props.item.definition != null && this.props.item.definition.id > -1) &&
                            <div>
                                {eval(this.props.item.definition.applied_to).length > 0 &&
                                    <span style={{ fontWeight: 'bold' }}>Currently Applied</span>
                                }
                                {eval(this.props.item.definition.applied_to).map((type) => (
                                    <Form.Check className='lineage-check' type='switch' checked='true' onChange={handleLineageCheck} id={'dl-' + type} label={type}></Form.Check>
                                ))}
                            </div>
                        }
                    </Container>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={() => this.cancelLineageSave()}>Cancel</Button>
                    <Button variant="primary" onClick={() => this.saveCol()}>Apply</Button>
                </Modal.Footer>
            </Modal>
            <Modal size="xl" show={this.state.newDefModal} animation={false} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Apply Definition</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Container>
                        <Row>
                            <Col>
                                {!this.state.newDefSelected &&
                                    <div>
                                        <AsyncTypeahead
                                            // filterBy={filterBy}
                                            id="def-search"
                                            labelKey="search_def"
                                            filterBy={['name', 'description']}
                                            minLength={2}
                                            onChange={this.selectDef}
                                            onSearch={this.defSearch}
                                            options={defSearchResults}
                                            placeholder='Search for existing Definition'
                                            renderMenuItemChildren={this.renderDefSearchMenuItem}
                                        />
                                    </div>
                                }
                                {this.state.newDefSelected &&
                                    <div>
                                        <Form style={{ paddingTop: '10px' }}>
                                            <Form.Group className="mb-3">
                                                {/* {this.state.tempSelDef.id > -1 &&
                                                    <div style={{ padding: "10px 0px" }}>
                                                        <Form.Label>Definition ID</Form.Label>
                                                        <Form.Control disabled="true" type="text" defaultValue={this.state.tempSelDef.id}></Form.Control>
                                                    </div>
                                                } */}
                                                {this.state.tempSelDef.id == -1 &&
                                                    <h3>New Definition</h3>
                                                }
                                                <Form.Label>Name</Form.Label>
                                                <Form.Control type="text" defaultValue={this.state.tempSelDef.name}
                                                    onChange={e => this.state.tempSelDef.name = e.target.value}
                                                />
                                                {(this.state.tempSelDef.applied_to != null && this.state.tempSelDef.applied_to.length > 0) &&
                                                    <div style={{ padding: "10px 0px" }}>
                                                        <Form.Label>Applied To</Form.Label>
                                                        <div>
                                                            {this.buildTagsString(eval(this.state.tempSelDef.applied_to), 'light')}
                                                        </div>
                                                    </div>
                                                }
                                                <div>
                                                    <Form.Label>Tags</Form.Label>
                                                    <div>
                                                        <ReactTags
                                                            tags={this.state.columnTags}
                                                            allowNew='true'
                                                            minQueryLength='1'
                                                            suggestions={this.state.columnTagSuggestions}
                                                            onDelete={(i) => onDelete(i)}
                                                            onAddition={(tag) => onAddition(tag)} />
                                                    </div>
                                                </div>
                                                <div style={{ padding: "10px 0px" }}>
                                                    <Form.Label>Description</Form.Label>
                                                    <Form.Control as="textarea" rows="3" defaultValue={this.state.tempSelDef.description}
                                                        onChange={e => this.state.tempSelDef.description = e.target.value}
                                                    />
                                                    <Form.Text className="text-muted">
                                                        Will appear in the Dataiku Dataset's column description.
                                                    </Form.Text>
                                                </div>
                                            </Form.Group>
                                        </Form>
                                    </div>
                                }
                            </Col>

                        </Row>
                    </Container>
                </Modal.Body>
                <Modal.Footer>
                    <Col style={{ textAlign: "left" }}>
                        <Button disabled={this.state.tempSelDef.id == -1} variant="link" onClick={() => this.toggleNew(true)}>New</Button>

                        {this.state.newDefSelected &&
                            <Button variant="link" onClick={() => this.toggleNew(false)}>Search</Button>
                        }
                        {!this.state.newDefSelected &&
                            <Button variant="link" onClick={() => this.toggleNew(true)}>Exit Search</Button>
                        }
                    </Col>
                    <Col ms-auto>
                        {this.state.tempSelDef.id != -1 &&
                            <div>
                                <Button variant="secondary" onClick={() => this.showLineageSelection()}>Save and apply to Lineage</Button>
                                <Button onClick={() => this.saveCol()}>Save Definition</Button>
                            </div>
                        }
                        {this.state.tempSelDef.id == -1 &&
                            <Dropdown >
                                <Dropdown.Toggle id="dropdown-basic">
                                    Save and Apply
                                </Dropdown.Toggle>

                                <Dropdown.Menu>
                                    <Dropdown.Item onClick={() => this.saveCol()}>Save and Apply to column: {this.props.item.name}</Dropdown.Item>
                                    <Dropdown.Item onClick={() => this.showLineageSelection()}>Save and apply to Lineage</Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        }
                    </Col>
                </Modal.Footer>
            </Modal>
            <Row>
                <Col xs="auto">
                    <div class="icon">
                        {Common.getIconForDataikuItemType(this.props.object_type, "100%")}
                    </div>
                </Col>
                <Col>
                    <h1>{this.props.item.name}<a style={{ marginLeft: "10px" }} href={Common.createDatasetLink(this.props.item.project, this.props.item.dataset)} target="_blank"><ArrowUpRightSquare size={22} /></a></h1>
                    <p class="name">
                        <b>{this.props.item.type}</b> column in <span className='app-link' onClick={() => this.openProject(this.props.item.project)}>{this.props.item.project}</span>
                        <span style={{ padding: "0px 3px" }}>|</span>
                        <span className='app-link' onClick={() => this.openDataset(this.props.item.project + '|' + this.props.item.dataset)}>{this.props.item.dataset}</span>
                    </p>
                </Col>
                <Col>
                    <div className="float-end">
                        {(this.props.item.comment != null && this.props.item.comment.length > 0) &&
                            <Badge bg="success">
                                <div style={{ fontSize: "30px" }}>Documented
                                </div>
                            </Badge>
                        }
                        {((this.props.item.comment == null || this.props.item.comment.length == 0) && this.props.item.definition.id == -1) &&
                            <Badge bg="danger">
                                <div style={{ fontSize: "30px" }}>Undocumented
                                </div>
                            </Badge>
                        }
                    </div>
                </Col>
            </Row>
            <Row>
                <div style={{ paddingTop: '10px' }}>
                    <Tabs defaultActiveKey="definition" className="mb-3" onSelect={tabClicked}>
                        <Tab eventKey="definition" title="Definition" def>
                            {
                                this.props.item.definition.id == -1 &&
                                <div>
                                    <Button variant="primary"
                                        onClick={() => this.newDef()}
                                    >Add Definition</Button>{' '}
                                    <div style={{ padding: '10px' }}>
                                        {this.props.item.comment}
                                    </div>
                                </div>
                            }
                            {
                                this.props.item.definition.id > 0 &&
                                <div>
                                    <Button variant="primary"
                                        onClick={() => this.editDef()}
                                    >Edit Definition</Button>{' '}
                                    <div style={{ padding: '10px' }}>
                                        <Definition definition={this.props.item.definition}></Definition>
                                    </div>
                                </div>
                            }
                        </Tab>
                        <Tab eventKey="lineage" title="Lineage" def>
                            {
                                this.state.isLineageVisible &&
                                <div class="lineage" id="lineage-container">{lineage}</div>
                            }
                        </Tab>
                        <Tab eventKey='flow' title="DSS" def>
                            <iframe style={{ width: '100%', height: '500px' }} src={this.state.dssSrc} ></iframe>
                        </Tab>
                    </Tabs>
                </div>
            </Row>
        </Col>
    }

    renderDefinition() {
        return <Col>
            <Row>
                <Col xs="auto">
                    <div class="icon">
                        {Common.getIconForDataikuItemType(this.props.object_type, "100%")}
                    </div>
                </Col>
                <Col>
                    <h1>{this.props.item.name}</h1>
                    <p class="name">
                        Definition
                    </p>
                </Col>
            </Row>
            <Row>
                <Col>
                    <div>
                        <Form style={{ paddingTop: '10px' }}>
                            <Form.Group className="mb-3">
                                <Form.Label>Name</Form.Label>
                                <Form.Control type="text" defaultValue={this.props.item.name}
                                    onChange={e => this.props.item.name = e.target.value}
                                />
                                {(this.props.item.applied_to != null && this.props.item.applied_to.length > 0) &&
                                    <div style={{ padding: "10px 0px" }}>
                                        <Form.Label>Applied To</Form.Label>
                                        <div>
                                            {this.buildTagsString(eval(this.props.item.applied_to), 'light')}
                                        </div>
                                    </div>
                                }
                                <Form.Label>Description</Form.Label>
                                <Form.Control as="textarea" rows="3" defaultValue={this.props.item.description}
                                    onChange={e => this.props.item.description = e.target.value}
                                />
                                <Form.Text className="text-muted">
                                    Will appear in the Dataiku Dataset's column description.
                                </Form.Text>
                            </Form.Group>
                            <Button variant="primary" onClick={() => this.saveDef()}>Save</Button>

                        </Form>
                    </div>
                </Col>
            </Row>
        </Col>
    }

    renderDataset() {
        let tags = this.buildTagsString(this.props.item.meta.tags, 'light', false);
        let lineage = this.buildLineage();

        var listItems = this.props.item.schema.map((col) =>
            //onClick={() => this.openColumn(col.key)}
            <tr>
                <td>
                    {Common.getIconForDataikuItemType('column', "16px")}
                    <span className='app-link' style={{ marginLeft: '10px' }} onClick={() => this.openColumn(col.key)}>{col.name}</span>
                </td>
                <td>{col.type}</td>
                <td>
                    {col.comment}
                </td>
            </tr>
        );

        const tabClicked = (e) => {
            if (e == 'flow')
                this.setState({
                    'dssSrc': Common.createDatasetLink(this.props.item.project, this.props.item.id)
                });

            this.setState({ isLineageVisible: (e === "lineage") })
        };

        return <Col>
            <Row>
                <Col xs="auto">
                    <div class="icon">
                        {Common.getIconForDataikuItemType(this.props.object_type, "100%")}
                    </div>
                </Col>
                <Col>
                    <h1>{this.props.item.id}<span style={{ paddingLeft: "6px", paddingBottom: "2px" }}><a href={Common.createDatasetLink(this.props.item.project, this.props.item.id)} target="_blank"><ArrowUpRightSquare size={22} /></a></span></h1>

                    <p>Dataset in <span className='app-link' onClick={() => this.openProject(this.props.item.project)}>{this.props.item.project}</span></p>
                    <div class="tags">{tags}</div>
                </Col>
                <Col>
                    {this.createDocPctCard(this.props.item.total_cols, this.props.item.total_cols_def)}
                </Col>
            </Row>

            <Row style={{ paddingTop: '20px' }}>
                <Tabs defaultActiveKey="columns" id="uncontrolled-tab-example" className="mb-3" onSelect={tabClicked}>
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
                    <Tab eventKey="lineage" title="Lineage">
                        {
                            this.state.isLineageVisible &&
                            <div class="lineage" id="lineage-container">{lineage}</div>
                        }
                    </Tab>
                    <Tab eventKey='flow' title="DSS" def>
                        <iframe style={{ width: '100%', height: '500px' }} src={this.state.dssSrc} ></iframe>
                    </Tab>
                </Tabs>
            </Row>
        </Col>;
    }

    createDocPctCard(total_cols, documented_cols) {
        var pct = (documented_cols / total_cols).toFixed(2) * 100;

        var bg = "secondary";
        if (pct > 80)
            bg = "success";
        else {
            if (pct < 40)
                bg = "danger"
        }

        return <Card style={{ width: '16rem' }} className="float-end">
            <Card.Body>
                <Card.Title>
                    <div style={{ textAlign: "center" }}>
                        <Badge bg={bg}>
                            <div style={{ fontSize: "50px" }}>{pct}%
                            </div>
                        </Badge>
                    </div>
                </Card.Title>
                <Card.Text>
                    <div style={{ textAlign: "center", fontSize: "15px" }}>
                        {documented_cols} / {total_cols} columns<br />documented
                    </div>
                </Card.Text>
            </Card.Body>
        </Card>
    }

    renderProject() {
        let tags = this.buildTagsString(this.props.item.tags, 'light', false);
        let dataSetRows = this.props.item.datasets.map((col) =>
            <tr>
                <td>{Common.getIconForDataikuItemType('dataset', "16px")}
                    <span class="app-link" style={{ marginLeft: '10px' }} onClick={() => this.openDataset(col)}>{col.split('|')[1]}</span></td>
            </tr>
        );

        const tabSelected = (e) => {
            if (e == 'flow')
                this.setState({
                    'dssSrc': Common.createProjectLink(this.props.item.projectKey)
                });
        }

        return <Col>
            <Row>
                <Col xs="auto">
                    <div class="icon">
                        {Common.getIconForDataikuItemType(this.props.object_type, "100%")}
                    </div>
                </Col>
                <Col>
                    <h1>{this.props.item.name} ({this.props.item.projectKey})<span style={{ paddingLeft: "6px", paddingBottom: "2px" }}>
                        <a href={Common.createProjectLink(this.props.item.projectKey)} target="_blank"><ArrowUpRightSquare size={22} /></a>
                    </span>
                    </h1>
                    <p>Project<span style={{ paddingLeft: '4px' }}>
                        in <span style={{ fontWeight: "bold" }}>{this.props.item.folder}</span> folder</span></p>
                    <div class="tags">{tags}</div>
                </Col>
                <Col>
                    {this.createDocPctCard(this.props.item.total_cols, this.props.item.total_cols_def)}
                </Col>
            </Row>
            <Row>
                <div style={{ paddingTop: '10px' }}>
                    <Tabs defaultActiveKey="datasets" className="mb-3" id='project-tabs' onSelect={tabSelected}>
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
                        <Tab eventKey='flow' title="DSS" def>
                            <iframe style={{ width: '100%', height: '500px' }} src={this.state.dssSrc} ></iframe>
                        </Tab>
                    </Tabs>
                </div>
            </Row>
        </Col >;
    }

    render() {
        let item;
        let itemDetails = this.renderItemDetailsByType();
        if (this.props.item != null) {
            item = <Row className="align-items-start">
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