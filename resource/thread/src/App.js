import React, { Fragment } from "react";
import { Component } from 'react';
import { useEffect } from 'react';

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import {
    Button,
    Col,
    Container,
    Form,
    Row
} from 'react-bootstrap';

import {
    BrowserRouter as Router,
    Switch,
    Route,
    Routes,
    Link
} from "react-router-dom";

import logo from './logo.svg';
import eventBus from "./eventBus";

import Dataset from './components/dataset.js';
import Common from "./common/common";

class App extends Component {

    // JUST ADDING A COMMENT TO TEST WORKFLOW.
    constructor(props) {
        super(props)

        this.state = {
            rendered: false,
            dataiku: undefined,
            isLoaded: false,
            isLoading: false,
            project_list: [],
            full_ds_name: '',
            full_tree: {},
            selectedDataset: null,
            searchResults: []
        };

        this.project_list = []

        // This binding is necessary to make `this` work in the callback
        // this.handleClick = this.handleClick.bind(this);
    }

    // handleClick = () => {
    //     console.log('The link was clicked.');

    //     window.$.getJSON(window.getWebAppBackendUrl('initialize'), function (data) {
    //         const output = window.$('<pre />').text('Backend reply: ' + JSON.stringify(data));
    //         window.$('body').append(output)
    //     });

    // }

    findDataset = (key) => {
        var proj = key.split('.')[0];
        var ds_name = key.split('.')[1];

        // var p_ref = tree[proj];
        console.log(ds_name);

        var ds = this.state.full_tree[proj]['datasets'].find(element => element.name == ds_name);

        this.setState({
            selectedDataset: ds,
            full_ds_name: ds_name
        })

        // fetch(window.getWebAppBackendUrl('dataset-details'), {
        //     method: 'POST', body: JSON.stringify({
        //         'dataset-name': ds_name,
        //         'project': proj
        //     })
        // })
        //     .then(res => res.json())
        //     .then(
        //         (result) => {
        //             this.setState({
        // selectedDataset: result.dataset,
                //         full_ds_name: result.dataset_name
                //     })
                // });

        // return p_ref.datasets.find(({ name }) => name === ds_name);

        // this.setState({
        //     selectedDataset: this.findDataset(full_tree, selected[0].id),
        //     full_ds_name: selected[0].id
        // })
    }

    // refreshData = () => {
    //     fetch(window.getWebAppBackendUrl('get-projects'))
    //         .then(res => res.json())
    //         .then(
    //             (result) => {
    //                 var p_list = []
    //                 Object.keys(result).forEach(function (proj_name) {
    //                     for (var x = 0; x < result[proj_name].datasets.length; x++) {
    //                         var ds = result[proj_name].datasets[x];
    //                         p_list[p_list.length] = { id: proj_name + '.' + ds.name, label: ds.name + ' (' + proj_name + ')' };
    //                     }
    //                 });

    //                 this.setState({
    //                     isLoaded: true,
    //                     project_list: p_list,
    //                     full_tree: result
    //                 });
    //             });
    // }

    search = (query) => {
        const requestOptions = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        };

