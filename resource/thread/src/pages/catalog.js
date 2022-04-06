import React, { Component } from 'react';
import { Col, Row, Table } from 'react-bootstrap';
import Common from '../common/common';

class Catalog extends Component {

    constructor(props) {
        super(props);

        this.state = {
            definitions: [],
            title: "Catelog View"
        };        
    }

    componentDidMount() {
        console.log('componentDidMount() :: ');

        this.fetchDefinitions();
    }

    fetchDefinitions() {
        console.log('fetchDefinitions() :: ');
        let _definitions = [
            {
              "applied_to": "",
              "description": "the address would go here",
              "destinations": [],
              "id": 8154516,
              "name": "C_ADDRESS3",
              "sources": []
            },
            {
              "applied_to": [
                "ANALYTICSBIDEMO|CUSTOMER|C_NAME"
              ],
              "description": "customer name",
              "destinations": [],
              "id": 71867443,
              "name": "Customer Name",
              "sources": []
            },
            {
              "applied_to": [
                "ANALYTICSBIDEMO|LINEITEM_approved|L_PARTKEY",
                "ANALYTICSBIDEMO|LINEITEM_prepared|L_PARTKEY"
              ],
              "description": "The Key of the part",
              "destinations": [],
              "id": 10825829,
              "name": "L_PARTKEY",
              "sources": []
            },
            {
              "applied_to": [
                "ANALYTICSBIDEMO|LINEITEM_approved|L_SUPPKEY",
                "ANALYTICSBIDEMO|LINEITEM_prepared|L_SUPPKEY"
              ],
              "description": "Supplier Key!",
              "destinations": [],
              "id": 44834024,
              "name": "L_SUPPKEY",
              "sources": []
            },
            {
              "applied_to": [
                "ASTORCATALOG|market|market_id",
                "ASTORCATALOG|market_prepared|market_id",
                "ASTORCATALOG|market_prepared_2|market_id"
              ],
              "description": "The identifier of the market in question.. yes it is",
              "destinations": [],
              "id": 94803275,
              "name": "market_id",
              "sources": []
            },
            {
              "applied_to": [
                "ASTORCATALOG|market_prepared|market_value",
                "ASTORCATALOG|market|market_value"
              ],
              "description": "The value of the market",
              "destinations": [],
              "id": 61889884,
              "name": "market_value",
              "sources": []
            },
            {
              "applied_to": [
                "ASTORCATALOG|market_prepared_prepared|market_name"
              ],
              "description": "THE NAME OF THE MARKET",
              "destinations": [],
              "id": 40458378,
              "name": "market_name",
              "sources": []
            },
            {
              "applied_to": [
                "ASTORCATALOG|market_prepared_2|market_value",
                "ASTORCATALOG|market|market_value"
              ],
              "description": "This is the value of the market basket KYLE B!",
              "destinations": [],
              "id": 94731640,
              "name": "market_value",
              "sources": []
            },
            {
              "applied_to": [
                "HARVEST|harvest_time_report_from2021_06_01|First Name"
              ],
              "description": "First Name",
              "destinations": [],
              "id": 51496813,
              "name": "First Name",
              "sources": []
            },
            {
              "applied_to": [
                "NYTAXIVM|test|passenger_count",
                "NYTAXIVM|test_prepared|passenger_count"
              ],
              "description": "integer indicating the number of passengers in the taxi ride.",
              "destinations": [],
              "id": 18333451,
              "name": "passenger_count",
              "sources": []
            },
            {
              "applied_to": [
                "NYTAXIVM|train_filtered_prepared|fare_amount",
                "NYTAXIVM|train|fare_amount",
                "NYTAXIVM|Test_Sample_scored|fare_amount",
                "NYTAXIVM|computer_test_submit|fare_amount"
              ],
              "description": "Fare amount charged in US dollars",
              "destinations": [],
              "id": 5031132,
              "name": "fare_amount",
              "sources": []
            },
            {
              "applied_to": [
                "ADVANCEDDESIGNERVM|Stacked_Online_Retail|customerid",
                "ADVANCEDDESIGNERVM|Online_Retail_Distinct_topn|customerid",
                "ADVANCEDDESIGNERVM|Online_Retail_Distinct_topn_prepared|customerid",
                "ADVANCEDDESIGNERVM|Online_Retail_Distinct|customerid"
              ],
              "description": "",
              "destinations": [],
              "id": 76470816,
              "name": "customerid",
              "sources": []
            },
            {
              "applied_to": [
                "ADVANCEDDESIGNERVM|Online_Retail_Distinct_by_year_windows|2009_total_revenue_sum",
                "ADVANCEDDESIGNERVM|Online_Retail_Distinct_by_year|2009_total_revenue_sum"
              ],
              "description": "This is all the revenue in 2009",
              "destinations": [],
              "id": 83464104,
              "name": "2009_total_revenue_sum",
              "sources": []
            },
            {
              "applied_to": [
                "ADVANCEDDESIGNERVM|Online_Retail_Distinct|stock_code",
                "ADVANCEDDESIGNERVM|Online_Retail_Prepared|stock_code",
                "ADVANCEDDESIGNERVM|Online_Retail_Distinct_prepared|stock_code"
              ],
              "description": "This is the code of the stock",
              "destinations": [],
              "id": 4987852,
              "name": "stock_code",
              "sources": []
            },
            {
              "applied_to": [
                "ADVANCEDDESIGNERVM|Online_Retail_2011|stock_code"
              ],
              "description": "Stock Code",
              "destinations": [],
              "id": 18542206,
              "name": "stock_code",
              "sources": []
            },
            {
              "applied_to": [
                "ANALYTICSBIDEMO|CUSTOMER|C_ADDRESS"
              ],
              "description": "the address would go here",
              "destinations": [],
              "id": 30821723,
              "name": "C_ADDRESS",
              "sources": []
            }
        ];

        // const requestOptions = {
        //     method: 'GET',
        //     headers: { 'Content-Type': 'application/json' },
        // };

        // let term = "Add";

        // let url = window.getWebAppBackendUrl('def-search') + '?term=' + term;
        // fetch(url, requestOptions)
        //     .then(res => res.json())
        //     .then((response) => {
        //         console.log('response == ');
        //         console.log(response);
        //     });

        this.setState({
            definitions: _definitions
        });
    }

