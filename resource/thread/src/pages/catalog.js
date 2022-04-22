import React, { Component } from 'react';
import { Col, Row, Spinner, Table } from 'react-bootstrap';
import Common from '../common/common';
import { FaCaretDown, FaCaretUp, FaFilter, FaSearch } from 'react-icons/fa';
import App from '../App';
import { useNavigate } from 'react-router-dom';
import Tag from "../components/tag"
import eventBus from '../eventBus';

class Catalog extends Component {
    // These values NEED to match data KEYS for sorting to work
    static NAME = 'name';
    static DESCRIPTION = 'description';

    constructor(props) {
        super(props);

        this.state = {
            definitions: [],
            loading: false,
            searchBy: "",
            sortBy: {},
            tag: "",
            tags: [],
            title: "Catelog View"
        };
    }

    componentDidMount() {
        window.$(document).ready(() => {
            this.fetchDefinitions();
            this.fetchTags();
        });
    }

    displayTableHeaderCarets(columnHeader) {
        let sortBy = this.state.sortBy[columnHeader];
        if (sortBy === 'ASC') {
            return <span className="header-icons-container">
                <FaCaretUp style={{ color: "#000" }} />
            </span>;
        } else if (sortBy === 'DESC') {
            return <span className="header-icons-container">
                <FaCaretDown style={{ color: "#000" }} />
            </span>;
        } else {
            return <span className="header-icons-container">
                <FaCaretUp style={{ color: "#777" }} />
                <FaCaretDown style={{ color: "#777" }} />
            </span>;
        }
    }

    fetchDefinitions(term = "") {
        const requestOptions = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        };

