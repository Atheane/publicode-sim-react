import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home";
import TarifSimulateur from "./TarifSimulateur";
import DoucheSimulateur from "./DoucheSimulateur";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tarifs" element={<TarifSimulateur />} />
        <Route path="/co2-douche" element={<DoucheSimulateur />} />
      </Routes>
    </Router>
  );
}

export default App;
