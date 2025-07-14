import { getSupabaseClient } from '../../src/supabaseClient';

export default async function handler(req, res) {
  const { id } = req.query;
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const supabase = getSupabaseClient(token);

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) {
      res.status(404).json({ error: 'Photo non trouvée' });
      return;
    }
    res.status(200).json(data);
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
} 