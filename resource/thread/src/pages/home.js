import React, { Component } from 'react';
import { Row } from 'react-bootstrap';

class Home extends Component {

    constructor(props) {
        super(props);

        this.state = {
            title: "Home View"
        };
    }

    render() {
        return <Row>
            <p>{this.state.title}</p>
        </Row>
    }
}

export default Home;