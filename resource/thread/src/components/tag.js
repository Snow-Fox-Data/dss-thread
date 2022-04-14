import React, { Component } from "react";
import { FaTags } from "react-icons/fa";

class Tag extends Component {

    constructor(props) {
        super(props);

        this.props.cursor = 'pointer'
        if (this.props.onClick == null)
            this.props.cursor = 'arrow';
    }

    onClick = () => {
        if (this.props.onClick != null)
            this.props.onClick(this.props.tag);
    }

    render() {

        return (<div class="item-tag" style={{ cursor: this.props.cursor }} onClick={() => this.onClick()}>
            <FaTags></FaTags><span style={{ paddingLeft: '4px' }}>{this.props.tag}</span>
        </div>)
    }
}

export default Tag;