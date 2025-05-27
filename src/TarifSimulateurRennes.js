import React, { useEffect, useState } from "react";
import Engine, { formatValue } from "publicodes";
import yaml from "js-yaml";

function TransportRennesSimulateur() {
  const [engine, setEngine] = useState(null);
  const [result, setResult] = useState(null);
  const [situation, setSituation] = useState({
    "transport_rennes . profil utilisateur": "'adulte'",
    "transport_rennes . type de titre": "'abonnement mensuel'",
    "transport_rennes . conditions ressources": "'aucune'",
    "transport_rennes . échelon bourse": 2,
    "transport_rennes . fréquence usage": 20,
  });

  useEffect(() => {
    const yamlContent = `
transport_rennes:
  titre: Tarifs de transport Rennes Métropole (STAR)
  description: Calcul du coût annuel des transports en commun selon le profil utilisateur
  icônes: 🚌 🚇 💳
  note: Les tarifs sont applicables dans les 43 communes de Rennes Métropole desservies par le réseau STAR
  unité: €/an
  formule: coût annuel

transport_rennes . profil utilisateur:
  question: Quel est votre profil ?
  par défaut: "'adulte'"
  une possibilité:
    - "'enfant 0-4 ans'"
    - "'enfant 5-11 ans'"
    - "'jeune 12-17 ans'"
    - "'jeune 18-26 ans'"
    - "'adulte'"
    - "'senior 65-74 ans'"
    - "'senior 75+ ans'"
    - "'étudiant'"
    - "'étudiant boursier'"

transport_rennes . type de titre:
  question: Quel type de titre souhaitez-vous ?
  par défaut: "'abonnement mensuel'"
  une possibilité:
    - "'voyage unitaire'"
    - "'pass journée'"
    - "'10 voyages'"
    - "'abonnement mensuel'"
    - "'abonnement annuel'"
    - "'pass mobilité'"

transport_rennes . conditions ressources:
  applicable si: profil utilisateur != 'enfant 0-4 ans' et profil utilisateur != 'enfant 5-11 ans'
  question: Bénéficiez-vous d'une réduction sous conditions de ressources ?
  par défaut: "'aucune'"
  une possibilité:
    - "'aucune'"
    - "'réduction 50%'"
    - "'réduction 85%'"
    - "'gratuité'"

transport_rennes . échelon bourse:
  applicable si: profil utilisateur = 'étudiant boursier'
  question: Quel est votre échelon de bourse CROUS ?
  par défaut: 2
  une possibilité:
    - 0
    - 1
    - 2
    - 3
    - 4
    - 5
    - 6
    - 7

transport_rennes . fréquence usage:
  applicable si: type de titre = 'voyage unitaire' ou type de titre = 'pass journée'
  question: Combien de voyages par mois ?
  par défaut: 20
  suggestions:
    occasionnel: 5
    régulier: 20
    fréquent: 40

transport_rennes . coût unitaire:
  unité: €
  variations:
    - si: profil utilisateur = 'enfant 0-4 ans'
      alors: 0
    - si: profil utilisateur = 'enfant 5-11 ans'
      alors: 0
    - si: type de titre = 'voyage unitaire'
      alors: 1.70
    - si: type de titre = 'pass journée'
      alors: 4.70
    - si: type de titre = '10 voyages'
      alors:
        variations:
          - si: conditions ressources = 'réduction 50%'
            alors: 7.65
          - sinon: 15.30

transport_rennes . tarif abonnement mensuel:
  unité: €/mois
  variations:
    - si: profil utilisateur = 'enfant 0-4 ans' ou profil utilisateur = 'enfant 5-11 ans'
      alors: 0
    - si: profil utilisateur = 'étudiant boursier'
      alors:
        variations:
          - si: échelon bourse >= 5
            alors: 0
          - si: échelon bourse >= 3
            alors: 22.30 * 0.15
          - si: échelon bourse = 2
            alors: 22.30 * 0.5
          - sinon: 22.30
    - si: profil utilisateur = 'étudiant'
      alors: 18.92
    - si: conditions ressources = 'gratuité'
      alors: 0
    - si: conditions ressources = 'réduction 85%'
      alors:
        variations:
          - si: profil utilisateur = 'jeune 12-17 ans'
            alors: 3.35
          - si: profil utilisateur = 'jeune 18-26 ans'
            alors: 3.80
          - si: profil utilisateur = 'adulte'
            alors: 7.95
          - si: profil utilisateur = 'senior 65-74 ans'
            alors: 4.75
          - si: profil utilisateur = 'senior 75+ ans'
            alors: 4.55
    - si: conditions ressources = 'réduction 50%'
      alors:
        variations:
          - si: profil utilisateur = 'jeune 12-17 ans'
            alors: 11.15
          - si: profil utilisateur = 'jeune 18-26 ans'
            alors: 12.60
          - si: profil utilisateur = 'adulte'
            alors: 26.50
          - si: profil utilisateur = 'senior 65-74 ans'
            alors: 15.80
          - si: profil utilisateur = 'senior 75+ ans'
            alors: 15.15
    - sinon: 22.30

transport_rennes . tarif pass mobilité:
  unité: €/mois
  valeur: 21.92

transport_rennes . coût annuel:
  unité: €/an
  variations:
    - si: type de titre = 'voyage unitaire'
      alors: coût unitaire * fréquence usage * 12
    - si: type de titre = 'pass journée'
      alors: coût unitaire * fréquence usage * 12
    - si: type de titre = '10 voyages'
      alors: coût unitaire * fréquence usage / 10 * 12
    - si: type de titre = 'abonnement mensuel'
      alors: tarif abonnement mensuel * 12
    - si: type de titre = 'abonnement annuel'
      alors: tarif abonnement mensuel * 12 * 0.75
    - si: type de titre = 'pass mobilité'
      alors: tarif pass mobilité * 12
    `;

    const rules = yaml.load(yamlContent);
    const engine = new Engine(rules);
    setEngine(engine);
  }, []);

  useEffect(() => {
    if (engine) {
      engine.setSituation(situation);
      setResult(engine.evaluate("transport_rennes"));
    }
  }, [engine, situation]);

  if (!engine) return <div>Chargement...</div>;

  const handleChange = (name, value) => {
    setSituation((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const isFieldVisible = (fieldName) => {
    try {
      const evaluation = engine.evaluate(
        `transport_rennes . ${fieldName} . applicable si`
      );
      return !evaluation || evaluation.nodeValue !== false;
    } catch {
      return true;
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <h1>🚌 Simulateur Tarifs Transport Rennes Métropole</h1>
      <p style={{ color: "#666", marginBottom: "30px" }}>
        Calculez le coût annuel de vos transports sur le réseau STAR
      </p>

      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", marginBottom: "15px" }}>
          <strong>Votre profil :</strong>
          <select
            value={situation["transport_rennes . profil utilisateur"]}
            onChange={(e) =>
              handleChange(
                "transport_rennes . profil utilisateur",
                e.target.value
              )
            }
            style={{ marginLeft: "10px", padding: "5px", minWidth: "200px" }}
          >
            <option value="'enfant 0-4 ans'">Enfant 0-4 ans</option>
            <option value="'enfant 5-11 ans'">Enfant 5-11 ans</option>
            <option value="'jeune 12-17 ans'">Jeune 12-17 ans</option>
            <option value="'jeune 18-26 ans'">Jeune 18-26 ans</option>
            <option value="'adulte'">Adulte 27-64 ans</option>
            <option value="'senior 65-74 ans'">Senior 65-74 ans</option>
            <option value="'senior 75+ ans'">Senior 75+ ans</option>
            <option value="'étudiant'">Étudiant</option>
            <option value="'étudiant boursier'">Étudiant boursier</option>
          </select>
        </label>

        <label style={{ display: "block", marginBottom: "15px" }}>
          <strong>Type de titre :</strong>
          <select
            value={situation["transport_rennes . type de titre"]}
            onChange={(e) =>
              handleChange("transport_rennes . type de titre", e.target.value)
            }
            style={{ marginLeft: "10px", padding: "5px", minWidth: "200px" }}
          >
            <option value="'voyage unitaire'">Voyage à l'unité</option>
            <option value="'pass journée'">Pass journée</option>
            <option value="'10 voyages'">Carnet 10 voyages</option>
            <option value="'abonnement mensuel'">Abonnement mensuel</option>
            <option value="'abonnement annuel'">Abonnement annuel</option>
            <option value="'pass mobilité'">Pass mobilité</option>
          </select>
        </label>

        {isFieldVisible("conditions ressources") && (
          <label style={{ display: "block", marginBottom: "15px" }}>
            <strong>Conditions de ressources :</strong>
            <select
              value={situation["transport_rennes . conditions ressources"]}
              onChange={(e) =>
                handleChange(
                  "transport_rennes . conditions ressources",
                  e.target.value
                )
              }
              style={{ marginLeft: "10px", padding: "5px", minWidth: "200px" }}
            >
              <option value="'aucune'">Aucune réduction</option>
              <option value="'réduction 50%'">Réduction 50%</option>
              <option value="'réduction 85%'">Réduction 85%</option>
              <option value="'gratuité'">Gratuité</option>
            </select>
          </label>
        )}

        {situation["transport_rennes . profil utilisateur"] ===
          "'étudiant boursier'" && (
          <label style={{ display: "block", marginBottom: "15px" }}>
            <strong>Échelon de bourse CROUS :</strong>
            <select
              value={situation["transport_rennes . échelon bourse"]}
              onChange={(e) =>
                handleChange(
                  "transport_rennes . échelon bourse",
                  parseInt(e.target.value)
                )
              }
              style={{ marginLeft: "10px", padding: "5px", minWidth: "200px" }}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7].map((echelon) => (
                <option key={echelon} value={echelon}>
                  Échelon {echelon}
                </option>
              ))}
            </select>
          </label>
        )}

        {(situation["transport_rennes . type de titre"] ===
          "'voyage unitaire'" ||
          situation["transport_rennes . type de titre"] ===
            "'pass journée'") && (
          <label style={{ display: "block", marginBottom: "15px" }}>
            <strong>Fréquence d'usage (voyages/mois) :</strong>
            <input
              type="number"
              value={situation["transport_rennes . fréquence usage"]}
              onChange={(e) =>
                handleChange(
                  "transport_rennes . fréquence usage",
                  parseInt(e.target.value)
                )
              }
              style={{ marginLeft: "10px", padding: "5px", width: "100px" }}
              min="1"
              max="100"
            />
          </label>
        )}
      </div>

      {result && (
        <div
          style={{
            padding: "25px",
            backgroundColor: "#f8f9fa",
            borderRadius: "10px",
            marginTop: "30px",
            border: "2px solid #e9ecef",
          }}
        >
          <h2 style={{ color: "#2c3e50", marginBottom: "15px" }}>
            💰 Coût annuel estimé
          </h2>
          <p
            style={{
              fontSize: "1.5em",
              fontWeight: "bold",
              color: "#27ae60",
              marginBottom: "10px",
            }}
          >
            {formatValue(result)}
          </p>
          <p style={{ fontSize: "0.9em", color: "#666", marginBottom: "15px" }}>
            Soit environ{" "}
            <strong>
              {formatValue({ ...result, nodeValue: result.nodeValue / 12 })} par
              mois
            </strong>
          </p>
          <div
            style={{ fontSize: "0.8em", color: "#666", fontStyle: "italic" }}
          >
            <p>
              ℹ️ Les tarifs sont applicables dans les 43 communes de Rennes
              Métropole
            </p>
            <p>🚌 Réseau STAR : bus + métro</p>
            <p>
              🚴 Pass mobilité inclut : transport + vélo libre-service +
              auto-partage
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransportRennesSimulateur;
