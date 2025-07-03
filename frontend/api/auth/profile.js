import supabase from '../../src/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Méthode non autorisée' });
    return;
  }

  const { id } = req.query;
  if (!id) {
    res.status(400).json({ error: 'ID utilisateur requis' });
    return;
  }

  const { data, error } = await supabase
    .from('users')
    .select('username, email')
    .eq('id', id)
    .single();

  if (error) {
    res.status(404).json({ error: error.message });
    return;
  }

  res.status(200).json(data);
} 