import React, { Component } from "react";
import { Col, Container, Row, Card } from "react-bootstrap";
import Common from "../common/common";
import { Modal, Button, Form, Toast, ButtonGroup, Dropdown } from "react-bootstrap";
import Tag from "./tag"

class Definition extends Component {

    constructor(props) {
        super(props);
    }

    buildTagsString(arrayTags) {
        if (arrayTags == null)
            return;

        let tags = [];

        arrayTags.forEach(element => {
                         tags[tags.length] = <Tag tag={element}></Tag>
        });

        return tags;
    }

    render() {

        return (<Card style={{ width: '50rem' }}>
            <Card.Header>Definition: {this.props.definition.name}</Card.Header>
            <Card.Body>
                <Card.Text>
                    <h5>
                        Name
                    </h5>
                    <div style={{ paddingBottom: "10px" }}>
                        {this.props.definition.name}
                    </div>
                    {eval(this.props.definition.tags).length > 0 &&
                        <div>
                            <h5>
                                Tags
                            </h5>
                            <div style={{ paddingBottom: "10px" }}>
                                {this.buildTagsString(eval(this.props.definition.tags))}
                            </div>
                        </div>
                    }
                    <h5>
                        Description
                    </h5>
                    <div style={{ paddingBottom: "10px" }}>
                        {this.props.definition.description}
                    </div>
                </Card.Text>
            </Card.Body>
        </Card>
        )
    }
}

export default Definition;