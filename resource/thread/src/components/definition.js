import React, { Component } from "react";
import { Col, Container, Row, Card } from "react-bootstrap";
import Common from "../common/common";


class Definition extends Component {

    constructor(props) {
        super(props);
    }

    render() {
        return (<Card style={{ width: '18rem' }}>
            <Card.Body>
                <Card.Title>{this.props.definition.name}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">Definition</Card.Subtitle>
                <Card.Text>
                    <span style={{ fontWeight: "bold", paddingRight: "10px" }}>
                        ID
                    </span>
                    <span>
                        {this.props.definition.id}
                    </span>
                    <span style={{ fontWeight: "bold", paddingRight: "10px" }}>
                        Name
                    </span>
                    <span>
                        {this.props.definition.name}
                    </span>
                    <span style={{ fontWeight: "bold", paddingRight: "10px" }}>
                        Description
                    </span>
                    <span>
                        {this.props.definition.description}
                    </span>
                </Card.Text>
            </Card.Body>
        </Card>
        )
    }
}

export default Definition;