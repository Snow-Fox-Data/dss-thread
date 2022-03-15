import React, { Component } from "react";
import { Col, Container, Row } from "react-bootstrap";
import Common from "../common/common";


class Meaning extends Component {

    constructor(props) {
        super(props);


    }

    render() {
        return (
            <Container>
                {this.props.name}
            </Container>
        )
    }
}

export default Meaning;