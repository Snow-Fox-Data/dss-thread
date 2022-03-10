import React, { Fragment } from "react";
import { Component } from 'react';
import { useEffect } from 'react';

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import eventBus from "./eventBus";

import { FaRedo } from 'react-icons/fa';
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import {
    Container,
    Col,
    Row,
    Spinner,
    Button
} from 'react-bootstrap';

import {
    BrowserRouter as Router,
    Switch,
    Route,
    Routes,
    Link
} from "react-router-dom";

import Common from "./common/common";
import DataikuItem from "./components/dataikuItem";

class App extends Component {

    constructor(props) {
        super(props)

        this.state = {
            dataiku: undefined,
            dataikuItem: null,
            filters: {
                columns: true,
                datasets: true,
                projects: true,                
            },
            isLoading: false,
            selectedItem: null,
            selectedItemType: null,
            searchResults: [],
            loading: true
        }
    }

    handleOnChange = (type) => {
        console.log("type == ");
        console.log(type);

        let tempFilters = this.state.filters;

        console.log("tempFilters == ");
        console.log(tempFilters);

        tempFilters[type] = !tempFilters[type];

        this.setState({ 
            filters: tempFilters
        });
    }

    loadItem = (item) => {
        this.setState({ loading: true });
        console.log('loadItem :: item == ');
        console.log(item);

        if (item.length > 0) {
            const requestOptions = {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            };

            fetch(window.getWebAppBackendUrl('load-item') + '?key=' + item[0].key, requestOptions)
                .then(res => res.json())
                .then((response) => {
                    console.log('response == ');
                    console.log(response);

                    this.setState({
                        loading: false,
                        selectedItem: response,
                        selectedItemType: item[0].type
                    });
                });
        }
    }

    search = (query) => {
        const requestOptions = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        };

        console.log("this.state.filters == ");
        console.log(this.state.filters);

        let types = "&types=";
        types += Object.entries(this.state.filters).map(([key, value]) => {
            console.log("key == " + key);
            console.log("value == " + value);
            console.log(value);
            console.log("(value == true) == ");
            console.log((value == true));
            if(value == true) {
                return key;
            }            
            return null;
        });

        console.log("types == " + types);
        // types = (types[types.length - 1] === ',') ? types.substring(0, types.length - 1) : types;
        // console.log("types == " + types);

        this.setState({ loading: true });
        fetch(window.getWebAppBackendUrl('search') + '?term=' + query, requestOptions)
            .then(res => res.json())
            .then((response) => {
                var p_list = [];
                Object.keys(response).forEach(function (results) {
                    p_list[p_list.length] = response[results];
                });

                this.setState({
                    searchResults: p_list
                });
                this.setState({ loading: false });
            });
    }

    componentDidMount() {
        window.$(document).ready(() => {
            this.setState({ dataiku: window.dataiku });
            this.setState({ rendered: true });
            this.setState({ loading: false });

            // eventBus.on("dataRefresh", (data) =>
            //     this.refreshData()
            // );

            eventBus.on("datasetSelected", (ds) =>
                this.loadItem([{
                    key: ds,
                    type: 'dataset'
                }])
            );

            eventBus.on("projectSelected", (proj) =>
                this.loadItem([{
                    key: proj,
                    type: 'project'
                }])
            );

            eventBus.on("columnSelected", (proj) =>
                this.loadItem([{
                    key: proj,
                    type: 'column'
                }])
            );

            // this.search('thread');
            // this.refreshData();
        });
    }

    rescan() {
        this.setState({ loading: true });
        fetch(window.getWebAppBackendUrl('scan'))
            .then(res => res.json())
            .then((response) => {
                this.setState({ loading: false });
            });
    }

    renderMenuItemChildren(option, props) {
        return <Fragment>
            {Common.getIconForDataikuItemType(option.type)}
            <span style={{ fontWeight: 'bold', paddingLeft: '4px' }}>Name: {option.name}</span>
            <span style={{ padding: '3px' }}>|</span>
            <span>Type: {option.type}</span>
            {option.type == 'dataset' || option.type == 'column' &&
                <span>
                    <span style={{ padding: '3px' }}>|</span>
                    <span>Project: {option.key.split('.')[0]}</span>
                </span>
            }
        </Fragment>;
    }

    render() {
        // <Router>
        //     <main>
        //       <nav>
        //         <ul>
        //           <li><Link to="/">Home</Link></li>
        //           <li><a href="/about">About</a></li>
        //           <li><a href="/contact">Contact</a></li>
        //         </ul>
        //       </nav>

        //         <Routes>
        //             <Route path="/" exact component={Home} />
        //         </Routes>
        //     </main>
        // </Router>

        const { filters, isLoading, searchResults, selectedItem, selectedItemType } = this.state;
        // const ref = React.createRef();
        const filterBy = () => true;

        this.dataikuItem = <DataikuItem item={selectedItem} type={selectedItemType} />;

        return (
            <Container style={{ paddingTop: '20px' }}>
                <Row style={{ paddingBottom: '10px' }}>
                    <Col><h1>Thread</h1></Col>
                    <Col style={{ textAlign: 'right' }}>
                        <FaRedo onClick={() => this.rescan()} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                    </Col>
                </Row>

                <Row>
                    <AsyncTypeahead
                        filterBy={filterBy}
                        id="async-search"
                        isLoading={isLoading}
                        labelKey="key"
                        minLength={3}
                        onChange={this.loadItem}
                        onSearch={this.search}
                        options={searchResults}
                        placeholder='Search'
                        renderMenuItemChildren={this.renderMenuItemChildren}
                    />
                </Row>

                <Row className="filter" style={{ marginTop: "0.5em" }}>
                    <Col xs={1}>
                        <h4>Filter By: </h4>
                    </Col>
                    {Object.entries(filters).map(([key, value]) => {
                        return (
                            <Col xs={1}>
                                <div className="filter-types" key={key}>
                                    <input
                                        type="checkbox"
                                        id={`filter-${key}`}
                                        name={key}
                                        value={key}
                                        checked={value}
                                        onChange={() => this.handleOnChange(key)}
                                        style={{ marginRight:  "1.0em" }}
                                    />
                                    <label htmlFor={`filter-${key}`}>{key}</label>
                                </div>
                            </Col>                                
                        );
                    })}
                </Row>

                <Row>
                    <div style={{ padding: '10px' }}>
                        {this.state.loading ?
                            <Spinner animation="border" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </Spinner>
                            : null}
                    </div>
                </Row>
                <Row>
                    {this.dataikuItem}
                </Row>
            </Container>
        );
    }
}

export default App;
