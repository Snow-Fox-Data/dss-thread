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
                    <Col style={{fontWeight:"bold"}}>
                        Name
                    </Col>
                    <Col>
                        {this.props.meaning.name}
                    </Col>
                </Row>
                <Row>
                    <Col style={{fontWeight:"bold"}}>
                        Description
                    </Col>
                    <Col>
                        {this.props.meaning.description}
                    </Col>
                </Row>

            </Container>
        )
    }
}

export default Meaning;