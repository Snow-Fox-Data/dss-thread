import React, { Component } from "react";
import { Col, Container, Row, Card } from "react-bootstrap";
import Common from "../common/common";


class Definition extends Component {

    constructor(props) {
        super(props);
    }

    render() {
        return (<Card style={{ width: '30rem' }}>
            <Card.Header>{this.props.definition.name}</Card.Header>
            <Card.Body>
                <Card.Text>
                    <h5>
                        ID
                    </h5>
                    <span>
                        {this.props.definition.id}
                    </span>
                    <h5>
                        Name
                    </h5>
                    <span>
                        {this.props.definition.name}
                    </span>
                    <h5>
                        Description
                    </h5>
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