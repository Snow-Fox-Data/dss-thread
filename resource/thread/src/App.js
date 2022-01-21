import React, { Fragment } from "react";
import { Component } from 'react';
import { useEffect } from 'react';

import logo from './logo.svg';
import './App.css';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Form from 'react-bootstrap/Form'
import Col from 'react-bootstrap/Col';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Typeahead } from 'react-bootstrap-typeahead';
import eventBus from "./eventBus";
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Routes,
    Link
} from "react-router-dom";
import Dataset from './components/dataset.js';

class App extends Component {

    constructor(props) {
        super(props)

        this.state = {
            rendered: false,
            dataiku: undefined,
            isLoaded: false,
            project_list: [],
            full_ds_name: '',
            full_tree: {},
            selectedDataset: null
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

        fetch(window.getWebAppBackendUrl('dataset-details'), {
            method: 'POST', body: JSON.stringify({
                'dataset-name': ds_name
            })
        })
            .then(res => res.json())
            .then(
                (result) => {
                    alert(result)
                });
                
        // return p_ref.datasets.find(({ name }) => name === ds_name);

        // this.setState({
        //     selectedDataset: this.findDataset(full_tree, selected[0].id),
        //     full_ds_name: selected[0].id
        // })
    }

    refreshData = () => {
        fetch(window.getWebAppBackendUrl('get-projects'))
            .then(res => res.json())
            .then(
                (result) => {
                    var p_list = []
                    Object.keys(result).forEach(function (proj_name) {
                        for (var x = 0; x < result[proj_name].datasets.length; x++) {
                            var ds = result[proj_name].datasets[x];
                            p_list[p_list.length] = { id: proj_name + '.' + ds.name, label: ds.name + ' (' + proj_name + ')' };
                        }
                    });

                    this.setState({
                        isLoaded: true,
                        project_list: p_list,
                        full_tree: result
                    });
                });
    }

    componentDidMount() {
        window.$(document).ready(() => {
            this.setState({ dataiku: window.dataiku });
            this.setState({ rendered: true });

            eventBus.on("dataRefresh", (data) =>
                this.refreshData()
            );

            this.refreshData()
        }

        );
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
        const { isLoaded, project_list, full_tree, showDetail, selectedDataset, full_ds_name } = this.state;
        const ref = React.createRef();

        if (!isLoaded) {
            return <div>Scanning DSS...</div>;
        } else {
            if (selectedDataset == null) {
                return (
                    <Container style={{ paddingTop: '20px' }}>
                        <Row>
                            <Typeahead
                                ref={ref}
                                placeholder='Search for Dataset'
                                onChange={(selected) => {
                                    if (selected.length > 0) {
                                        this.findDataset(selected[0].id)
                                        ref.current.clear()
                                    };
                                }}
                                options={project_list}
                            />
                        </Row>
                    </Container>
                );
            }
            else {
                return (
                    <Container style={{ paddingTop: '20px' }}>
                        <Row>
                            <Typeahead
                                ref={ref}
                                placeholder='Search for Dataset'
                                onChange={(selected) => {
                                    if (selected.length > 0) {
                                        this.findDataset()
                                        ref.current.clear()
                                    };
                                }}
                                options={project_list}
                            />
                        </Row>
                        <Row>
                            <Dataset deets={selectedDataset} full_ds_name={full_ds_name}></Dataset>
                        </Row>
                    </Container>
                );
            }
        }
    }
}

export default App;
