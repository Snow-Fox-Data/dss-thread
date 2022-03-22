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
            currentUser: '',
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
            if (types.indexOf(dataikuItem.object_type.toString()) >= 0) {
                p_list[p_list.length] = dataikuItem;

            }
        });

        return p_list;
    }

    formatQueryTypes = () => {
        let types = [];
        Object.entries(this.state.filters).sort().map(([key, value]) => {
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
        if (item.length > 0) {
            this.loadItemByKey(item[0].key)
        }
    }

    loadItemByKey = (itemKey) => {
        const requestOptions = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        };

        let obj_type = 'project';
        let splitCt = (itemKey.split("|").length - 1);
        if (splitCt == 1)
            obj_type = 'dataset';
        else if (splitCt == 2)
            obj_type = 'column'

        fetch(window.getWebAppBackendUrl('load-item') + '?key=' + itemKey, requestOptions)
            .then(res => res.json())
            .then((response) => {
                console.log('response == ');
                console.log(response);

                this.setState({
                    loading: false,
                    selectedItem: response,
                    selectedItemType: obj_type
                });
            });
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

            fetch(window.getWebAppBackendUrl('get-user'))
                .then(res => res.json())
                .then((response) => {

                    this.setState({ dataiku: window.dataiku, currentUser: response['you_are'] });
                    this.setState({ rendered: true });
                    this.setState({ loading: false });

                    this.navDeepLink();

                    eventBus.on("datasetSelected", (ds) => {
                        this.loadItem([{
                            key: ds,
                            object_type: 'dataset'
                        }])

                        // clear the search bar
                        // this.searchRef.clear()
                        this.navToObject(ds)
                    }
                    );

                    eventBus.on("projectSelected", (proj) => {
                        this.loadItem([{
                            key: proj,
                            object_type: 'project'
                        }])

                        // clear the search bar
                        // this.searchRef.clear()
                        this.navToObject(proj)
                    }
                    );

                    eventBus.on("columnSelected", (col) => {
                        this.loadItem([{
                            key: col,
                            object_type: 'column'
                        }])

                        // clear the search bar
                        // this.searchRef.clear()
                        this.navToObject(col)
                    }
                    );

                    eventBus.on("loading", (isLoading) =>
                        this.setState({ "loading": isLoading })
                    );
                });
        });
    }

    navDeepLink() {
        let parts = window.top.location.href.split('#o=')

        if (parts.length > 1) {
            this.loadItemByKey(parts[1])
        }
    }

    navToObject(obj) {
        let base_url = window.top.location.href.split('#')[0]
        window.top.location.href = base_url + "#o=" + obj
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

            <span style={{ paddingRight: '5px' }}>
                {Common.getIconForDataikuItemType(option.object_type, '13px')}
            </span>
            {option.object_type == 'column' &&
                <span>
                    <span style={{}}>Project:</span>
                    <span style={{}}>{option.key.split('|')[0]}</span>

                    <span style={{ padding: '0px 4px' }}>|</span>

                    <span style={{}}>Dataset:</span>
                    <span style={{ padding: '0px 4px' }}>{option.key.split('|')[1]}</span>

                    <span style={{ padding: '0px 4px' }}>|</span>

                    <span>Column:</span><span style={{ fontWeight: 'bold', padding: '0px 4px' }}>{option.name}</span>
                </span>
            }
            {option.object_type == 'dataset' &&
                <span>
                    <span style={{}}>Project:</span>
                    <span style={{}}>{option.key.split('|')[0]}</span>

                    <span style={{ padding: '0px 4px' }}>|</span>

                    <span style={{}}>Dataset:</span>
                    <span style={{ padding: '0px 4px', fontWeight: 'bold' }}>{option.name}</span>
                </span>
            }
            {option.object_type == 'project' &&
                <span>
                    <span>Project: </span><span style={{ fontWeight: 'bold', padding: '0px 4px' }}>{option.name}</span>
                </span>
            }

        </Fragment >;
    }

    toggleFilter() {
        this.setState({ openFilter: !this.state.openFilter });
    }

    render() {
        this.searchRef = React.createRef();

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

        this.dataikuItem = <DataikuItem item={selectedItem} object_type={selectedItemType} />;

        return (

            <Container style={{ paddingTop: '10px' }}>
                <nav class="navbar navbar-expand-lg navbar-light bg-light">
                    <a class="navbar-brand" href="#">Navbar</a>
                    <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                </nav>
                <Row>
                    <Col>
                        <div class="title-row"><h1>Thread</h1></div></Col>
                    <Col style={{ textAlign: 'right', paddingTop: '16px', 'paddingRight': '16px' }}>
                        <FaRedo onClick={() => this.rescan()} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                        <div>{this.state.currentUser}</div>
                    </Col>
                </Row>

                <Row>
                    <Col>
                        <div className="input-group" style={{ width: "100%" }}>
                            <AsyncTypeahead
                                filterBy={filterBy}
                                id="async-search"
                                delay={300}
                                labelKey={option => {
                                    return option.key.replaceAll('|', ' | ')
                                }
                                }
                                ref={this.searchRef}
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
                        {/* <Col xs={1}>
                            <h5>Filter By: </h5>
                        </Col> */}
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
                                            style={{ marginRight: "5px" }}
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
