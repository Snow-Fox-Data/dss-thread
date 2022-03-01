import React, { Component, Fragment } from 'react';
// import eventBus from "../eventBus";

// import { Handle } from 'react-flow-renderer';

class MenuItemProject extends Component {
    constructor(props) {
        console.log('Menu Item Project :: constructor :: props == ');
        console.log(props);

        super(props);

        this.state = {
            // option: 
        };
    }

    render() {
        return (
            <Fragment>      
                {/* <span>Type: {option.type}; </span>
                <span>Name: {option.name}; </span> */}
                <span>Type: TEST; </span>
                <span>Name: TEST; </span>
                <span>RENDERED FROM COMPONENT</span>                          
            </Fragment>
        );
    }
}

export default MenuItemProject;