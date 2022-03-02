import React, { Component } from "react";
import { Col, Container, Row } from "react-bootstrap";

class DataikuItem extends Component {

    constructor(props) {
        super(props);

        this.state = {
            
        };
    }

    // id: "ADVANCED_CREDITCARDFRAUDAMOSNJUGUN"
    // key: "ADVANCED_CREDITCARDFRAUDAMOSNJUGUN.trans_by_groupID"
    // lineage-downstream: "[]"
    // lineage-upstream: "[{
    //     'name': 'ADVANCED_CREDITCARDFRAUDAMOSNJUGUN.transactions_joined_joined', 'lineage_upstream': [
    //         {'name': 'ADVANCED_CREDITCARDFRAUDAMOSNJUGUN.merchant_info', 'lineage_upstream': []}, 
    //         {'name': 'ADVANCED_CREDITCARDFRAUDAMOSNJUGUN.cardholder_info', 'lineage_upstream': []}, 
    //         {'name': 'ADVANCED_CREDITCARDFRAUDAMOSNJUGUN.transactions_2018_prepared_stacked', 'lineage_upstream': [
    //             {'name': 'ADVANCED_CREDITCARDFRAUDAMOSNJUGUN.transactions_2018_prepared', 'lineage_upstream': [
    //                 {'name': 'ADVANCED_CREDITCARDFRAUDAMOSNJUGUN.transactions_2018', 'lineage_upstream': []}
    //             ]}, 
    //             {'name': 'ADVANCED_CREDITCARDFRAUDAMOSNJUGUN.transactions_2017', 'lineage_upstream': []}
    //         ]}
    //     ]}
    // ]"
    // meta:
    //     checklists:
    //         checklists: []
    //     custom:
    //         kv: {}
    //     tags: []
    // name: "ADVANCED_CREDITCARDFRAUDAMOSNJUGUN.trans_by_groupID"
    // project: "ADVANCED_CREDITCARDFRAUDAMOSNJUGUN"
    // schema: Array(5)
    //     0: {name: 'merchant_id', type: 'string'}
    //     1: {name: 'merchant_subsector_description', type: 'string'}
    //     2: {name: 'merchant_latitude', type: 'double'}
    //     3: {name: 'merchant_longitude', type: 'double'}
    //     4: {name: 'merchant_state', type: 'string'}

    render() {
        console.log('render() :: this.props == ');
        console.log(this.props);

        let item;
        if (this.props.item != null) {
            item = <Row>
                <p><b>Name: </b>{this.props.item.name}</p>
                <p><b>Project: </b>{this.props.item.project}</p>                  
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