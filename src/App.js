import React, { useEffect, useState } from "react";
import Engine, { formatValue } from "publicodes";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import TarifSimulateur from "./TarifSimulateur";

function DoucheSimulateur() {
  const [engine, setEngine] = useState(null);
  const [result, setResult] = useState(null);
  const [situation, setSituation] = useState({
    "douche . fréquence": "1 douche/jour",
    "douche . durée moyenne": "10 min/douche",
    "chauffage . type": "'électricité'",
    "douche . pomme de douche économe": "non",
  });

  useEffect(() => {
    const rules = {
      douche: {
        titre: "Impact carbone d'une douche",
        description:
          "Impact carbone liée aux douches prise au cours de l'année",
        unité: "kgCO2eq/an",
        produit: ["fréquence", "impact par litre", "litres consommés"],
      },
      eau: {
        icônes: "💧",
      },
      chauffage: {
        valeur: "oui",
        icônes: "🔥",
      },
      "chauffage . type": {
        "par défaut": "'électricité'",
      },
      "douche . fréquence": {
        question: "Combien prenez-vous de douches ?",
        "par défaut": "1 douche/jour",
        suggestions: {
          "1 par jour": "1 douche/jour",
          "5 par semaine": "5 douche/semaine * 52 semaine/an",
          "2 par jour": "2 douche/jour",
        },
      },
      "douche . impact par litre": {
        somme: ["eau . impact par litre froid", "chauffage . impact par litre"],
      },
      "eau . impact par litre froid": {
        unité: "kgCO2eq/litre",
        formule: 0.000132,
      },
      "chauffage . impact par litre": {
        produit: [
          "0.0325 kWh/litre",
          {
            unité: "kgCO2eq/kWh",
            variations: [
              { si: "chauffage . type = 'gaz'", alors: 0.227 },
              { si: "chauffage . type = 'fioul'", alors: 0.324 },
              { si: "chauffage . type = 'électricité'", alors: 0.059 },
            ],
          },
        ],
      },
      "douche . litres consommés": {
        produit: ["durée moyenne", "débit"],
      },
      "douche . durée moyenne": {
        question: "Combien de temps dure votre douche en général ?",
        "par défaut": "10 min/douche",
        suggestions: {
          expresse: "5 min/douche",
          moyenne: "10 min/douche",
          lente: "20 min/douche",
        },
      },
      "douche . débit": {
        valeur: "18 litre/min",
      },
      "douche . pomme de douche économe": {
        question: "Utilisez-vous une pomme de douche économe ?",
        "par défaut": "non",
        avec: {
          débit: {
            remplace: "débit",
            valeur: "9 litre/min",
          },
        },
      },
    };

    const engine = new Engine(rules);
    setEngine(engine);
  }, []);

  useEffect(() => {
    if (engine) {
      engine.setSituation(situation);
      setResult(engine.evaluate("douche"));
    }
  }, [engine, situation]);

  if (!engine) return <div>Chargement...</div>;

  const handleChange = (name, value) => {
    setSituation((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      <h1>Simulateur CO2 douche</h1>

      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", marginBottom: "10px" }}>
          Fréquence des douches :
          <select
            value={situation["douche . fréquence"]}
            onChange={(e) => handleChange("douche . fréquence", e.target.value)}
            style={{ marginLeft: "10px" }}
          >
            <option value="1 douche/jour">1 par jour</option>
            <option value="5 douche/semaine * 52 semaine/an">
              5 par semaine
            </option>
            <option value="2 douche/jour">2 par jour</option>
          </select>
        </label>

        <label style={{ display: "block", marginBottom: "10px" }}>
          Durée moyenne :
          <select
            value={situation["douche . durée moyenne"]}
            onChange={(e) =>
              handleChange("douche . durée moyenne", e.target.value)
            }
            style={{ marginLeft: "10px" }}
          >
            <option value="5 min/douche">5 minutes (expresse)</option>
            <option value="10 min/douche">10 minutes (moyenne)</option>
            <option value="20 min/douche">20 minutes (lente)</option>
          </select>
        </label>

        <label style={{ display: "block", marginBottom: "10px" }}>
          Type de chauffage :
          <select
            value={situation["chauffage . type"]}
            onChange={(e) => handleChange("chauffage . type", e.target.value)}
            style={{ marginLeft: "10px" }}
          >
            <option value="'électricité'">Électricité</option>
            <option value="'gaz'">Gaz</option>
            <option value="'fioul'">Fioul</option>
          </select>
        </label>

        <label style={{ display: "block", marginBottom: "10px" }}>
          Pomme de douche économe :
          <select
            value={situation["douche . pomme de douche économe"]}
            onChange={(e) =>
              handleChange("douche . pomme de douche économe", e.target.value)
            }
            style={{ marginLeft: "10px" }}
          >
            <option value="non">Non</option>
            <option value="oui">Oui</option>
          </select>
        </label>
      </div>

      {result && (
        <div
          style={{
            padding: "20px",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
            marginTop: "20px",
          }}
        >
          <h2>Résultat</h2>
          <p>Impact carbone : {formatValue(result)}</p>
          <p style={{ fontSize: "0.9em", color: "#666" }}>
            À titre de comparaison, l'empreinte carbone d'un burger est estimée
            à 0.279kg
          </p>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <nav style={{ padding: "20px", background: "#eee", marginBottom: 30 }}>
        <Link to="/" style={{ marginRight: 20 }}>
          Simulateur CO2 douche
        </Link>
        <Link to="/tarifs">Simulateur de règles tarifaires</Link>
      </nav>
      <Routes>
        <Route path="/" element={<DoucheSimulateur />} />
        <Route path="/tarifs" element={<TarifSimulateur />} />
      </Routes>
    </Router>
  );
}

export default App;
