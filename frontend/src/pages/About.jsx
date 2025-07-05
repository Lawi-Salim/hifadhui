"use client"

import { Link } from "react-router-dom"
import "./Legal.css"

const About = () => {
  return (
    <div className="legal-container">
      <div className="legal-header">
        <h1>À propos de Wakati Mapessa</h1>
        <p className="legal-updated">Dernière mise à jour : 2025-07-04</p>
      </div>

      <div className="legal-content">
        <section className="legal-section">
          <p>
            <strong>Wakati Mavuna</strong> est une initiative personnelle visant à offrir aux créateurs des outils gratuits, simples et accessibles pour <strong>protéger la paternité de leurs œuvres numériques</strong>.
          </p>
        </section>

        <section className="legal-section">
          <h2>Mission</h2>
          <ul>
            <li>Conserver la trace légale des créations</li>
            <li>Protéger les droits d'auteur</li>
            <li>Réduire la dépendance aux géants du web</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>🌍 Pourquoi ce nom ?</h2>
          <p>
            <strong>"Wakati"</strong> signifie <em>temps</em>, <strong>"Mavuna"</strong> signifie <em>récolte</em>.<br />
            <strong>Le temps consacré à la création mérite d'être récolté et protégé.</strong>
          </p>
        </section>

        <section className="legal-section">
          <h2>👤 Public cible</h2>
          <ul>
            <li>Artistes visuels (designs, illustrations…)</li>
            <li>Auteurs (textes, scénarios…)</li>
            <li>Développeurs (code, projets…)</li>
            <li>Tout créateur numérique indépendant</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>🔐 Comment ça marche ?</h2>
          <ul>
            <li><strong>Horodatage</strong> automatique à l'upload</li>
            <li><strong>Identifiant unique</strong> associé</li>
            <li>Stockage sécurisé dans une base de données</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>🔑 Nos valeurs</h2>
          <ul>
            <li><strong>Liberté</strong> du créateur</li>
            <li><strong>Souveraineté</strong> sur ses œuvres</li>
            <li><strong>Simplicité</strong> technique</li>
            <li><strong>Gratuité</strong> comme point de départ</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>🚀 Initiative ouverte</h2>
          <p>
            Projet porté par un développeur indépendant, <strong>en constante évolution</strong>.
          </p>
        </section>

        <section className="legal-section">
          <h2>📬 Contact</h2>
          <p>
            📧 <strong>wakati.mavuna@gmail.com</strong>
          </p>
          <p>
            🌐 <a href="https://hifadhui.vercel.app" target="_blank" rel="noopener noreferrer">https://hifadhui.vercel.app</a>
          </p>
        </section>
      </div>

      <div className="legal-footer">
        <Link to="/" className="btn btn-outline">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  )
}

export default About 