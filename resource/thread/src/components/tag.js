import React, { Component } from "react";
import { Col, Container, Row, Card } from "react-bootstrap";
import Common from "../common/common";
import { Modal, Button, Form, Toast, ButtonGroup, Dropdown } from "react-bootstrap";
import { FaTags } from "react-icons/fa";

class Tag extends Component {

    constructor(props) {
        super(props);
    }

    render() {

        return (<div class="item-tag">
            <FaTags></FaTags><span style={{ paddingLeft: '4px' }}>{this.props.tag}</span>
        </div>)
    }
}

export default Tag;