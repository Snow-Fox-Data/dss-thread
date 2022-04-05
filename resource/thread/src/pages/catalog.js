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

        fetch(window.getWebAppBackendUrl('def-search'))
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