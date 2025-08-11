import React, { useEffect, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";

export default function App() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });

  useEffect(() => {
    // Fetch large dataset from your backend
    fetch("http://localhost:3000/graph-data")
      .then(res => res.json())
      .then(data => {
        // react-force-graph expects `source` and `target` keys for links
        setGraphData(data);
      })
      .catch(err => console.error("Error loading graph data:", err));
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ForceGraph2D
        graphData={graphData}
        nodeLabel={node => `${node.label}: ${node.name}`}
        linkLabel={link => link.type}
        linkDirectionalArrowLength={5}
        linkDirectionalArrowRelPos={1}
        nodeCanvasObjectMode={() => "after"}
        nodeCanvasObject={(node, ctx) => {
          const label = node.name || node.id;
          ctx.font = "12px Sans-Serif";
          ctx.fillStyle = "black";
          ctx.fillText(label, node.x + 8, node.y + 3);
        }}
      />
    </div>
  );
}
