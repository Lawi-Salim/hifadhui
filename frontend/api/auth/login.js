import { getSupabaseClient } from '../../src/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' });
    return;
  }

  // Pour Vercel, req.body peut être vide si le bodyParser n'est pas activé
  // On parse le body manuellement si besoin
  let body = req.body;
  if (!body || typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      res.status(400).json({ error: 'Corps de requête invalide' });
      return;
    }
  }

  const { email, password } = body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email et mot de passe requis' });
    return;
  }

  // Connexion de l'utilisateur via Supabase Auth
  const { data, error } = await getSupabaseClient().auth.signInWithPassword({ email, password });

  if (error) {
    res.status(401).json({ error: error.message });
    return;
  }

  res.status(200).json({ user: data.user, session: data.session });
} 