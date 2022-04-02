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
  var link = "";

  function formatData(_data) {
    var project_splits = _data.project.split('|');
    switch (project_splits.length) {
      case 1:
        project = _data.project;
        link = Common.createProjectLink(project);
        break;
      case 2:
        project = project_splits[0];
        dataset = project_splits[1];
        link = Common.createDatasetLink(project, dataset);
        break;
      case 3:
        project = project_splits[0];
        dataset = project_splits[1];
        column = project_splits[2];
        link = Common.createDatasetLink(project, dataset);
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
          <a href={link}>
            <ArrowUpRightSquare size={18} />
          </a>
        </div>
        <div style={{ float: 'left' }}>
          <div>
            <div >
              <div className="node-item">
                <FaProjectDiagram size='16px' />
              </div>
              <div className="node-name">{project}</div>
              <div style={{ float: 'clear' }}></div>
            </div>
            {dataset != '' &&
              <div>
                <div className="lineage-node-icon">
                  <FaDatabase size='16px' /></div><div class="node-name">{dataset}</div>
                <div style={{ float: 'clear' }}></div>
              </div>
            }
            {column != '' &&
              <div>
                <div className="lineage-node-name">
                  <FaList size='16px' />
                </div>
                <div className="node-name">{column}</div>
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