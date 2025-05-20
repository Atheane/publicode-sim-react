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
        const result = engine.evaluate("tarif");
        setResult(result);

        // Génération des explications
        const newExplanations = [];

        // Vérifier les conditions de gratuité en premier
        const handicap = parseInt(situation["situation handicap"]);
        const isCombattant = situation["carte combattant"] === "'oui'";
        const qf = parseInt(situation["quotient familial"]);

        // Déterminer le type de voyage et les explications associées
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
          // Cas de gratuité - à traiter en premier, et si c'est le cas,
          // ne pas ajouter d'autres explications de tarif standard
          if (handicap >= 50) {
            newExplanations.push(
              "Vous bénéficiez de la gratuité en raison de votre situation de handicap (taux d'incapacité ≥ 50%)."
            );
          } else if (isCombattant) {
            newExplanations.push(
              "Vous bénéficiez de la gratuité en tant que titulaire de la carte du combattant."
            );
          } else if (qf <= 555) {
            newExplanations.push(
              "Vous êtes éligible à la gratuité (tarif solidaire tranche 1)."
            );
          } else {
            // Si pas de gratuité, ajouter les explications de réduction et de catégorie
            if (qf <= 775) {
              newExplanations.push(
                "Vous êtes éligible au tarif solidaire (tranche 2, réduction de 50%)."
              );
            } else if (qf <= 970) {
              newExplanations.push(
                "Vous êtes éligible au tarif solidaire (tranche 3, réduction de 30%)."
              );
            }

            // Ajouter l'explication sur la catégorie d'âge seulement si pas de gratuité
            const age = parseInt(situation["âge"]);
            if (age < 5) {
              newExplanations.push(
                "Transport gratuit pour les moins de 5 ans."
              );
            } else if (age <= 10) {
              newExplanations.push("Tarif Pitchoun appliqué (5-10 ans).");
            } else if (age <= 27) {
              newExplanations.push("Tarif Jeune appliqué (11-27 ans).");
            } else if (age >= 60) {
              newExplanations.push("Tarif Senior appliqué (60 ans et plus).");
            } else if (situation["salarié entreprise partenaire"] === "'oui'") {
              newExplanations.push("Tarif Salarié appliqué.");
            } else {
              newExplanations.push("Tarif Classique appliqué (28-59 ans).");
            }
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
              <option value="'2 voyages'">2 voyages</option>
              <option value="'10 voyages'">10 voyages</option>
            </select>
          </div>
        )}

        {situation["type voyage"] === "'occasionnel'" &&
          situation["type ticket"] === "'10 voyages'" && (
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
                <label>Titulaire de la carte du combattant ?</label>
                <select
                  value={situation["carte combattant"]}
                  onChange={(e) =>
                    handleChange("carte combattant", e.target.value)
                  }
                >
                  <option value="'non'">Non</option>
                  <option value="'oui'">Oui</option>
                </select>
              </div>

              <div className="form-group">
                <label>En service civique ?</label>
                <select
                  value={situation["service civique"]}
                  onChange={(e) =>
                    handleChange("service civique", e.target.value)
                  }
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
              <small>
                Différents tarifs s'appliquent selon votre tranche d'âge: moins
                de 5 ans (gratuit), 5-10 ans (Pitchoun), 11-27 ans (Jeune),
                28-59 ans (Classique/Salarié), 60 ans et plus (Senior)
              </small>
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
                Montant fourni par la CAF ou calculé à partir de vos revenus. QF
                ≤ 555€: gratuité / QF 556-775€: -50% / QF 776-970€: -30%
              </small>
            </div>

            <div className="form-group">
              <label>Taux d'incapacité (handicap)</label>
              <input
                type="number"
                value={situation["situation handicap"]}
                onChange={(e) =>
                  handleChange("situation handicap", parseInt(e.target.value))
                }
                min="0"
                max="100"
              />
              <small>
                Entrez 0 si vous n'êtes pas en situation de handicap. Les
                personnes avec un taux ≥ 50% bénéficient de la gratuité.
              </small>
            </div>

            <div className="form-group">
              <label>Titulaire de la carte du combattant ?</label>
              <select
                value={situation["carte combattant"]}
                onChange={(e) =>
                  handleChange("carte combattant", e.target.value)
                }
              >
                <option value="'non'">Non</option>
                <option value="'oui'">Oui</option>
              </select>
              <small>
                Les titulaires de la carte du combattant bénéficient de la
                gratuité des transports.
              </small>
            </div>

            {situation["âge"] >= 28 && situation["âge"] < 60 && (
              <div className="form-group">
                <label>
                  Êtes-vous salarié d'une entreprise partenaire TBM ?
                </label>
                <select
                  value={situation["salarié entreprise partenaire"]}
                  onChange={(e) =>
                    handleChange(
                      "salarié entreprise partenaire",
                      e.target.value
                    )
                  }
                >
                  <option value="'non'">Non</option>
                  <option value="'oui'">Oui</option>
                </select>
                <small>
                  Les salariés des entreprises partenaires TBM bénéficient d'un
                  tarif préférentiel.
                </small>
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
            <div className="explanations">
              <h3>Détails</h3>
              <ul style={{ listStyleType: "none", padding: "0" }}>
                {explanations.map((explanation, index) => (
                  <li
                    key={index}
                    style={{
                      padding: "6px 0",
                      borderBottom:
                        index < explanations.length - 1
                          ? "1px solid #e0e0e0"
                          : "none",
                    }}
                  >
                    {explanation}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {situation["type voyage"] === "'fréquent'" && (
            <div
              className="additional-info"
              style={{ marginTop: "20px", fontSize: "14px" }}
            >
              <p>
                <strong>Avantages inclus :</strong>
              </p>
              <ul>
                <li>Validations illimitées pendant la période d'abonnement</li>
                <li>Sur carte nominative TBM</li>
                <li>
                  Accès au programme de fidélité TBM fid' (inscription
                  obligatoire)
                </li>
                <li>
                  Valable sur tous les modes de transport de Bordeaux Métropole
                  : Tramway, Bus, Bato et Cars régionaux (dans la limite des 28
                  communes de Bordeaux Métropole)
                </li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TransportTarifSimulateur;
