import React, { Component } from "react";
import { Col, Container, Row } from "react-bootstrap";
import Common from "../common/common";


class Definition extends Component {

    constructor(props) {
        super(props);
    }

    render() {
        return (<div>
            <div style={{ maxWidth: "300px", border: "solid 1px #999", borderRadius: "2px", padding: "10px" }}>
                <Row>
                    <Col>
                        <span style={{ fontWeight: "bold", paddingRight: "10px" }}>
                            ID
                        </span>
                        <span>
                            {this.props.definition.id}
                        </span>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <span style={{ fontWeight: "bold", paddingRight: "10px" }}>
                            Name
                        </span>
                        <span>
                            {this.props.definition.name}
                        </span>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <span style={{ fontWeight: "bold", paddingRight: "10px" }}>
                            Description
                        </span>
                        <span>
                            {this.props.definition.description}
                        </span>
                    </Col>
                </Row>
            </div>
        </div>
        )
    }
}

export default Definition;