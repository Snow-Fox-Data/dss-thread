import React, { Component } from "react";
import { Col, Container, Row } from "react-bootstrap";
import Common from "../common/common";
// import Dataset from "./dataset";
import Table from 'react-bootstrap/Table';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import eventBus from "../eventBus";
import { ArrowUpRightSquare } from 'react-bootstrap-icons'
import Lineage from "./lineage";

class DataikuItem extends Component {

    constructor(props) {
        super(props);

        this.state = {

        };
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
                        {this.props.item.comment}
                    </Tab>
                    <Tab eventKey="lineage" title="Lineage" def>
                        lineage here 
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
                    <a href={this.createDatasetLink(this.props.item.project, this.props.item.id)} target="_blank"><ArrowUpRightSquare size={20} />
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

    createProjectLink(projkey) {
        return '/projects/' + projkey + '/flow/';
    }

    createDatasetLink(projkey, ds) {
        return '/projects/' + projkey + '/datasets/' + ds + '/explore/';
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
                <a href={this.createProjectLink(this.props.item.projectKey)} target="_blank"><ArrowUpRightSquare size={20} />
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
            <div class="dataiku-item" style={{ paddingTop: '20px' }}>
                {item}
            </div>
        );
    }
}

export default DataikuItem;