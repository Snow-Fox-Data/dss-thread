import React from "react";
import { Component } from 'react';

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import eventBus from "./eventBus";
import { Button, NavDropdown } from "react-bootstrap";

import {
    Container,
    Row,
    Spinner,
} from 'react-bootstrap';

import {
    Route,
    Link,
    Outlet,
    NavLink,
    Routes
} from "react-router-dom";

import logo from "./assets/images/thread-logo.png";
import loading_logo from "./assets/images/loading.gif";
import Common from "./common/common";

class App extends Component {
    static BASE_PATH = Common.formatBasePath();

    constructor(props) {
        super(props)

        this.state = {
            dataiku: undefined,
            currentUser: '',
            loading: false,
            loggedIn: null,
            scanning: false,
            logo: logo,
            fullRescan: false,
            loading_logo: loading_logo
        }
    }

    componentDidMount() {
        window.$(document).ready(() => {
            this.refreshUser();

            eventBus.on("scanning", (isScanning) => {
                this.setState({ 'scanning': isScanning })
            });
        });
    }

    refreshUser() {
        fetch(window.getWebAppBackendUrl('get-user'))
            .then(res => res.json())
            .then((response) => {

                if (response.status == 'ok') {

                    this.setState({
                        dataiku: window.dataiku,
                        currentUser: response['you_are'],
                        loggedIn: true
                    });

                    eventBus.dispatch('loggedIn', response)
                }
                else
                    this.setState({
                        loggedIn: false
                    })
            });
    }

    rescan() {
        if (!this.state.scanning) {

            if (window.confirm('A full rescan make take minutes to complete and may affect other Thread users. Would you like to proceed?')) {
                // this.setState({ "logo": loading_logo })

                this.setState({ scanning: true });
                this.setState({ fullRescan: true });
                fetch(window.getWebAppBackendUrl('scan'))
                    .then(res => res.json())
                    .then((response) => {
                        if (response.result == 'error')
                            alert(response.message)
                        else
                            window.location.reload();
                    });
            }
        }
    }


    export() {
        if (!this.state.scanning) {

            if (window.confirm('This will export the configured definitons to datasets in your project\'s flow. Would you like to proceed?')) {
                // this.setState({ "logo": loading_logo })

                fetch(window.getWebAppBackendUrl('export'))
                    .then(res => res.json())
                    .then((response) => {
                        if (response.result == 'error')
                            alert(response.message)
                        else
                            alert('Export Complete!')
                    });
            }
        }
    }

    homeClick() {
        window.location = Common.formatBasePath();
    }

    render() {
        const { activeTab, loading, scanning } = this.state;

        return (
            <Container style={{ paddingTop: '10px' }}>
                {this.state.loggedIn != null && this.state.loggedIn === false &&
                    <div>Unauthorized</div>
                }
                {this.state.scanning ?
                    <nav class="navbar navbar-expand-lg ">
                        {/* navbar-dark bg-dark */}
                        <div style={{ float: 'left', width: '50px', marginLeft: '10px' }}>
                            <img src={this.state.loading_logo} style={{ width: '50px' }} className="app-logo" alt="logo" />
                        </div>
                        <div style={{ float: 'left', width: '300px', marginLeft: '10px' }}>
                            <img src={this.state.logo} className="app-logo" alt="logo" />
                        </div>

                        {/* <div style={{ float: 'left', paddingLeft:'10px' }}>
                            <a class="navbar-brand" style={{ fontSize: "27px" }}>Full scan in progress...</a>
                        </div> */}
                    </nav>
                    :
                    <div hidden={!this.state.loggedIn}>
                        <nav class="navbar navbar-expand-lg">

                            <div class="container-fluid">
                                <img src={this.state.logo} className="app-logo" alt="logo" />

                                <div class="collapse navbar-collapse" id="navbarContent">
                                    <ul class="navbar-nav ms-auto mb-2 mb-lg-0">
                                        <li class="nav-item">
                                            <NavLink activeClassName='active'
                                                onClick={this.homeClick}
                                                to="/">Home</NavLink>
                                        </li>
                                        <li class="nav-item">
                                            <NavLink activeClassName='active'
                                                to="/catalog">Catalog</NavLink>
                                        </li>
                                    </ul>
                                </div>
                                <ul class="navbar-nav" style={{ paddingRight: '15px' }}>
                                    <NavDropdown title={this.state.currentUser}>
                                        <NavDropdown.Item target="_blank" href="https://github.com/Excelion-Partners/dss-thread/raw/main/Thread_User_Instructions.pdf">User Instructions</NavDropdown.Item>
                                        <NavDropdown.Divider />
                                        <NavDropdown.Item onClick={() => this.rescan()}>Full DSS Scan</NavDropdown.Item>
                                        <NavDropdown.Item onClick={() => this.export()}>Export Friendly Format</NavDropdown.Item>
                                    </NavDropdown>
                                </ul>
                            </div>
                        </nav>
                        <Row>
                            <Outlet />
                        </Row>
                    </div >
                }
            </Container >
        );
    }
}

export default App;
