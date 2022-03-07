import React, { Component } from "react";
import { FaColumns, FaDatabase, FaList, FaProjectDiagram, FaQuestionCircle } from "react-icons/fa";

// function createDsLink(ds) {
//     return this.createDsLink2(ds.projectKey, ds.name)
// }

// function createDsLink2(proj, ds) {
//     return '/projects/' + proj + '/datasets/' + ds + '/explore/';
// }

function createDsLinkFull(proj, ds) {
    return '<a href="' + this.createDsLink2(proj, ds) + '" target="_blank">' + proj + '.' + ds + '</a>';
}

function createProjectLink(projkey) {
    return '/projects/' + projkey + '/flow/';
}

function createDatasetLink(projkey, ds) {
    return '/projects/' + projkey + '/datasets/' + ds + '/explore/';
}

function getIconForDataikuItemType(type, size = "11px") {
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
    createDatasetLink,
    createProjectLink,
    createDsLinkFull,
    getIconForDataikuItemType
};

export default Common;