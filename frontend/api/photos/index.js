import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    let body = req.body;
    if (!body || typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        res.status(400).json({ error: 'Corps de requête invalide' });
        return;
      }
    }
    const { title, description, photoUrl } = body;
    if (!title || !photoUrl) {
      res.status(400).json({ error: 'Titre et URL de la photo requis' });
      return;
    }
    // Ajoute la photo dans la table photos
    const { data, error } = await supabase
      .from('photos')
      .insert([{ title, description, filepath: photoUrl }]);
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(201).json(data[0]);
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
} 