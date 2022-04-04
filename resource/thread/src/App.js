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
import logo from "./assets/images/icon_thread.png";
import Home from "./pages/home";
import Catalog from "./pages/catalog";

class App extends Component {
    static currentUrl = window.location.pathname;

    constructor(props) {
        super(props)

        this.state = {
            dataiku: undefined,
            dataikuItem: null,
            filters: {
                column: true,
                dataset: true,
                project: true,
                definition: true
            },
            currentUser: '',
            loading: true,
            openFilter: true,
            selectedItem: null,
            selectedItemType: null,
            searchResults: [],
            loggedIn: false
        }

        console.log("window.location.href == " + window.location.href);
        console.log("window.location == " + window.location);
        console.log("window.location.pathname == " + window.location.pathname);
    }

    // filterDataikuItems = (response) => {
    //     let types = this.formatQueryTypes();

    //     var p_list = [];
    //     Object.keys(response).forEach(function (results) {
    //         var dataikuItem = response[results];
    //         if (types.indexOf(dataikuItem.object_type.toString()) >= 0) {
    //             p_list[p_list.length] = dataikuItem;
    //         }
    //     });

    //     return p_list;
    // }

    // formatQueryTypes = () => {
    //     let types = [];
    //     Object.entries(this.state.filters).sort().map(([key, value]) => {
    //         if (value == true) {
    //             types[types.length] = key.toString();
    //         }
    //     });

    //     return types;
    // }

    // handleOnChange = (type) => {
    //     let tempFilters = this.state.filters;
    //     tempFilters[type] = !tempFilters[type];

    //     this.setState({
    //         filters: tempFilters
    //     });
    // }

    // loadItem = (item) => {
    //     this.setState({ loading: true });
    //     if (item.length > 0) {
    //         this.loadItemByKey(item[0].key)
    //         this.navToObject(item[0].key)
    //     }
    // }

    // loadItemByKey = (itemKey) => {
    //     const requestOptions = {
    //         method: 'GET',
    //         headers: { 'Content-Type': 'application/json' },
    //     };

    //     // let obj_type = 'project';
    //     // let splitCt = (itemKey.split("|").length - 1);
    //     // if (splitCt == 1)
    //     //     obj_type = 'dataset';
    //     // else if (splitCt == 2)
    //     //     obj_type = 'column'

    //     fetch(window.getWebAppBackendUrl('load-item') + '?key=' + itemKey, requestOptions)
    //         .then(res => res.json())
    //         .then((response) => {
    //             console.log('response == ');
    //             console.log(response);

    //             this.setState({
    //                 loading: false,
    //                 selectedItem: response,
    //                 selectedItemType: response.object_type
    //             });
    //         });
    // }

    // search = (term) => {
    //     const requestOptions = {
    //         method: 'GET',
    //         headers: { 'Content-Type': 'application/json' },
    //     };

    //     let url = window.getWebAppBackendUrl('search') + '?term=' + term;
    //     this.setState({ loading: true });
    //     fetch(url, requestOptions)
    //         .then(res => res.json())
    //         .then((response) => {
    //             var p_list = this.filterDataikuItems(response);

    //             this.setState({
    //                 searchResults: p_list,
    //                 loading: false
    //             });
    //         });
    // }

    componentDidMount() {

        window.$(document).ready(() => {

            fetch(window.getWebAppBackendUrl('get-user'))
                .then(res => res.json())
                .then((response) => {

                    if (response.status == 'ok') {

                        this.setState({
                            dataiku: window.dataiku,
                            currentUser: response['you_are'],
                            loading: false,
                            loggedIn: true
                        });

                        // this.navDeepLink();

                        // window.addEventListener("hashchange", () => this.navDeepLink());

                        // eventBus.on("datasetSelected", (ds) => {
                        //     this.loadItem([{
                        //         key: ds,
                        //         object_type: 'dataset'
                        //     }])

                        //     // clear the search bar
                        //     // this.searchRef.clear()
                        //     this.navToObject(ds)
                        // }
                        // );

                        // eventBus.on("definitionSelected", (ds) => {
                        //     this.loadItem([{
                        //         key: ds,
                        //         object_type: 'definition'
                        //     }])

                        //     // clear the search bar
                        //     // this.searchRef.clear()
                        //     this.navToObject(ds)
                        // }
                        // );


                        // eventBus.on("projectSelected", (proj) => {
                        //     this.loadItem([{
                        //         key: proj,
                        //         object_type: 'project'
                        //     }])

                        //     // clear the search bar
                        //     // this.searchRef.clear()
                        //     this.navToObject(proj)
                        // }
                        // );

                        // eventBus.on("columnSelected", (col) => {
                        //     this.loadItem([{
                        //         key: col,
                        //         object_type: 'column'
                        //     }])

                        //     // clear the search bar
                        //     // this.searchRef.clear()
                        //     this.navToObject(col)
                        // }
                        // );

                        eventBus.on("loading", (isLoading) =>
                            this.setState({ "loading": isLoading })
                        );
                    }
                    else
                        this.setState({
                            loading: false
                        })
                });

        });
    }

