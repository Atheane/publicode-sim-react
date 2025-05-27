import React, { useEffect, useState } from "react";
import Engine, { formatValue } from "publicodes";
import yaml from "js-yaml";

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
    fetch(process.env.PUBLIC_URL + "/co2.yaml")
      .then((res) => res.text())
      .then((text) => {
        const rules = yaml.load(text);
        const engine = new Engine(rules);
        setEngine(engine);
      });
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

export default DoucheSimulateur;
