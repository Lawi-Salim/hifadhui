// Utilitaire de formatage de taille de fichiers (octets -> B, Ko, Mo, Go, To)
export const formatFileSize = (bytes) => {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return '0 B';

  const units = ['B', 'Ko', 'Mo', 'Go', 'To'];
  const k = 1024;

  let index = Math.floor(Math.log(value) / Math.log(k));
  if (!Number.isFinite(index) || index < 0) index = 0;
  if (index >= units.length) index = units.length - 1;

  const normalized = value / Math.pow(k, index);
  if (!Number.isFinite(normalized)) return '0 B';

  return `${normalized.toFixed(2)} ${units[index]}`;
};
