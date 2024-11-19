import React, { useState, useEffect } from "react";
import Draggable from "react-draggable";
import axios from "axios";

const GIPHY_API_KEY = "bhPW4fBuqajABoZNUhQ4yUfCcv1lA3Uz";
const WS_URL = "ws://localhost:8080";

const fontSizes = Array.from({ length: 101 }, (_, i) => i + 50); // Sizes 50-150
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
  const [fontSize, setFontSize] = useState("50");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontColor, setFontColor] = useState("black");
  const [searchQuery, setSearchQuery] = useState("");
  const [giphyResults, setGiphyResults] = useState([]);
  const [socket, setSocket] = useState(null);
  const [resizing, setResizing] = useState(null); // Track resizing state

  // Initialize WebSocket
  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    setSocket(ws);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (["update", "move", "resize", "delete"].includes(data.type)) {
        setElements(data.elements);
      }
    };

    ws.onopen = () => console.log("WebSocket connected");
    ws.onclose = () => {
      console.log("WebSocket disconnected, reconnecting...");
      setTimeout(() => setSocket(new WebSocket(WS_URL)), 3000); // Reconnect after 3 seconds
    };

    return () => ws.close();
  }, []);

  const sendToSocket = (data) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
      console.log("WebSocket update sent:", data); // Debugging
    }
  };

  const addElement = (type, content) => {
    const estimatedWidth =
      type === "text" ? (newText.length * parseInt(fontSize, 10)) / 2 : 150;
    const estimatedHeight =
      type === "text" ? parseInt(fontSize, 10) * 1.5 : 150;

    const newElement = {
      id: elements.length + 1,
      type,
      content: content || (type === "text" ? newText : ""),
      fontSize: type === "text" ? `${fontSize}px` : undefined,
      fontFamily: type === "text" ? fontFamily : undefined,
      color: type === "text" ? fontColor : undefined,
      position: { x: 100, y: 100 },
      size: { width: estimatedWidth, height: estimatedHeight },
      timestamp: Date.now(), // Used to force OBS reload
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
      el.id === id ? { ...el, size, timestamp: Date.now() } : el
    );
    setElements(updatedElements);
    sendToSocket({ type: "resize", elements: updatedElements }); // Notify OBS of size change
  };

  const removeElement = (id) => {
    const updatedElements = elements.filter((el) => el.id !== id);
    setElements(updatedElements);
    sendToSocket({ type: "update", elements: updatedElements }); // Notify OBS immediately
    console.log("Element removed and update sent:", updatedElements); // Debugging
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

  const handleMouseMove = (e) => {
    if (resizing) {
      const { id, initialWidth, initialHeight, initialMouseX, initialMouseY } =
        resizing;
      const deltaX = e.clientX - initialMouseX;
      const deltaY = e.clientY - initialMouseY;

      const newWidth = Math.max(50, initialWidth + deltaX); // Prevent width from going below 50
      const newHeight = Math.max(50, initialHeight + deltaY); // Prevent height from going below 50

      updateElementSize(id, { width: newWidth, height: newHeight });
    }
  };

  const handleMouseUp = () => {
    if (resizing) {
      sendToSocket({ type: "resize", elements }); // Finalize resize updates
      setResizing(null);
    }
  };

  return (
    <div
      className="app"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <header className="controls" style={{ marginBottom: "10px" }}>
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

      <div
        className="giphy-results controls"
        style={{ display: "flex", flexWrap: "wrap", marginBottom: "10px" }}
      >
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
        className="canvas"
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
            onDrag={(e, data) => {
              updateElementPosition(element.id, { x: data.x, y: data.y });
            }}
            disabled={resizing} // Disable dragging while resizing
          >
            <div
              style={{
                position: "absolute",
                width: element.size.width,
                height: element.size.height,
                overflow: "hidden", // Prevent scrollbars
                cursor: "move",
                border:
                  resizing?.id === element.id ? "2px dashed blue" : "none", // Highlight resizing element
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
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                  }}
                >
                  <img
                    src={`${element.content}?timestamp=${element.timestamp}`} // Force reload in OBS
                    alt="Draggable"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                  <div
                    className="resize-handle controls"
                    style={{
                      width: "10px",
                      height: "10px",
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      background: "blue",
                      cursor: "nwse-resize",
                    }}
                    onMouseDown={(e) =>
                      setResizing({
                        id: element.id,
                        initialWidth: element.size.width,
                        initialHeight: element.size.height,
                        initialMouseX: e.clientX,
                        initialMouseY: e.clientY,
                      })
                    }
                  ></div>
                </div>
              )}
              <button
                className="remove-btn controls"
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
