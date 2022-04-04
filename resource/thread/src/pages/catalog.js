import React, { Component } from 'react';
import { Row } from 'react-bootstrap';

class Catalog extends Component {

    constructor(props) {
        super(props);

        this.state = {
            title: "Catelog View"
        };
    }

    render() {
        return <Row>
            <p>{this.state.title}</p>
        </Row>
    }
}

export default Catalog;