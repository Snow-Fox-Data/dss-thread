import React, { Component } from "react";
import { Col, Container, Row, Card } from "react-bootstrap";
import Common from "../common/common";
import { Modal, Button, Form, Toast, ButtonGroup, Dropdown } from "react-bootstrap";
import { FaTags } from "react-icons/fa";

class Definition extends Component {

    constructor(props) {
        super(props);
    }

    buildTagsString(arrayTags, variant = "primary", link = true) {
        if (arrayTags == null)
            return;

        let tags = [];

        arrayTags.forEach(element => {
            if (link) {
                tags[tags.length] = <Button onClick={() => this.openDataset(element)} style={{ marginRight: '6px', marginBottom: '5px' }} variant={variant} size="sm">
                    {element}
                </Button>
            }
            else
                tags[tags.length] = <Button style={{ marginRight: '6px', marginBottom: '5px' }} variant={variant} size="sm">
                    <FaTags></FaTags><span style={{ paddingLeft: '4px' }}>{element}</span>
                </Button>

        });

        return tags;
    }

    render() {

        return (<Card style={{ width: '50rem' }}>
            <Card.Header>Definition: {this.props.definition.name}</Card.Header>
            <Card.Body>
                <Card.Text>
                    {/* <h5>
                        ID
                    </h5>
                    <div style={{ paddingBottom: "10px" }}>
                        {this.props.definition.id}
                    </div> */}
                    <h5>
                        Name
                    </h5>
                    <div style={{ paddingBottom: "10px" }}>
                        {this.props.definition.name}
                    </div>
                    {this.props.definition.tags.length > 0 &&
                        <div>
                            <h5>
                                Tags
                            </h5>
                            <div style={{ paddingBottom: "10px" }}>
                                {this.buildTagsString(eval(this.props.definition.tags), 'light', false)}
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