// Show the UI
figma.showUI(__html__, { width: 600, height: 600 });

// Define a TypeScript interface for node data
interface NodeData {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  characters?: string;
}

// Function to collect the top layers and exclude text layers from conversion
function getTopLayers(nodes: readonly SceneNode[]): SceneNode[] {
  const topLayers: SceneNode[] = [];
  for (const node of nodes) {
    if (node.type !== 'TEXT') {
      topLayers.push(node);
    }
  }
  return topLayers;
}

// Function to extract node details
function getNodeData(node: SceneNode): NodeData {
  const baseData: NodeData = {
    id: node.id,
    name: node.name,
    type: node.type,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
  };

  if (node.type === 'TEXT') {
    const textNode = node as TextNode;
    baseData.characters = textNode.characters;
  }

  return baseData;
}

// Function to convert nodes to PNG images
async function convertNodesToPNGs(nodes: SceneNode[]): Promise<string[]> {
  const imagePromises: Promise<string>[] = nodes.map(async (node) => {
    const image = await node.exportAsync({ format: 'PNG' });
    return figma.base64Encode(image);
  });
  return Promise.all(imagePromises);
}

// Collect nodes and export as PNG images with text layers intact
figma.ui.onmessage = async (msg: { type: string }) => {
  if (msg.type === 'export-png') {
    try {
      const selection = figma.currentPage.selection;

      if (selection.length === 0) {
        figma.ui.postMessage({
          type: 'error',
          message: 'Please select at least one node to export',
        });
        return;
      }

      // Get the top layers excluding text layers
      const topLayers = getTopLayers(selection);

      // Convert top layers to PNG images
      const pngData = await convertNodesToPNGs(topLayers);

      // Extract node data for text layers
      const textLayers = selection.filter((node) => node.type === 'TEXT').map(getNodeData);

      // Send PNG data and text layers back to UI
      figma.ui.postMessage({
        type: 'exported-png',
        pngData: pngData,
        textLayers: textLayers,
      });
    } catch (error: any) {
      figma.ui.postMessage({
        type: 'error',
        message: `Export failed: ${error.message}`,
      });
    }
  }
};