/**
 * Service de géolocalisation IP
 * Utilise une API gratuite pour obtenir les informations de localisation
 */

/**
 * Enrichit les données de session avec les informations de géolocalisation
 * @param {string} ipAddress - L'adresse IP à analyser
 * @returns {Object} - Informations de géolocalisation
 */
export const enrichIPData = async (ipAddress) => {
  console.log(`🌍 [IP GEO] Début enrichissement pour IP: ${ipAddress}`);
  
  // Ignorer les IPs locales
  if (!ipAddress || 
      ipAddress === '127.0.0.1' || 
      ipAddress === '::1' || 
      ipAddress.startsWith('192.168.') || 
      ipAddress.startsWith('10.') || 
      ipAddress.startsWith('172.')) {
    
    const localData = {
      country: 'Local',
      countryCode: 'LO',
      city: 'Localhost',
      region: 'Local Network',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      isp: 'Local Network'
    };
    
    console.log(`🏠 [IP GEO] IP locale détectée:`, localData);
    return localData;
  }

  try {
    console.log(`🔍 [IP GEO] Appel API pour ${ipAddress}...`);
    
    // Utilisation de l'API gratuite ip-api.com (100 requêtes/minute)
    const response = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,message,country,countryCode,region,regionName,city,timezone,isp,query`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`📡 [IP GEO] Réponse API:`, data);
    
    if (data.status === 'fail') {
      console.warn(`❌ Géolocalisation échouée pour ${ipAddress}:`, data.message);
      return getDefaultIPData();
    }

    const enrichedData = {
      country: data.country || 'Unknown',
      countryCode: data.countryCode || 'XX',
      city: data.city || 'Unknown',
      region: data.regionName || 'Unknown',
      timezone: data.timezone || 'Unknown',
      isp: data.isp || 'Unknown'
    };

    console.log(`✅ [IP GEO] Données enrichies:`, enrichedData);
    return enrichedData;

  } catch (error) {
    console.error(`❌ Erreur géolocalisation pour ${ipAddress}:`, error.message);
    return getDefaultIPData();
  }
};

/**
 * Retourne des données par défaut en cas d'erreur
 */
const getDefaultIPData = () => ({
  country: 'Unknown',
  countryCode: 'XX',
  city: 'Unknown',
  region: 'Unknown',
  timezone: 'Unknown',
  isp: 'Unknown'
});

/**
 * Met à jour une session existante avec les données de géolocalisation
 * @param {Object} session - L'objet session Sequelize
 * @param {string} ipAddress - L'adresse IP
 */
export const updateSessionWithIPData = async (session, ipAddress) => {
  try {
    const ipData = await enrichIPData(ipAddress);
    
    await session.update({
      country: ipData.country,
      countryCode: ipData.countryCode,
      city: ipData.city,
      region: ipData.region,
      timezone: ipData.timezone,
      isp: ipData.isp
    });

    console.log(`🌍 [IP GEO] Données enrichies pour ${ipAddress}:`, {
      country: ipData.country,
      city: ipData.city,
      isp: ipData.isp
    });

    return ipData;
  } catch (error) {
    console.error(`❌ Erreur mise à jour géolocalisation:`, error);
    return null;
  }
};
