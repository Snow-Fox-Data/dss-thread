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

function formatBasePath() {
    console.log('formatBasePath() :: START :: ');

    // let arrayUrlPath = App.CURRENT_URL.split('/');
    let arrayUrlPath = window.location.pathname.split('/');
    console.log('arrayUrlPath == ');
    console.log(arrayUrlPath);

    arrayUrlPath = arrayUrlPath.map((path, index) => {
        // console.log('index == ' + index);
        // console.log('path == ' + path);

        return (path.length > 0) ? path : null;
    }).filter((path) => path !== null);

    // console.log('arrayUrlPath == ');
    // console.log(arrayUrlPath);

    let urlBuilder = '/' + arrayUrlPath[0] + '/' + arrayUrlPath[1] + '/' + arrayUrlPath[2];
    console.log('urlBuilder == ' + urlBuilder);

    console.log('formatBasePath() :: END :: ');
    return urlBuilder;
};

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
    formatBasePath,
    getIconForDataikuItemType,
};

export default Common;