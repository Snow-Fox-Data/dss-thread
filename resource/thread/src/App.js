import React from "react";
import { Component } from 'react';

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import eventBus from "./eventBus";
import { Button, NavDropdown } from "react-bootstrap";

import { FaRedo } from 'react-icons/fa';

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
import Home from "./pages/home";
import Catalog from "./pages/catalog";
import Common from "./common/common";

class App extends Component {
    static CURRENT_URL = window.location.pathname;
    static BASE_PATH = Common.formatBasePath();

    static HOME = "HOME";
    static CATALOG = "CATALOG";

    constructor(props) {
        super(props)

        this.state = {
            activeTab: 'HOME',
            dataiku: undefined,
            currentUser: '',
            loading: true,
            loggedIn: null,
            scanning: false,
            logo: logo
        }

        console.log("window.location.href == " + window.location.href);
        console.log("window.location == " + window.location);
        console.log("window.location.pathname == " + window.location.pathname);

        this.checkActiveTab();
    }

    checkActiveTab() {
        // console.log('checkActiveTab() :: START :: App.CURRENT_URL.indexOf(App.CATALOG) === ' + App.CURRENT_URL.indexOf(App.CATALOG));
        let activeTab = App.HOME;
        if (App.CURRENT_URL.toUpperCase().indexOf(App.CATALOG) > -1) {
            activeTab = App.CATALOG;
        }

        // console.log('checkActiveTab() :: END :: activeTab == ' + activeTab);
        this.setState({
            activeTab: activeTab
        });
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

    checkPublic() {
        if (window.location.href.toLowerCase().indexOf('/webapps/view') > -1) {
            const queryParams = new URLSearchParams(window.location.search)
            // not accessing the public app
            var proj = queryParams.get("projectKey");
            var id = queryParams.get("webAppId");
            var url = window.location.origin + '/public-webapps/' + proj + '/' + id;

            return <div>
                <h4>Please access Thread through the <a target="_blank" href={url}>public web URL</a></h4>
                <div style={{ paddingTop: '15px' }}>
                    <span style={{ fontWeight: 'bold' }}>Public App Key:</span> {proj}.{id}
                </div>
            </div>
        }

        return '';
    }

    render() {
        const { activeTab, loading, scanning } = this.state;

        var publicApp = this.checkPublic();

        return (
            <Container style={{ paddingTop: '10px' }}>
                {this.state.loggedIn != null && this.state.loggedIn === false &&
                    <div>Unauthorized</div>
                }
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
                                    {/* <li class="nav-item">
                                        <Link className={activeTab == App.HOME ?  'active' : ''} 
                                            onClick={() => this.setState({ activeTab: App.HOME })} 
                                            to={App.CURRENT_URL}>Home</Link>
                                    </li>
                                    <li class="nav-item">
                                        <Link className={activeTab == App.CATALOG ?  'active' : ''} 
                                            onClick={() => this.setState({ activeTab: App.CATALOG })} 
                                            to={App.CURRENT_URL + "/catalog"}>Catalog</Link>
                                    </li> */}

                                    {/* STANDARD ROUTES */}
                                    <li class="nav-item">
                                        <NavLink activeClassName='active'
                                            onClick={() => this.setState({ activeTab: App.HOME })}
                                            to="/">Home</NavLink>
                                    </li>
                                    <li class="nav-item">
                                        <NavLink activeClassName='active'
                                            onClick={() => this.setState({ activeTab: App.CATALOG })}
                                            to="/catalog">Catalog</NavLink>
                                    </li>
                                </ul>
                            </div>
                            <ul class="navbar-nav" style={{ paddingRight: '15px' }}>
                                <NavDropdown title={this.state.currentUser}>
                                    <NavDropdown.Item onClick={() => this.rescan()}>Full DSS Scan</NavDropdown.Item>
                                </NavDropdown>
                            </ul>
                        </div>
                    </nav>
                    <Row>
                        {publicApp.length == 0 ?
                            <Outlet />
                            :
                            { publicApp }
                        }
                    </Row>
                </div >
            </Container >
        );
    }
}

export default App;
