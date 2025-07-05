"use client"

import { Link } from "react-router-dom"
import "./Legal.css"

const PrivacyPolicy = () => {
  return (
    <div className="legal-container">
      <div className="legal-header">
        <h1>Politique de confidentialité</h1>
        <p className="legal-updated">Dernière mise à jour : {new Date().toLocaleDateString()}</p>
      </div>

      <div className="legal-content">
        <section className="legal-section">
          <h2>1. Introduction</h2>
          <p>
            Chez Hifadhui, nous accordons une grande importance à la protection de vos données personnelles. Cette
            politique de confidentialité explique quelles informations nous collectons, comment elles sont utilisées
            et comment nous les protégeons.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Informations que nous collectons</h2>
          <p>Nous collectons les types d'informations suivants :</p>
          <ul>
            <li>
              <strong>Informations de compte :</strong> Lors de la création d’un compte, nous collectons votre nom
              d’utilisateur, adresse e-mail et mot de passe.
            </li>
            <li>
              <strong>Contenu utilisateur :</strong> Les images que vous téléchargez, ainsi que les titres et
              descriptions associés.
            </li>
            <li>
              <strong>Informations d’utilisation :</strong> Comment vous utilisez notre plateforme (pages visitées,
              date et heure de connexion, interactions).
            </li>
            <li>
              <strong>Informations techniques :</strong> Adresse IP, navigateur, appareil utilisé, système
              d’exploitation.
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. Comment nous utilisons vos informations</h2>
          <p>Nous utilisons vos informations pour :</p>
          <ul>
            <li>Fournir, gérer et améliorer le service</li>
            <li>Créer et administrer votre compte</li>
            <li>Stocker et afficher vos créations</li>
            <li>Vous contacter si besoin (informations liées à votre compte)</li>
            <li>Assurer la sécurité et la stabilité du service</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. Sécurité des données</h2>
          <p>
            Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles pour protéger vos
            informations contre l'accès non autorisé, la perte ou la modification.
          </p>
          <p>
            Vos fichiers sont stockés de manière sécurisée et ne sont accessibles que par vous, sauf si vous décidez
            explicitement de les partager.
          </p>
        </section>

        <section className="legal-section">
          <h2>5. Vos droits</h2>
          <p>En tant qu'utilisateur, vous avez les droits suivants :</p>
          <ul>
            <li>Consulter les données liées à votre compte</li>
            <li>Corriger une information incorrecte</li>
            <li>Supprimer votre compte et vos fichiers</li>
            <li>Demander des informations sur vos fichiers hébergés</li>
          </ul>
          <p>
            Pour toute demande liée à vos données, vous pouvez nous contacter via l’adresse mentionnée à la fin de
            cette page. Nous répondrons dans les meilleurs délais.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Durée de conservation</h2>
          <p>
            Vos données sont conservées tant que votre compte est actif. En cas de suppression de compte, les
            données associées seront supprimées dans un délai raisonnable, sauf obligation technique ou légale
            contraire.
          </p>
        </section>

        <section className="legal-section">
          <h2>7. Partage des données</h2>
          <p>
            Nous ne partageons pas vos informations personnelles avec des tiers, sauf dans les cas suivants :
          </p>
          <ul>
            <li>Avec votre consentement explicite</li>
            <li>Sur obligation légale ou demande des autorités</li>
            <li>Pour protéger nos droits ou ceux des utilisateurs</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>8. Modifications</h2>
          <p>
            Nous pouvons mettre à jour cette politique de confidentialité à tout moment. Toute modification
            importante sera communiquée via notre site ou par e-mail.
          </p>
        </section>

        <section className="legal-section">
          <h2>9. Contact</h2>
          <p>
            Pour toute question concernant cette politique de confidentialité ou vos données personnelles, vous
            pouvez nous écrire à l’adresse suivante : <strong>privacy@hifadhui.com</strong>
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

export default PrivacyPolicy