        fetch(window.getWebAppBackendUrl('search') + '?term=' + query, requestOptions)
            .then(res => res.json())
            .then(
                (reponse) => {
                    console.log('reponse == ');
                    console.log(reponse);

                    // var p_list = [];
                    // Object.keys(reponse.results).forEach(function (results) {
                    //     p_list[p_list.length] = reponse.results[results];
                    // });

                    var p_list = [
                        {
                            "type": "project",
                            "name": "whatever",
                            "short-description": "....",
                            "lineage-upstream": [],
                            "lineage-downstream": [],
                            "datasets": [],
                        }, {
                            "type": "dataset",
                            "name": "whatever",
                            "short-description": "....",
                            "lineage-upstream": [],
                            "lineage-downstream": [],
                            "columns": [],
                        }, {
                            "type": "column",
                            "name": "whatever",
                            "short-description": "....",
                            "lineage-upstream": [],
                            "lineage-downstream": [],
                            "definition": "my-definition",
                        }, {
                            "type": "definition",
                            "name": "whatever",
                            "columns": ["project.dataset5.col1", "project2.dataset2.col3"],
                            "tags": ["tag1", "tag2"],
                            "description": "This is the thing that does the stuff",
                            "sources": [],
                            "destinations": ["some powerbi report"]
                        }
                    ]

                    console.log('p_list :: ');
                    console.log(p_list);

                    this.setState({
                        searchResults: p_list                        
                        // isLoaded: true,
                        // project_list: p_list,
                        // full_tree: result
                    });
                });
    }

    componentDidMount() {
        window.$(document).ready(() => {
            this.setState({ dataiku: window.dataiku });
            this.setState({ rendered: true });

            // eventBus.on("dataRefresh", (data) =>
            //     this.refreshData()
            // );

            // eventBus.on("datasetSelected", (ds) =>
            //     this.findDataset(ds)
            // );

            // this.search('thread');
            // this.refreshData();
        });
    }

    renderMenuItemChildren(option, props) {
        console.log('option == ');
        console.log(option);
        console.log('props == ');
        console.log(props);

        // switch(option.type) {
        //     case "project":
        //         console.log('RENDER PROJECT');
        //         return <Fragment>      
        //             <span>Type: {option.type}; </span>
        //             <span>Name: {option.name}; </span>                                
        //         </Fragment>;

        //         // return MenuItemProject;
        //         // break;
        //     case "dataset":
        //         console.log('RENDER DATASET');
        //         break;
        //     case "column":
        //         console.log('RENDER COLUMN');
        //         break;
        //     case "definition":
        //         console.log('RENDER DEFINITION');
        //         break;
        //     default: 
        //         console.log('RENDER DEFAULT');
        //         return <Fragment>      
        //             <span>Type: {option.type}; </span>
        //             <span>Name: {option.name}; </span>                                
        //         </Fragment>;
        // }   

        // FaColumns, FaDatabase, FaList, FaProjectDiagram

        return <Fragment>
            {Common.getIconForObjectType(option.type)}
            <span style={{ marginLeft: '.5rem', marginRight: '.5rem' }}>Type: {option.type}; </span>
            <span>Name: {option.name}; </span>                                
        </Fragment>;
    }

    render() {
        //        <Router>
        //     <main>
        //       <nav>
        //         <ul>
        //           <li><Link to="/">Home</Link></li>
        //           <li><a href="/about">About</a></li>
        //           <li><a href="/contact">Contact</a></li>
        //         </ul>
        //       </nav>
        //             <Routes>
        //   <Route path="/" exact component={Home} />
        //             </Routes>
        //     </main>
        // </Router>
        // )
        const { isLoaded, isLoading, project_list, full_tree, showDetail, selectedDataset, full_ds_name, searchResults } = this.state;
        const ref = React.createRef();
        const filterBy = () => true;

        return (
            <Container style={{ paddingTop: '20px' }}>
                <Row>
                    <AsyncTypeahead
                        filterBy={filterBy}
                        id="async-search"
                        isLoading={isLoading}
                        labelKey="name"
                        minLength={3}
                        onSearch={this.search}
                        options={searchResults}
                        placeholder='Search for Dataset'
                        renderMenuItemChildren={this.renderMenuItemChildren}
                    />                    
                </Row>
            </Container>
        );

        // renderMenuItemChildren={(option, props) => (                                   
        //     <Fragment>      
        //         <span>Type: {option.type}; </span>
        //         <span>Name: {option.name}; </span>                                
        //     </Fragment>
        // )}

        // if (!isLoaded) {
        //     return <div>Scanning DSS...</div>;
        // } else {
        //     if (selectedDataset == null) {
        //         return (
        //             <Container style={{ paddingTop: '20px' }}>
        //                 <Row>
        //                     <Typeahead
        //                         ref={ref}
        //                         placeholder='Search for Dataset'
        //                         onChange={(selected) => {
        //                             if (selected.length > 0) {
        //                                 this.findDataset(selected[0].id)
        //                                 ref.current.clear()
        //                             };
        //                         }}
        //                         options={project_list}
        //                     />
        //                 </Row>
        //             </Container>
        //         );
        //     }
        //     else {
        //         return (
        //             <Container style={{ paddingTop: '20px' }}>
        //                 <Row>
        //                     <Typeahead
        //                         ref={ref}
        //                         placeholder='Search for Dataset'
        //                         onChange={(selected) => {
        //                             if (selected.length > 0) {
        //                                 this.findDataset(selected[0].id)
        //                                 ref.current.clear()
        //                             };
        //                         }}
        //                         options={project_list}
        //                     />
        //                 </Row>
        //                 <Row>
        //                     <Dataset deets={selectedDataset} full_ds_name={full_ds_name}></Dataset>
        //                 </Row>
        //             </Container>
        //         );
        //     }
        // }
    }
}

export default App;
