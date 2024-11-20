import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import ControlPage from "./ControlPage";
import DisplayPage from "./DisplayPage";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ControlPage />} />
        <Route path="/display" element={<DisplayPage />} />
      </Routes>
    </Router>
  );
};

export default App;
