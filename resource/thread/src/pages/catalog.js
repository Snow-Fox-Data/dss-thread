import React, { Component } from 'react';
import { Row } from 'react-bootstrap';

class Catalog extends Component {

    constructor(props) {
        super(props);

        this.state = {
            title: "Catelog View"
        };

        this.getDefinitions();
    }

    getDefinitions() {
        const requestOptions = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        };

        let term = 'Add';

        let url = window.getWebAppBackendUrl('def-search') + '?term=' + term;
        fetch(url, requestOptions)
            .then(res => res.json())
            .then((response) => {
                console.log('response == ');
                console.log(response);
            });
    }

    render() {
        return <Row>
            <p>{this.state.title}</p>
        </Row>
    }
}

export default Catalog;