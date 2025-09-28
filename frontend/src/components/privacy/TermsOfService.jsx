import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiFileText, FiShield, FiAlertTriangle, FiUsers, FiCreditCard, FiBookOpen, FiLock, FiCheckCircle } from 'react-icons/fi';
import './LegalPages.css';

const TermsOfService = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        {/* Header avec navigation */}
        <div className="legal-header">
          <Link to="/" className="back-link">
            <FiArrowLeft />
            <span>Retour à l'accueil</span>
          </Link>
          <div className="legal-title">
            <FiFileText className="legal-icon" />
            <h1>Conditions d'Utilisation</h1>
          </div>
          <p className="legal-subtitle">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>

        {/* Contenu */}
        <div className="legal-content">
          {/* Introduction */}
          <section className="legal-section">
            <h2>Acceptation des conditions</h2>
            <p>
              En utilisant <strong>Hifadhui</strong>, vous acceptez d'être lié par ces conditions d'utilisation. 
              Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.
            </p>
            <p>
              Ces conditions constituent un accord légal entre vous et Hifadhui concernant l'utilisation 
              de notre service de coffre-fort numérique.
            </p>
          </section>

          {/* Description du service */}
          <section className="legal-section">
            <div className="section-header">
              <FiShield className="section-icon" />
              <h2>Description du service</h2>
            </div>
            
            <p>
              <strong>Hifadhwi</strong> est un service de stockage cloud sécurisé qui vous permet de :
            </p>
            
            <ul>
              <li><strong>Stocker</strong> vos documents, images et fichiers de manière sécurisée</li>
              <li><strong>Organiser</strong> vos fichiers dans des dossiers personnalisés</li>
              <li><strong>Partager</strong> vos documents via des liens sécurisés temporaires (24h)</li>
              <li><strong>Accéder</strong> à vos fichiers depuis n'importe quel appareil</li>
              <li><strong>Générer</strong> des certificats d'authenticité pour vos documents</li>
              <li><strong>Prouver</strong> la propriété intellectuelle avec hash SHA-256</li>
              <li><strong>Authentifier</strong> via Google OAuth ou compte local</li>
            </ul>

            <h3>Fonctionnalités futures prévues</h3>
            <ul>
              <li><strong>Partage avancé</strong> : QR codes, protection par mot de passe, durées personnalisables</li>
              <li><strong>Statistiques</strong> : Historique des accès et analytics de partage</li>
              <li><strong>Validation email</strong> : Restriction aux domaines reconnus (Gmail, Yahoo, Outlook, etc.)</li>
              <li><strong>Partage en lot</strong> : Albums temporaires et gestion groupée</li>
            </ul>
          </section>

          {/* Création de compte */}
          <section className="legal-section">
            <div className="section-header">
              <FiUsers className="section-icon" />
              <h2>Création et gestion de compte</h2>
            </div>
            
            <h3>Éligibilité</h3>
            <ul>
              <li>Vous devez avoir au moins <strong>16 ans</strong> pour utiliser Hifadhui</li>
              <li>Vous devez fournir des informations exactes et à jour</li>
              <li>Un seul compte par personne est autorisé</li>
            </ul>

            <h3>Responsabilités du compte</h3>
            <ul>
              <li><strong>Sécurité</strong> : Vous êtes responsable de la sécurité de votre mot de passe</li>
              <li><strong>Activité</strong> : Toute activité sur votre compte est sous votre responsabilité</li>
              <li><strong>Notification</strong> : Informez-nous immédiatement de tout usage non autorisé</li>
              <li><strong>Exactitude</strong> : Maintenez vos informations de compte à jour</li>
            </ul>
          </section>

          {/* Utilisation acceptable */}
          <section className="legal-section">
            <div className="section-header">
              <FiAlertTriangle className="section-icon" />
              <h2>Utilisation acceptable</h2>
            </div>
            
            <h3>Utilisations autorisées</h3>
            <ul>
              <li>Stockage de documents personnels et professionnels légitimes</li>
              <li>Partage de fichiers avec des personnes autorisées</li>
              <li>Organisation et gestion de vos données personnelles</li>
              <li>Utilisation conforme aux lois applicables</li>
            </ul>

            <h3>Utilisations interdites</h3>
            <div className="prohibited-content">
              <p><strong>Il est strictement interdit de stocker ou partager :</strong></p>
              <ul>
                <li><strong>Contenu illégal</strong> : Matériel violant les lois locales ou internationales</li>
                <li><strong>Contenu malveillant</strong> : Virus, malware, ou code nuisible</li>
                <li><strong>Contenu protégé</strong> : Matériel sous copyright sans autorisation</li>
                <li><strong>Contenu offensant</strong> : Harcèlement, discrimination, ou contenu haineux</li>
                <li><strong>Données sensibles</strong> : Informations médicales, financières sans autorisation</li>
                <li><strong>Spam ou phishing</strong> : Contenu frauduleux ou trompeur</li>
              </ul>
            </div>
          </section>

          {/* Propriété intellectuelle */}
          <section className="legal-section">
            <h2>Propriété intellectuelle</h2>
            
            <h3>Vos droits</h3>
            <ul>
              <li>Vous conservez tous les droits sur vos fichiers et documents</li>
              <li>Hifadhui ne revendique aucun droit sur votre contenu</li>
              <li>Vous pouvez supprimer ou exporter vos données à tout moment</li>
            </ul>

            <h3>Nos droits</h3>
            <ul>
              <li>Hifadhui, son logo et sa technologie sont notre propriété</li>
              <li>Vous ne pouvez pas copier, modifier ou distribuer notre service</li>
              <li>Toute utilisation non autorisée est interdite</li>
            </ul>

            <h3>Licence d'utilisation</h3>
            <p>
              En uploadant du contenu, vous nous accordez une licence limitée pour :
            </p>
            <ul>
              <li>Stocker et traiter vos fichiers</li>
              <li>Générer des aperçus bien détaillés</li>
              <li>Faciliter le partage selon vos instructions</li>
              <li>Assurer la sécurité et les sauvegardes</li>
            </ul>
          </section>

          {/* Surveillance et données techniques */}
          <section className="legal-section">
            <div className="section-header">
              <FiShield className="section-icon" />
              <h2>Surveillance et collecte de données techniques</h2>
            </div>
            
            <h3>Finalités de la collecte</h3>
            <p>
              En utilisant Hifadhui, vous acceptez que nous collections et analysions des données techniques pour :
            </p>
            <ul>
              <li><strong>Sécurité du service</strong> : Détection d'activités suspectes et de tentatives d'intrusion</li>
              <li><strong>Amélioration continue</strong> : Optimisation des performances et de l'expérience utilisateur</li>
              <li><strong>Support technique</strong> : Diagnostic et résolution rapide des problèmes</li>
              <li><strong>Conformité légale</strong> : Respect des obligations réglementaires</li>
            </ul>

            <h3>Données collectées automatiquement</h3>
            <div className="privacy-notice">
              <p><strong>Informations techniques collectées :</strong></p>
              <ul>
                <li>Adresse IP publique et géolocalisation approximative</li>
                <li>Informations sur le navigateur et le système d'exploitation</li>
                <li>Historique des connexions et des actions effectuées</li>
                <li>Données de performance et d'utilisation du service</li>
                <li>Journaux d'accès et de sécurité</li>
              </ul>
            </div>

            <h3>Tableau de bord administrateur</h3>
            <p>
              Les administrateurs autorisés peuvent consulter des analyses agrégées et anonymisées via un tableau de bord sécurisé pour :
            </p>
            <ul>
              <li>Surveiller la sécurité globale du service</li>
              <li>Analyser les tendances d'utilisation</li>
              <li>Optimiser les performances techniques</li>
              <li>Détecter et prévenir les abus</li>
            </ul>

            <h3>Vos droits et garanties</h3>
            <div className="privacy-highlight">
              <h4><FiShield className="section-icon" /> Protections mises en place</h4>
              <ul>
                <li><strong>Anonymisation automatique</strong> : Données personnelles anonymisées après 90 jours</li>
                <li><strong>Accès restreint</strong> : Seuls les administrateurs autorisés peuvent consulter ces données</li>
                <li><strong>Finalité limitée</strong> : Utilisation exclusivement pour la sécurité et l'amélioration du service</li>
                <li><strong>Pas de commercialisation</strong> : Aucune vente ou partage à des fins commerciales</li>
                <li><strong>Droit d'accès</strong> : Vous pouvez demander l'accès à vos données techniques</li>
                <li><strong>Droit de suppression</strong> : Vous pouvez demander la suppression de vos données</li>
              </ul>
            </div>

            <h3>Consentement et acceptation</h3>
            <p>
              En utilisant Hifadhui, vous consentez explicitement à cette collecte de données techniques. 
              Ce consentement peut être retiré à tout moment en cessant d'utiliser le service ou en nous contactant.
            </p>
          </section>

          {/* Tarification */}
          <section className="legal-section">
            <div className="section-header">
              <FiCreditCard className="section-icon" />
              <h2>Tarification et paiements</h2>
            </div>
            
            <h3>Service gratuit</h3>
            <p>
              Hifadhui propose actuellement un service <strong>gratuit</strong> avec les limitations suivantes :
            </p>
            <ul>
              <li>Espace de stockage limité</li>
              <li>Taille maximale par fichier : 5 MB</li>
              <li>Fonctionnalités de base incluses</li>
            </ul>

            <h3>Évolutions futures</h3>
            <p>
              Nous nous réservons le droit d'introduire des plans payants avec :
            </p>
            <ul>
              <li>Espace de stockage étendu</li>
              <li>Fonctionnalités avancées</li>
              <li>Support prioritaire</li>
              <li>Préavis de 30 jours pour tout changement tarifaire</li>
            </ul>
          </section>

          {/* Disponibilité du service */}
          <section className="legal-section">
            <h2>Disponibilité et maintenance</h2>
            
            <h3>Engagement de service</h3>
            <ul>
              <li>Nous visons une disponibilité de <strong>99.9%</strong></li>
              <li>Maintenance programmée avec préavis</li>
              <li>Sauvegardes automatiques quotidiennes</li>
            </ul>

            <h3>Interruptions possibles</h3>
            <ul>
              <li>Maintenance technique planifiée</li>
              <li>Problèmes d'infrastructure tiers</li>
              <li>Cas de force majeure</li>
              <li>Mesures de sécurité d'urgence</li>
            </ul>
          </section>

          {/* Limitation de responsabilité */}
          <section className="legal-section">
            <div className="section-header">
              <FiBookOpen className="section-icon" />
              <h2>Limitation de responsabilité</h2>
            </div>
            
            <h3>Service fourni "en l'état"</h3>
            <p>
              Hifadhui est fourni sans garantie expresse ou implicite. Nous ne garantissons pas :
            </p>
            <ul>
              <li>L'absence d'interruption du service</li>
              <li>L'absence d'erreurs ou de bugs</li>
              <li>La compatibilité avec tous les appareils</li>
              <li>La récupération de données en cas de problème technique</li>
            </ul>

            <h3>Limitation des dommages</h3>
            <p>
              Notre responsabilité est limitée au montant payé pour le service au cours des 12 derniers mois. 
              Nous ne sommes pas responsables des dommages indirects, consécutifs ou punitifs.
            </p>

            <h3>Vos responsabilités</h3>
            <ul>
              <li><strong>Sauvegardes</strong> : Maintenez des copies de vos fichiers importants</li>
              <li><strong>Sécurité</strong> : Protégez vos identifiants de connexion</li>
              <li><strong>Conformité</strong> : Respectez les lois applicables</li>
              <li><strong>Usage raisonnable</strong> : N'abusez pas des ressources du service</li>
            </ul>
          </section>

          {/* Suspension et résiliation */}
          <section className="legal-section">
            <h2>Suspension et résiliation</h2>
            
            <h3>Résiliation par vous</h3>
            <ul>
              <li>Vous pouvez supprimer votre compte à tout moment depuis les paramètres</li>
              <li><strong>Période de grâce de 14 jours</strong> : Votre compte devient inaccessible mais récupérable</li>
              <li><strong>Lien de récupération</strong> : Envoyé par email pour réactiver votre compte</li>
              <li><strong>Suppression définitive</strong> : Après 14 jours, toutes vos données sont supprimées</li>
              <li><strong>Données externes</strong> : Fichiers Cloudinary et sessions OAuth révoquées</li>
            </ul>

            <h3>Suspension par Hifadhui</h3>
            <p>Nous pouvons suspendre votre compte en cas de :</p>
            <ul>
              <li>Violation de ces conditions d'utilisation</li>
              <li>Activité suspecte ou frauduleuse</li>
              <li>Non-paiement (pour les services payants futurs)</li>
              <li>Demande des autorités compétentes</li>
            </ul>

            <h3>Procédure de résiliation</h3>
            <ul>
              <li><strong>Avertissement</strong> : Notification préalable quand possible</li>
              <li><strong>Période de correction</strong> : 7 jours pour corriger les violations</li>
              <li><strong>Appel</strong> : Possibilité de contester la décision</li>
              <li><strong>Récupération</strong> : Accès aux données pendant 30 jours</li>
            </ul>
          </section>

          {/* Modifications */}
          <section className="legal-section">
            <h2>Modifications des conditions</h2>
            
            <p>
              Nous pouvons modifier ces conditions d'utilisation. Les modifications importantes seront :
            </p>
            <ul>
              <li><strong>Notifiées</strong> par e-mail 30 jours à l'avance</li>
              <li><strong>Affichées</strong> dans l'application avec la nouvelle date</li>
              <li><strong>Effectives</strong> après la période de préavis</li>
            </ul>
            
            <p>
              L'utilisation continue du service après notification constitue votre acceptation des nouvelles conditions.
            </p>
          </section>

          {/* Droit applicable */}
          <section className="legal-section">
            <h2>Droit applicable et juridiction</h2>
            
            <ul>
              <li><strong>Droit applicable</strong> : Droit français</li>
              <li><strong>Juridiction</strong> : Tribunaux français compétents</li>
              <li><strong>Médiation</strong> : Tentative de résolution amiable privilégiée</li>
              <li><strong>Langue</strong> : Version française fait foi</li>
            </ul>
          </section>

          {/* Dispositions générales */}
          <section className="legal-section">
            <h2>Dispositions générales</h2>
            
            <h3>Intégralité de l'accord</h3>
            <p>
              Ces conditions, avec notre politique de confidentialité, constituent l'intégralité 
              de l'accord entre vous et Hifadhui.
            </p>

            <h3>Divisibilité</h3>
            <p>
              Si une disposition est jugée invalide, les autres dispositions restent en vigueur.
            </p>

            <h3>Renonciation</h3>
            <p>
              Le fait de ne pas faire valoir un droit ne constitue pas une renonciation à ce droit.
            </p>
          </section>

          {/* Contact */}
          <section className="legal-section">
            <h2>Contact et support</h2>
            
            <p>Pour toute question concernant ces conditions d'utilisation :</p>
            
            <div className="contact-info">
              {/* <div className="contact-item">
                <strong>Support général :</strong> <a href="mailto:mavuna@hifadhui.site">mavuna@hifadhui.site</a>
              </div>
              <div className="contact-item">
                <strong>Questions légales :</strong> <a href="mailto:mavuna@hifadhui.site">mavuna@hifadhui.site</a>
              </div>
              <div className="contact-item">
                <strong>Signalement d'abus :</strong> <a href="mailto:mavuna@hifadhui.site">mavuna@hifadhui.site</a>
              </div> */}
              <div className="contact-item">
                <strong>Site web :</strong> <a href="https://hifadhui.site">https://hifadhui.site</a>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="legal-footer">
          <p>
            Ces conditions d'utilisation sont effectives depuis le {new Date().toLocaleDateString('fr-FR')} 
            et s'appliquent à tous les utilisateurs de Hifadhui.
          </p>
          <div className="legal-links">
            <Link to="/privacy">Politique de confidentialité</Link>
            <Link to="/contact">Nous contacter</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
