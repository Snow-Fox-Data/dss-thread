import React, { Component } from "react";
import { ReactTable } from "react-table";  
import { Col, Container, Row } from "react-bootstrap";
import Common from "../common/common";

class DataikuItem extends Component {

    constructor(props) {
        super(props);

        this.state = {
            
        };
    }

    renderItemDetailsByType() {
        switch(this.props.type) {
            case 'dataset':
                return this.renderDataset();
            case 'project':
                return this.renderDataset();
            case 'dataset':
                return <Col>
                    <p>No rendering has been setup for this item.</p>
                </Col>;
        }
    }

    renderDataset() {
        const columns = [{  
            Header: 'Name',  
            accessor: 'name'  
        },{  
            Header: 'Type',  
            accessor: 'type'  
        }] 

        let tags = [<span><b>Tags: </b></span>];
        this.props.item.meta.tags.forEach(element => {
            tags[tags.length] = <span>{element}</span>;
        });
        
        return <Col>
            <p class="name"><b>Name: </b>{this.props.item.name}</p>
            <p class="project"><b>Project: </b>{this.props.item.project}</p>
            
            <div class="schema-content">  
                <p class="schema"><b>Project: </b></p>
                <ReactTable  
                    data={this.props.item.schema}  
                    columns={columns}  
                    defaultPageSize = {2}  
                    pageSizeOptions = {[2,4, 6]}  
                />  
            </div>    

            <div class="tags">{tags}</div>  
        </Col>;
    }

    renderProject() {
        // const columns = [{  
        //     Header: 'Name',  
        //     accessor: 'name'  
        // },{  
        //     Header: 'Type',  
        //     accessor: 'type'  
        // }] 

        // let tags;
        // this.props.meta.tags.forEach(element => {
        //     tags[tags.length] = <span>{element}</span>;
        // });
        
        return <Col>
            <p class="name"><b>Name: </b>{this.props.item.name}</p>
            <p class="project"><b>Project: </b>{this.props.item.project}</p>
            
            {/* <div class="schema-content">  
                <p class="schema"><b>Project: </b></p>
                <ReactTable  
                    data={this.props.schema}  
                    columns={columns}  
                    defaultPageSize = {2}  
                    pageSizeOptions = {[2,4, 6]}  
                />  
            </div>     */}

            {/* <div class="tags">{tags}</div>   */}
        </Col>;
    }

    render() {
        console.log('render() :: this.props == ');
        console.log(this.props);

        let item;
        let itemDetails = this.renderItemDetailsByType();
        if (this.props.item != null) {
            // MOVE RENDER ITEMS HERE AND PUT ROW AS MAIN TAG FOR BUILDING IT.
            item = <Row>
                <Col xs={1}>
                    {Common.getIconForDataikuItemType(this.props.type, "100%")}
                </Col>
                {itemDetails}                                          
            </Row>
        } else {
            item = <Row>
                <p>No Item to display...</p>
            </Row>
        }        

        return (
            <div class="dataiku-item" style={{ paddingTop: '20px' }}>
                {item}
            </div>
        );
    }
}

export default DataikuItem;