import React, { Component, Fragment } from 'react';
import { Col, Row, Spinner, Card, Badge } from 'react-bootstrap';
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
            loggedIn: false,
            collectionStats: {}
        }
    }

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
                            loggedIn: true,
                            collectionStats: response.stats
                        });

                        this.navDeepLink();

                        window.addEventListener("hashchange", () => this.navDeepLink());

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

                        eventBus.on("definitionSelected", (ds) => {
                            this.loadItem([{
                                key: ds,
                                object_type: 'definition'
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
                    }
                    else
                        this.setState({
                            loading: false
                        })
                });

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

    navDeepLink() {
        let parts = window.top.location.href.split('#o=')

        if (parts.length > 1) {
            this.setState({ "loading": true });
            this.loadItemByKey(parts[1])
        }
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

                {loading ?
                    <Row>
                        <div style={{ padding: '10px' }}>
                            <Spinner animation="border" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </Spinner>
                        </div>
                    </Row>
                    : null}

                {selectedItem == null &&
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