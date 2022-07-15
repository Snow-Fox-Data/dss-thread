import React, { Component, Fragment } from 'react';
import { Container } from "react-bootstrap";
import { Col, Row, Spinner, Card, Button, Table } from 'react-bootstrap';

class NotFound extends Component {

    constructor(props) {
        super(props);

        this.state = {
            rendered: false,
        }

        window.$(document).ready(() => {
            this.setState({ rendered: true })
        })
    }

    checkPublic() {
        if (window.location.href.toLowerCase().indexOf('/webapps/view') > -1) {
            const queryParams = new URLSearchParams(window.location.search)
            // not accessing the public app
            var proj = queryParams.get("projectKey");
            var id = queryParams.get("webAppId");
            var url = window.location.origin + '/public-webapps/' + proj + '/' + id;

            // var backend_url = window.location.origin + '/web-apps-backends/' + proj + '/' + id + '/scan';
            var backend_url = ''; //window.getWebAppBackendUrl('scan');

            return (<div>
                <h4>Please access Thread through the <a target="_blank" href={url}>public web URL</a></h4>
                <div style={{ paddingTop: '15px' }}>
                    <span style={{ fontWeight: 'bold' }}>Public App Key:</span> {proj}.{id}
                </div>
                <div style={{ paddingTop: '15px' }}>
                    <span style={{ fontWeight: 'bold' }}>Full Rescan URL:</span> {backend_url}
                </div>
            </div>)
        }

        return '';
    }

    render() {
        var publicApp = this.checkPublic();

        return (
            <>
                <Row>
                    <Col>
                        {this.state.rendered &&
                            publicApp.length == 0 ?
                            <h2>Resource not found</h2>
                            :
                            <div style={{ padding: '20px' }}>
                                {publicApp}
                            </div>
                        }
                    </Col>
                </Row>
            </>
        )
    }
}
export default (props) => (
    <NotFound
        {...props}
    />
);