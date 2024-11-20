import React, { useState, useEffect } from "react";
import Draggable from "react-draggable";

const WS_URL = "ws://localhost:8080";

const DisplayPage = () => {
  const [elements, setElements] = useState([]);
  const [socket, setSocket] = useState(null);
  const [resizing, setResizing] = useState(null);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    setSocket(ws);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "update") {
        setElements(data.elements); // Synchronize elements from WebSocket
      }
    };

    ws.onopen = () => console.log("WebSocket connected");
    ws.onclose = () => {
      console.log("WebSocket disconnected, reconnecting...");
      setTimeout(() => setSocket(new WebSocket(WS_URL)), 3000);
    };

    return () => ws.close();
  }, []);

  const sendToSocket = (data) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
    }
  };

  const updateElementPosition = (id, position) => {
    const updatedElements = elements.map((el) =>
      el.id === id ? { ...el, position } : el
    );
    setElements(updatedElements);
    sendToSocket({ type: "update", elements: updatedElements });
  };

  const updateElementSize = (id, size) => {
    const updatedElements = elements.map((el) =>
      el.id === id ? { ...el, size } : el
    );
    setElements(updatedElements);
    sendToSocket({ type: "update", elements: updatedElements });
  };

  const removeElement = (id) => {
    const updatedElements = elements.filter((el) => el.id !== id); // Remove item locally
    setElements(updatedElements); // Update local state
    sendToSocket({ type: "update", elements: updatedElements }); // Send updated state to WebSocket
  };

  const handleMouseMove = (e) => {
    if (resizing) {
      const { id, initialWidth, initialHeight, initialMouseX, initialMouseY } =
        resizing;
      const deltaX = e.clientX - initialMouseX;
      const deltaY = e.clientY - initialMouseY;

      const newWidth = Math.max(50, initialWidth + deltaX);
      const newHeight = Math.max(50, initialHeight + deltaY);

      updateElementSize(id, { width: newWidth, height: newHeight });
    }
  };

  const handleMouseUp = () => setResizing(null);

  return (
    <div
      className="display-page"
      style={{
        position: "relative",
        width: "1920px",
        height: "1080px",
        overflow: "hidden",
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {elements.map((element) => (
        <Draggable
          key={element.id}
          position={element.position}
          onDrag={(e, data) => {
            updateElementPosition(element.id, { x: data.x, y: data.y });
          }}
        >
          <div
            style={{
              position: "absolute",
              width: element.size.width,
              height: element.size.height,
              cursor: "move",
            }}
          >
            {element.type === "text" ? (
              <span
                style={{
                  fontSize: element.fontSize,
                  fontFamily: element.fontFamily,
                  color: element.color,
                }}
              >
                {element.content}
              </span>
            ) : (
              <div
                style={{ position: "relative", width: "100%", height: "100%" }}
              >
                <img
                  src={`${element.content}?timestamp=${element.timestamp}`}
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
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                background: "red",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
              onClick={() => removeElement(element.id)}
            >
              Remove
            </button>
          </div>
        </Draggable>
      ))}
    </div>
  );
};

export default DisplayPage;
