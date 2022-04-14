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

        return (<div class="react-tags__selected-tag">
         <FaTags></FaTags>   here
        </div>)
    }
}

export default Tag;