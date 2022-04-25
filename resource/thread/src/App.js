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

import logo from "./assets/images/icon_thread.png";
import loading_logo from "./assets/images/thread-spinner.gif";
import Common from "./common/common";

class App extends Component {
    static BASE_PATH = Common.formatBasePath();

    constructor(props) {
        super(props)

        this.state = {
            dataiku: undefined,
            currentUser: '',
            loading: true,
            loggedIn: null,
            scanning: false,
            logo: logo,
            fullRescan: false
        }
    }

    componentDidMount() {
        window.$(document).ready(() => {
            this.refreshUser();

            eventBus.on("scanning", (isScanning) => {
                if (isScanning)
                    this.setState({ "logo": loading_logo })
                else
                    this.setState({ "logo": logo })
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
                this.setState({ "logo": loading_logo })

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
                {this.state.fullRescan ?
                    <div>
                        <div style="float:left"><img src={this.state.logo} /></div>
                        <div style="float:left">
                            <h2>Scanning in progress...</h2>
                        </div>
                    </div>
                    :
                    <div hidden={!this.state.loggedIn}>
                        <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
                            <div class="container-fluid">
                                <img src={this.state.logo} className="app-logo" alt="logo" />
                                <a class="navbar-brand" style={{ fontWeight: "bold", fontSize: "27px" }}>Thread</a>
                                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                                    <span class="navbar-toggler-icon"></span>
                                </button>
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
