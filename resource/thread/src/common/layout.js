import Elk from "elkjs";
import { isNode } from "react-flow-renderer";

const DEFAULT_WIDTH = 172;
const DEFAULT_HEIGHT = 36;

export const createGraphLayout = async (elements) => {
  const nodes = [];
  const edges = [];

  const elk = new Elk({
    defaultLayoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.padding": "[top=200,left=100,bottom=25,right=25]",
      // "elk.spacing.componentComponent": 30,
      "elk.spacing.nodeNode": 50,
      "elk.layered.spacing.nodeNodeBetweenLayers": 25,
      // "elk.edgeLabels.inline": true,
      "elk.edgeRouting": "SPLINES"
      // "elk.algorithm": "layered",
      // "elk.contentAlignment": "V_CENTER",
      // "elk.direction": "RIGHT",
      // "elk.spacing.nodeNode": "25",
      // "elk.layered.spacing.nodeNodeBetweenLayers": "75"
      // "elk.layered.spacing": "50",
      // "elk.spacing": "50"
      // "elk.spacing.individual": "250"
      // "elk.alignment": "RIGHT"
    }
  });

  elements.forEach((el) => {
    if (isNode(el)) {
      nodes.push({
        id: el.id,
        width: el.__rf?.width ?? DEFAULT_WIDTH,
        height: el.__rf?.height ?? DEFAULT_HEIGHT
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
