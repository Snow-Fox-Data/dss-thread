import React, { Component } from "react";
import { FaColumns, FaDatabase, FaList, FaProjectDiagram, FaQuestionCircle } from "react-icons/fa";

function getIconForDataikuItemType(type, size = "14px") {
    // console.log();
    switch(type) {
        case "project":
            return <FaProjectDiagram size={size} />;
        case "dataset":
            return <FaDatabase size={size} />;
        case "column":
            return <FaColumns size={size} />;
        case "definition":
            return <FaList size={size} />;
        default: 
            return <FaQuestionCircle size={size} />;
    }   
}

const Common = {
    getIconForDataikuItemType
};

export default Common;