import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home";
import TarifSimulateurLille from "./Lille";
import TarifSimulateurBordeaux from "./Bordeaux";
import DoucheSimulateur from "./DoucheSimulateur";
// import TarifSimulateurRennes from "./Rennes";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/bordeaux" element={<TarifSimulateurBordeaux />} />
        <Route path="/lille" element={<TarifSimulateurLille />} />
        {/* <Route path="/rennes" element={<TarifSimulateurRennes />} /> */}
        <Route path="/co2-douche" element={<DoucheSimulateur />} />
      </Routes>
    </Router>
  );
}

export default App;
