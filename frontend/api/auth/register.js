import { createClient } from '@supabase/supabase-js';

console.log("SUPABASE_URL", process.env.REACT_APP_SUPABASE_URL);
console.log("SUPABASE_ANON_KEY", process.env.REACT_APP_SUPABASE_ANON_KEY);

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

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

  // Création de l'utilisateur sur Supabase Auth
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.status(201).json({ user: data.user });
} 