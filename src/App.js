import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home";
import TarifSimulateurLille from "./TarifSimulateurLille";
import TarifSimulateurBordeaux from "./TarifSimulateurBordeaux";
import DoucheSimulateur from "./DoucheSimulateur";
import TarifSimulateurRennes from "./TarifSimulateurRennes";
import TarifSimulateurColmar from "./TarifSimulateurColmar";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tarifs-lille" element={<TarifSimulateurLille />} />
        <Route path="/tarifs-bordeaux" element={<TarifSimulateurBordeaux />} />
        <Route path="/tarifs-rennes" element={<TarifSimulateurRennes />} />
        <Route path="/tarifs-colmar" element={<TarifSimulateurColmar />} />
        <Route path="/co2-douche" element={<DoucheSimulateur />} />
      </Routes>
    </Router>
  );
}

export default App;
