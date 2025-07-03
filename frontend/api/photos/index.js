import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  console.log('API /api/photos appelé, méthode :', req.method);
  if (req.method === 'POST') {
    let body = req.body;
    console.log('Body brut reçu :', body);
    if (!body || typeof body === 'string') {
      try {
        body = JSON.parse(body);
        console.log('Body parsé :', body);
      } catch (e) {
        console.error('Erreur de parsing du body :', e);
        res.status(400).json({ error: 'Corps de requête invalide' });
        return;
      }
    }
    const { title, description, photoUrl } = body;
    if (!title || !photoUrl) {
      console.error('Titre ou photoUrl manquant');
      res.status(400).json({ error: 'Titre et URL de la photo requis' });
      return;
    }
    try {
      const { data, error } = await supabase
        .from('photos')
        .insert([{ title, description, filepath: photoUrl }]);
      if (error) {
        console.error('Erreur Supabase lors de l\'insertion :', error);
        res.status(500).json({ error: error.message });
        return;
      }
      console.log('Photo insérée avec succès :', data[0]);
      res.status(201).json(data[0]);
    } catch (err) {
      console.error('Erreur inattendue lors de l\'insertion :', err);
      res.status(500).json({ error: 'Erreur serveur inattendue' });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
} 