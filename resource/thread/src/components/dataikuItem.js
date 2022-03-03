import React, { Component } from "react";
import { Col, Container, Row } from "react-bootstrap";
import Common from "../common/common";

class DataikuItem extends Component {

    constructor(props) {
        super(props);

        this.state = {
            
        };
    }

    buildTagsString(arrayTags) {
        let tags = [<span><b>Tags: </b></span>];
    
        arrayTags.forEach(element => {
            tags[tags.length] = <span>{element}</span>;
        });

        return tags;
    }

    // buildSchemaTable() { 
    //     const data = React.useMemo(
    //         () => this.props.item.schema,
    //         []
    //       )
        
    //       const columns = React.useMemo(
    //         () => [
    //             {  
    //                 Header: 'Name',  
    //                 accessor: 'name'  
    //             },{  
    //                 Header: 'Type',  
    //                 accessor: 'type'  
    //             }
    //         ],
    //         []
    //       )
        
    //       const {
    //         getTableProps,
    //         getTableBodyProps,
    //         headerGroups,
    //         rows,
    //         prepareRow,
    //       } = useTable({ columns, data })
        
    //       return (
    //         <table {...getTableProps()} style={{ border: 'solid 1px blue' }}>
    //           <thead>
    //             {headerGroups.map(headerGroup => (
    //               <tr {...headerGroup.getHeaderGroupProps()}>
    //                 {headerGroup.headers.map(column => (
    //                   <th
    //                     {...column.getHeaderProps()}
    //                     style={{
    //                       borderBottom: 'solid 3px red',
    //                       background: 'aliceblue',
    //                       color: 'black',
    //                       fontWeight: 'bold',
    //                     }}
    //                   >
    //                     {column.render('Header')}
    //                   </th>
    //                 ))}
    //               </tr>
    //             ))}
    //           </thead>
    //           <tbody {...getTableBodyProps()}>
    //             {rows.map(row => {
    //               prepareRow(row)
    //               return (
    //                 <tr {...row.getRowProps()}>
    //                   {row.cells.map(cell => {
    //                     return (
    //                       <td
    //                         {...cell.getCellProps()}
    //                         style={{
    //                           padding: '10px',
    //                           border: 'solid 1px gray',
    //                           background: 'papayawhip',
    //                         }}
    //                       >
    //                         {cell.render('Cell')}
    //                       </td>
    //                     )
    //                   })}
    //                 </tr>
    //               )
    //             })}
    //           </tbody>
    //         </table>
    //       )
    // }

    renderItemDetailsByType() {
        switch(this.props.type) {
            case 'dataset':
                return this.renderDataset();
            case 'project':
                return this.renderProject();
            case 'dataset':
                return <Col>
                    <p>No rendering has been setup for this item.</p>
                </Col>;
        }
    }

    renderDataset() {
        let tags = this.buildTagsString(this.props.item.meta.tags);

        // let schemaTable = this.buildSchemaTable();
        
        return <Col>
            <p class="name"><b>Name: </b>{this.props.item.name}</p>
            <p class="project"><b>Project: </b>{this.props.item.project}</p>
            <p class="name"><b>Type: </b>{this.props.type}</p>
            
            {/* <div class="schema-content">  
                <p class="schema"><b>Project: </b></p>
                {schemaTable}
            </div>     */}

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

        let tags = this.buildTagsString(this.props.item.meta.tags);
        
        return <Col>
            <p class="name"><b>Name: </b>{this.props.item.name}</p>
            <p class="name"><b>Type: </b>{this.props.type}</p>

            {/* <p class="project"><b>Project: </b>{this.props.item.project}</p> */}
            
            {/* <div class="schema-content">  
                <p class="schema"><b>Project: </b></p>
                <ReactTable  
                    data={this.props.schema}  
                    columns={columns}  
                    defaultPageSize = {2}  
                    pageSizeOptions = {[2,4, 6]}  
                />  
            </div>     */}

            <div class="tags">{tags}</div>  
        </Col>;
    }

    render() {
        console.log('render() :: this.props == ');
        console.log(this.props);

        let item;
        let itemDetails = this.renderItemDetailsByType();
        if (this.props.item != null) {
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