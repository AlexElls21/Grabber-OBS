import React, { useState, useEffect } from "react";
import axios from "axios";

const ControlPage = () => {
  const [elements, setElements] = useState([]);
  const [newText, setNewText] = useState("");
  const [fontSize, setFontSize] = useState("50");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontColor, setFontColor] = useState("black");
  const [searchQuery, setSearchQuery] = useState("");
  const [giphyResults, setGiphyResults] = useState([]);
  const [giphyOffset, setGiphyOffset] = useState(0); // Offset for pagination
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");
    setSocket(ws);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "update") {
        setElements(data.elements);
      }
    };

    ws.onopen = () => console.log("WebSocket connected");
    ws.onclose = () => {
      console.log("WebSocket disconnected, reconnecting...");
      setTimeout(() => setSocket(new WebSocket("ws://localhost:8080")), 3000); // Reconnect after 3 seconds
    };

    return () => ws.close();
  }, []);

  const sendToSocket = (data) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
    }
  };

  const addElement = (type, content) => {
    const estimatedWidth =
      type === "text" ? (newText.length * parseInt(fontSize, 10)) / 2 : 150;
    const estimatedHeight =
      type === "text" ? parseInt(fontSize, 10) * 1.5 : 150;

    const newElement = {
      id: Date.now(), // Use unique ID
      type,
      content: content || (type === "text" ? newText : ""),
      fontSize: type === "text" ? `${fontSize}px` : undefined,
      fontFamily: type === "text" ? fontFamily : undefined,
      color: type === "text" ? fontColor : undefined,
      position: { x: 100, y: 100 },
      size: { width: estimatedWidth, height: estimatedHeight },
      timestamp: Date.now(),
    };

    const updatedElements = [...elements, newElement];
    setElements(updatedElements);
    sendToSocket({ type: "update", elements: updatedElements });
    setNewText("");
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
      <h1 style={{ textAlign: "center" }}>Control Page</h1>

      <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        {/* Text Form */}
        <div
          style={{
            flex: 1,
            border: "1px solid #ccc",
            padding: "15px",
            borderRadius: "8px",
          }}
        >
          <h2>Add Text</h2>
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Enter text here"
            style={{
              width: "100%",
              marginBottom: "10px",
              padding: "8px",
              fontSize: "16px",
            }}
          />
          <select
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
            style={{ marginBottom: "10px" }}
          >
            {[...Array(101).keys()].map((size) => (
              <option key={size} value={size}>
                {size}px
              </option>
            ))}
          </select>
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            style={{ marginBottom: "10px" }}
          >
            {[
              "Arial",
              "Verdana",
              "Helvetica",
              "Times New Roman",
              "Courier New",
            ].map((family) => (
              <option key={family} value={family}>
                {family}
              </option>
            ))}
          </select>
          <select
            value={fontColor}
            onChange={(e) => setFontColor(e.target.value)}
            style={{ marginBottom: "10px" }}
          >
            {["black", "white", "red", "blue", "green"].map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>
          <button
            onClick={() => addElement("text")}
            disabled={!newText}
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Add Text
          </button>
        </div>

        {/* Iframe for Display Page */}
        <div
          style={{
            flex: 2,
            border: "1px solid #ccc",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <iframe
            src="/display"
            style={{
              width: "100%",
              height: "calc(100vh - 120px)", // Dynamically set height
              border: "none",
            }}
            title="Display Page"
          />
        </div>
      </div>
    </div>
  );
};

export default ControlPage;
