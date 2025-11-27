// Service de génération de licences pour les téléchargements ZIP
// Génère un texte de licence (txt) basé sur la sélection de fichiers et un template générique avec placeholders

const extractLettersFromFilenames = (items = []) => {
  const letters = new Set();

  items.forEach((item) => {
    const name = item?.filename || '';
    // Exemple attendu : A-fond.png, B-profil.jpg
    const match = name.match(/^([A-Za-zÀ-ÖØ-öø-ÿ])/);
    if (match && match[1]) {
      letters.add(match[1].toUpperCase());
    }
  });

  return Array.from(letters).sort((a, b) => a.localeCompare(b, 'fr'));
};

const buildPackName = (items = []) => {
  if (!items || items.length === 0) {
    return 'Pack de fichiers';
  }

  if (items.length === 1) {
    const name = items[0]?.filename || 'Fichier';
    return `Pack – ${name}`;
  }

  const total = items.length;
  const firstNames = items
    .slice(0, 3)
    .map((item) => item.filename || 'Fichier')
    .join(', ');

  if (total <= 3) {
    return `Pack – ${firstNames}`;
  }

  return `Pack – ${firstNames} (+${total - 3} autres fichiers)`;
};

const buildFilesSection = (items = []) => {
  if (!items || items.length === 0) {
    return 'Aucun fichier sélectionné.';
  }

  const lines = items.map((item) => {
    const filename = item.filename || 'Fichier sans nom';
    const productId = item.empreinte?.product_id || 'N/A';
    const hash = item.hash || 'N/A';

    return `- ${filename} (Product ID: ${productId}, Hash: ${hash})`;
  });

  return lines.join('\n');
};

// Template par défaut EDITABLE (placeholders: {{HEADER}}, {{PACK_NAME}}, {{CREATOR_NAME}}, {{FILES_SECTION}})
const DEFAULT_EDITABLE_TEMPLATE = `{{HEADER}}

==================================================
1. PRÉSENTATION DU PRODUIT
==================================================

{{PACK_NAME}}
Créateur : {{CREATOR_NAME}}

==================================================
2. CONTENU DU PACK
==================================================

Les fichiers suivants sont inclus dans ce pack :

{{FILES_SECTION}}

==================================================
3. LICENCE D'UTILISATION
==================================================

Vous êtes autorisé à :
- utiliser ces fichiers dans vos projets personnels ou commerciaux,
- les modifier selon vos besoins (couleurs, forme, intégration, montage),
- les intégrer dans vos créations destinées à la vente (images, affiches, contenus numériques, etc.).

Vous n'êtes pas autorisé à :
- revendre ou redistribuer les fichiers d'origine tels quels,
- offrir gratuitement les fichiers sources,
- revendiquer que vous êtes l'auteur initial des fichiers fournis.

==================================================
4. PROPRIÉTÉ & PREUVE D'ANTÉRIORITÉ
==================================================

Les visuels restent la propriété exclusive de {{CREATOR_NAME}}
L'acheteur reçoit une licence commerciale d'utilisation,
mais les droits d'auteur ne sont pas transférés.
`;

// Bloc NON ÉDITABLE, toujours ajouté à la fin de la licence générée
const NON_EDITABLE_FOOTER = `Sécurité de la propriété :
Tous les fichiers sont enregistrés, horodatés et protégés sur la plateforme :
👉 https://hifadhui.site

Vérification officielle :
Vous pouvez confirmer la paternité et l'existence du fichier via :
👉 https://hifadhui.site/verify

Modes de recherche disponibles :
• Par signature numérique
• Par nom du fichier
• Par Product ID
`;

// Template texte utilisé comme base pour le rendu (partie éditable)
const DEFAULT_TXT_TEMPLATE = DEFAULT_EDITABLE_TEMPLATE;

// Export du template par défaut pour l'UI (Settings) : uniquement la partie éditable
export const DEFAULT_MD_TEMPLATE = DEFAULT_EDITABLE_TEMPLATE;

const renderTemplate = (template, variables = {}) => {
  if (!template || typeof template !== 'string') {
    return '';
  }

  return Object.keys(variables).reduce((result, key) => {
    const value = variables[key] != null ? String(variables[key]) : '';
    const pattern = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    return result.replace(pattern, value);
  }, template);
};

/**
 * Génère le contenu texte de la licence (txt et md) pour une sélection de fichiers
 * @param {Array} selectedItems - Fichiers sélectionnés (avec filename, empreinte, hash, etc.)
 * @param {{ txtTemplate?: string, mdTemplate?: string }} templates - (optionnel) templates personnalisés
 * @param {{ creatorName?: string }} options - (optionnel) options supplémentaires, ex: nom/marque du créateur
 * @returns {{ txtContent: string, mdContent: string }}
 */
export const generateLicenseForSelection = (selectedItems = [], templates = {}, options = {}) => {
  const packName = buildPackName(selectedItems);
  const filesSection = buildFilesSection(selectedItems);

  const header = "FICHE PRODUIT & LICENCE D'UTILISATION";
  const creator = options.creatorName || 'Hifadhui';

  // Un seul template partagé pour TXT (et éventuellement MD pour compat) :
  // 1) template texte personnalisé (txtTemplate)
  // 2) sinon template Markdown personnalisé (mdTemplate)
  // 3) sinon template texte par défaut
  const effectiveTemplate =
    templates.txtTemplate ||
    templates.mdTemplate ||
    DEFAULT_TXT_TEMPLATE;

  const variables = {
    HEADER: header,
    PACK_NAME: packName,
    CREATOR_NAME: creator,
    FILES_SECTION: filesSection
  };

  const renderedBody = renderTemplate(effectiveTemplate, variables);
  const finalText = `${renderedBody}\n\n${renderTemplate(NON_EDITABLE_FOOTER, variables)}`;

  // Même contenu pour compatibilité, mais seul .txt est réellement utilisé côté ZIP
  const txtContent = finalText;
  const mdContent = finalText;

  return { txtContent, mdContent };
};