        let url = window.getWebAppBackendUrl('def-search') + '?term=' + term;
        fetch(url, requestOptions)
            .then(res => res.json())
            .then((response) => {
                this.setState({ definitions: response });
                this.sortDefinitions(Catalog.NAME);
            });
    }

    fetchDefinitionsByTag(term = "") {
        const requestOptions = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        };

        let url = window.getWebAppBackendUrl('def-by-tag') + '?term=' + term;
        fetch(url, requestOptions)
            .then(res => res.json())
            .then((response) => {
                this.setState({ definitions: response });
                this.sortDefinitions(Catalog.NAME);
            });
    }

    fetchTags() {
        const requestOptions = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        };

        let url = window.getWebAppBackendUrl('tag-list');
        fetch(url, requestOptions)
            .then(res => res.json())
            .then((response) => {
                this.setState({
                    tags: response
                });
            });
    }

    formatAppliedTo(appliedTo) {
        appliedTo = JSON.parse(appliedTo);
        if (appliedTo != null && appliedTo.length > 0) {
            return appliedTo.length;
        } else {
            return <span>0</span>;
        }
    }

    formatTags(tags) {
        tags = JSON.parse(tags);
        if (tags != null && tags.length > 0) {
            let formattedTags = tags.map((tag) => {
                return <Tag onClick={event => this.onClickTag(tag)} tag={tag}></Tag>
                // <span className='definition-tag' onClick={event => this.onClickTag(tag)}>{tag}</span>;
            });

            return formattedTags;
        } else {
            return <span>{tags}</span>;
        }
    }

    onChangeTag(_tag) {
        this.fetchDefinitionsByTag(_tag);
        this.setState({ tag: _tag });
    }

    onClickTag(_tag) {
        this.fetchDefinitions(_tag);
        this.setState({ tag: _tag });
    }

    openDefinition(defKey) {
        // eventBus.dispatch('navToObject', { obj: defKey })
        this.props.navigate('dss/' + defKey, { replace: true });
    }

    sortDefinitions(sortBy) {
        let _definitions = this.state.definitions;
        let _sortBy = this.state.sortBy;

        let sortByKeys = Object.keys(_sortBy);
        if (sortByKeys.length > 0) {
            sortByKeys.map((item, index) => {
                if (item !== sortBy) { _sortBy[item] = null }
            });
        }

        if (_sortBy[sortBy] == null || _sortBy[sortBy] === 'DESC') {
            _definitions = _definitions.sort((a, b) => {
                var tempA = a; var tempB = b;
                if (tempA[sortBy].toLowerCase() === tempB[sortBy].toLowerCase()) return 0;
                return tempA[sortBy].toLowerCase() > tempB[sortBy].toLowerCase() ? 1 : -1;
            });

            _sortBy[sortBy] = 'ASC';
        } else {
            _definitions = _definitions.sort((a, b) => {
                var tempA = a; var tempB = b;
                if (tempA[sortBy].toLowerCase() === tempB[sortBy].toLowerCase()) return 0;
                return tempA[sortBy].toLowerCase() < tempB[sortBy].toLowerCase() ? 1 : -1;
            });

            _sortBy[sortBy] = 'DESC';
        }

        this.setState({
            definitions: _definitions,
            sortBy: _sortBy
        });
    }

    renderDefinitions() {
        if (this.state.definitions.length > 0) {
            var listItems = this.state.definitions.map((col) =>
                <tr>
                    <td className='definition-name' onClick={() => this.openDefinition(col.id)}>
                        <span>{col.name}</span>
                    </td>
                    <td>
                        {col.description}
                    </td>
                    {/* <td>
                        {this.formatAppliedTo(col.applied_to)}
                    </td> */}
                    <td>
                        {this.formatTags(col.tags)}
                    </td>
                </tr>
            );

            return listItems;
        } else {
            return <tr>
                <td colSpan={3} className="text-center">
                    <span>No results for your search</span>
                </td>
            </tr>;
        }
    }

    renderTagSelect() {
        if (this.state.tags.length > 0) {
            var tags = this.state.tags.map((tag) =>
                <option value={tag}>{tag}</option>
            );

            return <div className='search-bar'>
                <div className="input-group">
                    <span className="input-group-addon input-group-text" style={{ width: "auto" }}>
                        <div style={{ display: "block" }}>
                            <FaFilter style={{
                                color: "#000",
                                height: '21px',
                                width: '21px'
                            }} />
                        </div>
                    </span>

                    <select class="form-control" onChange={event => this.onChangeTag(event.target.value)} value={this.state.tag}>
                        <option value={""}>Filter By Tag</option>
                        {tags}
                    </select>
                </div>
            </div>;
        } else {
            return <div>
                <select class="form-control">
                    <option value="">No tags found</option>
                </select>
            </div>;
        }
    }

    render() {
        // console.log('render() :: STATE == ');
        // console.log(this.state);
        const { loading, searchBy } = this.state;

        return <Col>
            {loading ?
                <Row>
                    <div style={{ padding: '10px' }}>
                        <Spinner animation="border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </Spinner>
                    </div>
                </Row>
                : null}
            <Row>
                <Col md={6}>
                    <div>
                        <h2>{Common.getIconForDataikuItemType('definition', "24px")}<span style={{ paddingLeft: '8px' }}>Definitions</span></h2>
                    </div>
                </Col>
                <Col>
                    {this.renderTagSelect()}
                </Col>
                <Col>
                    <div className='search-bar'>
                        <div className="input-group">
                            <span className="input-group-addon input-group-text" style={{ width: "auto" }}>
                                <div style={{ display: "block" }}>
                                    <FaSearch style={{
                                        color: "#000",
                                        height: '21px',
                                        width: '21px'
                                    }} />
                                </div>
                            </span>

                            <input className="form-control" placeholder="Search Definitions"
                                onChange={event => this.fetchDefinitions(event.target.value)}
                                type="text" value={searchBy} />
                        </div>
                    </div>
                </Col>
            </Row>
            <Row>
                <Col>
                    <div className='table-definitions table-responsive'>
                        <Table striped bordered hover>
                            <thead>
                                <tr>
                                    <th onClick={() => this.sortDefinitions(Catalog.NAME)}>
                                        Name
                                        {this.displayTableHeaderCarets(Catalog.NAME)}
                                    </th>
                                    <th onClick={() => this.sortDefinitions(Catalog.DESCRIPTION)}>
                                        Description
                                        {this.displayTableHeaderCarets(Catalog.DESCRIPTION)}
                                    </th>
                                    {/* <th>Applied To</th> */}
                                    <th>Tags</th>
                                </tr>
                            </thead>
                            <tbody>
                                {this.renderDefinitions()}
                            </tbody>
                        </Table>
                    </div>
                </Col>
            </Row>
        </Col>
    }
}

// export default Catalog;

export default (props) => (
    <Catalog
        {...props}
        navigate={useNavigate()}
    />
);