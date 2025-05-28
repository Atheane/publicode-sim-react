import React, { useEffect, useState } from "react";
import Engine, { formatValue } from "publicodes";
import yaml from "js-yaml";

function TransportLilleSimulateur() {
  const [engine, setEngine] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [explanations, setExplanations] = useState([]);

  const [situation, setSituation] = useState({
    "type transport": "'abonnement'", // Changé pour tester
    "type billet": "'unitaire'",
    "type abonnement": "'standard'",
    périodicité: "'mensuel'", // Assurez-vous que c'est bien défini
    âge: 30,
    "quotient familial": 600, // Changé pour correspondre à votre test
    coquelicot: "non",
    iris: "non",
    css: "non",
    qf0: "non",
  });

  useEffect(() => {
    fetch(process.env.PUBLIC_URL + "/lille.yaml")
      .then((response) => {
        if (!response.ok) throw new Error("Fichier YAML non trouvé");
        return response.text();
      })
      .then((yamlText) => {
        const processedYaml = yamlText.replace(/(\d+(\.\d+)?)\s*€/g, "$1");
        const rules = yaml.load(processedYaml);
        const newEngine = new Engine(rules);
        setEngine(newEngine);
        setLoading(false);
      })
      .catch((err) => {
        setError(`Erreur lors du chargement: ${err.message}`);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    console.log(situation);

    if (engine) {
      try {
        engine.setSituation(situation);
        const result = engine.evaluate("tarif");
        setResult(result);

        // Génération des explications
        const newExplanations = [];
        const age = parseInt(situation["âge"]);
        const qf = parseInt(situation["quotient familial"]);

        if (situation["type transport"] === "'occasionnel'") {
          const billetLabels = {
            "'unitaire'": "Trajet unitaire",
            "'unitaire x10'": "Trajet unitaire x10",
            "'zap'": "Trajet ZAP",
            "'mwr sans correspondance'": "Trajet MWR sans correspondance",
            "'mwr avec correspondance'": "Trajet MWR avec correspondance",
            "'integre'": "Trajet intégré",
            "'mwr x10 sans correspondance'":
              "Trajet x10 MWR sans correspondance",
            "'mwr x10 avec correspondance'":
              "Trajet x10 MWR avec correspondance",
            "'handipole'": "Trajet Handipole",
            "'rsa x10'": "Trajet x10 RSA",
            "'pass soiree'": "Pass Soirée",
            "'pass 1 jour'": "Pass 1 jour",
            "'pass 2 jours'": "Pass 2 jours",
            "'pass 3 jours'": "Pass 3 jours",
            "'pass 4 jours'": "Pass 4 jours",
            "'pass 5 jours'": "Pass 5 jours",
            "'pass 6 jours'": "Pass 6 jours",
            "'pass 7 jours'": "Pass 7 jours",
            "'semaine mwr'": "Semaine MWR sans correspondance",
            "'semaine integree'": "Formule semaine intégrée",
            "'hebdo ter'": "Mon ABO TER Hebdo",
          };
          newExplanations.push(
            billetLabels[situation["type billet"]] || "Billet occasionnel"
          );
        } else if (situation["type transport"] === "'abonnement'") {
          if (age < 18) {
            newExplanations.push("Titre moins de 18 ans - GRATUIT");
          } else if (situation["coquelicot"] === "oui") {
            newExplanations.push(
              "Abonnement Coquelicot - Tarif spécial pour non/mal voyants"
            );
          } else if (situation["iris"] === "oui") {
            newExplanations.push(
              "Abonnement Iris - Tarif spécial demandeurs d'emploi"
            );
          } else if (situation["css"] === "oui") {
            newExplanations.push(
              "Tarif CSS - Bénéficiaires CSS non participative ou AME"
            );
          } else if (situation["qf0"] === "oui" && age >= 65) {
            newExplanations.push("Tarif QF0 - Seniors à très faibles revenus");
          } else if (situation["type abonnement"] === "'abo ter mensuel'") {
            newExplanations.push("Mon ABO TER Mensuel");
          } else if (situation["type abonnement"] === "'abo ter permanent'") {
            newExplanations.push("Mon ABO + TER");
          } else if (situation["type abonnement"] === "'vlille reduit'") {
            newExplanations.push("Abonnement V'Lille 1 an tarif réduit");
          } else if (situation["type abonnement"] === "'vlille standard'") {
            newExplanations.push("Abonnement V'Lille 1 an");
          } else if (qf <= 716) {
            let tranche = "";
            if (qf < 374) tranche = "QF1 (< 374€)";
            else if (qf <= 537) tranche = "QF2 (375-537€)";
            else tranche = "QF3 (538-716€)";

            let categorie = "";
            if (age <= 25) categorie = "4-25 ans";
            else if (age <= 64) categorie = "26-64 ans";
            else categorie = "65 ans et plus";

            newExplanations.push(`Tarif réduit ${tranche} - ${categorie}`);
          } else {
            let categorie = "";
            if (age <= 25) categorie = "4-25 ans";
            else if (age <= 64) categorie = "Tout public";
            else categorie = "65 ans et plus";

            newExplanations.push(`Tarif standard ${categorie}`);
          }

          const periodiciteLabels = {
            "'mensuel'": "mensuel",
            "'permanent'": "permanent (engagement 12 mois)",
            "'10 mois'": "10 mois",
          };

          if (situation["type abonnement"] === "'standard'") {
            newExplanations.push(
              `Abonnement ${periodiciteLabels[situation["périodicité"]]}`
            );
          }
        }

        setExplanations(newExplanations);
      } catch (error) {
        console.error("Erreur lors de l'évaluation:", error);
        setError(`Erreur lors de l'évaluation: ${error.message}`);
      }
    }
  }, [engine, situation]);

  const handleChange = (name, value) => {
    setSituation((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading) return <div>Chargement du simulateur...</div>;
  if (error) return <div style={{ color: "red" }}>Erreur: {error}</div>;

  const showPeriodicite =
    situation["type transport"] === "'abonnement'" &&
    situation["type abonnement"] === "'standard'";

  const showAbonnementSpecifique =
    situation["type transport"] === "'abonnement'" &&
    situation["âge"] >= 26 &&
    situation["âge"] <= 64 &&
    situation["quotient familial"] > 716 &&
    situation["coquelicot"] === "non" &&
    situation["iris"] === "non" &&
    situation["css"] === "non" &&
    situation["qf0"] === "non";

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <h1>🚇 Simulateur Tarifs Transport Métropole Européenne de Lille</h1>
      <p>
        Calculez votre tarif ilévia, Arc En Ciel et TER en fonction de votre
        situation
      </p>

      <div
        style={{
          marginBottom: "20px",
          padding: "20px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
        }}
      >
        <h2>Type de transport</h2>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Type de transport :
          </label>
          <select
            value={situation["type transport"]}
            onChange={(e) => handleChange("type transport", e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          >
            <option value="'occasionnel'">Occasionnel (billets et pass)</option>
            <option value="'abonnement'">Abonnement</option>
          </select>
        </div>

        {situation["type transport"] === "'occasionnel'" && (
          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              Type de billet :
            </label>
            <select
              value={situation["type billet"]}
              onChange={(e) => handleChange("type billet", e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            >
              <optgroup label="Trajets unitaires">
                <option value="'unitaire'">Trajet unitaire (1,80€)</option>
                <option value="'unitaire x10'">
                  Trajet unitaire x10 (15,60€)
                </option>
                <option value="'zap'">Trajet ZAP (1,15€)</option>
                <option value="'handipole'">Trajet Handipole (3,10€)</option>
                <option value="'rsa x10'">Trajet x10 RSA (7,90€)</option>
              </optgroup>
              <optgroup label="Trajets MWR">
                <option value="'mwr sans correspondance'">
                  MWR sans correspondance (2,25€)
                </option>
                <option value="'mwr avec correspondance'">
                  MWR avec correspondance (2,45€)
                </option>
                <option value="'integre'">Trajet intégré (2,30€)</option>
                <option value="'mwr x10 sans correspondance'">
                  MWR x10 sans correspondance (18,20€)
                </option>
                <option value="'mwr x10 avec correspondance'">
                  MWR x10 avec correspondance (20,20€)
                </option>
              </optgroup>
              <optgroup label="Pass journaliers">
                <option value="'pass soiree'">Pass Soirée (2,50€)</option>
                <option value="'pass 1 jour'">Pass 1 jour (5,40€)</option>
                <option value="'pass 2 jours'">Pass 2 jours (9,80€)</option>
                <option value="'pass 3 jours'">Pass 3 jours (13,00€)</option>
                <option value="'pass 4 jours'">Pass 4 jours (15,10€)</option>
                <option value="'pass 5 jours'">Pass 5 jours (16,80€)</option>
                <option value="'pass 6 jours'">Pass 6 jours (17,90€)</option>
                <option value="'pass 7 jours'">Pass 7 jours (18,40€)</option>
              </optgroup>
              <optgroup label="Pass hebdomadaires">
                <option value="'semaine mwr'">Semaine MWR (13,00€)</option>
                <option value="'semaine integree'">
                  Semaine intégrée (21,00€)
                </option>
                <option value="'hebdo ter'">Mon ABO TER Hebdo (10,70€)</option>
              </optgroup>
            </select>
          </div>
        )}

        {showAbonnementSpecifique && (
          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              Type d'abonnement :
            </label>
            <select
              value={situation["type abonnement"]}
              onChange={(e) => handleChange("type abonnement", e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            >
              <option value="'standard'">Abonnement standard</option>
              <option value="'abo ter mensuel'">
                Mon ABO TER Mensuel (63,00€/mois)
              </option>
              <option value="'abo ter permanent'">
                Mon ABO + TER (55,00€/mois)
              </option>
              <option value="'vlille reduit'">
                Abonnement V'Lille 1 an tarif réduit (27,00€)
              </option>
              <option value="'vlille standard'">
                Abonnement V'Lille 1 an (40,50€)
              </option>
            </select>
          </div>
        )}

        {showPeriodicite && (
          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              Périodicité :
            </label>
            <select
              value={situation["périodicité"]}
              onChange={(e) => handleChange("périodicité", e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            >
              <option value="'mensuel'">Mensuel</option>
              <option value="'permanent'">
                Permanent (engagement 12 mois)
              </option>
              {(parseInt(situation["âge"]) <= 25 ||
                (parseInt(situation["quotient familial"]) <= 716 &&
                  parseInt(situation["âge"]) <= 25)) && (
                <option value="'10 mois'">10 mois</option>
              )}
            </select>
          </div>
        )}
      </div>

      {situation["type transport"] === "'abonnement'" && (
        <div
          style={{
            marginBottom: "20px",
            padding: "20px",
            backgroundColor: "#fff3e0",
            borderRadius: "8px",
          }}
        >
          <h2>Informations personnelles</h2>

          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              Âge :
            </label>
            <input
              type="number"
              value={situation["âge"]}
              onChange={(e) => handleChange("âge", parseInt(e.target.value))}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
              min="0"
              max="120"
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              Quotient familial (€) :
            </label>
            <input
              type="number"
              value={situation["quotient familial"]}
              onChange={(e) =>
                handleChange("quotient familial", parseInt(e.target.value))
              }
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
              min="0"
            />
            <small style={{ color: "#666" }}>
              QF1: &lt; 374€ | QF2: 375-537€ | QF3: 538-716€ | &gt; 716€: tarif
              standard
            </small>
          </div>

          <div
            style={{
              marginBottom: "20px",
              padding: "15px",
              backgroundColor: "#e3f2fd",
              borderRadius: "6px",
            }}
          >
            <h3>Tarifs spéciaux</h3>

            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "flex", alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={situation["coquelicot"] === "oui"}
                  onChange={(e) =>
                    handleChange("coquelicot", e.target.checked ? "oui" : "non")
                  }
                  style={{ marginRight: "10px" }}
                />
                Tarif Coquelicot (non/mal voyant, CMI cécité) - 7,90€/mois
              </label>
            </div>

            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "flex", alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={situation["iris"] === "oui"}
                  onChange={(e) =>
                    handleChange("iris", e.target.checked ? "oui" : "non")
                  }
                  style={{ marginRight: "10px" }}
                />
                Tarif Iris (demandeur d'emploi) - 7,90€/mois
              </label>
            </div>

            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "flex", alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={situation["css"] === "oui"}
                  onChange={(e) =>
                    handleChange("css", e.target.checked ? "oui" : "non")
                  }
                  style={{ marginRight: "10px" }}
                />
                CSS non participative ou AME
              </label>
            </div>

            {situation["âge"] >= 65 && (
              <div style={{ marginBottom: "10px" }}>
                <label style={{ display: "flex", alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={situation["qf0"] === "oui"}
                    onChange={(e) =>
                      handleChange("qf0", e.target.checked ? "oui" : "non")
                    }
                    style={{ marginRight: "10px" }}
                  />
                  QF0 (non imposable ou &lt; 300€ d'impôts) - 7,90€/mois
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      {result && (
        <div
          style={{
            padding: "30px",
            backgroundColor: result.nodeValue === 0 ? "#e8f5e8" : "#f5f5f5",
            borderRadius: "8px",
            marginTop: "20px",
            border:
              result.nodeValue === 0 ? "2px solid #4caf50" : "1px solid #ddd",
          }}
        >
          <h2 style={{ color: result.nodeValue === 0 ? "#2e7d32" : "#333" }}>
            {result.nodeValue === 0 ? "🎉 Transport GRATUIT !" : "💰 Tarif"}
          </h2>

          <div
            style={{
              fontSize: "1.5em",
              fontWeight: "bold",
              marginBottom: "10px",
            }}
          >
            {result.nodeValue === 0 ? (
              <span style={{ color: "#2ecc71" }}>Gratuit</span>
            ) : (
              <>
                {formatValue(result)} €
                {situation["type transport"] === "'abonnement'" &&
                  situation["type abonnement"] === "'standard'" &&
                  (situation["périodicité"] === "'mensuel'" ||
                    situation["périodicité"] === "'permanent'") &&
                  "/mois"}
                {situation["type transport"] === "'abonnement'" &&
                  situation["périodicité"] === "'10 mois'" &&
                  "/mois (formule 10 mois)"}
                {(situation["type abonnement"] === "'abo ter mensuel'" ||
                  situation["type abonnement"] === "'abo ter permanent'") &&
                  "/mois"}
              </>
            )}
          </div>

          {explanations.length > 0 && (
            <div style={{ marginTop: "15px" }}>
              <strong>Détails :</strong>
              <ul style={{ margin: "5px 0", paddingLeft: "20px" }}>
                {explanations.map((explanation, index) => (
                  <li key={index}>{explanation}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ marginTop: "15px", fontSize: "0.9em", color: "#666" }}>
            <strong>Zones couvertes :</strong> Métropole Européenne de Lille
            (MEL), réseaux ilévia, Arc En Ciel et TER, ligne MWR (Mouscron,
            Wattrelos, Roubaix)
          </div>
        </div>
      )}
    </div>
  );
}

export default TransportLilleSimulateur;