    // navDeepLink() {
    //     let parts = window.top.location.href.split('#o=')

    //     if (parts.length > 1) {
    //         this.setState({ "loading": true });
    //         this.loadItemByKey(parts[1])
    //     }
    // }

    // navToObject(obj) {
    //     let base_url = window.top.location.href.split('#')[0]
    //     window.top.location.href = base_url + "#o=" + obj
    // }

    rescan() {
        this.setState({ loading: true });
        fetch(window.getWebAppBackendUrl('scan'))
            .then(res => res.json())
            .then((response) => {
                this.setState({ loading: false });
            });
    }

    // renderMenuItemChildren(option, props) {
    //     return <Fragment>

    //         <span style={{ paddingRight: '5px' }}>
    //             {Common.getIconForDataikuItemType(option.object_type, '13px')}
    //         </span>
    //         {option.object_type == 'definition' &&
    //             <span>
    //                 <span style={{}}>Definition: </span>
    //                 <span style={{}}>{option.description}</span>
    //             </span>
    //         }
    //         {option.object_type == 'column' &&
    //             <span>
    //                 <span style={{}}>Project: </span>
    //                 <span style={{}}>{option.key.split('|')[0]}</span>

    //                 <span style={{ padding: '0px 4px' }}>|</span>

    //                 <span style={{}}>Dataset:</span>
    //                 <span style={{ padding: '0px 4px' }}>{option.key.split('|')[1]}</span>

    //                 <span style={{ padding: '0px 4px' }}>|</span>

    //                 <span>Column:</span><span style={{ fontWeight: 'bold', padding: '0px 4px' }}>{option.name}</span>
    //             </span>
    //         }
    //         {option.object_type == 'dataset' &&
    //             <span>
    //                 <span style={{}}>Project:</span>
    //                 <span style={{}}>{option.key.split('|')[0]}</span>

    //                 <span style={{ padding: '0px 4px' }}>|</span>

    //                 <span style={{}}>Dataset:</span>
    //                 <span style={{ padding: '0px 4px', fontWeight: 'bold' }}>{option.name}</span>
    //             </span>
    //         }
    //         {option.object_type == 'project' &&
    //             <span>
    //                 <span>Project: </span><span style={{ fontWeight: 'bold', padding: '0px 4px' }}>{option.name}</span>
    //             </span>
    //         }

    //     </Fragment >;
    // }

    // toggleFilter() {
    //     this.setState({ openFilter: !this.state.openFilter });
    // }

    render() {
        // this.searchRef = React.createRef();

        // const { filters, loading, openFilter, searchResults, selectedItem, selectedItemType } = this.state;
        // const filterBy = () => true;

        // this.dataikuItem = <DataikuItem item={selectedItem} object_type={selectedItemType} />;

        const { loading } = this.state;

        return (
            <Container style={{ paddingTop: '10px' }}>
                {!this.state.loggedIn &&
                    <div>Unauthorized</div>
                }
                <div hidden={!this.state.loggedIn}>
                    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
                        <div class="container-fluid">
                            <img src={logo} className="app-logo" alt="logo" />
                            <a class="navbar-brand" style={{ fontWeight: "bold", fontSize: "27px" }}>Thread</a>
                            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                                <span class="navbar-toggler-icon"></span>
                            </button>
                            <div class="collapse navbar-collapse" id="navbarContent">
                                <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                                    <li class="nav-item">
                                        <Link to={App.currentUrl}>Home</Link>
                                    </li>
                                    <li class="nav-item">
                                        <Link to={App.currentUrl + "/catalog"}>Catalog</Link>
                                    </li>
                                </ul>
                            </div>
                            <ul class="navbar-nav">
                                <li style={{ padding: '12px' }}>
                                    <FaRedo onClick={() => this.rescan()} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link">{this.state.currentUser}</a>
                                </li>
                            </ul>
                        </div>
                    </nav>

                    <Row>
                        <Routes>
                            <Route path={App.currentUrl} element={<Home />} />
                            <Route path={App.currentUrl + "/catalog"} element={<Catalog />} />
                        </Routes>
                    </Row>

                    {/* <Row>
                        <Col>
                            <div className="input-group" style={{ width: "100%" }}>
                                <AsyncTypeahead
                                    filterBy={filterBy}
                                    id="async-search"
                                    delay={300}
                                    labelKey="description"
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
                        : null} */}

                    <Row>
                        <div style={{ padding: '10px' }}>
                            {loading ?
                                <Spinner animation="border" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </Spinner>
                                : null}
                        </div>
                    </Row>

                    {/* <Row>
                        {!loading ? this.dataikuItem : null}
                    </Row>  */}
                </div>
            </Container>
        );
    }
}

export default App;
