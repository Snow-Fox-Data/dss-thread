import React, { Component } from "react";
import { FaColumns, FaDatabase, FaList, FaProjectDiagram, FaQuestionCircle } from "react-icons/fa";

function createDsLinkThread(proj, ds) {
    return '/projects/' + proj + '/datasets/' + ds + '/explore/';
}

function createDsLinkTag(proj, ds) {
    return '<a href="' + this.createDsLinkThread(proj, ds) + '" target="_blank">' + proj + '.' + ds + '</a>';
}

function createProjectLink(projkey) {
    return '/projects/' + projkey + '/flow/';
}

function createDatasetLink(projkey, ds) {
    return '/projects/' + projkey + '/datasets/' + ds + '/explore/';
}

function getIconForDataikuItemType(type, size = "11px") {
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
    createDsLinkTag,
    getIconForDataikuItemType
};

export default Common;