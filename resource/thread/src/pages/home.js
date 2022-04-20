import React, { Component, Fragment } from 'react';
import { Col, Row, Spinner, Card, Button, Table } from 'react-bootstrap';
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import { FaFilter } from 'react-icons/fa';
import Common from '../common/common';
import DataikuItem from '../components/dataikuItem';
import eventBus from '../eventBus';

class Home extends Component {

    constructor(props) {
        super(props);

        this.state = {
            dataiku: undefined,
            dataikuItem: null,
            dataikuItems: [],
            filters: {
                column: true,
                dataset: true,
                project: true,
                definition: true
            },
            errorMsg: '',
            currentUser: '',
            loading: true,
            openFilter: true,
            selectedItem: null,
            selectedItemType: null,
            searchResults: [],
            loggedIn: false,
            collectionStats: {},
            hashListenerAdded: false
        }
    }

    addHashListener() {
        if (!this.state.hashListenerAdded) {
            window.addEventListener("hashchange", () => this.navDeepLink());
            this.state.hashListenerAdded = true;
        }
    }

    componentDidMount() {

        eventBus.on("datasetSelected", (ds) => {
            this.navToObject(ds)
        });

        eventBus.on("definitionSelected", (ds) => {
            this.navToObject(ds)
        });

        eventBus.on("projectSelected", (proj) => {
            this.navToObject(proj)
        }
        );

        eventBus.on("columnSelected", (col) => {
            this.navToObject(col)
        }
        );

        eventBus.on("loading", (isLoading) =>
            this.setState({ "loading": isLoading })
        );

        // this gets fired by app.js
        eventBus.on('loggedIn', (response) => {
            this.setState({
                dataiku: window.dataiku,
                currentUser: response['you_are'],
                loading: false,
                loggedIn: true
            });
        });

        window.$(document).ready(() => {
            if (!this.navDeepLink())
                this.reloadDssStats();

            // this.addHashListener();
        });
    }

    reloadDssStats = (callback = null) => {
        fetch(window.getWebAppBackendUrl('dss-stats'))
            .then(res => res.json())
            .then((response) => {
                this.setState({
                    collectionStats: response.stats,
                    recents: eval(response.stats.recents),
                    loading: false
                });

                if (callback != null)
                    callback()
            });
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
        // Update Filters and store to state.
        let tempFilters = this.state.filters;
        tempFilters[type] = !tempFilters[type];
        this.setState({ filters: tempFilters });

        // Filter definitions after filter is updated.
        var p_list = this.filterDataikuItems(this.state.dataikuItems);
        this.setState({ searchResults: p_list });
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

        fetch(window.getWebAppBackendUrl('load-item') + '?key=' + itemKey, requestOptions)
            .then(res => res.json())
            .then((response) => {
                console.log('response == ');
                console.log(response);

                if (response.success) {
                    this.setState({
                        errorMsg: '',
                        loading: false,
                        selectedItem: response,
                        selectedItemType: response.object_type
                    });
                }
                else {
                    this.setState({
                        loading: false,
                        selectedItem: null,
                        errorMsg: 'There was a problem loading this object'
                    });
                }
            });
    }

    search = (term) => {
        const requestOptions = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        };

