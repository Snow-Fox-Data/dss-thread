import React, { Component, useState, useEffect } from "react";
import { FaColumns, FaDatabase, FaList, FaProjectDiagram, FaQuestionCircle } from "react-icons/fa";

function createProjectLink(projkey) {
    return '/projects/' + projkey + '/flow/';
}

function createDatasetLink(projkey, ds) {
    return '/projects/' + projkey + '/datasets/' + ds + '/explore/';
}

function createDatasetLinkTag(proj, ds) {
    return '<a href="' + this.createDatasetLink(proj, ds) + '" target="_blank">' + proj + '.' + ds + '</a>';
}

function getBaseUrl() {
    const queryParams = new URLSearchParams(window.location.search)
    // not accessing the public app
    var proj = queryParams.get("projectKey");
    var id = queryParams.get("webAppId");
    var url = window.location.origin + '/public-webapps/' + proj + '/' + id;

    return url, proj, id;
}

function getIconForDataikuItemType(type, size = "11px") {
    switch (type) {
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
    createDatasetLinkTag,
    getIconForDataikuItemType,
    getBaseUrl
};

export default Common;