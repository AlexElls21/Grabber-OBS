import React, { useState, useEffect } from "react";
import axios from "axios";

const GIPHY_API_KEY = process.env.REACT_APP_GIPHY_API_KEY;
const WS_URL = process.env.REACT_APP_WS_URL;
console.log("here ", GIPHY_API_KEY);
const fontSizes = Array.from({ length: 101 }, (_, i) => i + 50);
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

  const TWITCH_CLIENT_ID = process.env.REACT_APP_TWITCH_CLIENT_ID; // Replace with your Twitch Client ID
  const TWITCH_REDIRECT_URI = process.env.REACT_APP_TWITCH_REDIRECT_URI; // Replace with your Redirect URI

  // State for authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  // Handle Twitch Authentication on page load
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hash.get("access_token");

    if (accessToken) {
      authenticateUser(accessToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  console.log(userInfo);

  const authenticateUser = async (accessToken) => {
    try {
      // Fetch user info from Twitch API
      const { data } = await axios.get("https://api.twitch.tv/helix/users", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Client-ID": TWITCH_CLIENT_ID,
        },
      });

      setUserInfo(data.data[0]); // Set user information
      setIsAuthenticated(true); // Mark user as authenticated
    } catch (error) {
      console.error("Failed to authenticate with Twitch:", error);
      setIsAuthenticated(false);
    }
  };

  const redirectToTwitchLogin = () => {
    const twitchAuthUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${TWITCH_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      TWITCH_REDIRECT_URI
    )}&response_type=token&scope=user:read:email`;
    window.location.href = twitchAuthUrl;
  };

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
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
    sendToSocket({ type: "update", elements: updatedElements }); // Notify DisplayPage
    setNewText("");
  };

  const searchGiphy = async (offset = 0) => {
    if (!searchQuery) return;
    try {
      const gifs = await axios.get(`https://api.giphy.com/v1/gifs/search`, {
        params: {
          api_key: GIPHY_API_KEY,
          q: searchQuery,
          limit: 5,
          offset,
        },
      });

      const stickers = await axios.get(
        `https://api.giphy.com/v1/stickers/search`,
        {
          params: {
            api_key: GIPHY_API_KEY,
            q: searchQuery,
            limit: 5,
            offset,
          },
        }
      );

      setGiphyResults([...gifs.data.data, ...stickers.data.data]);
      setGiphyOffset(offset);
    } catch (error) {
      console.error("Error fetching Giphy results:", error);
      setGiphyResults([]);
    }
  };

  const handleNext = () => {
    searchGiphy(giphyOffset + 5);
  };

  const handlePrevious = () => {
    if (giphyOffset > 0) {
      searchGiphy(giphyOffset - 5);
    }
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
      {!isAuthenticated ? (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <h2>Sign in with Twitch to Access Controls</h2>
          <button
            onClick={redirectToTwitchLogin}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              cursor: "pointer",
              backgroundColor: "#9146FF",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
            }}
          >
            Sign in with Twitch
          </button>
        </div>
      ) : (
        <div>
          <h1 style={{ textAlign: "center" }}>Control Page</h1>
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
                  {fontSizes.map((size) => (
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
                  {fontFamilies.map((family) => (
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
                  {fontColors.map((color) => (
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

              {/* Image Form */}
              <div
                style={{
                  flex: 1,
                  border: "1px solid #ccc",
                  padding: "15px",
                  borderRadius: "8px",
                }}
              >
                <h2>Search and Add Images</h2>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for Gifs or Stickers"
                  style={{
                    width: "100%",
                    marginBottom: "10px",
                    padding: "8px",
                    fontSize: "16px",
                  }}
                />
                <button
                  onClick={() => searchGiphy(0)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginBottom: "10px",
                    fontSize: "16px",
                    cursor: "pointer",
                  }}
                >
                  Search
                </button>
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    justifyContent: "center",
                    marginBottom: "10px",
                  }}
                >
                  <button
                    onClick={handlePrevious}
                    disabled={giphyOffset === 0}
                    style={{
                      padding: "10px",
                      fontSize: "16px",
                      cursor: "pointer",
                    }}
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNext}
                    style={{
                      padding: "10px",
                      fontSize: "16px",
                      cursor: "pointer",
                    }}
                  >
                    Next
                  </button>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px",
                    justifyContent: "center",
                  }}
                >
                  {giphyResults.map((gif) => (
                    <img
                      key={gif.id}
                      src={gif.images.fixed_width.url}
                      alt={gif.title}
                      width={100}
                      style={{
                        cursor: "pointer",
                        border: "2px solid #ccc",
                        borderRadius: "8px",
                      }}
                      onClick={() =>
                        addElement("image", gif.images.fixed_width.url)
                      }
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Display iframe */}
            <iframe
              src="/display"
              style={{
                width: "100%",
                height: "500px",
                border: "1px solid #ccc",
              }}
              title="Display Page"
            />
          </div>
        </div>
      )}
    </div>
  );

  // return (
  //   <div style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
  //     <h1 style={{ textAlign: "center" }}>Control Page</h1>

  //     <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
  //       {/* Text Form */}
  //       <div
  //         style={{
  //           flex: 1,
  //           border: "1px solid #ccc",
  //           padding: "15px",
  //           borderRadius: "8px",
  //         }}
  //       >
  //         <h2>Add Text</h2>
  //         <input
  //           type="text"
  //           value={newText}
  //           onChange={(e) => setNewText(e.target.value)}
  //           placeholder="Enter text here"
  //           style={{
  //             width: "100%",
  //             marginBottom: "10px",
  //             padding: "8px",
  //             fontSize: "16px",
  //           }}
  //         />
  //         <select
  //           value={fontSize}
  //           onChange={(e) => setFontSize(e.target.value)}
  //           style={{ marginBottom: "10px" }}
  //         >
  //           {fontSizes.map((size) => (
  //             <option key={size} value={size}>
  //               {size}px
  //             </option>
  //           ))}
  //         </select>
  //         <select
  //           value={fontFamily}
  //           onChange={(e) => setFontFamily(e.target.value)}
  //           style={{ marginBottom: "10px" }}
  //         >
  //           {fontFamilies.map((family) => (
  //             <option key={family} value={family}>
  //               {family}
  //             </option>
  //           ))}
  //         </select>
  //         <select
  //           value={fontColor}
  //           onChange={(e) => setFontColor(e.target.value)}
  //           style={{ marginBottom: "10px" }}
  //         >
  //           {fontColors.map((color) => (
  //             <option key={color} value={color}>
  //               {color}
  //             </option>
  //           ))}
  //         </select>
  //         <button
  //           onClick={() => addElement("text")}
  //           disabled={!newText}
  //           style={{
  //             width: "100%",
  //             padding: "10px",
  //             fontSize: "16px",
  //             cursor: "pointer",
  //           }}
  //         >
  //           Add Text
  //         </button>
  //       </div>

  //       {/* Image Form */}
  //       <div
  //         style={{
  //           flex: 1,
  //           border: "1px solid #ccc",
  //           padding: "15px",
  //           borderRadius: "8px",
  //         }}
  //       >
  //         <h2>Search and Add Images</h2>
  //         <input
  //           type="text"
  //           value={searchQuery}
  //           onChange={(e) => setSearchQuery(e.target.value)}
  //           placeholder="Search for Gifs or Stickers"
  //           style={{
  //             width: "100%",
  //             marginBottom: "10px",
  //             padding: "8px",
  //             fontSize: "16px",
  //           }}
  //         />
  //         <button
  //           onClick={() => searchGiphy(0)}
  //           style={{
  //             width: "100%",
  //             padding: "10px",
  //             marginBottom: "10px",
  //             fontSize: "16px",
  //             cursor: "pointer",
  //           }}
  //         >
  //           Search
  //         </button>
  //         <div
  //           style={{
  //             display: "flex",
  //             gap: "10px",
  //             justifyContent: "center",
  //             marginBottom: "10px",
  //           }}
  //         >
  //           <button
  //             onClick={handlePrevious}
  //             disabled={giphyOffset === 0}
  //             style={{ padding: "10px", fontSize: "16px", cursor: "pointer" }}
  //           >
  //             Previous
  //           </button>
  //           <button
  //             onClick={handleNext}
  //             style={{ padding: "10px", fontSize: "16px", cursor: "pointer" }}
  //           >
  //             Next
  //           </button>
  //         </div>
  //         <div
  //           style={{
  //             display: "flex",
  //             flexWrap: "wrap",
  //             gap: "10px",
  //             justifyContent: "center",
  //           }}
  //         >
  //           {giphyResults.map((gif) => (
  //             <img
  //               key={gif.id}
  //               src={gif.images.fixed_width.url}
  //               alt={gif.title}
  //               width={100}
  //               style={{
  //                 cursor: "pointer",
  //                 border: "2px solid #ccc",
  //                 borderRadius: "8px",
  //               }}
  //               onClick={() => addElement("image", gif.images.fixed_width.url)}
  //             />
  //           ))}
  //         </div>
  //       </div>
  //     </div>

  //     {/* Display iframe */}
  //     <iframe
  //       src="/display"
  //       style={{
  //         width: "100%",
  //         height: "500px",
  //         border: "1px solid #ccc",
  //       }}
  //       title="Display Page"
  //     />
  //   </div>
  // );
};

export default ControlPage;
