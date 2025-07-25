import { getSupabaseClient } from '../../src/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const supabase = getSupabaseClient();
    
    // Le script SQL complet
    const sqlScript = `
      -- Activer les extensions nécessaires
      create extension if not exists "uuid-ossp";

      -- Supprimer les tables si elles existent déjà (pour les réinitialisations)
      drop table if exists photos cascade;
      drop table if exists users cascade;

      -- Créer la table users avec UUID
      create table users (
        id uuid primary key default uuid_generate_v4(),
        username varchar(50) not null,
        email varchar(100) not null unique,
        password varchar(255) not null,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );

      -- Créer la table photos avec UUID également pour la cohérence
      create table photos (
        id uuid primary key default uuid_generate_v4(),
        user_id uuid not null,
        title varchar(100) not null,
        description text,
        filepath varchar(500) not null,
        upload_date timestamptz not null default now(),
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        
        -- Contrainte de clé étrangère
        constraint fk_user
          foreign key (user_id)
          references users(id)
          on delete cascade
      );

      -- Créer les index pour les performances
      create index idx_photos_user_id on photos(user_id);
      create index idx_users_email on users(email);

      -- Activer la sécurité au niveau des lignes
      alter table users enable row level security;
      alter table photos enable row level security;

      -- Politiques de sécurité pour la table users
      create policy "Tout le monde peut voir les profils"
        on users for select
        using (true);

      create policy "Les utilisateurs peuvent gérer leur propre profil"
        on users for all
        using (auth.uid() = id);

      -- Politiques de sécurité pour la table photos
      create policy "Les utilisateurs peuvent voir leurs propres photos"
        on photos for select
        using (auth.uid() = user_id);

      create policy "Les utilisateurs peuvent insérer leurs propres photos"
        on photos for insert
        with check (auth.uid() = user_id);

      create policy "Les utilisateurs peuvent mettre à jour leurs propres photos"
        on photos for update
        using (auth.uid() = user_id);

      create policy "Les utilisateurs peuvent supprimer leurs propres photos"
        on photos for delete
        using (auth.uid() = user_id);

      -- Fonction pour mettre à jour automatiquement updated_at
      create or replace function update_updated_at_column()
      returns trigger as $$
      begin
        new.updated_at = now();
        return new;
      end;
      $$ language plpgsql;

      -- Déclencheurs pour mettre à jour automatiquement updated_at
      create trigger update_users_updated_at
      before update on users
      for each row
      execute function update_updated_at_column();

      create trigger update_photos_updated_at
      before update on photos
      for each row
      execute function update_updated_at_column();
    `;

    // Exécuter le script SQL
    const { error } = await supabase.rpc('exec_sql', { sql: sqlScript });
    
    if (error) {
      console.error('Erreur lors de l\'exécution du script SQL:', error);
      res.status(500).json({ 
        error: 'Erreur lors de l\'exécution du script SQL',
        details: error.message 
      });
      return;
    }

    res.status(200).json({ 
      message: 'Script SQL exécuté avec succès',
      note: 'Base de données configurée avec les politiques RLS'
    });

  } catch (error) {
    console.error('Erreur lors de la configuration de la base de données:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la configuration de la base de données',
      details: error.message 
    });
  }
} 