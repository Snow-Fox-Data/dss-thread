import React, { Fragment } from "react";
import { Component } from 'react';
import { useEffect } from 'react';

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import eventBus from "./eventBus";

import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import {
    FaFilter,
    FaRedo
} from 'react-icons/fa';

import {
    Button,
    Container,
    Col,
    Row,
    Spinner,
} from 'react-bootstrap';
import InputGroup from "react-bootstrap/InputGroup";

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
                column: true,
                dataset: true,
                project: true,
            },
            loading: true,
            openFilter: true,
            selectedItem: null,
            selectedItemType: null,
            searchResults: [],
        }
    }

    filterDataikuItems = (response) => {
        let types = this.formatQueryTypes();

        var p_list = [];
        Object.keys(response).forEach(function (results) {
            var dataikuItem = response[results];
            if (types.indexOf(dataikuItem.type.toString()) >= 0) {
                p_list[p_list.length] = dataikuItem;

            }
        });

        return p_list;
    }

    formatQueryTypes = () => {
        let types = [];
        Object.entries(this.state.filters).map(([key, value]) => {
            if (value == true) {
                types[types.length] = key.toString();
            }
        });

        return types;
    }

    handleOnChange = (type) => {
        let tempFilters = this.state.filters;
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

    search = (term) => {
        const requestOptions = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        };

        let url = window.getWebAppBackendUrl('search') + '?term=' + term;
        this.setState({ loading: true });
        fetch(url, requestOptions)
            .then(res => res.json())
            .then((response) => {
                var p_list = this.filterDataikuItems(response);

                this.setState({
                    searchResults: p_list,
                    loading: false
                });
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

            eventBus.on("loading", (isLoading) =>
                this.setState({ "loading": isLoading })
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

    toggleFilter() {
        this.setState({ openFilter: !this.state.openFilter });
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

        const { filters, loading, openFilter, searchResults, selectedItem, selectedItemType } = this.state;
        const filterBy = () => true;

        this.dataikuItem = <DataikuItem item={selectedItem} type={selectedItemType} />;

        return (
            <Container style={{paddingTop: '20px', paddingTop: '20px' }}>
                <Row style={{ paddingBottom: '10px' }}>
                    <Col><h1>Thread</h1></Col>
                    <Col style={{ textAlign: 'right' }}>
                        <FaRedo onClick={() => this.rescan()} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                    </Col>
                </Row>

                <Row>
                    <Col>
                        <div className="input-group" style={{ width: "100%" }}>
                            <AsyncTypeahead
                                filterBy={filterBy}
                                id="async-search"
                                delay={300}
                                labelKey="key"
                                minLength={3}
                                onChange={this.loadItem}
                                onSearch={this.search}
                                options={searchResults}
                                placeholder='Search'
                                renderMenuItemChildren={this.renderMenuItemChildren}
                                style={{ width: "97.5%" }}
                            />
                            <div className="input-group-btn">
                                <FaFilter onClick={() => this.toggleFilter()} style={{
                                    backgroundColor: "#66a3ff",
                                    color: "#FFFFFF",
                                    cursor: 'pointer',
                                    height: '34px',
                                    padding: "8px",
                                    width: '34px'
                                }} />
                            </div>
                        </div>
                    </Col>
                </Row>

                {openFilter ?
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
                                            style={{ marginRight: "1.0em" }}
                                        />
                                        <label htmlFor={`filter-${key}`}>{key}s</label>
                                    </div>
                                </Col>
                            );
                        })}
                    </Row>
                    : null}

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
