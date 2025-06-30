"use client"

import { Link } from "react-router-dom"
import "./Legal.css"

const TermsOfService = () => {
  return (
    <div className="legal-container">
      <div className="legal-header">
        <h1>Conditions d'utilisation</h1>
        <p className="legal-updated">Dernière mise à jour : {new Date().toLocaleDateString()}</p>
      </div>

      <div className="legal-content">
        <section className="legal-section">
          <h2>1. Acceptation des conditions</h2>
          <p>
            En accédant et en utilisant le service Hifadhui, vous acceptez d'être lié par ces conditions d'utilisation.
            Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Description du service</h2>
          <p>
            Hifadhui est une plateforme de stockage et de protection de photos qui permet aux utilisateurs de
            télécharger, stocker et gérer leurs créations photographiques en toute sécurité.
          </p>
        </section>

        <section className="legal-section">
          <h2>3. Compte utilisateur</h2>
          <p>
            Pour utiliser certaines fonctionnalités du service, vous devez créer un compte. Vous êtes responsable de
            maintenir la confidentialité de vos informations de compte et de toutes les activités qui se produisent sous
            votre compte.
          </p>
        </section>

        <section className="legal-section">
          <h2>4. Contenu de l'utilisateur</h2>
          <p>
            En téléchargeant du contenu sur Hifadhui, vous conservez tous vos droits de propriété sur ce contenu.
            Cependant, vous accordez à Hifadhui une licence limitée pour stocker et afficher votre contenu uniquement
            dans le but de fournir le service.
          </p>
          <p>
            Vous déclarez et garantissez que vous possédez ou avez les droits nécessaires pour partager tout contenu que
            vous téléchargez sur Hifadhui, et que ce contenu ne viole pas les droits de tiers.
          </p>
        </section>

        <section className="legal-section">
          <h2>5. Utilisation acceptable</h2>
          <p>Vous acceptez de ne pas utiliser Hifadhui pour:</p>
          <ul>
            <li>
              Télécharger ou partager du contenu illégal, nuisible, menaçant, abusif, harcelant, diffamatoire, vulgaire,
              obscène, ou autrement répréhensible
            </li>
            <li>Violer les droits de propriété intellectuelle d'autrui</li>
            <li>Tenter d'accéder à des comptes d'autres utilisateurs ou à des zones sécurisées du service</li>
            <li>Perturber ou interférer avec le service ou les serveurs ou réseaux connectés au service</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>6. Sécurité et confidentialité</h2>
          <p>
            Hifadhui s'engage à protéger la sécurité et la confidentialité de vos photos et informations personnelles.
            Nous utilisons des technologies de chiffrement et des mesures de sécurité avancées pour protéger vos
            données.
          </p>
          <p>
            Pour plus d'informations sur la façon dont nous collectons, utilisons et protégeons vos données, veuillez
            consulter notre
            <Link to="/privacy"> Politique de confidentialité</Link>.
          </p>
        </section>

        <section className="legal-section">
          <h2>7. Modifications du service</h2>
          <p>
            Hifadhui se réserve le droit de modifier ou d'interrompre, temporairement ou définitivement, le service (ou
            toute partie de celui-ci) avec ou sans préavis. Nous ne serons pas responsables envers vous ou un tiers pour
            toute modification, suspension ou interruption du service.
          </p>
        </section>

        <section className="legal-section">
          <h2>8. Limitation de responsabilité</h2>
          <p>
            Dans toute la mesure permise par la loi, Hifadhui ne sera pas responsable des dommages directs, indirects,
            accessoires, spéciaux, consécutifs ou punitifs, y compris, mais sans s'y limiter, la perte de profits, de
            données, d'utilisation, de bonne volonté, ou d'autres pertes intangibles, résultant de votre accès ou
            utilisation ou incapacité à accéder ou à utiliser le service.
          </p>
        </section>

        <section className="legal-section">
          <h2>9. Loi applicable</h2>
          <p>
            Ces conditions sont régies et interprétées conformément aux lois françaises, sans égard aux principes de
            conflits de lois.
          </p>
        </section>

        <section className="legal-section">
          <h2>10. Contact</h2>
          <p>
            Si vous avez des questions concernant ces conditions d'utilisation, veuillez nous contacter à l'adresse
            suivante: contact@hifadhui.com
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

