import React, { useEffect, useState } from "react";
import Engine, { formatValue } from "publicodes";
import yaml from "js-yaml";

function TraceSimulateur() {
  const [engine, setEngine] = useState(null);
  const [result, setResult] = useState(null);
  const [situation, setSituation] = useState({
    "trace . type de transport": "'billet unitaire'",
    "abonnement . profil": "'standard'",
    "abonnement . durée": "'mensuel'",
    "billet alsa+ . type": "'24h colmar agglo'",
    "abonnement combiné . destination": "'colmar-strasbourg'",
    "abonnement combiné . âge": "non",
    "abonnement combiné . durée": "'mensuel'",
  });

  useEffect(() => {
    fetch(process.env.PUBLIC_URL + "/trace-tarifs.publicodes.yaml")
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
      setResult(engine.evaluate("trace"));
    }
  }, [engine, situation]);

  if (!engine) return <div>Chargement...</div>;

  const handleChange = (name, value) => {
    setSituation((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const renderConditionalFields = () => {
    const typeTransport = situation["trace . type de transport"];

    switch (typeTransport) {
      case "'abonnement'":
        return (
          <>
            <label style={{ display: "block", marginBottom: "10px" }}>
              Profil :
              <select
                value={situation["abonnement . profil"]}
                onChange={(e) =>
                  handleChange("abonnement . profil", e.target.value)
                }
                style={{ marginLeft: "10px" }}
              >
                <option value="'jeune'">Jeune (5-25 ans)</option>
                <option value="'standard'">Standard (pour tous)</option>
                <option value="'senior'">Senior (66 ans et +)</option>
                <option value="'tarif réduit'">
                  Tarif réduit (demandeurs d'emploi, handicap...)
                </option>
              </select>
            </label>

            <label style={{ display: "block", marginBottom: "10px" }}>
              Durée :
              <select
                value={situation["abonnement . durée"]}
                onChange={(e) =>
                  handleChange("abonnement . durée", e.target.value)
                }
                style={{ marginLeft: "10px" }}
              >
                <option value="'mensuel'">Mensuel</option>
                <option value="'annuel'">Annuel</option>
              </select>
            </label>
          </>
        );

      case "'billet alsa+'":
        return (
          <label style={{ display: "block", marginBottom: "10px" }}>
            Type de billet Alsa+ :
            <select
              value={situation["billet alsa+ . type"]}
              onChange={(e) =>
                handleChange("billet alsa+ . type", e.target.value)
              }
              style={{ marginLeft: "10px" }}
            >
              <option value="'24h colmar agglo'">
                24h Colmar Agglo (3,60€)
              </option>
              <option value="'groupe journée colmar agglo'">
                Groupe journée Colmar Agglo (5,40€)
              </option>
              <option value="'24h département 68'">
                24h Département 68 (23,10€)
              </option>
              <option value="'groupe journée département 68'">
                Groupe journée Département 68 (24,20€)
              </option>
              <option value="'24h alsace'">24h Alsace (37,40€)</option>
              <option value="'groupe journée alsace'">
                Groupe journée Alsace (39,10€)
              </option>
            </select>
          </label>
        );

      case "'abonnement combiné'":
        return (
          <>
            <label style={{ display: "block", marginBottom: "10px" }}>
              Destination :
              <select
                value={situation["abonnement combiné . destination"]}
                onChange={(e) =>
                  handleChange(
                    "abonnement combiné . destination",
                    e.target.value
                  )
                }
                style={{ marginLeft: "10px" }}
              >
                <option value="'colmar-strasbourg'">Colmar-Strasbourg</option>
                <option value="'colmar-mulhouse'">Colmar-Mulhouse</option>
              </select>
            </label>

            <label style={{ display: "block", marginBottom: "10px" }}>
              Âge :
              <select
                value={situation["abonnement combiné . âge"]}
                onChange={(e) =>
                  handleChange("abonnement combiné . âge", e.target.value)
                }
                style={{ marginLeft: "10px" }}
              >
                <option value="oui">Moins de 26 ans (Primo combiné)</option>
                <option value="non">26 ans et plus (Presto combiné)</option>
              </select>
            </label>

            <label style={{ display: "block", marginBottom: "10px" }}>
              Durée :
              <select
                value={situation["abonnement combiné . durée"]}
                onChange={(e) =>
                  handleChange("abonnement combiné . durée", e.target.value)
                }
                style={{ marginLeft: "10px" }}
              >
                <option value="'mensuel'">Mensuel</option>
                <option value="'hebdomadaire'">Hebdomadaire</option>
              </select>
            </label>
          </>
        );

      default:
        return null;
    }
  };

  const getDescription = () => {
    const typeTransport = situation["trace . type de transport"];

    switch (typeTransport) {
      case "'billet unitaire'":
        return "Billet simple pour un trajet";
      case "'carnet 10 billets'":
        return "Carnet de 10 billets - En vente à l'Agence Commerciale Trace et chez les dépositaires Points Trace";
      case "'billet 72h'":
        return "Valable pour 1 personne, nombre illimité de voyages sur le réseau Trace pendant 72h";
      case "'billet alsa+'":
        return "Billets permettant de se déplacer à volonté sur tous les réseaux (trains, bus, cars)";
      case "'abonnement'":
        return "Abonnement mensuel ou annuel selon votre profil";
      case "'abonnement combiné'":
        return "Abonnement train + réseaux urbains pour les liaisons intercités";
      default:
        return "";
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      <h1>🚌 Calculateur de tarifs Trace</h1>

      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", marginBottom: "10px" }}>
          Type de transport :
          <select
            value={situation["trace . type de transport"]}
            onChange={(e) =>
              handleChange("trace . type de transport", e.target.value)
            }
            style={{ marginLeft: "10px" }}
          >
            <option value="'billet unitaire'">Billet unitaire (1,50€)</option>
            <option value="'carnet 10 billets'">
              Carnet de 10 billets (11,00€)
            </option>
            <option value="'billet 72h'">Billet 72h (7,00€)</option>
            <option value="'billet alsa+'">Billet Alsa+</option>
            <option value="'abonnement'">Abonnement</option>
            <option value="'abonnement combiné'">Abonnement combiné</option>
          </select>
        </label>

        {renderConditionalFields()}
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
          <h2>💰 Coût</h2>
          <p
            style={{ fontSize: "1.5em", fontWeight: "bold", color: "#2563eb" }}
          >
            {formatValue(result)}
          </p>
          <p style={{ fontSize: "0.9em", color: "#666", marginTop: "10px" }}>
            {getDescription()}
          </p>
        </div>
      )}

      <div style={{ marginTop: "30px", fontSize: "0.8em", color: "#666" }}>
        <h3>ℹ️ Informations complémentaires</h3>
        <ul>
          <li>
            Billets en vente à l'Agence Commerciale Trace, sur la boutique en
            ligne et chez les dépositaires Points Trace
          </li>
          <li>
            Les billets Alsa+ permettent de voyager sur tous les réseaux
            (trains, trams, bus, cars) du périmètre choisi
          </li>
          <li>
            Les abonnements combinés incluent le train et les réseaux urbains
            des villes de destination
          </li>
        </ul>
      </div>
    </div>
  );
}

export default TraceSimulateur;
