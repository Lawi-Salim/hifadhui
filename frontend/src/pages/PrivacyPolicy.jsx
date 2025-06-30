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
            politique de confidentialité explique comment nous collectons, utilisons, partageons et protégeons vos
            informations lorsque vous utilisez notre service.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Informations que nous collectons</h2>
          <p>Nous collectons les types d'informations suivants:</p>
          <ul>
            <li>
              <strong>Informations de compte:</strong> Lorsque vous créez un compte, nous collectons votre nom
              d'utilisateur, adresse e-mail et mot de passe.
            </li>
            <li>
              <strong>Contenu utilisateur:</strong> Les photos que vous téléchargez, ainsi que les titres et
              descriptions associés.
            </li>
            <li>
              <strong>Informations d'utilisation:</strong> Comment vous interagissez avec notre service, y compris les
              dates et heures d'accès, les pages visitées et les fonctionnalités utilisées.
            </li>
            <li>
              <strong>Informations techniques:</strong> Adresse IP, type de navigateur, appareil utilisé, et système
              d'exploitation.
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. Comment nous utilisons vos informations</h2>
          <p>Nous utilisons vos informations pour:</p>
          <ul>
            <li>Fournir, maintenir et améliorer notre service</li>
            <li>Créer et gérer votre compte</li>
            <li>Stocker et afficher vos photos</li>
            <li>Communiquer avec vous concernant votre compte ou notre service</li>
            <li>Protéger la sécurité et l'intégrité de notre service</li>
            <li>Respecter nos obligations légales</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. Protection des données</h2>
          <p>
            Nous prenons la sécurité de vos données très au sérieux. Nous mettons en œuvre des mesures techniques et
            organisationnelles appropriées pour protéger vos informations personnelles contre la perte, l'accès non
            autorisé, la divulgation, l'altération et la destruction.
          </p>
          <p>
            Vos photos sont stockées avec un chiffrement avancé et ne sont accessibles qu'à vous, sauf si vous
            choisissez explicitement de les partager.
          </p>
        </section>

        <section className="legal-section">
          <h2>5. Conformité au RGPD</h2>
          <p>
            Hifadhui est conforme au Règlement Général sur la Protection des Données (RGPD) de l'Union européenne. Cela
            signifie que vous avez certains droits concernant vos données personnelles, notamment:
          </p>
          <ul>
            <li>Le droit d'accéder à vos données personnelles</li>
            <li>Le droit de rectifier vos données personnelles</li>
            <li>Le droit de supprimer vos données personnelles</li>
            <li>Le droit de restreindre le traitement de vos données personnelles</li>
            <li>Le droit à la portabilité des données</li>
            <li>Le droit de s'opposer au traitement</li>
          </ul>
          <p>Pour exercer ces droits, veuillez nous contacter à l'adresse indiquée à la fin de cette politique.</p>
        </section>

        <section className="legal-section">
          <h2>6. Conservation des données</h2>
          <p>
            Nous conservons vos données personnelles aussi longtemps que nécessaire pour fournir notre service et
            respecter nos obligations légales. Si vous supprimez votre compte, nous supprimerons vos informations
            personnelles et vos photos dans un délai raisonnable, sauf si la loi nous oblige à les conserver.
          </p>
        </section>

        <section className="legal-section">
          <h2>7. Partage des informations</h2>
          <p>
            Nous ne vendons pas vos informations personnelles à des tiers. Nous pouvons partager vos informations dans
            les circonstances suivantes:
          </p>
          <ul>
            <li>Avec votre consentement</li>
            <li>Pour se conformer à une obligation légale</li>
            <li>Pour protéger nos droits, notre vie privée, notre sécurité ou notre propriété</li>
            <li>Dans le cadre d'une transaction d'entreprise, comme une fusion ou une acquisition</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>8. Modifications de cette politique</h2>
          <p>
            Nous pouvons mettre à jour cette politique de confidentialité de temps à autre. Nous vous informerons de
            tout changement important en publiant la nouvelle politique sur cette page et en vous envoyant un e-mail.
          </p>
        </section>

        <section className="legal-section">
          <h2>9. Contact</h2>
          <p>
            Si vous avez des questions concernant cette politique de confidentialité, veuillez nous contacter à
            l'adresse suivante: privacy@hifadhui.com
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

