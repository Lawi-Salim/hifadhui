import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiShield, FiLock, FiEye, FiDatabase, FiMail, FiUsers, FiMonitor, FiGlobe, FiActivity, FiZap, FiCheckCircle } from 'react-icons/fi';
import './LegalPages.css';

const PrivacyPolicy = () => {
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
            <FiShield className="legal-icon" />
            <h1>Politique de Confidentialité</h1>
          </div>
          <p className="legal-subtitle">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>

        {/* Contenu */}
        <div className="legal-content">
          {/* Introduction */}
          <section className="legal-section">
            <h2>Introduction</h2>
            <p>
              Chez <strong>Hifadhui</strong>, nous nous engageons à protéger votre vie privée et vos données personnelles. 
              Cette politique de confidentialité explique comment nous collectons, utilisons, stockons et protégeons 
              vos informations lorsque vous utilisez notre service de coffre-fort numérique.
            </p>
          </section>

          {/* Données collectées */}
          <section className="legal-section">
            <div className="section-header">
              <FiDatabase className="section-icon" />
              <h2>Données que nous collectons</h2>
            </div>
            
            <h3>Informations d'identification</h3>
            <ul>
              <li><strong>Nom et prénom</strong> : Pour personnaliser votre expérience</li>
              <li><strong>Adresse e-mail</strong> : Pour la création de compte et les communications</li>
              <li><strong>Validation des domaines</strong> : Seuls certains domaines email reconnus sont autorisés pour l'inscription (Gmail, Yahoo, Outlook, etc.) pour éviter les emails jetables</li>
              <li><strong>Mot de passe</strong> : Chiffré et sécurisé pour l'authentification</li>
              <li><strong>Photo de profil</strong> : Optionnelle, via Google OAuth si utilisée</li>
            </ul>

            <h3>Fichiers et documents</h3>
            <ul>
              <li><strong>Documents uploadés</strong> : Images, PDFs que vous stockez</li>
              <li><strong>Métadonnées</strong> : Nom, taille, type et date de création des fichiers</li>
              <li><strong>Organisation</strong> : Structure de dossiers et organisation de vos documents</li>
            </ul>

            <h3>Données techniques et de sécurité</h3>
            <ul>
              <li><strong>Adresse IP publique</strong> : Pour la sécurité, géolocalisation et détection d'anomalies</li>
              <li><strong>Informations de navigation</strong> : 
                <ul>
                  <li>Type et version du navigateur (Chrome, Firefox, Safari, etc.)</li>
                  <li>Système d'exploitation (Windows, macOS, Linux, iOS, Android)</li>
                  <li>Résolution d'écran et informations d'affichage</li>
                  <li>User-Agent complet pour l'identification technique</li>
                </ul>
              </li>
              <li><strong>Données de géolocalisation</strong> : 
                <ul>
                  <li>Pays, région et ville approximative basés sur l'IP</li>
                  <li>Fournisseur d'accès Internet (FAI)</li>
                  <li>Fuseau horaire automatiquement détecté</li>
                </ul>
              </li>
              <li><strong>Journaux d'activité détaillés</strong> : 
                <ul>
                  <li>Historique des connexions avec horodatage précis</li>
                  <li>Actions effectuées (upload, téléchargement, partage, suppression)</li>
                  <li>Tentatives de connexion (réussies et échouées)</li>
                  <li>Accès aux fichiers partagés avec comptage des consultations</li>
                </ul>
              </li>
              <li><strong>Données de performance</strong> : 
                <ul>
                  <li>Temps de chargement des pages</li>
                  <li>Erreurs techniques rencontrées</li>
                  <li>Statistiques d'utilisation des fonctionnalités</li>
                </ul>
              </li>
              <li><strong>Empreinte technique</strong> : 
                <ul>
                  <li>Informations sur les plugins et extensions installés</li>
                  <li>Préférences de langue du navigateur</li>
                  <li>Informations sur les cookies et le stockage local</li>
                </ul>
              </li>
            </ul>
            
            <div className="privacy-notice">
              <p><strong><FiLock style={{display: 'inline', marginRight: '8px'}} />Engagement de confidentialité :</strong> Toutes les données techniques sont collectées uniquement à des fins de sécurité, d'amélioration du service et de détection d'activités suspectes. Elles sont automatiquement anonymisées après 90 jours et ne sont jamais partagées avec des tiers.</p>
            </div>
          </section>

          {/* Utilisation des données */}
          <section className="legal-section">
            <div className="section-header">
              <FiEye className="section-icon" />
              <h2>Comment nous utilisons vos données</h2>
            </div>
            
            <ul>
              <li><strong>Fourniture du service</strong> : Stockage sécurisé et accès à vos fichiers</li>
              <li><strong>Authentification</strong> : Vérification de votre identité et sécurisation de votre compte</li>
              <li><strong>Communication</strong> : Notifications importantes, mises à jour de sécurité</li>
              <li><strong>Amélioration du service</strong> : Analyse d'usage pour optimiser l'expérience</li>
              <li><strong>Sécurité avancée</strong> : 
                <ul>
                  <li>Détection d'activités suspectes et de tentatives d'intrusion</li>
                  <li>Analyse des patterns de connexion pour identifier les anomalies</li>
                  <li>Surveillance géographique pour détecter les accès inhabituels</li>
                  <li>Monitoring des plateformes et navigateurs pour la sécurité</li>
                </ul>
              </li>
              <li><strong>Support technique</strong> : Assistance et résolution de problèmes</li>
              <li><strong>Conformité légale</strong> : Respect des obligations légales et réglementaires</li>
            </ul>
          </section>

          {/* Analyse technique et surveillance */}
          <section className="legal-section">
            <div className="section-header">
              <FiDatabase className="section-icon" />
              <h2>Analyse technique et surveillance</h2>
            </div>
            
            <h3>Dashboard administrateur</h3>
            <p>
              Pour assurer la sécurité et la qualité du service, nous collectons et analysons des données techniques via un tableau de bord administrateur sécurisé :
            </p>
            
            <h4><FiMonitor className="section-icon" /> Analyse des plateformes</h4>
            <ul>
              <li><strong>Navigateurs utilisés</strong> : Statistiques d'usage (Chrome, Firefox, Safari, etc.)</li>
              <li><strong>Systèmes d'exploitation</strong> : Répartition des plateformes (Windows, macOS, Linux, mobile)</li>
              <li><strong>Versions et compatibilité</strong> : Suivi des versions pour optimiser la compatibilité</li>
            </ul>

            <h4><FiGlobe className="section-icon" /> Analyse géographique</h4>
            <ul>
              <li><strong>Répartition géographique</strong> : Pays et régions d'utilisation du service</li>
              <li><strong>Détection d'anomalies</strong> : Connexions depuis des localisations inhabituelles</li>
              <li><strong>Optimisation réseau</strong> : Amélioration des performances selon les régions</li>
            </ul>

            <h4><FiActivity className="section-icon" /> Historique des connexions</h4>
            <ul>
              <li><strong>Journaux de connexion</strong> : Horodatage, IP, navigateur, localisation</li>
              <li><strong>Détection de fraude</strong> : Identification des tentatives d'accès non autorisées</li>
              <li><strong>Analyse comportementale</strong> : Patterns d'utilisation pour la sécurité</li>
              <li><strong>Rétention limitée</strong> : Données automatiquement supprimées après 90 jours</li>
            </ul>

            <h4><FiZap className="section-icon" /> Monitoring technique</h4>
            <ul>
              <li><strong>Performance du service</strong> : Temps de réponse, disponibilité, erreurs</li>
              <li><strong>Utilisation des ressources</strong> : Optimisation de l'infrastructure</li>
              <li><strong>Diagnostics d'erreurs</strong> : Identification et résolution rapide des problèmes</li>
            </ul>

            <div className="privacy-highlight">
              <h4><FiShield className="section-icon" /> Garanties de confidentialité</h4>
              <ul>
                <li><strong>Accès restreint</strong> : Seuls les administrateurs autorisés peuvent consulter ces données</li>
                <li><strong>Anonymisation automatique</strong> : Les données personnelles sont anonymisées après 90 jours</li>
                <li><strong>Finalité limitée</strong> : Utilisation exclusivement pour la sécurité et l'amélioration du service</li>
                <li><strong>Pas de profilage commercial</strong> : Aucune utilisation à des fins publicitaires ou commerciales</li>
                <li><strong>Conformité RGPD</strong> : Respect strict des réglementations européennes sur la protection des données</li>
              </ul>
            </div>
          </section>

          {/* Stockage et sécurité */}
          <section className="legal-section">
            <div className="section-header">
              <FiLock className="section-icon" />
              <h2>Stockage et sécurité</h2>
            </div>
            
            <h3>Localisation des données</h3>
            <p>
              Vos données sont stockées de manière sécurisée sur des serveurs cloud certifiés :
            </p>
            <ul>
              <li><strong>Base de données</strong> : Supabase (infrastructure PostgreSQL sécurisée)</li>
              <li><strong>Fichiers</strong> : Cloudinary (stockage cloud optimisé et sécurisé)</li>
              <li><strong>Hébergement</strong> : Vercel (infrastructure mondiale sécurisée)</li>
            </ul>

            <h3>Mesures de sécurité</h3>
            <ul>
              <li><strong>Chiffrement</strong> : Toutes les données sont chiffrées en transit et au repos</li>
              <li><strong>Authentification</strong> : Tokens JWT sécurisés avec expiration automatique</li>
              <li><strong>Accès contrôlé</strong> : Seuls les utilisateurs authentifiés accèdent à leurs données</li>
              <li><strong>Surveillance</strong> : Monitoring continu pour détecter les intrusions</li>
              <li><strong>Sauvegardes</strong> : Sauvegardes automatiques et redondantes</li>
            </ul>
          </section>

          {/* Partage des données */}
          <section className="legal-section">
            <div className="section-header">
              <FiUsers className="section-icon" />
              <h2>Partage de vos données</h2>
            </div>
            
            <p><strong>Nous ne vendons jamais vos données personnelles.</strong></p>
            
            <h3>Partage limité dans les cas suivants :</h3>
            <ul>
              <li><strong>Fournisseurs de services</strong> : Partenaires techniques (Cloudinary, Supabase) sous contrat strict</li>
              <li><strong>Obligations légales</strong> : Si requis par la loi ou une décision de justice</li>
              <li><strong>Protection des droits</strong> : Pour protéger nos droits, votre sécurité ou celle d'autrui</li>
              <li><strong>Consentement explicite</strong> : Avec votre autorisation préalable</li>
            </ul>
          </section>

          {/* Vos droits */}
          <section className="legal-section">
            <div className="section-header">
              <FiShield className="section-icon" />
              <h2>Vos droits</h2>
            </div>
            
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            
            <ul>
              <li><strong>Droit d'accès</strong> : Consulter toutes vos données personnelles</li>
              <li><strong>Droit de rectification</strong> : Corriger vos informations inexactes</li>
              <li><strong>Droit à l'effacement</strong> : Supprimer votre compte et toutes vos données</li>
              <li><strong>Droit à la portabilité</strong> : Exporter vos données dans un format standard</li>
              <li><strong>Droit d'opposition</strong> : Vous opposer au traitement de vos données</li>
              <li><strong>Droit de limitation</strong> : Limiter le traitement de vos données</li>
            </ul>

            <div className="rights-actions">
              <h3>Comment exercer vos droits :</h3>
              <ul>
                <li>Depuis votre compte : Paramètres → Confidentialité</li>
                <li>Par e-mail : <a href="mailto:mavuna@hifadhui.site">mavuna@hifadhui.site</a></li>
                <li>Délai de réponse : 30 jours maximum</li>
              </ul>
            </div>

            <div className="rights-actions">
              <h3>Suppression de compte avec période de grâce :</h3>
              <p>
                Lorsque vous supprimez votre compte, celui-ci entre en <strong>période de grâce de 14 jours</strong>. 
                Durant cette période :
              </p>
              <ul>
                <li><strong>Compte inaccessible</strong> : Vous ne pouvez plus vous connecter</li>
                <li><strong>Récupération possible</strong> : Un lien de récupération est envoyé par email</li>
                <li><strong>Suppression définitive</strong> : Après 14 jours, toutes vos données sont définitivement supprimées</li>
                <li><strong>Données externes</strong> : Fichiers Cloudinary et sessions OAuth révoquées</li>
              </ul>
            </div>
          </section>

          {/* Cookies et tracking */}
          <section className="legal-section">
            <h2>Cookies et technologies de suivi</h2>
            
            <h3>Cookies essentiels</h3>
            <ul>
              <li><strong>Authentification</strong> : Token de connexion sécurisé</li>
              <li><strong>Préférences</strong> : Paramètres d'affichage et de navigation</li>
              <li><strong>Sécurité</strong> : Protection contre les attaques CSRF</li>
            </ul>

            <h3>Cookies analytiques</h3>
            <p>
              Nous utilisons des cookies anonymes pour améliorer notre service. Vous pouvez les désactiver dans les 
              paramètres de votre navigateur.
            </p>
          </section>

          {/* Rétention des données */}
          <section className="legal-section">
            <h2>Durée de conservation</h2>
            
            <ul>
              <li><strong>Compte actif</strong> : Tant que votre compte existe</li>
              <li><strong>Suppression de compte</strong> : Période de grâce de 14 jours, puis suppression définitive</li>
              <li><strong>Données de sécurité</strong> : Journaux conservés 12 mois maximum</li>
              <li><strong>Données légales</strong> : Conservées selon les obligations légales</li>
            </ul>
          </section>

          {/* Modifications */}
          <section className="legal-section">
            <h2>Modifications de cette politique</h2>
            <p>
              Nous pouvons modifier cette politique de confidentialité. Les modifications importantes 
              vous seront notifiées par e-mail ou via l'application. La date de dernière mise à jour 
              est indiquée en haut de cette page.
            </p>
          </section>

          {/* Contact */}
          <section className="legal-section">
            <div className="section-header">
              <FiMail className="section-icon" />
              <h2>Contact</h2>
            </div>
            
            <p>Pour toute question concernant cette politique de confidentialité :</p>
            
            <div className="contact-info">
              {/* <div className="contact-item">
                <strong>Support général :</strong> <a href="mailto:mavuna@hifadhui.site">mavuna@hifadhui.site</a>
              </div>
              <div className="contact-item">
                <strong>Délégué à la protection des données :</strong> <a href="mailto:mavuna@hifadhui.site">mavuna@hifadhui.site</a>
              </div>
              <div className="contact-item">
                <strong>Questions juridiques :</strong> <a href="mailto:mavuna@hifadhui.site">mavuna@hifadhui.site</a>
              </div> */}
              <div className="contact-item">
                <strong>Site web :</strong> <a href="https://hifadhui.site">https://hifadhui.site</a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
