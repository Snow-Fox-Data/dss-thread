import React, { Component } from "react";
import { Col, Container, Row } from "react-bootstrap";
import Common from "../common/common";

class DataikuItem extends Component {

    constructor(props) {
        super(props);

        this.state = {
            
        };
    }

    // render()  {}

    render() {
        console.log('render() :: this.props == ');
        console.log(this.props);

        let item;
        if (this.props.item != null) {
            item = <Row>
                <Col xs={1}>
                    {Common.getIconForDataikuItemType(this.props.type, "5x")}
                </Col>
                <Col>
                    <p><b>Name: </b>{this.props.item.name}</p>
                    <p><b>Project: </b>{this.props.item.project}</p>
                </Col>                              
            </Row>
        } else {
            item = <Row>
                <p>No Item to display...</p>
            </Row>
        }        

        return (
            <div style={{ paddingTop: '20px' }}>
                {item}
            </div>
        );
    }
}

export default DataikuItem;