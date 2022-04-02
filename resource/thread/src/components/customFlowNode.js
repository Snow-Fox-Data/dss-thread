import React, { memo } from 'react';
import eventBus from "../eventBus";

import { Handle } from 'react-flow-renderer';
import Common from '../common/common';
import { ArrowUpRightSquare, ThermometerSnow } from 'react-bootstrap-icons'
import { FaColumns, FaDatabase, FaList, FaProjectDiagram, FaQuestionCircle } from "react-icons/fa";

export default memo(({ data, isConnectable }) => {
  var project = "";
  var dataset = "";
  var column = "";

  function formatData(_data) {
    var project_splits = _data.project.split('|');
    switch (project_splits.length) {
      case 1:
        project = _data.project;
        dataset = _data.dataset;
        break;
      case 2:
        project = project_splits[0];
        dataset = project_splits[1];
        break;
      case 3:
        project = project_splits[0];
        dataset = project_splits[1];
        column = project_splits[2];
        break;
      default:
        project = _data.project;
        dataset = _data.dataset;
        break;
    }
  }

  function selectDataset(e) {
    e.preventDefault();
    eventBus.dispatch("datasetSelected", project + '|' + dataset);
  }

  formatData(data);

  return (
    <>
      <Handle
        className='thread-handle'
        type="target"
        position="left"
        isConnectable={isConnectable}
      />

      <div>

        <div style={{ float: 'right' }}>
          <ArrowUpRightSquare size={18} />
        </div>
        <div style={{ float: 'left' }}>
          <div>
            <div >
              <div style={{ float: 'left', paddingTop: '2px' }}>
                <FaProjectDiagram size='16px' />
              </div>
              <div style={{
                paddingLeft: '6px',
                float: 'left', width: '200px', whiteSpace: 'no-wrap', overflow: 'hidden', textOverflow: 'ellipsis'
              }}>{project}</div>
              <div style={{ float: 'clear' }}></div>
            </div>
            {dataset != '' &&
              <div>
                <div style={{ float: 'left', paddingTop: '2px' }}>
                  <FaDatabase size='16px' /></div><div style={{
                    paddingLeft: '6px', float: 'left', width: '200px', whiteSpace: 'no-wrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>{dataset}</div>
                <div style={{ float: 'clear' }}></div>
              </div>
            }
            {column != '' &&
              <div>
                <div style={{ float: 'left', paddingTop: '2px' }}>
                  <FaList size='16px' />
                </div>
                <div style={{ paddingLeft: '6px', float: 'left', width: '200px', whiteSpace: 'no-wrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{column}</div>
                <div style={{ float: 'clear' }}></div>
              </div>
            }
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position="right"
        isConnectable={isConnectable}
      />
    </>
  );
});