        let url = window.getWebAppBackendUrl('search') + '?term=' + term;
        // this.setState({ loading: true });
        fetch(url, requestOptions)
            .then(res => res.json())
            .then((response) => {
                var p_list = this.filterDataikuItems(response);
                this.setState({
                    dataikuItems: response,
                    searchResults: p_list,
                    // loading: false
                });
            });
    }

    navDeepLink() {
        let parts = window.top.location.href.split('#o=')

        if (parts.length > 1) {
            this.setState({ "loading": true });
            this.loadItemByKey(parts[1])

            return true;
        }
        else {
            this.reloadDssStats(() =>
                this.setState({
                    "selectedItem": null,
                    "dataikuItem": null,
                    "selectedItemType": null,
                    "errorMsg": ''
                }));
        }

        return false;
    }

    navToObject(obj) {
        let base_url = window.top.location.href.split('#')[0]
        window.top.location.href = base_url + "#o=" + encodeURIComponent(obj);
    }

    renderMenuItemChildren(option, props) {
        return <Fragment>

            <span style={{ paddingRight: '5px' }}>
                {Common.getIconForDataikuItemType(option.object_type, '13px')}
            </span>
            {option.object_type == 'definition' &&
                <span>
                    <span style={{}}>Definition: </span>
                    <span style={{}}>{option.description}</span>
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

    scanNewProjects = () => {
        const requestOptions = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        };

        let url = window.getWebAppBackendUrl('scan-new');
        this.setState({ loading: true });
        fetch(url, requestOptions)
            .then(res => res.json())
            .then((response) => {
                // alert(response)
                this.setState({ loading: false });

                if (response.length > 0)
                    this.reloadDssStats();
            });
    }

    collectionStats() {
        return <div style={{ padding: '20px' }}>
            <h1>Dataiku Instance Stats</h1>
            <Row style={{ paddingTop: '20px' }}>
                <Col>
                    <Card style={{ width: '15rem' }} >
                        <Card.Header>
                            Projects
                        </Card.Header>
                        <Card.Body>
                            <Card.Title>
                                <div style={{ fontSize: "50px", textAlign: "center" }}>
                                    {this.state.collectionStats.project_ct}
                                </div>
                            </Card.Title>
                        </Card.Body>
                    </Card>
                </Col><Col>
                    <Card style={{ width: '15rem' }} >
                        <Card.Header>
                            Datasets
                        </Card.Header>
                        <Card.Body>
                            <Card.Title>
                                <div style={{ fontSize: "50px", textAlign: "center" }}>{this.state.collectionStats.dataset_ct}
                                </div>
                            </Card.Title>
                        </Card.Body>
                    </Card>
                </Col>
                <Col>
                    <Card style={{ width: '15rem' }} >
                        <Card.Header>
                            Columns
                        </Card.Header>
                        <Card.Body>
                            <Card.Title>
                                <div style={{ fontSize: "50px", textAlign: "center" }}>{this.state.collectionStats.column_ct}
                                </div>
                            </Card.Title>
                        </Card.Body>
                    </Card>
                </Col>
                <Col>
                    <Card style={{ width: '15rem' }} >
                        <Card.Header>
                            Definitions
                        </Card.Header>
                        <Card.Body>
                            <Card.Title>
                                <div style={{ fontSize: "50px", textAlign: "center" }}>{this.state.collectionStats.definition_ct}
                                </div>
                            </Card.Title>
                        </Card.Body>
                    </Card>
                </Col>
            </Row >
            {this.state.recents != null &&
                <Row>
                    <Col style={{ paddingTop: '20px' }}>
                        <Row>
                            <Col>
                                <h3>Recent Projects</h3>
                            </Col>
                            <Col xs={1}>
                                <Button variant="secondary" size="sm" onClick={() => this.scanNewProjects()}>Scan for new Projects</Button>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <Table striped bordered hover>
                                    <thead>
                                        <tr>
                                            <th>
                                                Name
                                            </th>
                                            <th>
                                                Last Modified
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {this.state.recents.map((col) =>
                                            <tr>
                                                <td><span class="app-link" onClick={() => this.navToObject(col.key)}>{col.key}</span></td>
                                                <td>{new Date(col.last_modified).toDateString()}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            }
        </div>
    }

    render() {
        this.searchRef = React.createRef();

        const { filters, loading, openFilter, searchResults, selectedItem, selectedItemType } = this.state;
        const filterBy = () => true;

        this.dataikuItem = <DataikuItem item={selectedItem} object_type={selectedItemType} />;

        return (
            <>
                <Row>
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
                                <Col xs={3} md={2} lg={1}>
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

                {loading ?
                    <Row>
                        <div style={{ padding: '10px' }}>
                            <Spinner animation="border" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </Spinner>
                        </div>
                    </Row>
                    : null}

                {this.state.errorMsg.length > 0 ?
                    <Row>
                        <div style={{ padding: '20px' }}>
                            <h2>{this.state.errorMsg}</h2>
                        </div>
                    </Row>
                    : null}

                {(selectedItem == null && this.state.errorMsg.length == 0) &&
                    this.collectionStats()
                }
                <Row>
                    {!loading ? this.dataikuItem : null}
                </Row>
            </>
        );
    }
}

export default Home;