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
import { FaTags, FaThumbsDown, FaThumbsUp, FaRedo } from "react-icons/fa";
import { ArrowRightSquare } from 'react-bootstrap-icons'
import Tag from "./tag"

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
        console.log('saveCol() :: ');

        let applyTo = this.state.applyToDataSets; // eval(this.state.tempSelDef.applied_to);
        applyTo.push(this.props.item.key);

        // de-dupe array
        applyTo = applyTo.filter(function (item, pos) {
            return applyTo.indexOf(item) == pos;
        })

        let val = '';
        if (this.state.tempSelDef.description != null)
            val = this.state.tempSelDef.description;

        if (val.length < 2 || this.state.tempSelDef.name.length < 2) {
            alert('Name and desription must be at least 2 characters');
            return;
        }

        var tagList = [];
        for (var x = 0; x < this.state.columnTags.length; x++) {
            tagList.push(this.state.columnTags[x].name);
        }

        console.log('tagList == ');
        console.log(tagList);

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
                    if (result.success) {
                        this.props.item.definition = result.value;
                        this.props.item.comment = result.value.description;

                        this.setState({
                            newDefModal: false
                        });
                    }
                    else {
                        alert(result.message);
                    }

                    eventBus.dispatch("loading", false);
                });
    };

    deleteDef() {
        if (window.confirm('Are you sure you\'d like to delete this definition?')) {
            const requestOptions = {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            };

            fetch(window.getWebAppBackendUrl('delete-definition?id=' + this.props.item.id), requestOptions)
                .then(res => res.json())
                .then(
                    (result) => {
                        // go back to the home page
                        window.location = window.location.origin + window.location.pathname.substr(0, window.location.pathname.indexOf('dss'));
                    });
        }
    }

    saveDef() {
        console.log('saveDef() :: ');
        let applyTo = eval(this.props.item.applied_to);

        var tagList = [];
        for (var x = 0; x < this.state.columnTags.length; x++) {
            tagList.push(this.state.columnTags[x].name);
        }

        console.log('tagList == ');
        console.log(tagList);

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
                "id": this.props.item.id,
                "tags": tagList
            })
        }

        eventBus.dispatch("loading", true);

        fetch(window.getWebAppBackendUrl('update-desc'), requestOptions)
            .then(res => res.json())
            .then(
                (result) => {
                    this.openDssObject(this.props.item.id)
                    // eventBus.dispatch("reloadItem", this.props.item.id);
                });
    };

    buildLineage() {
        return <Row>
            <Lineage deets={this.props.item} parentid={this.props.parentid} full_ds_name={this.props.item.key} type={this.props.object_type}></Lineage>
        </Row>
    }

    buildTagsString(arrayTags, variant = "primary", link = true) {
        if (arrayTags == null)
            return;

        let tags = [];

        arrayTags.forEach(element => {
            if (link) {
                tags[tags.length] = <Button onClick={() => this.openDssObject(element)} style={{ marginRight: '6px', marginBottom: '5px' }} variant={variant} >
                    <span style={{ paddingRight: '4px' }}>{element}</span><ArrowUpRightSquare />
                </Button>
            }
            else
                tags[tags.length] = <Tag tag={element}></Tag>
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

    tagListToObj(tagList) {
        if (tagList == null || tagList.length == 0)
            return [];

        var tags = [];
        for (var x = 0; x < tagList.length; x++) {
            tags.push({ id: x, name: tagList[x] })
        }

        return tags
    }

    // componentWillUnmount() {
    //     console.log('componentWillUnmount() :: ');
    //     eventBus.remove("columnSelected", this);
    //     eventBus.remove("datasetSelected", this);
    //     eventBus.remove("definitionSelected", this);
    //     eventBus.remove("projectSelected", this);
    // }

    componentDidMount() {
        switch (this.props.object_type) {
            case 'column':
                var tags = this.tagListToObj(eval(this.props.item.tag_list));
                this.setState({
                    columnTagSuggestions: tags
                })
                break;
            case 'definition':
                var tagsArr = this.tagListToObj(eval(this.props.item.tags));
                var tagsListArr = this.tagListToObj(eval(this.props.item.tag_list));

                this.setState({
                    columnTags: tagsArr,
                    columnTagSuggestions: tagsListArr
                })
                break;
        }
    }

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
        let tags = this.tagListToObj(eval(this.props.item.definition.tags));
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

    openDssObject(obj) {
        eventBus.dispatch('navToObject', { obj: obj, id: this.props.parentid })
    }

    defSearch = (term) => {
        if (term.length > 1) {
            const requestOptions = {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            };

            let url = window.getWebAppBackendUrl('def-search') + '?term=' + term;
            this.setState({ loading: true });
            fetch(url, requestOptions)
                .then(res => res.json())
                .then((response) => {
                    this.setState({
                        defSearchResults: response
                    });
                });
        }
    }

    renderDefSearchMenuItem(option, props) {
        return <Fragment>
            <div style={{ fontWeight: 'bold' }}>{option.name}</div>
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

        if (this.state.tempSelDef.id > -1) {
            app_to = eval(this.state.tempSelDef.applied_to);
        }
        else {
            if (this.props.item.definition.id > -1) {
                app_to = eval(this.props.item.definition.applied_to);
            }
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

    createDocPctCard(total_cols, documented_cols) {
        var pct = 0;
        var bg = "secondary";

        if (documented_cols > 0) {
            pct = ((documented_cols / total_cols) * 100).toFixed(0);

            bg = "secondary";
            if (pct > 80)
                bg = "success";
            else {
                if (pct < 40)
                    bg = "danger"
            }
        }

        return <Card style={{ width: '15rem' }} className="float-end">
            <Card.Header>
                Documentation Status
            </Card.Header>
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
                        {documented_cols} / {total_cols} columns
                    </div>
                </Card.Text>
            </Card.Body>
        </Card>
    }

    onDefTagDelete = (i) => {
        const _columnTags = this.state.columnTags.slice(0)
        _columnTags.splice(i, 1)
        this.setState({ columnTags: _columnTags })
    }

    onDefTagAddition = (tag) => {
        console.log('dataiku :: onDefTagAddition() :: tag' + tag);
        if (!this.state.columnTags.some(e => e.name === tag.name)) {
            const _columnTags = [].concat(this.state.columnTags, tag)
            this.setState({ columnTags: _columnTags })
        }
        console.log('State == ');
        console.log(this.state);
    }

    scanProject = () => {
        const requestOptions = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        };

        let url = window.getWebAppBackendUrl('scan-project') + '?key=' + this.props.item.projectKey;

        // eventBus.dispatch("scanning", true);
        eventBus.dispatch("loading", true);

        fetch(url, requestOptions)
            .then(res => res.json())
            .then((response) => {
                // eventBus.dispatch("scanning", false);
                eventBus.dispatch("loading", false);
                this.openDssObject(this.props.item.projectKey)
                // this.openDssObject(this.props.item.projectKey)
            });
    }

    renderColumn() {
        const filterBy = () => true;
        const { defSearchResults } = this.state;

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
        let refs = {};
        if (this.state.tempSelDef.id > -1) {
            applieds = eval(this.state.tempSelDef.applied_to); // applying an existing definition

        } else {
            if (this.props.item.definition.id > -1) {
                applieds = eval(this.props.item.definition.applied_to)
            }
        }

        if (this.props.item.lineage_downstream != null) {
            let down_flat = this.flattenArray(this.props.item, 'lineage_downstream')
            down_flat.map((type) => {
                if (!applieds.includes(type))
                    downstreams.push(type)
            });
        }

        if (this.props.item.lineage_upstream != null) {
            let up_flat = this.flattenArray(this.props.item, 'lineage_upstream')
            up_flat.map((type) => {
                if (!applieds.includes(type))
                    upstreams.push(type)
            });
        }

        applieds.map((type) => (
            refs['ap-' + type] = React.createRef()
        ));
        downstreams.map((type) => (
            refs['dl-' + type] = React.createRef()
        ));
        upstreams.map((type) => (
            refs['ul-' + type] = React.createRef()
        ));

        const selectAll = (all) => {
            var checked = false;
            if (all) {
                checked = true;

                var allArr = applieds.concat(upstreams);
                allArr = allArr.concat(downstreams);

                this.state.applyToDataSets = allArr;
            }
            else
                this.state.applyToDataSets = [this.props.item.key];

            for (const key in refs) {
                refs[key].current.checked = checked;
            }
        }

        return <Col>
            <Modal size="lg" show={this.state.applyLineageModal} animation={false} onHide={() => this.cancelLineageSave()}>
                <Modal.Header closeButton>
                    <Modal.Title>Apply Definition To Lineage</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Container>
                        <div style={{ paddingBottom: '10px' }}>Select the up and downstream datasets to apply this definition</div>

                        {/* <Button onClick={()=>selectAllLineage()}>Select All</Button> */}

                        <span style={{ fontWeight: 'bold' }}>This Column</span>
                        <Form.Check className='lineage-check' disabled='true' checked='true' type='switch' id='this-cb' label={this.props.item.name}></Form.Check>

                        <span class="app-link" onClick={() => selectAll(true)}>All</span>&nbsp;|&nbsp;<span class="app-link" onClick={() => selectAll(false)}>None</span><br />
                        {upstreams.length > 0 &&
                            <span style={{ fontWeight: 'bold' }}>Upstream</span>
                        }
                        {upstreams.map((type) => (
                            <Form.Check ref={refs['ul-' + type]} className='lineage-check' type='switch' onChange={handleLineageCheck} id={'ul-' + type} label={type}></Form.Check>
                        ))}
                        {downstreams.length > 0 &&
                            <span style={{ fontWeight: 'bold' }}>Downstream</span>
                        }
                        {downstreams.map((type) => (
                            <Form.Check ref={refs['dl-' + type]} className='lineage-check' type='switch' onChange={handleLineageCheck} id={'dl-' + type} label={type}></Form.Check>
                        ))}

                        {(applieds.length > 0) &&
                            <div>
                                <span style={{ fontWeight: 'bold' }}>Currently Applied</span>
                                {applieds.map((type) => (
                                    <Form.Check ref={refs['ap-' + type]} className='lineage-check' type='switch' defaultChecked='true' onChange={handleLineageCheck} id={'ap-' + type} label={type}></Form.Check>
                                ))}
                            </div>
                        }
                    </Container>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="info" onClick={() => this.cancelLineageSave()}>&lt; Edit Definition</Button>
                    <Button variant="primary" style={{ marginBottom: '5px' }} onClick={() => this.saveCol()}>Apply</Button>
                </Modal.Footer>
            </Modal>
            <Modal size="xl" show={this.state.newDefModal} animation={false} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Apply Definition to column {this.props.item.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Container>
                        <Row>
                            <Col>
                                {!this.state.newDefSelected &&
                                    <div>
                                        <AsyncTypeahead
                                            // filterBy={filterBy}
                                            delay="300"
                                            id="def-search"
                                            labelKey="search_def"
                                            // filterBy={['name', 'description']}
                                            minLength={3}
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
                                                {this.state.tempSelDef.id == -1 &&
                                                    <h3>New Definition</h3>
                                                }
                                                <Form.Label>Name</Form.Label>
                                                <Form.Control type="text" defaultValue={this.state.tempSelDef.name}
                                                    onChange={e => this.state.tempSelDef.name = e.target.value}
                                                />
                                                <Form.Text className="text-muted">
                                                    Changing this name does not change the dataset column name
                                                </Form.Text>
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
                                                            onDelete={(i) => this.onDefTagDelete(i)}
                                                            onAddition={(tag) => this.onDefTagAddition(tag)} />
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
                            <Button variant="link" onClick={() => this.toggleNew(false)}>Search for Definition</Button>
                        }
                        {!this.state.newDefSelected &&
                            <Button variant="link" onClick={() => this.toggleNew(true)}>Exit Search</Button>
                        }
                    </Col>
                    <Col ms-auto>
                        <Button variant="info" onClick={() => this.showLineageSelection()}>Select Applied Datasets &gt;</Button>

                    </Col>
                </Modal.Footer>
            </Modal>
            <Row>
                <Col xs="auto">
                    <div class="icon">
                        {Common.getIconForDataikuItemType(this.props.object_type, "80px")}
                    </div>

                </Col>
                <div class="col" style={{ wordBreak: 'break-word' }}>
                    <h1>{this.props.item.name}</h1>
                    <p class="name">
                        <b>{this.props.item.type}</b> column in <span className='app-link' onClick={() => this.openDssObject(this.props.item.project)}>{this.props.item.project}</span>
                        <span style={{ padding: "0px 3px" }}>|</span>
                        <span className='app-link' onClick={() => this.openDssObject(this.props.item.project + '|' + this.props.item.dataset)}>{this.props.item.dataset}</span>
                    </p>
                </div>
                <Col sm={4}>
                    <div className="float-end">
                        <Card>
                            <Card.Header>
                                Documentation Status
                            </Card.Header>
                            <Card.Body style={{ fontSize: '22px', textAlign: 'center' }}>
                                {(this.props.item.comment != null && this.props.item.comment.length > 0) &&
                                    <Badge bg="success" >
                                        <div><FaThumbsUp></FaThumbsUp>
                                            <span style={{ paddingLeft: '4px' }}>Documented</span>
                                        </div>
                                    </Badge>
                                }
                                {((this.props.item.comment == null || this.props.item.comment.length == 0) && this.props.item.definition.id == -1) &&
                                    <Badge bg="danger">
                                        <div>
                                            Undocumented
                                        </div>
                                    </Badge>
                                }
                            </Card.Body>
                        </Card>
                    </div>

                    <div class="options-button">
                        <Dropdown>
                            <Dropdown.Toggle
                                variant="outline-secondary">
                                Options
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                                <Dropdown.Item href={Common.createDatasetLink(this.props.item.project, this.props.item.dataset)} target="_blank">Open Dataset in new Tab</Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                </Col>
            </Row>
            <Row>
                <div style={{ paddingTop: '10px' }}>
                    <Tabs defaultActiveKey="definition" className="mb-3" onSelect={tabClicked}>
                        <Tab eventKey="definition" title="Definition" def>
                            {
                                (this.props.item.definition.id == -1) &&
                                <div>
                                    <Button variant="primary"
                                        disabled={!this.props.item.user_security}
                                        onClick={() => this.newDef()}
                                    >{(this.props.item.comment != null && this.props.item.comment.length > 0) ?
                                        <span>Create Definition from Column Description</span>
                                        :
                                        <span>
                                            Add Definition
                                        </span>
                                        }
                                    </Button>{' '}
                                    {(this.props.item.comment != null && this.props.item.comment.length > 0) &&
                                        <div style={{ padding: '10px' }}>
                                            <h5>Column Description</h5>
                                            {this.props.item.comment}
                                        </div>
                                    }
                                </div>
                            }
                            {
                                (this.props.item.definition.id > 0 && this.props.item.user_security) &&
                                <div>
                                    <Button variant="primary"
                                        onClick={() => this.editDef()}
                                    >Edit Definition</Button>{' '}
                                    <div style={{ paddingTop: '10px' }}>
                                        <Definition definition={this.props.item.definition}></Definition>
                                    </div>
                                </div>
                            }
                        </Tab>
                        {/* <Tab eventKey="lineage" title="Lineage" def>
                            {
                                this.state.isLineageVisible &&
                                <div class="lineage" id="lineage-container">{lineage}</div>
                            }
                        </Tab> */}
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
                        {Common.getIconForDataikuItemType(this.props.object_type, '80px')}
                    </div>

                </Col>
                <Col>
                    <h1>{this.props.item.name}</h1>
                    <p class="name">
                        Definition
                    </p>
                </Col>
                <Col sm={4}>
                    <div class="options-button">
                        <Dropdown>
                            <Dropdown.Toggle
                                variant="outline-secondary">
                                Options
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                                <Dropdown.Item onClick={() => this.deleteDef()}>Delete</Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                </Col>
            </Row>
            <Row style={{ paddingTop: '15px' }}>
                <Col>
                    <Tabs defaultActiveKey="details">
                        <Tab eventKey="details" title="Details" def>
                            <div>
                                <Form style={{ paddingTop: '10px' }}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Name</Form.Label>
                                        <Form.Control type="text" defaultValue={this.props.item.name}
                                            onChange={e => this.props.item.name = e.target.value}
                                        />
                                        <div style={{ padding: "10px 0px" }}>
                                            <Form.Label>Tags</Form.Label>
                                            <ReactTags
                                                tags={this.state.columnTags}
                                                allowNew='true'
                                                minQueryLength='1'
                                                suggestions={this.state.columnTagSuggestions}
                                                onDelete={(i) => this.onDefTagDelete(i)}
                                                onAddition={(tag) => this.onDefTagAddition(tag)}
                                            // onAddition={(tag) => this.onDefTagAddition.bind(this)} 
                                            />
                                        </div>

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
                        </Tab>
                    </Tabs>
                </Col>
            </Row>
        </Col>
    }

    renderDataset() {
        let tags = this.buildTagsString(this.props.item.meta.tags, 'light', false);
        let lineage = this.buildLineage();

        var listItems = this.props.item.schema.map((col) =>
            //onClick={() => this.openDssObject(col.key)}
            <tr>
                <td>
                    {Common.getIconForDataikuItemType('column', "16px")}
                    <span className='app-link' style={{ marginLeft: '10px' }} onClick={() => this.openDssObject(col.key)}>{col.name}</span>
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
                        {Common.getIconForDataikuItemType(this.props.object_type, "80px")}
                    </div>

                </Col>
                <div class="col" style={{ wordBreak: 'break-word' }}>
                    <h1>{this.props.item.id}</h1>

                    <p><span style={{ fontWeight: 'bold' }}>{this.props.item.ds_type}</span> Dataset in <span className='app-link' onClick={() => this.openDssObject(this.props.item.project)}>{this.props.item.project}</span></p>
                    <div class="tags">{tags}</div>
                </div>
                <Col sm={4}>
                    {this.createDocPctCard(this.props.item.total_cols, this.props.item.total_cols_def)}
                    <div class="options-button">
                        <Dropdown>
                            <Dropdown.Toggle
                                variant="outline-secondary">
                                Options
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                                <Dropdown.Item href={Common.createDatasetLink(this.props.item.project, this.props.item.id)} target="_blank">Open Dataset in new Tab</Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
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

    renderProject() {
        let tags = this.buildTagsString(this.props.item.tags, 'light', false);
        let dataSetRows = this.props.item.datasets.map((col) =>
            <tr>
                <td>{Common.getIconForDataikuItemType('dataset', "16px")}
                    <span class="app-link" style={{ marginLeft: '10px' }} onClick={() => this.openDssObject(col.key)}>{col.key.split('|')[1]}</span></td>
                <td>
                    {col.documented_columns} / {col.total_columns}
                    {(col.total_columns > 0) &&
                        <span>
                            &nbsp;({((col.documented_columns / col.total_columns) * 100).toFixed(0)}%)
                        </span>
                    }
                </td>
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
                        {Common.getIconForDataikuItemType(this.props.object_type, '80px')}
                    </div>

                </Col>
                <Col>
                    <h1>{this.props.item.name} <span style={{ paddingLeft: "6px", paddingBottom: "2px" }}>

                    </span>
                    </h1>
                    <h4>({this.props.item.projectKey})</h4>
                    {/* <span><FaRedo onClick={() => this.scanProject()} style={{ width: '20px', height: '20px', cursor: 'pointer' }} /></span> */}
                    <p><span style={{ paddingLeft: '4px' }}>Project owned by <span style={{ fontWeight: "bold" }}>{this.props.item.ownerDisplayName}</span> in <span style={{ fontWeight: "bold" }}>{this.props.item.folder}</span> folder</span></p>
                    <div class="tags">{tags}</div>

                </Col>
                <Col sm={4}>
                    {this.createDocPctCard(this.props.item.total_cols, this.props.item.total_cols_def)}
                    {this.props.item.user_security &&
                        <div class='options-button'>
                            <Dropdown>
                                <Dropdown.Toggle
                                    variant="outline-secondary">
                                    Options
                                </Dropdown.Toggle>

                                <Dropdown.Menu>
                                    <Dropdown.Item href={Common.createProjectLink(this.props.item.projectKey)} target="_blank">Open Project in new Tab</Dropdown.Item>
                                    <Dropdown.Item onClick={() => this.scanProject()}>Rescan Project</Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </div>
                    }
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
                                        <th>Documentation Status</th>
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

export default (props) => (
    <DataikuItem
        {...props}
    />
);