    formatAppliedTo(appliedTo) {
        console.log("formatAppliedTo(appliedTo) :: appliedTo == ");
        console.log(appliedTo);

        if(appliedTo.length > 0) {
            let formattedAppliedTo = appliedTo.map((col) => {
                return <span>{col}<br/></span>;
            });
    
            return formattedAppliedTo;
        } else {
            return <span>{appliedTo}</span>;
        }
    }

    sortDefinitions(sortBy) { 
        console.log('sortDefinitions() :: sortBy == ' + sortBy);
        let _definitions = this.state.definitions
            .sort((a, b) => {
                var tempA = a;
                var tempB = b;
                if( tempA.name.toLowerCase() === tempB.name.toLowerCase()) return 0;
                return tempA.name.toLowerCase() > tempB.name.toLowerCase() ? 1 : -1;
            });

        this.setState({
            definitions: _definitions
        });
    }

    renderDefinitions() {
        if(this.state.definitions.length > 0) {
            var listItems = this.state.definitions.map((col) =>
                //onClick={() => this.openColumn(col.key)}
                <tr>
                    <td>
                        {/* {Common.getIconForDataikuItemType('definition', "16px")} */}
                        <span style={{ marginLeft: '10px' }}>{col.name}</span>
                        {/* <span className='app-link' style={{ marginLeft: '10px' }} onClick={() => this.openColumn(col.key)}>{col.name}</span> */}
                    </td>                    
                    <td>
                        {col.description}
                    </td>
                    <td>
                        {this.formatAppliedTo(col.applied_to)}
                    </td>
                </tr>
            );

            return <Row>
                <Col>
                    <div className='table-definitions table-responsive'>
                        <Table striped bordered hover>
                            <thead>
                                <tr>
                                    <th className='text-center' colSpan={3}>Definitions</th>
                                </tr>
                                <tr>
                                    <th onClick={() => this.sortDefinitions('Name')}>Name</th>
                                    <th>Description</th>
                                    <th>Applied To</th>
                                </tr>
                            </thead>
                            <tbody>
                                {listItems}
                            </tbody>
                        </Table>
                    </div>                    
                </Col>
            </Row>;
        } else {
            return <p>{this.state.title}</p>
        }
    }

    render() {
        console.log('Definitions == ');
        console.log(this.state.definitions);

        return <Col>
            {this.renderDefinitions()}
        </Col>
    }
}

export default Catalog;