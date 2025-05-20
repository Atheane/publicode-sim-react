import React, { useEffect, useState } from "react";
import Engine, { formatValue } from "publicodes";
import yaml from "js-yaml";

function LilleTransportTarifSimulateur() {
  const [engine, setEngine] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [explanations, setExplanations] = useState([]);
  // Situation initiale
  const [situation, setSituation] = useState({
    "type voyage": "'unitaire'",
    "type unitaire": "'simple'",
    "type pass": "'1 jour'",
    "type abonnement": "'mensuel'",
    âge: 30,
    "quotient familial": 750,
    "css ou ame": "'non'",
    "habitant mel": "'oui'",
    "bénéficiaire rsa": "'non'",
    handipole: "'non'",
    "éligible tarif coquelicot": "'non'",
    "éligible tarif iris": "'non'",
  });

  useEffect(() => {
    // Charge le fichier YAML depuis le dossier public
    fetch(process.env.PUBLIC_URL + "/tarif-transport-lille.yaml")
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

        // Déterminer le type de voyage et les explications associées
        if (situation["type voyage"] === "'unitaire'") {
          if (situation["bénéficiaire rsa"] === "'oui'") {
            newExplanations.push(
              "Carnet de 10 trajets au tarif RSA (bénéficiaires du RSA socle non majoré pour situation d'isolement)"
            );
          } else if (situation["handipole"] === "'oui'") {
            newExplanations.push(
              "Tarif Handipole pour les personnes à mobilité réduite"
            );
          } else if (situation["type unitaire"] === "'simple'") {
            newExplanations.push(
              "Titre valable 1h dans toute la MEL, entre la 1ère et la dernière validation"
            );
          } else if (situation["type unitaire"] === "'carnet 10'") {
            newExplanations.push(
              "Carnet de 10 trajets, chacun valable 1h entre la 1ère et la dernière validation"
            );
          }
          newExplanations.push(
            "Valable sur les réseaux ilévia, Arc en Ciel et TER"
          );
        } else if (situation["type voyage"] === "'pass'") {
          if (situation["type pass"] === "'soirée'") {
            newExplanations.push(
              "Voyagez en illimité de 19h jusqu'à la fin de service"
            );
            newExplanations.push(
              "Valable sur les réseaux ilévia et Arc en Ciel"
            );
          } else {
            const jours = situation["type pass"].replace(/['"]/g, "");
            if (jours === "1 jour") {
              newExplanations.push(
                "Voyagez en illimité pendant 24 heures après la 1ère validation"
              );
            } else {
              const nombreJours = jours.split(" ")[0];
              newExplanations.push(
                `Voyagez en illimité pendant ${nombreJours} jours après la 1ère validation`
              );
            }
            newExplanations.push(
              "Valable sur les réseaux ilévia, Arc en Ciel et TER"
            );
          }
        } else if (situation["type voyage"] === "'abonnement'") {
          const age = parseInt(situation["âge"]);
          const qf = parseInt(situation["quotient familial"]);

          if (situation["éligible tarif coquelicot"] === "'oui'") {
            newExplanations.push(
              "Vous bénéficiez du tarif Coquelicot réservé aux non ou mal voyants"
            );
          } else if (situation["éligible tarif iris"] === "'oui'") {
            newExplanations.push(
              "Vous bénéficiez du tarif Iris réservé aux demandeurs d'emploi sous certaines conditions"
            );
          } else if (age < 18 && situation["habitant mel"] === "'oui'") {
            newExplanations.push(
              "Titre gratuit réservé aux habitants de la MEL de moins de 18 ans"
            );
          } else {
            if (age >= 4 && age <= 25) {
              newExplanations.push("Tarif 4-25 ans");

              if (
                situation["type abonnement"] === "'10 mois'" &&
                situation["habitant mel"] === "'oui'"
              ) {
                newExplanations.push(
                  "Abonnement 10 mois valable du 1er septembre au 30 juin (réservé aux habitants de la MEL)"
                );
              }
            } else if (age >= 65) {
              newExplanations.push("Tarif 65 ans et plus");
            } else {
              newExplanations.push("Tarif tout public (26-64 ans)");
            }

            if (situation["type abonnement"] === "'permanent'") {
              newExplanations.push(
                "Abonnement permanent avec engagement minimum de 12 mois"
              );
            }

            if (situation["habitant mel"] === "'oui'") {
              if (qf <= 374) {
                newExplanations.push(
                  "Vous bénéficiez du tarif solidaire QF1 (QF ≤ 374€)"
                );
              } else if (qf <= 537) {
                newExplanations.push(
                  "Vous bénéficiez du tarif solidaire QF2 (QF entre 375€ et 537€)"
                );
              } else if (qf <= 716) {
                newExplanations.push(
                  "Vous bénéficiez du tarif solidaire QF3 (QF entre 538€ et 716€)"
                );
              }
            }

            if (situation["css ou ame"] === "'oui'") {
              newExplanations.push(
                "Vous bénéficiez du tarif réservé aux bénéficiaires de la CSS non participative ou de l'AME"
              );
            }
          }

          newExplanations.push(
            "Valable sur les réseaux ilévia, Arc en Ciel et TER dans la MEL"
          );
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
      <h1>Simulateur de tarifs de transport ilévia</h1>
      <p>
        Calculez votre tarif en fonction de votre situation dans la Métropole
        Européenne de Lille
      </p>

      <div className="form-section">
        <h2>Type de titre</h2>

        <div className="form-group">
          <label>Type de titre</label>
          <select
            value={situation["type voyage"]}
            onChange={(e) => handleChange("type voyage", e.target.value)}
          >
            <option value="'unitaire'">Titre unitaire</option>
            <option value="'pass'">Pass journalier</option>
            <option value="'abonnement'">Abonnement</option>
          </select>
        </div>

        {situation["type voyage"] === "'unitaire'" && (
          <>
            <div className="form-group">
              <label>Êtes-vous bénéficiaire du RSA socle non majoré ?</label>
              <select
                value={situation["bénéficiaire rsa"]}
                onChange={(e) =>
                  handleChange("bénéficiaire rsa", e.target.value)
                }
              >
                <option value="'non'">Non</option>
                <option value="'oui'">Oui</option>
              </select>
            </div>

            <div className="form-group">
              <label>Utilisez-vous le service Handipole ?</label>
              <select
                value={situation["handipole"]}
                onChange={(e) => handleChange("handipole", e.target.value)}
              >
                <option value="'non'">Non</option>
                <option value="'oui'">Oui</option>
              </select>
            </div>

            {situation["bénéficiaire rsa"] === "'non'" &&
              situation["handipole"] === "'non'" && (
                <div className="form-group">
                  <label>Type de titre unitaire</label>
                  <select
                    value={situation["type unitaire"]}
                    onChange={(e) =>
                      handleChange("type unitaire", e.target.value)
                    }
                  >
                    <option value="'simple'">Trajet unitaire</option>
                    <option value="'carnet 10'">Carnet 10 trajets</option>
                  </select>
                </div>
              )}
          </>
        )}

        {situation["type voyage"] === "'pass'" && (
          <div className="form-group">
            <label>Type de pass</label>
            <select
              value={situation["type pass"]}
              onChange={(e) => handleChange("type pass", e.target.value)}
            >
              <option value="'soirée'">Pass Soirée</option>
              <option value="'1 jour'">Pass 1 jour</option>
              <option value="'2 jours'">Pass 2 jours</option>
              <option value="'3 jours'">Pass 3 jours</option>
              <option value="'4 jours'">Pass 4 jours</option>
              <option value="'5 jours'">Pass 5 jours</option>
              <option value="'6 jours'">Pass 6 jours</option>
              <option value="'7 jours'">Pass 7 jours</option>
            </select>
          </div>
        )}

        {situation["type voyage"] === "'abonnement'" && (
          <>
            <div className="form-group">
              <label>
                Êtes-vous non ou mal voyant avec carte mobilité inclusion
                mention cécité ?
              </label>
              <select
                value={situation["éligible tarif coquelicot"]}
                onChange={(e) =>
                  handleChange("éligible tarif coquelicot", e.target.value)
                }
              >
                <option value="'non'">Non</option>
                <option value="'oui'">Oui</option>
              </select>
            </div>

            <div className="form-group">
              <label>
                Êtes-vous demandeur d'emploi avec accompagnement renforcé ?
              </label>
              <select
                value={situation["éligible tarif iris"]}
                onChange={(e) =>
                  handleChange("éligible tarif iris", e.target.value)
                }
              >
                <option value="'non'">Non</option>
                <option value="'oui'">Oui</option>
              </select>
            </div>

            {situation["éligible tarif coquelicot"] === "'non'" &&
              situation["éligible tarif iris"] === "'non'" && (
                <>
                  <div className="form-group">
                    <label>Âge</label>
                    <input
                      type="number"
                      value={situation["âge"]}
                      onChange={(e) =>
                        handleChange("âge", parseInt(e.target.value))
                      }
                      min="0"
                      max="120"
                    />
                    <small>
                      Les tarifs varient selon l'âge: moins de 18 ans (gratuit
                      pour les habitants de la MEL), 4-25 ans, 26-64 ans, 65 ans
                      et plus
                    </small>
                  </div>

                  <div className="form-group">
                    <label>Habitant de la MEL ?</label>
                    <select
                      value={situation["habitant mel"]}
                      onChange={(e) =>
                        handleChange("habitant mel", e.target.value)
                      }
                    >
                      <option value="'oui'">Oui</option>
                      <option value="'non'">Non</option>
                    </select>
                    <small>
                      La gratuité pour les moins de 18 ans et les tarifs
                      solidaires sont réservés aux habitants de la Métropole
                      Européenne de Lille
                    </small>
                  </div>

                  {!(
                    parseInt(situation["âge"]) < 18 &&
                    situation["habitant mel"] === "'oui'"
                  ) && (
                    <>
                      <div className="form-group">
                        <label>Type d'abonnement</label>
                        <select
                          value={situation["type abonnement"]}
                          onChange={(e) =>
                            handleChange("type abonnement", e.target.value)
                          }
                        >
                          {parseInt(situation["âge"]) >= 4 &&
                          parseInt(situation["âge"]) <= 25 &&
                          situation["habitant mel"] === "'oui'" ? (
                            <>
                              <option value="'mensuel'">Mensuel</option>
                              <option value="'permanent'">Permanent</option>
                              <option value="'10 mois'">
                                10 mois (Sept-Juin)
                              </option>
                            </>
                          ) : (
                            <>
                              <option value="'mensuel'">Mensuel</option>
                              <option value="'permanent'">Permanent</option>
                            </>
                          )}
                        </select>
                      </div>

                      {situation["habitant mel"] === "'oui'" && (
                        <div className="form-group">
                          <label>Quotient familial CAF</label>
                          <input
                            type="number"
                            value={situation["quotient familial"]}
                            onChange={(e) =>
                              handleChange(
                                "quotient familial",
                                parseInt(e.target.value)
                              )
                            }
                            min="0"
                          />
                          <small>
                            Montant fourni par la CAF - QF ≤ 374€: tarif QF1 /
                            QF 375-537€: tarif QF2 / QF 538-716€: tarif QF3
                          </small>
                        </div>
                      )}

                      <div className="form-group">
                        <label>
                          Bénéficiaire de la CSS non participative ou de l'AME ?
                        </label>
                        <select
                          value={situation["css ou ame"]}
                          onChange={(e) =>
                            handleChange("css ou ame", e.target.value)
                          }
                        >
                          <option value="'non'">Non</option>
                          <option value="'oui'">Oui</option>
                        </select>
                      </div>
                    </>
                  )}
                </>
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
                {situation["type voyage"] === "'abonnement'" ? "/mois" : ""}
                {situation["type voyage"] === "'unitaire'" &&
                situation["type unitaire"] === "'carnet 10'"
                  ? " (carnet de 10)"
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

          {situation["type voyage"] === "'abonnement'" && (
            <div
              className="additional-info"
              style={{ marginTop: "20px", fontSize: "14px" }}
            >
              <p>
                <strong>Informations importantes :</strong>
              </p>
              <ul>
                <li>
                  Les abonnements permettent des voyages illimités sur la
                  période
                </li>
                <li>
                  Valable sur les réseaux ilévia, Arc en Ciel et TER dans la MEL
                </li>
                <li>
                  L'abonnement permanent nécessite un engagement de 12 mois
                  minimum
                </li>
                {situation["type abonnement"] === "'10 mois'" && (
                  <li>
                    L'abonnement 10 mois est valable du 1er septembre au 30 juin
                  </li>
                )}
                {situation["habitant mel"] === "'oui'" && (
                  <li>
                    Les tarifs solidaires (QF1, QF2, QF3) sont réservés aux
                    habitants de la MEL
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LilleTransportTarifSimulateur;
