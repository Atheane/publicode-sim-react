import React, { useEffect, useState } from "react";
import Engine, { formatValue } from "publicodes";
import yaml from "js-yaml";

function TransportBordeauxSimulateur() {
  const [engine, setEngine] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [explanations, setExplanations] = useState([]);

  const [situation, setSituation] = useState({
    "type voyage": "'occasionnel'",
    "type ticket": "'1 voyage'",
    étudiant: "'non'",
    militaire: "'non'",
    "carte combattant": "'non'",
    "service civique": "'non'",
    "famille nombreuse": "'non'",
    périodicité: "'mensuel'",
    âge: 30,
    "quotient familial": 1000,
    "salarié entreprise partenaire": "'non'",
    "situation handicap": 0,
  });

  useEffect(() => {
    fetch(process.env.PUBLIC_URL + "/bordeaux.yaml")
      .then((response) => {
        if (!response.ok) throw new Error("Fichier YAML non trouvé");
        return response.text();
      })
      .then((yamlText) => {
        // Prétraitement du texte YAML pour supprimer les symboles € problématiques
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
    if (engine) {
      try {
        engine.setSituation(situation);
        const result = engine.evaluate("tarif");
        setResult(result);

        // Génération des explications
        const newExplanations = [];

        const handicap = parseInt(situation["situation handicap"]);
        const isCombattant = situation["carte combattant"] === "'oui'";
        const qf = parseInt(situation["quotient familial"]);

        if (situation["type voyage"] === "'occasionnel'") {
          if (
            situation["type ticket"] === "'10 voyages'" &&
            (situation["étudiant"] === "'oui'" ||
              situation["militaire"] === "'oui'" ||
              situation["famille nombreuse"] === "'oui'" ||
              situation["carte combattant"] === "'oui'" ||
              situation["service civique"] === "'oui'")
          ) {
            newExplanations.push(
              "Vous bénéficiez du tarif réduit pour 10 voyages."
            );
          }
        } else if (situation["type voyage"] === "'fréquent'") {
          if (handicap >= 50) {
            newExplanations.push(
              "Gratuité - Situation de handicap (taux ≥ 50%)"
            );
          } else if (isCombattant) {
            newExplanations.push("Gratuité - Titulaire carte du combattant");
          } else if (qf <= 555) {
            newExplanations.push(
              "Gratuité - Tarif solidaire tranche 1 (QF ≤ 555€)"
            );
          } else {
            if (qf <= 775) {
              newExplanations.push("Tarif solidaire tranche 2 (réduction 50%)");
            } else if (qf <= 970) {
              newExplanations.push("Tarif solidaire tranche 3 (réduction 30%)");
            }

            const age = parseInt(situation["âge"]);
            if (age < 5) {
              newExplanations.push("Gratuit pour les moins de 5 ans");
            } else if (age <= 10) {
              newExplanations.push("Tarif Pitchoun (5-10 ans)");
            } else if (age <= 27) {
              newExplanations.push("Tarif Jeune (11-27 ans)");
            } else if (age >= 60) {
              newExplanations.push("Tarif Senior (60 ans et plus)");
            } else if (situation["salarié entreprise partenaire"] === "'oui'") {
              newExplanations.push("Tarif Salarié entreprise partenaire");
            } else {
              newExplanations.push("Tarif Classique (28-59 ans)");
            }
          }
        } else if (situation["type voyage"] === "'scolaire'") {
          newExplanations.push("Les transports scolaires sont gratuits");
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

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <h1>🚌 Simulateur Tarifs Transport Bordeaux Métropole</h1>
      <p>Calculez votre tarif en fonction de votre situation</p>

      <div
        style={{
          marginBottom: "20px",
          padding: "20px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
        }}
      >
        <h2>Type de voyage</h2>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Type de voyage :
          </label>
          <select
            value={situation["type voyage"]}
            onChange={(e) => handleChange("type voyage", e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          >
            <option value="'occasionnel'">Occasionnel</option>
            <option value="'fréquent'">Fréquent (abonnement)</option>
            <option value="'scolaire'">Scolaire</option>
          </select>
        </div>

        {situation["type voyage"] === "'occasionnel'" && (
          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              Type de ticket :
            </label>
            <select
              value={situation["type ticket"]}
              onChange={(e) => handleChange("type ticket", e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            >
              <option value="'1 voyage'">1 voyage</option>
              <option value="'2 voyages'">2 voyages</option>
              <option value="'10 voyages'">10 voyages</option>
            </select>
          </div>
        )}

        {situation["type voyage"] === "'fréquent'" && (
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
              <option value="'annuel'">Annuel</option>
            </select>
          </div>
        )}
      </div>

      {situation["type voyage"] === "'occasionnel'" &&
        situation["type ticket"] === "'10 voyages'" && (
          <div
            style={{
              marginBottom: "20px",
              padding: "20px",
              backgroundColor: "#e3f2fd",
              borderRadius: "8px",
            }}
          >
            <h2>Éligibilité au tarif réduit</h2>

            {[
              "étudiant",
              "militaire",
              "famille nombreuse",
              "service civique",
            ].map((field) => (
              <div key={field} style={{ marginBottom: "15px" }}>
                <label style={{ display: "flex", alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={situation[field] === "'oui'"}
                    onChange={(e) =>
                      handleChange(field, e.target.checked ? "'oui'" : "'non'")
                    }
                    style={{ marginRight: "10px" }}
                  />
                  {field === "étudiant" && "Étudiant"}
                  {field === "militaire" && "Militaire"}
                  {field === "famille nombreuse" && "Famille nombreuse"}
                  {field === "service civique" && "En service civique"}
                </label>
              </div>
            ))}
          </div>
        )}

      {situation["type voyage"] === "'fréquent'" && (
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
              ≤ 555€: gratuit | 556-775€: -50% | 776-970€: -30%
            </small>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              Taux d'incapacité (%) :
            </label>
            <input
              type="number"
              value={situation["situation handicap"]}
              onChange={(e) =>
                handleChange("situation handicap", parseInt(e.target.value))
              }
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
              min="0"
              max="100"
            />
            <small style={{ color: "#666" }}>≥ 50% = gratuit</small>
          </div>

          {situation["âge"] >= 28 && situation["âge"] < 60 && (
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "flex", alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={
                    situation["salarié entreprise partenaire"] === "'oui'"
                  }
                  onChange={(e) =>
                    handleChange(
                      "salarié entreprise partenaire",
                      e.target.checked ? "'oui'" : "'non'"
                    )
                  }
                  style={{ marginRight: "10px" }}
                />
                Salarié d'une entreprise partenaire TBM
              </label>
            </div>
          )}
        </div>
      )}

      <div style={{ marginBottom: "15px" }}>
        <label style={{ display: "flex", alignItems: "center" }}>
          <input
            type="checkbox"
            checked={situation["carte combattant"] === "'oui'"}
            onChange={(e) =>
              handleChange(
                "carte combattant",
                e.target.checked ? "'oui'" : "'non'"
              )
            }
            style={{ marginRight: "10px" }}
          />
          Titulaire de la carte du combattant
        </label>
      </div>

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
                {situation["périodicité"] === "'mensuel'" &&
                situation["type voyage"] === "'fréquent'"
                  ? "/mois"
                  : situation["périodicité"] === "'annuel'" &&
                    situation["type voyage"] === "'fréquent'"
                  ? "/an"
                  : ""}
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
        </div>
      )}
    </div>
  );
}

export default TransportBordeauxSimulateur;
