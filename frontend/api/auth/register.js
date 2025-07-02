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

  let body = req.body;
  console.log("BODY reçu sur /register:", body);

  // Pour Vercel, req.body peut être vide si le bodyParser n'est pas activé
  // On parse le body manuellement si besoin
  if (!body || typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      res.status(400).json({ error: 'Corps de requête invalide' });
      return;
    }
  }

  const { username, email, password } = body;

  if (!email || !password || !username) {
    res.status(400).json({ error: 'Nom, email et mot de passe requis' });
    return;
  }

  // Création de l'utilisateur sur Supabase Auth
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    console.log("ERREUR SUPABASE:", error);
    res.status(400).json({ error: error.message });
    return;
  }

  // Insertion dans la table personnalisée 'users'
  const userId = data.user.id;
  const { error: dbError } = await supabase
    .from('users')
    .insert([
      {
        id: userId,
        username,
        email,
        password: '', // On ne stocke pas le mot de passe ici, car il est géré par Supabase Auth
      }
    ]);
  if (dbError) {
    console.log("ERREUR DB:", dbError);
    res.status(500).json({ error: dbError.message });
    return;
  }

  res.status(201).json({ user: data.user });
} 