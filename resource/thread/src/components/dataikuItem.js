import React, { Component } from "react";
import { Col, Container } from "react-bootstrap";

class DataikuItem extends Component {

    constructor(props) {
        super(props);

        console.log('props == ');
        console.log(props);

        this.state = {
            
        };
    }

    render() {
        return (
            <>
                <Row>
                    <p>DISPLAY RESULTS OF LOAD ITEM HERE...</p>
                </Row>
            </>
        );
    }
}

export default DataikuItem;