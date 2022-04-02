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

  function openItem() {
    if (dataset != '')
      eventBus.dispatch("datasetSelected", data.project);
    else
      eventBus.dispatch("project", data.project);
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
          <a onClick={() => openItem()} href='#'>
            <ArrowUpRightSquare size={18} />
          </a>
        </div>
        <div style={{ float: 'left', width: '220px' }}>
          <div>
            <div>
              <div className="lineage-node-icon">
                <FaProjectDiagram size='16px' />
              </div>
              <div className="lineage-node-name">{project}</div>
              <div style={{ clear: 'both' }}></div>
            </div>
            {dataset != '' &&
              <div>
                <div className="lineage-node-icon">
                  <FaDatabase size='16px' />
                </div>
                <div class="lineage-node-name">{dataset}</div>
                <div style={{ clear: 'both' }}></div>
              </div>
            }
            {column != '' &&
              <div>
                <div className="lineage-node-icon">
                  <FaList size='16px' />
                </div>
                <div className="lineage-node-name">{column}</div>
                <div style={{ clear: 'both' }}></div>
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