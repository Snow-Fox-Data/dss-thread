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
                definition: true
            },
            currentUser: '',
            loading: true,
            openFilter: true,
            selectedItem: null,
            selectedItemType: null,
            searchResults: [],
        }
    }

    displayLogo() {
        return <image id="image0" width="70" height="69" x="0" y="0"
                    href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEYAAABFCAMAAADAZGAYAAAABGdBTUEAALGPC/xhBQAAACBjSFJN
                AAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAABp1BMVEX////+68L+14j/yF7/
                uUD+ry/+qSf+piT/qSj/ry/+uD7/xVv+1oX+6r/+6bv/ymT/riz/rCv/yGD+5rX+4aX+ukH+uD3+
                4J/+7Mb+vkn+vET/6r/+1YH+03r//ff/xFb+1ID+2Iv/wU//+e3/9uH/+e7/6bv+03v+tjn/8tb/
                9N7/tTf+46r+3pr+sjL/8NP/+vD/uDz/zWz/xl7/tDX+9uL+sTD+tjr/wVH+qyn/vUX+0Hb/9N3+
                2Ir/7sz/y2j/6Lj+4aP/u0X//vr+2pL+0nr/tDT/qij+1oT/+Ov/7cb+36D+037/ymb+46n/vkn+
                tzz+3pn+rCv/9uP/zGv/7MP/9Nz+5K3+6br+4KH+357+4aT/8M//xl3+5rP/+Oz/7s3+rSz++vH+
                vkj+0nj/xVn/6Ln/25X/rSz/9uL/y2n/wE3+4qb/wE//6r3/4aP/yGL+wE//+ev/ry7+qCf/46n+
                3Zn/1YD+z3T/yF//yGP+25T/2Yz+7cn/u0T+68H+2Iz//vn+sjP/+vL/5rX/szT+5K//9eH/znD/
                xFj/xVj/zm//5K18dJCaAAAAAWJLR0QAiAUdSAAAAAlwSFlzAAAASAAAAEgARslrPgAAAAd0SU1F
                B+YDHQQ0H9gx8XMAAAK4SURBVFjD7ZbnX9NQFIaPqFwtVRScuCqlrUJbsdWESEsligMVVw11oOLe
                4gYnLpx/tLlJmtxxsvjor++XpDnvfZrzntsmAC211FKolrQtXba8nZAVKxMdyVWLY6zuXEM4re3q
                jg1Zt54g2rAxFmTTZuKjni3RKVtJgLZFhGzfYZpTO1GlzFJvOgqlL0G/M5PNIcpmaG3X7nBK/4B1
                6/k81lC+YB2Ke8Iog3vtBaU0hoGyfdy3PwTT6yxQQJUpQ6A5ZweCKcPukkpOxlRH3NNaEOUgswSr
                V736aAAm4dk0HZHm1ZVDvpTDTAPqGCIGE7ANjzCuchYRG/vRQR/KKImlYyHDjqgBnHJc2COiCiJn
                HMWc4DyK9IPSRcxJFHMqrAt9QuU+n0YxZziPxsxZsW7vLGQ1znIOxbRznjJTKVMqVKSuziOUvqB+
                6ulMWb56AcGM+0OGjEyO9qPyTZFJBNMtLKXXDJqK3oACPaoN8c/jIoKZ5C3WwEt2snS1Zh7FcC4h
                mAbWTjNZbSxdGZKqlxHMlYBkp8xwkPJVBHPNN1kajmbBhGyuY/tmmvc0k6XhOElXhUndwDA3hUnZ
                yTrhKBM2jFUR3cW3+ElZY5mywzFhI9IeJrdRzB3JpxtghdOE1fn7uYti4J6wc5xwmrB6usJj7uOY
                B9yOcbabB7PH5ukhTuF/VTnMwQ38kQ8GHnMRBz+niOpHgSdsUz2IWMxTXwzMeK4CVmcevs/8KfD8
                hWszStL8Sc5wT18Gviq98jpXZYwO7sRfQ6DeOLZShiBy/0lnIUR125cvYJjmq9xMGAWgZhnBaCAy
                7Fe5uXAKwCx1vh1G1WE1HIUC8I4E6n00CsCHj/6QxKeoFFPz0zhES8aAmPqc/CJDlNTXeBSqb7Xv
                LKPYuRCfYevHQvVn16/fc3/a/vYvltHSf6l/CRGp1zHVdqcAAAAldEVYdGRhdGU6Y3JlYXRlADIw
                MjItMDMtMjlUMDE6NTI6MzErMDM6MDAapLGBAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDIyLTAzLTI5
                VDAxOjUyOjMxKzAzOjAwa/kJPQAAAABJRU5ErkJggg==" />;
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
            this.navToObject(item[0].key)
        }
    }

    loadItemByKey = (itemKey) => {
        const requestOptions = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        };

        // let obj_type = 'project';
        // let splitCt = (itemKey.split("|").length - 1);
        // if (splitCt == 1)
        //     obj_type = 'dataset';
        // else if (splitCt == 2)
        //     obj_type = 'column'

        fetch(window.getWebAppBackendUrl('load-item') + '?key=' + itemKey, requestOptions)
            .then(res => res.json())
            .then((response) => {
                console.log('response == ');
                console.log(response);

                this.setState({
                    loading: false,
                    selectedItem: response,
                    selectedItemType: response.object_type
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

                    this.setState({ 
                        dataiku: window.dataiku, 
                        currentUser: response['you_are'],
                        rendered: true,
                        loading: false
                    });

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
            this.setState({ "loading": true });
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
            {option.object_type == 'definition' &&
                <span>
                    <span style={{}}>Definition: </span>
                    <span style={{}}>{option.name}</span>
                </span>
            }
            {option.object_type == 'column' &&
                <span>
                    <span style={{}}>Project: </span>
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
                <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
                    <div class="container-fluid">
                        {/* <img src="../public/images/icon_thread.png" /> */}
                        {this.displayLogo()}
                        <a class="navbar-brand" style={{ fontWeight: "bold", fontSize: "27px" }}>Thread</a>
                        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                            <span class="navbar-toggler-icon"></span>
                        </button>
                        <div class="collapse navbar-collapse" id="navbarContent">
                            <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                                {/* <li class="nav-item">
                                    <a class="nav-link active" href="#">Home</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="#">Link</a>
                                </li> */}
                            </ul>
                            <ul class="navbar-nav">
                                <li style={{ padding: '12px' }}>
                                    <FaRedo onClick={() => this.rescan()} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link">{this.state.currentUser}</a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </nav>
                {/* <button class="btn btn-outline-success my-2 my-sm-0" type="submit">Search</button> */}
                {/* <Row>
                    <Col>
                        <div class="title-row"><h1>Thread</h1></div></Col>
                    <Col style={{ textAlign: 'right', paddingTop: '16px', 'paddingRight': '16px' }}>
                        <FaRedo onClick={() => this.rescan()} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                        <div>{this.state.currentUser}</div>
                    </Col>
                </Row> */}

                <Row>
                    <Col>
                        <div className="input-group" style={{ width: "100%" }}>
                            <AsyncTypeahead
                                filterBy={filterBy}
                                id="async-search"
                                delay={300}
                                // labelKey={option => {
                                //     return option.key.replaceAll('|', ' | ') + ' (' + option.name + ')'
                                // }
                                // }
                                labelKey="name"
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
