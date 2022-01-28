import React, { memo } from 'react';
import eventBus from "../eventBus";

import { Handle } from 'react-flow-renderer';

export default memo(({ data, isConnectable }) => {

  function createDsLink2(proj, ds) {
    return '/projects/' + proj + '/datasets/' + ds + '/explore/';
  }

  function selectDataset() {
    eventBus.dispatch("datasetSelected", data.project + '.' + data.dataset);
  }

  return (
    <>
      <Handle
        type="target"
        position="left"
        style={{ background: '#555' }}
        isConnectable={isConnectable}
      />
      <div style={{ border: 'solid 1px #333', borderRadius: '3px', textAlign: 'center', padding: '10px' }}>
        <div style={{ fontWeight: 'bold' }}>{data.project}</div>
        <div>
          {/* <a href={createDsLink2(data.project, data.dataset)} target="_blank">{data.dataset}</a> */}
          <a href='#' onclick={selectDataset}>{data.dataset}</a>
        </div>
        <div>
          {data.column}
        </div>
      </div>

      <Handle
        type="source"
        position="right"
        isConnectable={isConnectable}
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