import React from "react";
import { Component } from 'react';

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import eventBus from "./eventBus";

import { FaRedo } from 'react-icons/fa';

import {
    Container,
    Row,
    Spinner,
} from 'react-bootstrap';

// import {
//     Route,
//     Routes,
//     Link
// } from "react-router-dom";

import {
    BrowserRouter as Router,
    Switch,
    Route,
    Link,
    Routes
  } from "react-router-dom";

import logo from "./assets/images/icon_thread.png";
import Home from "./pages/home";
import Catalog from "./pages/catalog";

class App extends Component {
    static CURRENT_URL = window.location.pathname;

    static HOME = "HOME";
    static CATALOG = "CATALOG";

    constructor(props) {
        super(props)

        this.state = {
            activeTab: 'HOME',
            dataiku: undefined,
            currentUser: '',
            loading: true,
            loggedIn: null
        }

        console.log("window.location.href == " + window.location.href);
        console.log("window.location == " + window.location);
        console.log("window.location.pathname == " + window.location.pathname);
    }

    checkActiveTabab() {
        let activeTab = App.HOME;

        if(App.CURRENT_URL.indexOf('catalog') !== -1) {
            activeTab = App.CATALOG;
        } else {
            activeTab = App.HOME;
        }

        this.setState({
            activeTab: activeTab
        });
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
                            loggedIn: true
                        });

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

    rescan() {
        this.setState({ loading: true });
        fetch(window.getWebAppBackendUrl('scan'))
            .then(res => res.json())
            .then((response) => {
                this.setState({ loading: false });
            });
    }

    render() {
        const { activeTab, loading } = this.state;

        return (
            <Container style={{ paddingTop: '10px' }}>
                {this.state.loggedIn != null && this.state.loggedIn === false &&
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
                                     <li class="nav-item">
                                        <Link className={activeTab == App.HOME ?  'active' : ''} 
                                            onClick={() => this.setState({ activeTab: App.HOME })} 
                                            to="/">Home</Link>
                                    </li>
                                    <li class="nav-item">
                                        <Link className={activeTab == App.CATALOG ?  'active' : ''} 
                                            onClick={() => this.setState({ activeTab: App.CATALOG })} 
                                            to="/catalog">Catalog</Link>
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
                        {/* <Routes>
                            <Route path={App.CURRENT_URL} element={<Home />} />
                            <Route path={App.CURRENT_URL + "/catalog"} element={<Catalog />} />
                        </Routes> */}

                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/catalog" element={<Catalog />} />
                        </Routes>

                        {/* <Switch>
                            <Route path="/" element={<Home />} />
                            <Route path="/catalog" element={<Catalog />} />
                        </Switch> */}                        
                    </Row>

                </div>
            </Container>
        );
    }
}

export default App;
