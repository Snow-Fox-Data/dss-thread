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
                <Row>
                    <Col>
                        <span style={{ fontWeight: "bold", paddingRight: "10px" }}>
                            Name
                        </span>
                        <span>
                            {this.props.meaning.name}
                        </span>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <span style={{ fontWeight: "bold", paddingRight: "10px" }}>
                            Description
                        </span>
                        <span>
                            {this.props.meaning.value}
                        </span>
                    </Col>
                </Row>

            </Container>
        )
    }
}

export default Meaning;