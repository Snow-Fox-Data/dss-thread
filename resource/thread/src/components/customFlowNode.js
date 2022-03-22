import React, { memo } from 'react';
import eventBus from "../eventBus";

import { Handle } from 'react-flow-renderer';
import Common from '../common/common';

export default memo(({ data, isConnectable }) => {
  var project = "";
  var dataset = "";
  var column = "";

  function formatData(_data)  {
    console.log('customFlowNode :: formatData() :: _data == ');
    console.log(_data);
  
    var project_splits = _data.project.split(' | ');
  
    console.log('project_splits :: length == ' + project_splits.length);
    console.log(project_splits);

    switch(project_splits.length) {
      case 1:
        console.log('CASE 1');
        project = _data.project;
        dataset = _data.dataset;
        break;
      case 2:
        console.log('CASE 2');
        project = project_splits[0];
        dataset = project_splits[1];
        break;
      case 3:
        console.log('CASE 3');
        project = project_splits[0];
        dataset = project_splits[1];
        column = project_splits[2];
        break;
      default:
        console.log('DEFAULT');
        project = _data.project;
        dataset = _data.dataset;
        break;
    }

    console.log('customFlowNode :: formatData() :: wrap up ');
    console.log('project == ' + project);
    console.log('dataset == ' + dataset);
    console.log('column == ' + column);
  }

  function selectDataset(e) {
    e.preventDefault();
    eventBus.dispatch("datasetSelected", data.project + '|' + data.dataset);
  }

  formatData(data);

  return (
    <>
      <Handle
        type="target"
        position="left"
        style={{ background: '#555' }}
        isConnectable={isConnectable}
      />
      <div style={{ border: 'solid 1px #333', borderRadius: '3px', height: '100%', padding: '10px', textAlign: 'center', width: '100%' }}>
        <div style={{ fontWeight: 'bold' }}>{project}</div>
        <div>
          {/* <a href={Common.createDsLink2(data.project, data.dataset)} target="_blank">{data.dataset}</a> */}
          <a href='javascript:void(0)' onClick={selectDataset}>{dataset}</a>
        </div>
        <div>
          {column}
        </div>
      </div>

      <Handle
        type="source"
        position="right"
        isConnectable={isConnectable}
        style={{ background: '#555' }}
      />
      {/* <Handle
        type="source"
        position="right"
        id="b"
        style={{ bottom: 10, top: 'auto', background: '#555' }}
        isConnectable={isConnectable}
      /> */}
    </>
  );
});