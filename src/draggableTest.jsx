import React, { useState, useEffect } from "react";
import Draggable from "react-draggable";
import axios from "axios";

const GIPHY_API_KEY = "bhPW4fBuqajABoZNUhQ4yUfCcv1lA3Uz"; // Using the provided Giphy API key
const WS_URL = "ws://localhost:8080"; // Replace with your WebSocket server URL if different

const fontSizes = Array.from({ length: 200 }, (_, i) => i + 1); // Generate sizes 1-200
const fontFamilies = [
  "Arial",
  "Verdana",
  "Helvetica",
  "Times New Roman",
  "Courier New",
  "Georgia",
  "Trebuchet MS",
  "Impact",
];
const fontColors = [
  "black",
  "white",
  "red",
  "blue",
  "green",
  "yellow",
  "purple",
  "orange",
  "pink",
  "gray",
];

const App = () => {
  const [elements, setElements] = useState([]);
  const [newText, setNewText] = useState("");
  const [fontSize, setFontSize] = useState("16");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontColor, setFontColor] = useState("black");
  const [searchQuery, setSearchQuery] = useState("");
  const [giphyResults, setGiphyResults] = useState([]);
  const [socket, setSocket] = useState(null);

  // Initialize WebSocket
  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    setSocket(ws);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (
        data.type === "update" ||
        data.type === "move" ||
        data.type === "resize" ||
        data.type === "delete"
      ) {
        setElements(data.elements);
      }
    };

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected, reconnecting...");
      setTimeout(() => setSocket(new WebSocket(WS_URL)), 3000); // Reconnect after 3 seconds
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
    const estimatedHeight = type === "text" ? parseInt(fontSize, 10) * 1.5 : 50;

    const newElement = {
      id: elements.length + 1,
      type,
      content: content || (type === "text" ? newText : ""),
      fontSize: type === "text" ? `${fontSize}px` : undefined,
      fontFamily: type === "text" ? fontFamily : undefined,
      color: type === "text" ? fontColor : undefined,
      position: { x: 100, y: 100 },
      size: { width: estimatedWidth, height: estimatedHeight },
    };

    const updatedElements = [...elements, newElement];
    setElements(updatedElements);
    sendToSocket({ type: "update", elements: updatedElements });
    setNewText(""); // Clear input after adding text
  };

  const updateElementPosition = (id, position) => {
    const updatedElements = elements.map((el) =>
      el.id === id ? { ...el, position } : el
    );
    setElements(updatedElements);
    sendToSocket({ type: "move", elements: updatedElements });
  };

  const updateElementSize = (id, size) => {
    const updatedElements = elements.map((el) =>
      el.id === id ? { ...el, size } : el
    );
    setElements(updatedElements);
    sendToSocket({ type: "resize", elements: updatedElements }); // Notify OBS of size change
  };

  const removeElement = (id) => {
    const updatedElements = elements.filter((el) => el.id !== id);
    setElements(updatedElements);
    sendToSocket({ type: "delete", elements: updatedElements }); // Notify WebSocket about removal
  };

  const searchGiphy = async () => {
    if (!searchQuery) return;
    try {
      const gifs = await axios.get(`https://api.giphy.com/v1/gifs/search`, {
        params: {
          api_key: GIPHY_API_KEY,
          q: searchQuery,
          limit: 10,
        },
      });

      const stickers = await axios.get(
        `https://api.giphy.com/v1/stickers/search`,
        {
          params: {
            api_key: GIPHY_API_KEY,
            q: searchQuery,
            limit: 10,
          },
        }
      );

      setGiphyResults([...gifs.data.data, ...stickers.data.data]);
    } catch (error) {
      console.error("Error fetching Giphy results:", error);
      setGiphyResults([]);
    }
  };

  return (
    <div>
      <header style={{ marginBottom: "10px" }}>
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Enter text here"
          style={{ marginRight: "8px" }}
        />
        <select value={fontSize} onChange={(e) => setFontSize(e.target.value)}>
          {fontSizes.map((size) => (
            <option key={size} value={size}>
              {size}px
            </option>
          ))}
        </select>
        <select
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
        >
          {fontFamilies.map((family) => (
            <option key={family} value={family}>
              {family}
            </option>
          ))}
        </select>
        <select
          value={fontColor}
          onChange={(e) => setFontColor(e.target.value)}
        >
          {fontColors.map((color) => (
            <option key={color} value={color}>
              {color}
            </option>
          ))}
        </select>
        <button onClick={() => addElement("text")} disabled={!newText}>
          Add Text
        </button>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search Giphy"
          style={{ marginLeft: "8px", marginRight: "8px" }}
        />
        <button onClick={searchGiphy}>Search</button>
      </header>

      <div style={{ display: "flex", flexWrap: "wrap", marginBottom: "10px" }}>
        {giphyResults.map((gif) => (
          <img
            key={gif.id}
            src={gif.images.fixed_width.url}
            alt={gif.title}
            width={100}
            style={{
              cursor: "pointer",
              margin: "5px",
              border: "2px solid #ccc",
              borderRadius: "4px",
            }}
            onClick={() => addElement("image", gif.images.fixed_width.url)}
          />
        ))}
      </div>

      <div
        style={{
          position: "relative",
          height: "70vh",
          border: "1px solid #ccc",
        }}
      >
        {elements.map((element) => (
          <Draggable
            key={element.id}
            position={element.position}
            onDrag={
              (e, data) =>
                updateElementPosition(element.id, { x: data.x, y: data.y }) // Live update during dragging
            }
          >
            <div
              style={{
                position: "absolute",
                width: element.size.width,
                height: element.size.height,
                overflow: "hidden", // Prevent scrollbars
                cursor: "move",
                resize: element.type === "image" ? "both" : "none", // Resizing for images only
              }}
              onResize={(e) => {
                if (element.type === "image") {
                  updateElementSize(element.id, {
                    width: e.target.offsetWidth,
                    height: e.target.offsetHeight,
                  });
                }
              }}
            >
              {element.type === "text" ? (
                <span
                  style={{
                    fontSize: element.fontSize,
                    fontFamily: element.fontFamily,
                    color: element.color,
                    userSelect: "none",
                  }}
                >
                  {element.content}
                </span>
              ) : (
                <img
                  src={element.content}
                  alt="Draggable"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent interaction with draggable
                  removeElement(element.id);
                }}
                style={{
                  position: "absolute",
                  top: "0",
                  right: "0",
                  background: "red",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                Remove
              </button>
            </div>
          </Draggable>
        ))}
      </div>
    </div>
  );
};

export default App;
