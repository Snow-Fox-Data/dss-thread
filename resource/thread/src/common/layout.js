import Elk from "elkjs";
import { isNode } from "react-flow-renderer";
import Lineage from "../components/lineage";

// const DEFAULT_NODE_WIDTH = 200;
// const DEFAULT_NODE_HEIGHT = 60;

export const createGraphLayout = async (elements) => {
  const nodes = [];
  const edges = [];

  const elk = new Elk({
    defaultLayoutOptions: {
      "elk.algorithm": "layered",
      "elk.contentAlignment": "V_CENTER",
      "elk.direction": "RIGHT",
      // "elk.edgeLabels.inline": true,
      "elk.edgeRouting": "SPLINES",      
      "elk.layered.spacing.nodeNodeBetweenLayers": 50,
      "elk.padding": "[top=50,left=150,bottom=25,right=25]",
      "elk.spacing.nodeNode": 25,      
    }
  });

  elements.forEach((el) => {
    if (isNode(el)) {
      nodes.push({
        id: el.id,
        width: el.__rf?.width ?? Lineage.DEFAULT_NODE_WIDTH,
        height: el.__rf?.height ?? Lineage.DEFAULT_NODE_HEIGHT
      });
    } else {
      edges.push({
        id: el.id,
        target: el.target,
        source: el.source
      });
    }
  });

  const newGraph = await elk.layout({
    id: "root",
    children: nodes,
    edges: edges
  });

  return elements.map((el) => {
    if (isNode(el)) {
      const node = newGraph?.children?.find((n) => n.id === el.id);
      el.sourcePosition = "right";
      el.targetPosition = "left";
      if (node?.x && node?.y && node?.width && node?.height) {
        el.position = {
          x: node.x - node.width / 2 + Math.random() / 1000,
          y: node.y - node.height / 2
        };
      }
    }

    return el;
  });
};
