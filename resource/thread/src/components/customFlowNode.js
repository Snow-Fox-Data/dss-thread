import React, { memo } from 'react';
import eventBus from "../eventBus";

import { Handle } from 'react-flow-renderer';
import Common from '../common/common';

export default memo(({ data, isConnectable }) => {
  var project = "";
  var dataset = "";
  var column = "";

  function selectDataset(e) {
    e.preventDefault();
    eventBus.dispatch("datasetSelected", data.project + '|' + data.dataset);
  }

  console.log('customFlowNode :: data == ');
  console.log(data);

  var base_splits = data.project.split(' | ');

  console.log('base_splits == ');
  console.log(base_splits);

  return (
    <>
      <Handle
        type="target"
        position="left"
        style={{ background: '#555' }}
        isConnectable={isConnectable}
      />
      <div style={{ border: 'solid 1px #333', borderRadius: '3px', height: '100%', padding: '10px', textAlign: 'center', width: '100%' }}>
        <div style={{ fontWeight: 'bold' }}>{data.project}</div>
        <div>
          {/* <a href={Common.createDsLink2(data.project, data.dataset)} target="_blank">{data.dataset}</a> */}
          <a href='javascript:void(0)' onClick={selectDataset}>{data.dataset}</a>
        </div>
        <div>
          {data.column}
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