import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Récupérer toutes les photos de l'utilisateur connecté
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      res.status(401).json({ error: 'Non authentifié' });
      return;
    }
    // On utilise le token pour initialiser le client Supabase avec le contexte utilisateur
    const userSupabase = createClient(
      process.env.REACT_APP_SUPABASE_URL,
      process.env.REACT_APP_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
    const { data, error } = await userSupabase
      .from('photos')
      .select('*')
      .order('upload_date', { ascending: false });
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(200).json(data);
  } else if (req.method === 'POST') {
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
    const { title, description, photoUrl, user_id } = body;
    if (!title || !photoUrl || !user_id) {
      console.error('Titre, URL de la photo et user_id manquants');
      res.status(400).json({ error: 'Titre, URL de la photo et user_id requis' });
      return;
    }
    try {
      const { data, error } = await supabase
        .from('photos')
        .insert([{ title, description, filepath: photoUrl, user_id }]);
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