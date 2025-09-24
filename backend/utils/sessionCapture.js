import { UserSession } from '../models/index.js';
import { Op } from 'sequelize';
import { updateSessionWithIPData } from './ipGeolocation.js';

/**
 * Fonction utilitaire pour capturer une session utilisateur lors de la connexion
 */
export const captureUserSession = async (req, user) => {
  try {
    // Récupérer l'IP réelle
    const getClientIP = (req) => {
      const forwarded = req.headers['x-forwarded-for'];
      if (forwarded) {
        return forwarded.split(',')[0].trim();
      }
      
      const realIP = req.headers['x-real-ip'];
      if (realIP) {
        return realIP;
      }
      
      const remoteAddress = req.connection?.remoteAddress || 
                           req.socket?.remoteAddress || 
                           req.connection?.socket?.remoteAddress ||
                           req.ip;
      
      // Nettoyer l'IPv6 mapped IPv4
      if (remoteAddress && remoteAddress.startsWith('::ffff:')) {
        return remoteAddress.substring(7);
      }
      
      // En développement, si c'est localhost/loopback, garder l'IP valide
      if (remoteAddress === '::1' || remoteAddress === '127.0.0.1') {
        return remoteAddress; // Garder juste l'IP sans annotation
      }
      
      return remoteAddress || 'unknown';
    };

    const ipAddress = getClientIP(req);
    const userAgent = req.headers['user-agent'] || '';

    // Parser simple du User-Agent
    const parseUserAgent = (ua) => {
      const browser = ua.includes('Chrome') ? 'Chrome' :
                     ua.includes('Firefox') ? 'Firefox' :
                     ua.includes('Safari') ? 'Safari' :
                     ua.includes('Edge') ? 'Edge' : 'Unknown';
      
      const os = ua.includes('Windows NT 10.0') ? 'Windows 11' :
                 ua.includes('Windows NT') ? 'Windows' :
                 ua.includes('Mac OS X') ? 'macOS' :
                 ua.includes('Linux') ? 'Linux' :
                 ua.includes('Android') ? 'Android' :
                 ua.includes('iPhone') ? 'iOS' : 'Unknown';

      // Extraire la version du navigateur
      let browserVersion = '';
      if (browser === 'Chrome') {
        const match = ua.match(/Chrome\/([0-9.]+)/);
        browserVersion = match ? match[1] : '';
      } else if (browser === 'Firefox') {
        const match = ua.match(/Firefox\/([0-9.]+)/);
        browserVersion = match ? match[1] : '';
      }

      return { browser, browserVersion, os };
    };

    const { browser, browserVersion, os } = parseUserAgent(userAgent);

    // Vérifier si une session récente existe déjà (dernières 30 minutes)
    const recentSession = await UserSession.findOne({
      where: {
        userId: user.id,
        ipAddress: ipAddress,
        sessionStart: {
          [Op.gte]: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes
        }
      },
      order: [['sessionStart', 'DESC']]
    });

    // Si pas de session récente, créer une nouvelle
    if (!recentSession) {
      const sessionData = {
        userId: user.id,
        ipAddress: ipAddress,
        userAgent: userAgent,
        browser: browser,
        browserVersion: browserVersion,
        os: os,
        device: 'desktop',
        country: null,
        countryCode: null,
        city: null,
        region: null,
        timezone: null,
        isp: null,
        sessionStart: new Date(),
        isActive: true,
        isSuspicious: false,
        suspiciousReason: null
      };

      // Détecter les activités suspectes (trop de connexions récentes)
      const recentSessions = await UserSession.count({
        where: {
          userId: user.id,
          sessionStart: {
            [Op.gte]: new Date(Date.now() - 60 * 60 * 1000) // Dernière heure
          }
        }
      });

      if (recentSessions > 5) {
        sessionData.isSuspicious = true;
        sessionData.suspiciousReason = 'Trop de connexions récentes';
      }

      const session = await UserSession.create(sessionData);

      console.log(`🔍 [LOGIN SESSION] Session créée pour ${user.email}:`);
      console.log(`   🌐 IP: ${ipAddress}`);
      console.log(`   🖥️  Navigateur: ${browser} ${browserVersion}`);
      console.log(`   💻 OS: ${os}`);
      console.log(`   🆔 Session ID: ${session.id}`);

      // Enrichir avec les données de géolocalisation en arrière-plan
      updateSessionWithIPData(session, ipAddress).catch(error => {
        console.error('❌ Erreur enrichissement IP:', error);
      });

      return session;
    } else {
      console.log(`🔄 [LOGIN SESSION] Session récente trouvée pour ${user.email} - pas de nouvelle session`);
      return recentSession;
    }

  } catch (error) {
    console.error('❌ Erreur lors de la capture de session:', error);
    return null;
  }
};
