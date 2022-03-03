import React, { Component } from "react";
import { FaColumns, FaDatabase, FaList, FaProjectDiagram, FaQuestionCircle } from "react-icons/fa";

function getIconForDataikuItemType(type) {
    // console.log();
    switch(type) {
        case "project":
            return <FaProjectDiagram />;
        case "dataset":
            return <FaDatabase />;
        case "column":
            return <FaColumns />;
        case "definition":
            return <FaList />;
        default: 
            return <FaQuestionCircle />;
    }   
}

const Common = {
    getIconForDataikuItemType
};

export default Common;