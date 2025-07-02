export default function handler(req, res) {
  if (req.method === 'GET') {
    // Réponse exemple : tableau vide
    res.status(200).json([])
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' })
  }
} 