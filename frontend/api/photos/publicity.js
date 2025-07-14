import { getSupabaseClient } from '../../src/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' });
    return;
  }
  const { id, is_public, public_until } = req.body;
  if (!id) {
    res.status(400).json({ error: 'ID de la photo requis' });
    return;
  }
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('photos')
    .update({ is_public, public_until })
    .eq('id', id);
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(200).json({ success: true });
} 