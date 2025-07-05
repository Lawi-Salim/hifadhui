"use client"

import { Link } from "react-router-dom"
import "./Legal.css"

const TermsOfService = () => {
  return (
    <div className="legal-container">
      <div className="legal-header">
        <h1>Conditions Générales d'Utilisation (CGU)</h1>
        <p className="legal-updated">Dernière mise à jour : 2025-07-04</p>
      </div>

      <div className="legal-content">
        <section className="legal-section">
          <p>
            Bienvenue sur <strong>Hifadhui</strong>, la plateforme développée par <strong>Wakati Mavuna</strong> dédiée à la protection des
            créations numériques.
          </p>
          <p>
            En accédant ou en utilisant ce site, vous acceptez les présentes Conditions Générales d'Utilisation
            (CGU).
          </p>
        </section>

        <section className="legal-section">
          <h2>1. Objectif de la plateforme</h2>
          <p>
            Permettre aux créateurs de déposer et conserver leurs œuvres numériques dans un espace
            sécurisé et daté, servant de preuve d'antériorité.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Accès et utilisation du service</h2>
          <p>
            L'accès est restreint aux utilisateurs autorisés. Chaque utilisateur est responsable de ses
            identifiants.
          </p>
        </section>

        <section className="legal-section">
          <h2>3. Propriété des contenus déposés</h2>
          <p>
            Les fichiers déposés restent la propriété exclusive de leur auteur. Hifadhui ne revendique aucun
            droit sur ces créations.
          </p>
        </section>

        <section className="legal-section">
          <h2>4. Fonctionnement de la preuve numérique</h2>
          <p>
            Chaque dépôt est :
          </p>
          <ul>
            <li><strong>Horodaté</strong> (date et heure exactes)</li>
            <li><strong>Associé à un identifiant utilisateur</strong></li>
            <li><strong>Stocké dans une base sécurisée</strong></li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>5. Responsabilité</h2>
          <p>
            Hifadhui est un service expérimental.  
            L'utilisateur est invité à <strong>conserver une copie locale</strong> de ses fichiers.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Respect de la législation</h2>
          <p>
            L'utilisateur s'engage à ne pas déposer de contenus :
          </p>
          <ul>
            <li>illégaux</li>
            <li>incitant à la haine ou à la violence</li>
            <li>portant atteinte aux droits d'autrui</li>
          </ul>
          <p>
            Tout manquement peut entraîner la <strong>suspension ou suppression du compte</strong>.
          </p>
        </section>

        <section className="legal-section">
          <h2>7. Modifications</h2>
          <p>
            Les CGU peuvent être modifiées à tout moment.  
            L'utilisateur est invité à consulter régulièrement cette page.
          </p>
        </section>

        <section className="legal-section">
          <h2>8. Contact</h2>
          <p>
            📧 <strong>wakati.mavuna@gmail.com</strong><br />
            Développé avec ❤️ par <strong>Wakati Mavuna</strong>
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

export default TermsOfService

