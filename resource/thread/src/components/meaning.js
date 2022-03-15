import React, { Component } from "react";
import { Col, Container, Row } from "react-bootstrap";
import Common from "../common/common";


class Meaning extends Component {

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div style={{maxWidth:"200px", border:"solid 1px #333", borderRadius:"2px"}}>
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
                            {this.props.meaning.description}
                        </span>
                    </Col>
                </Row>

            </div>
        )
    }
}

export default Meaning;