import React from "react";
import { Link } from "react-router-dom";

function Home() {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <h1>Simulateurs Publicodes</h1>
      <p>Choisissez un simulateur :</p>

      <div style={{ display: "grid", gap: "20px", marginTop: "30px" }}>
        <Link
          to="/co2-douche"
          style={{
            padding: "20px",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <h2 style={{ margin: "0 0 10px 0" }}>🚿 Simulateur CO2 douche</h2>
          <p style={{ margin: 0, color: "#666" }}>
            Calculez l'impact carbone de vos douches en fonction de leur
            fréquence, durée et type de chauffage.
          </p>
        </Link>

        <Link
          to="/tarifs-bordeaux"
          style={{
            padding: "20px",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <h2 style={{ margin: "0 0 10px 0" }}>
            🎫 Simulateur des tarifs de transport pour Bordeaux Métropole
          </h2>
          <p style={{ margin: 0, color: "#666" }}>
            Calculez votre tarif de transport en fonction de votre profil et de
            vos besoins.
          </p>
        </Link>
        <Link
          to="/tarifs-lille"
          style={{
            padding: "20px",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <h2 style={{ margin: "0 0 10px 0" }}>
            🎫 Simulateur des tarifs de transport pour Lille Métropole
          </h2>
          <p style={{ margin: 0, color: "#666" }}>
            Calculez votre tarif de transport en fonction de votre profil et de
            vos besoins.
          </p>
        </Link>
      </div>
    </div>
  );
}

export default Home;
