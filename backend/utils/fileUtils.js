import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Crée un répertoire s'il n'existe pas
 * @param {string} dirPath - Chemin du répertoire à créer
 */
const ensureDirectoryExists = (dirPath) => {
  const fullPath = path.isAbsolute(dirPath) 
    ? dirPath 
    : path.join(__dirname, '..', dirPath);
  
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
  
  return fullPath;
};

/**
 * Supprime un fichier s'il existe
 * @param {string} filePath - Chemin du fichier à supprimer
 */
const deleteFileIfExists = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
};

/**
 * Copie un fichier d'un emplacement à un autre
 * @param {string} source - Chemin source
 * @param {string} target - Chemin cible
 */
const copyFile = (source, target) => {
  return new Promise((resolve, reject) => {
    const rd = fs.createReadStream(source);
    rd.on('error', reject);
    
    const wr = fs.createWriteStream(target);
    wr.on('error', reject);
    wr.on('close', () => resolve(target));
    
    rd.pipe(wr);
  });
};

/**
 * Déplace un fichier d'un emplacement à un autre
 * @param {string} source - Chemin source
 * @param {string} target - Chemin cible
 */
const moveFile = async (source, target) => {
  await copyFile(source, target);
  fs.unlinkSync(source);
  return target;
};

export {
  ensureDirectoryExists,
  deleteFileIfExists,
  copyFile,
  moveFile
};
