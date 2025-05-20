import React, { useEffect, useState } from "react";
import Engine, { formatValue } from "publicodes";
import yaml from "js-yaml";

function TransportTarifSimulateur() {
  const [engine, setEngine] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [explanations, setExplanations] = useState([]);
  // Situation initiale
  const [situation, setSituation] = useState({
    "type voyage": "'occasionnel'",
    "type ticket": "'1 voyage'",
    étudiant: "'non'",
    militaire: "'non'",
    "famille nombreuse": "'non'",
    périodicité: "'mensuel'",
    âge: 30,
    "quotient familial": 1200,
    salarié: "'non'",
  });

  useEffect(() => {
    // Charge le fichier YAML depuis le dossier public
    fetch(process.env.PUBLIC_URL + "/tarifs-transport.publicodes.yaml")
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
        setError(`Erreur lors du chargement ou parsing YAML: ${err.message}`);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (engine) {
      try {
        engine.setSituation(situation);
        console.log(
          "Âge condition:",
          engine.evaluate("âge >= 28 et âge < 60").nodeValue
        );
        console.log(
          "Salarié condition:",
          engine.evaluate("salarié = 'oui'").nodeValue
        );
        console.log("Tarif jeune:", engine.evaluate("tarif jeune").nodeValue);
        console.log(
          "Tarif salarié:",
          engine.evaluate("tarif salarié").nodeValue
        );
        console.log(
          "Tarif standard calculé:",
          engine.evaluate("tarif standard").nodeValue
        );
        console.log(
          "Condition âge < 11:",
          engine.evaluate("âge < 11").nodeValue
        );
        console.log(
          "Condition âge >= 11 et âge <= 27:",
          engine.evaluate("âge >= 11 et âge <= 27").nodeValue
        );
        console.log(
          "Condition âge >= 28 et âge < 60:",
          engine.evaluate("âge >= 28 et âge < 60").nodeValue
        );
        const result = engine.evaluate("tarif");
        setResult(result);
        // À ajouter dans la fonction TransportTarifSimulateur, après le calcul du résultat
        const trancheSolidaire = engine.evaluate("tranche solidaire").nodeValue;
        console.log("Tranche solidaire calculée:", trancheSolidaire);
        // Génération des explications
        const newExplanations = [];
        if (situation["type voyage"] === "'occasionnel'") {
          if (
            situation["type ticket"] === "'10 voyage'" &&
            (situation["étudiant"] === "'oui'" ||
              situation["militaire"] === "'oui'" ||
              situation["famille nombreuse"] === "'oui'")
          ) {
            newExplanations.push(
              "Vous bénéficiez du tarif réduit pour 10 voyages."
            );
          }
        } else if (situation["type voyage"] === "'fréquent'") {
          const age = parseInt(situation["âge"]);
          const qf = parseInt(situation["quotient familial"]);

          if (qf <= 1000) {
            const tranche = qf <= 600 ? "1" : qf <= 800 ? "2" : "3";
            newExplanations.push(
              `Vous êtes éligible au tarif solidaire (tranche ${tranche}).`
            );
          }

          if (age < 11) {
            newExplanations.push("Tarif Pitchoun appliqué (moins de 11 ans).");
          } else if (age <= 27) {
            newExplanations.push("Tarif Jeune appliqué (11-27 ans).");
          } else if (age >= 60) {
            newExplanations.push("Tarif Senior appliqué (60 ans et plus).");
          } else if (situation["salarié"] === "'oui'") {
            newExplanations.push("Tarif Salarié appliqué.");
          } else {
            newExplanations.push("Tarif Classique appliqué (28-59 ans).");
          }
        } else if (situation["type voyage"] === "'scolaire'") {
          newExplanations.push("Les transports scolaires sont gratuits.");
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
  if (error) return <div className="error">Erreur: {error}</div>;

  return (
    <div
      className="simulator-container"
      style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}
    >
      <h1>Simulateur de tarifs de transport</h1>
      <p>Calculez votre tarif en fonction de votre situation</p>

      <div className="form-section">
        <h2>Votre voyage</h2>

        <div className="form-group">
          <label>Type de voyage</label>
          <select
            value={situation["type voyage"]}
            onChange={(e) => handleChange("type voyage", e.target.value)}
          >
            <option value="'occasionnel'">Occasionnel</option>
            <option value="'fréquent'">Fréquent (abonnement)</option>
            <option value="'scolaire'">Scolaire</option>
          </select>
        </div>

        {situation["type voyage"] === "'occasionnel'" && (
          <div className="form-group">
            <label>Type de ticket</label>
            <select
              value={situation["type ticket"]}
              onChange={(e) => handleChange("type ticket", e.target.value)}
            >
              <option value="'1 voyage'">1 voyage</option>
              <option value="'2 voyage'">2 voyages</option>
              <option value="'10 voyage'">10 voyages</option>
            </select>
          </div>
        )}

        {situation["type voyage"] === "'occasionnel'" &&
          situation["type ticket"] === "'10 voyage'" && (
            <div className="eligibility-section">
              <h3>Éligibilité au tarif réduit</h3>

              <div className="form-group">
                <label>Étudiant ?</label>
                <select
                  value={situation["étudiant"]}
                  onChange={(e) => handleChange("étudiant", e.target.value)}
                >
                  <option value="'non'">Non</option>
                  <option value="'oui'">Oui</option>
                </select>
              </div>

              <div className="form-group">
                <label>Militaire ?</label>
                <select
                  value={situation["militaire"]}
                  onChange={(e) => handleChange("militaire", e.target.value)}
                >
                  <option value="'non'">Non</option>
                  <option value="'oui'">Oui</option>
                </select>
              </div>

              <div className="form-group">
                <label>Famille nombreuse ?</label>
                <select
                  value={situation["famille nombreuse"]}
                  onChange={(e) =>
                    handleChange("famille nombreuse", e.target.value)
                  }
                >
                  <option value="'non'">Non</option>
                  <option value="'oui'">Oui</option>
                </select>
                <small>
                  3 enfants de moins de 18 ans dans le foyer, carte SNCF Famille
                  Nombreuse, ou 5 enfants dans le foyer
                </small>
              </div>
            </div>
          )}

        {situation["type voyage"] === "'fréquent'" && (
          <>
            <div className="form-group">
              <label>Périodicité</label>
              <select
                value={situation["périodicité"]}
                onChange={(e) => handleChange("périodicité", e.target.value)}
              >
                <option value="'mensuel'">Mensuel</option>
                <option value="'annuel'">Annuel</option>
              </select>
            </div>

            <h3>Informations personnelles</h3>

            <div className="form-group">
              <label>Âge</label>
              <input
                type="number"
                value={situation["âge"]}
                onChange={(e) => handleChange("âge", parseInt(e.target.value))}
                min="0"
                max="120"
              />
            </div>

            <div className="form-group">
              <label>Quotient familial (€)</label>
              <input
                type="number"
                value={situation["quotient familial"]}
                onChange={(e) =>
                  handleChange("quotient familial", parseInt(e.target.value))
                }
                min="0"
              />
              <small>
                Montant fourni par la CAF ou calculé à partir de vos revenus
              </small>
            </div>

            {situation["âge"] >= 28 && situation["âge"] < 60 && (
              <div className="form-group">
                <label>Êtes-vous salarié ?</label>
                <select
                  value={situation["salarié"]}
                  onChange={(e) => handleChange("salarié", e.target.value)}
                >
                  <option value="'non'">Non</option>
                  <option value="'oui'">Oui</option>
                </select>
              </div>
            )}
          </>
        )}
      </div>

      {result && (
        <div
          className="result-section"
          style={{
            marginTop: "30px",
            padding: "20px",
            backgroundColor: "#f5f7fa",
            borderRadius: "8px",
          }}
        >
          <h2>Votre tarif</h2>
          <div
            className="tarif"
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#2c3e50",
              margin: "15px 0",
            }}
          >
            {formatValue(result)} €
            {situation["périodicité"] === "'mensuel'" &&
            situation["type voyage"] === "'fréquent'"
              ? "/mois"
              : situation["périodicité"] === "'annuel'" &&
                situation["type voyage"] === "'fréquent'"
              ? "/an"
              : ""}
          </div>

          {explanations.length > 0 && (
            <div className="explanations">
              <h3>Détails</h3>
              <ul>
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

export default TransportTarifSimulateur;
