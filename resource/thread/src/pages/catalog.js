import React, { Component } from 'react';
import { Col, Row, Spinner, Table } from 'react-bootstrap';
import Common from '../common/common';
import { FaCaretDown, FaCaretUp, FaSearch } from 'react-icons/fa';
import App from '../App';
import { useNavigate } from 'react-router-dom';

class Catalog extends Component {
    // These values NEED to match data KEYS for sorting to work
    static NAME = 'name';
    static DESCRIPTION = 'description';

    constructor(props) {
        super(props);

        this.state = {
            definitions: [],
            loading: false,
            sortBy: {},
            tags: [],
            title: "Catelog View"
        };
    }

    componentDidMount() {
        this.fetchDefinitions();
        this.fetchTags();
    }

    displayTableHeaderCarets(columnHeader) {
        let sortBy = this.state.sortBy[columnHeader];
        if(sortBy === 'ASC') {
            return <span className="header-icons-container">
                <FaCaretUp style={{ color: "#000" }} />
            </span>;
        } else if(sortBy === 'DESC') {
            return <span className="header-icons-container">
                <FaCaretDown style={{ color: "#000" }}  />
            </span>;
        } else {
            return <span className="header-icons-container">
                <FaCaretUp style={{ color: "#777" }} />
                <FaCaretDown style={{ color: "#777" }}  />
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
                this.setState({
                  definitions: response
                });
            });
    }

    fetchTags() {
        const requestOptions = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        };

        let url = window.getWebAppBackendUrl('def-search');
        fetch(url, requestOptions)
            .then(res => res.json())
            .then((response) => {
                console.log('response == ');
                console.log(response);
                // this.setState({
                //   tags: response
                // });
            });
    }

    formatAppliedTo(appliedTo) {    
        appliedTo = JSON.parse(appliedTo);
        if(appliedTo != null && appliedTo.length > 0) {
            let formattedAppliedTo = appliedTo.map((col) => {
                return <span>{col}<br/></span>;
            });
    
            return formattedAppliedTo;
        } else {
            return <span>{appliedTo}</span>;
        }
    }

    // import {browserHistory} from "react-router";

    // functionName() {
    // browserHistory.push("/path-to-link");
    // }

    openDefinition(defKey) {
    // https://dataiku.excelion.io/public-webapps/THREADDEMO/ROvQ0Y8/#o=83529576
      console.log("openDefinition(defKey) :: defKey == " + defKey);
      console.log("App.CURRENT_URL == " + App.CURRENT_URL);
      let url = App.CURRENT_URL + "#o=" + defKey;
      window.location = url;

      // THIS CODE SHOULD NAVIGATE TO LINK
    //   let navigate = useNavigate();
    //   navigate(url);
    }

    sortDefinitions(sortBy) { 
        let _definitions = this.state.definitions;
        let _sortBy = this.state.sortBy;

        let sortByKeys = Object.keys(_sortBy);
        if(sortByKeys.length > 0) {
          sortByKeys.map((item, index) => {
            if(item !== sortBy) {
              _sortBy[item] = null
            }
          });
        }

        if(_sortBy[sortBy] == null || _sortBy[sortBy] === 'DESC') {
            _definitions = _definitions.sort((a, b) => {
                var tempA = a; var tempB = b;
                if( tempA[sortBy].toLowerCase() === tempB[sortBy].toLowerCase()) return 0;
                return tempA[sortBy].toLowerCase() > tempB[sortBy].toLowerCase() ? 1 : -1;
            }); 

            _sortBy[sortBy] = 'ASC';
        } else {
            _definitions = _definitions.sort((a, b) => {
                var tempA = a; var tempB = b;
                if( tempA[sortBy].toLowerCase() === tempB[sortBy].toLowerCase()) return 0;
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
        if(this.state.definitions.length > 0) {
            this.searchRef = React.createRef();

            var listItems = this.state.definitions.map((col) =>
                <tr>
                    <td className='definition-name' onClick={() => this.openDefinition(col.id)}>
                        <span style={{ marginLeft: '10px' }}>{col.name}</span>
                    </td>                    
                    <td>
                        {col.description}
                    </td>
                    <td>
                        {this.formatAppliedTo(col.applied_to)}
                    </td>
                </tr>
            );

            return listItems;
        } else {
            return  <tr>
                      <td colSpan={3} className="text-center">
                          <span>No results for your search</span>
                      </td>
                    </tr>;
        }
    }

    render() {      
        console.log('render() :: STATE == ');
        console.log(this.state);
        const { loading } = this.state;

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
            <Col>
                <div>
                    <h2>Definitions</h2>
                </div>
              </Col>
              <Col>
                <div className='search-bar'>
                    <div className="input-group">                
                        <span className="input-group-addon input-group-text" style={{width: "auto"}}>
                            <div style={{display: "block"}}>
                                <FaSearch onClick={() => this.toggleFilter()} style={{
                                    color: "#000",
                                    height: '21px',
                                    width: '21px'
                                }} />
                            </div>
                        </span>

                        <input className="form-control" placeholder="Search Definitions" onChange={event => this.fetchDefinitions(event.target.value)} type="text" />
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
                                  <th>Applied To</th>
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

export default Catalog;