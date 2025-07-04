import { getSupabaseClient } from '../../src/supabaseClient';

console.log('Début du handler /api/photos');

export default async function handler(req, res) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  console.log('Token JWT reçu :', token ? token.substring(0, 20) + '...' : 'Aucun');

  const supabase = getSupabaseClient(token);

  if (req.method === 'GET') {
    if (!token) {
      res.status(401).json({ error: 'Non authentifié' });
      return;
    }
    const { data, error } = await supabase
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
    } else {
      console.log('Body parsé (déjà objet) :', body);
    }
    const user_id = body.user_id || body.userId || null;
    const { title, description, photoUrl } = body;
    console.log('Valeur user_id utilisée :', user_id);
    if (!title || !photoUrl || !user_id) {
      console.error('Titre, URL de la photo et user_id manquants');
      res.status(400).json({ error: 'Titre, URL de la photo et user_id requis' });
      return;
    }
    if (!token) {
      res.status(401).json({ error: 'Token JWT manquant pour l\'insertion protégée par RLS' });
      return;
    }
    try {
      console.log('Tentative d\'insertion avec les données :', { title, description, filepath: photoUrl, user_id });
      
      // Première tentative avec .select()
      let { data, error } = await supabase
        .from('photos')
        .insert([{ title, description, filepath: photoUrl, user_id }])
        .select();
      
      console.log('Réponse Supabase - data:', data, 'error:', error);
      
      if (error) {
        console.error('Erreur Supabase lors de l\'insertion :', error);
        
        // Si l'erreur est liée à .select(), essayer sans
        if (error.message.includes('select') || error.message.includes('permission')) {
          console.log('Tentative d\'insertion sans .select()...');
          const { error: insertError } = await supabase
            .from('photos')
            .insert([{ title, description, filepath: photoUrl, user_id }]);
          
          if (insertError) {
            console.error('Erreur lors de l\'insertion sans select :', insertError);
            res.status(500).json({ error: insertError.message });
            return;
          }
          
          // Si l'insertion réussit, récupérer la photo insérée
          const { data: insertedData, error: selectError } = await supabase
            .from('photos')
            .select('*')
            .eq('user_id', user_id)
            .eq('title', title)
            .eq('filepath', photoUrl)
            .order('upload_date', { ascending: false })
            .limit(1);
          
          if (selectError) {
            console.error('Erreur lors de la récupération de la photo insérée :', selectError);
            res.status(500).json({ error: 'Photo insérée mais erreur lors de la récupération' });
            return;
          }
          
          data = insertedData;
        } else {
          res.status(500).json({ error: error.message });
          return;
        }
      }
      
      // Vérifier que data existe et contient au moins un élément
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.error('Aucune donnée retournée après insertion');
        res.status(500).json({ error: 'Erreur lors de l\'insertion : aucune donnée retournée' });
        return;
      }
      
      console.log('Photo insérée avec succès :', data[0]);
      res.status(201).json(data[0]);
    } catch (err) {
      console.error('Erreur inattendue lors de l\'insertion :', err, err.stack);
      res.status(500).json({ error: 'Erreur serveur inattendue', details: err.message, stack: err.stack });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
} 