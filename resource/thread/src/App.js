import React, { Fragment } from "react";
import { Component } from 'react';
import { useEffect } from 'react';

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import {
    Container,
    Row
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
            isLoading: false,
            selectedItem: null,
            searchResults: [],
        }
    }

    loadItem = (item) => {
        console.log('loadItem :: item == ');
        console.log(item);

        if(item.length > 0) {
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
                        selectedItem: response      
                    });
                });
        } else {
            this.setState({
                selectedItem: null      
            });
        }
    }

    search = (query) => {
        const requestOptions = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        };

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
            });
    }

    componentDidMount() {
        window.$(document).ready(() => {
            this.setState({ dataiku: window.dataiku });
            this.setState({ rendered: true });

            // eventBus.on("dataRefresh", (data) =>
            //     this.refreshData()
            // );

            // eventBus.on("datasetSelected", (ds) =>
            //     this.findDataset(ds)
            // );

            // this.search('thread');
            // this.refreshData();
        });
    }

    renderMenuItemChildren(option, props) {
        return <Fragment>
            {Common.getIconForObjectType(option.type)}
            <span style={{ marginLeft: '.5rem', marginRight: '.5rem' }}>Type: {option.type}; </span>
            <span>Name: {option.name}; </span>                                
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
        
        const { isLoading, searchResults, selectedItem } = this.state;
        // const ref = React.createRef();
        const filterBy = () => true;

        this.dataikuItem = <DataikuItem item={selectedItem} />;

        return (
            <Container style={{ paddingTop: '20px' }}>
                <Row>
                    <AsyncTypeahead
                        filterBy={filterBy}
                        id="async-search"
                        isLoading={isLoading}
                        labelKey="name"
                        minLength={3}
                        onChange={this.loadItem}
                        onSearch={this.search}
                        options={searchResults}
                        placeholder='Search for Datase'                        
                        renderMenuItemChildren={this.renderMenuItemChildren}
                    />                    
                </Row>

                {this.dataikuItem}
            </Container>
        );
    }
}

export default App;
