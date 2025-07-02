import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' });
    return;
  }

  let body = req.body;
  if (!body || typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      res.status(400).json({ error: 'Corps de requête invalide' });
      return;
    }
  }

  const { email } = body;
  if (!email) {
    res.status(400).json({ error: 'Email requis' });
    return;
  }

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: process.env.NEXT_PUBLIC_SITE_URL || 'https://hifadhui.vercel.app/reset-password'
  });

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.status(200).json({ message: 'Email de réinitialisation envoyé' });
} 