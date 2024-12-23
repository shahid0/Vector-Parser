// Plugin to convert top layers (excluding text layers) into PNGs and place them back on the canvas
figma.showUI(__html__);

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'convert-to-png') {
    const selectedNodes = figma.currentPage.selection;

    if (selectedNodes.length === 0) {
      figma.notify('Please select at least one top-level layer or group.');
      return;
    }

    for (const node of selectedNodes) {
      if (node.type === 'TEXT') continue; // Skip text nodes directly selected

      const isGroupOrTopLevel = node.type === 'GROUP' || node.parent === figma.currentPage;
      if (!isGroupOrTopLevel) continue;

      // Export node as PNG
      const pngBytes = await node.exportAsync({
        format: 'PNG',
        constraint: { type: 'SCALE', value: 1 },
      });
      const pngHash = figma.createImage(pngBytes);
      const pngNode = figma.createRectangle();
      pngNode.resize(node.width, node.height);
      pngNode.fills = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: pngHash.hash }];

      // Offset placement to avoid overlapping with the original node
      pngNode.x = node.x + 500; // Offset by 50px on the x-axis
      pngNode.y = node.y + 500; // Offset by 50px on the y-axis
      figma.currentPage.appendChild(pngNode);

      // Clone and position text layers relative to the PNG node
      if ('findAll' in node) {
        const textNodes = node.findAll((n: SceneNode) => n.type === 'TEXT') as TextNode[];
        for (const textNode of textNodes) {
          const newText = textNode.clone();
          newText.x = textNode.x + 500; // Offset by 50px on the x-axis
          newText.y = textNode.y + 500; // Offset by 50px on the y-axis
          figma.currentPage.appendChild(newText);
        }
      }
    }

    figma.notify('Conversion complete');
  }

  figma.closePlugin();
};

// HTML part for the plugin UI
figma.showUI(
  `
  <style>
    button {
      background: #18A0FB;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
    }

    button:hover {
      background: #0D8DE3;
    }
  </style>
  <div>
    <button id="convert">Convert to PNG</button>
    <script>
      document.getElementById('convert').onclick = () => {
        parent.postMessage({ pluginMessage: { type: 'convert-to-png' } }, '*');
      };
    </script>
  </div>
  `,
  { width: 200, height: 100 }
);
