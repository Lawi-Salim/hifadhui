-- ========================================
-- SUPPRESSION DES TABLES (POUR LE DÉVELOPPEMENT)
-- ========================================
-- L'ordre est important à cause des clés étrangères
DROP TABLE IF EXISTS ModerationActions CASCADE;
DROP TABLE IF EXISTS Reports CASCADE;
DROP TABLE IF EXISTS Notifications CASCADE;
DROP TABLE IF EXISTS MessageAttachments CASCADE;
DROP TABLE IF EXISTS Messages CASCADE;
DROP TABLE IF EXISTS UserSessions CASCADE;
DROP TABLE IF EXISTS FileShares CASCADE;
DROP TABLE IF EXISTS File CASCADE;
DROP TABLE IF EXISTS Dossier CASCADE;
DROP TABLE IF EXISTS ActivityLogs CASCADE;
DROP TABLE IF EXISTS passwordresettokens CASCADE;
DROP TABLE IF EXISTS Utilisateur CASCADE;

-- ========================================
-- TABLE : Utilisateur
-- ========================================
CREATE TABLE Utilisateur (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255), -- hashé, NULL pour utilisateurs OAuth
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    -- Colonnes OAuth
    google_id VARCHAR(255) UNIQUE,
    provider VARCHAR(50) DEFAULT 'local' CHECK (provider IN ('local', 'google', 'facebook')),
    avatar_url TEXT,
    is_email_verified BOOLEAN DEFAULT FALSE,
    -- Colonnes pour la période de grâce (soft delete)
    deleted_at TIMESTAMP NULL, -- Date de demande de suppression
    deletion_scheduled_at TIMESTAMP NULL, -- Date programmée de suppression définitive
    recovery_token VARCHAR(255) UNIQUE, -- Token pour récupération du compte
    recovery_token_expires_at TIMESTAMP NULL, -- Expiration du token de récupération
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- TABLE : Dossier
-- ========================================
CREATE TABLE Dossier (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL, -- Nom slug pour stockage (ex: 'Mon-Dossier')
    name_original VARCHAR(255) NOT NULL, -- Nom original pour affichage (ex: 'Mon Dossier')
    owner_id UUID REFERENCES Utilisateur(id) ON DELETE CASCADE, -- NULL pour dossier système
    parent_id UUID REFERENCES Dossier(id) ON DELETE CASCADE, -- Colonne pour la hiérarchie
    is_system_root BOOLEAN NOT NULL DEFAULT FALSE, -- Dossier racine système
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- TABLE : File
-- ========================================
CREATE TABLE File (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL, -- ex: Cloudinary
    mimetype VARCHAR(100),
    size BIGINT, -- Taille du fichier en octets
    hash CHAR(64) UNIQUE NOT NULL, -- SHA-256
    owner_id UUID NOT NULL REFERENCES Utilisateur(id) ON DELETE CASCADE,
    dossier_id UUID REFERENCES Dossier(id) ON DELETE SET NULL,
    version INT NOT NULL DEFAULT 1,
    parent_file_id UUID REFERENCES file(id) ON DELETE SET NULL,
    is_latest BOOLEAN NOT NULL DEFAULT TRUE, -- numéro de version du fichier
    date_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    signature TEXT NOT NULL UNIQUE, -- obligatoire et unique
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ========================================
-- TABLE : ActivityLogs
-- ========================================
CREATE TABLE ActivityLogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES Utilisateur(id) ON DELETE CASCADE, -- NULL autorisé pour actions système (ex: échecs de connexion)
    action_type VARCHAR(50) NOT NULL, -- ex: 'FILE_UPLOAD', 'FOLDER_CREATE', 'FILE_DELETE', 'failed_login'
    details JSONB, -- { "fileId": "...", "fileName": "...", "folderId": "..." } ou { "ip": "...", "email": "..." }
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- TABLE : passwordresettokens
-- ========================================
CREATE TABLE passwordresettokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL REFERENCES Utilisateur(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- TABLE : FileShares
-- ========================================
CREATE TABLE FileShares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES File(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_by UUID NOT NULL REFERENCES Utilisateur(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    access_count INT DEFAULT 0, -- Compteur d'accès pour statistiques
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- TABLE : Messages (Système de messagerie admin)
-- ========================================
CREATE TABLE Messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Type de message
    type VARCHAR(50) NOT NULL CHECK (type IN ('contact_received', 'email_sent', 'email_received', 'notification', 'alert')),
    
    -- Informations du message
    subject VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    html_content TEXT, -- Version HTML pour les emails
    
    -- Expéditeur et destinataire
    sender_email VARCHAR(255), -- Email de l'expéditeur (pour contact_received)
    sender_name VARCHAR(255), -- Nom de l'expéditeur (pour contact_received)
    recipient_email VARCHAR(255), -- Email du destinataire (pour email_sent)
    
    -- Statut et métadonnées
    status VARCHAR(50) DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'archived', 'deleted')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Métadonnées techniques
    message_id VARCHAR(255), -- ID du message email (pour tracking)
    thread_id UUID REFERENCES Messages(id) ON DELETE SET NULL, -- Pour les conversations
    reply_to UUID REFERENCES Messages(id) ON DELETE SET NULL, -- Message auquel on répond
    
    -- Données supplémentaires
    metadata JSONB, -- Infos supplémentaires (IP, user-agent, etc.)
    
    -- Dates
    sent_at TIMESTAMP, -- Date d'envoi (pour email_sent)
    read_at TIMESTAMP, -- Date de lecture
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- TABLE : MessageAttachments (Pièces jointes des messages)
-- ========================================
CREATE TABLE MessageAttachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES Messages(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL, -- URL Cloudinary ou locale
    mimetype VARCHAR(100),
    size BIGINT, -- Taille en octets
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- TABLE : UserSessions (Sessions utilisateur avec données techniques)
-- ========================================
CREATE TABLE UserSessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES Utilisateur(id) ON DELETE CASCADE,
    ip_address INET NOT NULL,
    user_agent TEXT,
    browser VARCHAR(100),
    browser_version VARCHAR(50),
    os VARCHAR(100),
    device VARCHAR(100),
    country VARCHAR(100),
    country_code VARCHAR(2),
    city VARCHAR(100),
    region VARCHAR(100),
    timezone VARCHAR(50),
    isp VARCHAR(200),
    session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    is_suspicious BOOLEAN DEFAULT FALSE,
    suspicious_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- TABLE : Notifications (Système de notifications admin)
-- ========================================
CREATE TABLE Notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL DEFAULT 'system' CHECK (type IN (
        'system', 'security', 'user_activity', 'file_activity', 
        'email', 'maintenance', 'backup', 'storage', 'error', 'success'
    )),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status VARCHAR(20) NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
    userId UUID REFERENCES Utilisateur(id) ON DELETE SET NULL,
    relatedEntityType VARCHAR(50),
    relatedEntityId UUID,
    actionUrl VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    read_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ========================================
-- TABLE : Reports (Signalements)
-- ========================================
CREATE TABLE Reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES Utilisateur(id) ON DELETE SET NULL, -- NULL pour signalements anonymes
    reported_user_id UUID REFERENCES Utilisateur(id) ON DELETE CASCADE, -- NULL pour signalements système (ex: tentatives de connexion)
    file_id UUID REFERENCES File(id) ON DELETE SET NULL, -- NULL si pas lié à un fichier
    type VARCHAR(50) NOT NULL DEFAULT 'inappropriate' CHECK (type IN ('inappropriate', 'spam', 'copyright', 'harassment', 'failed_login_attempts', 'other')),
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
    admin_id UUID REFERENCES Utilisateur(id) ON DELETE SET NULL, -- Admin qui a traité
    admin_action TEXT, -- Description de l'action prise
    resolved_at TIMESTAMP,
    source VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'automatic')), -- Source du signalement
    evidence TEXT, -- JSON stringifié contenant les preuves du signalement automatique
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- TABLE : ModerationActions (Actions de modération)
-- ========================================
CREATE TABLE ModerationActions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES Utilisateur(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES Utilisateur(id) ON DELETE CASCADE,
    report_id UUID REFERENCES Reports(id) ON DELETE SET NULL, -- NULL si action indépendante
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('warning', 'suspension', 'deletion', 'content_removal')),
    reason TEXT NOT NULL,
    duration INTEGER, -- En jours, NULL pour actions permanentes
    start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP, -- Calculé automatiquement pour suspensions
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB DEFAULT '{}', -- Données supplémentaires
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- INDEXES (performance)
-- ========================================

-- Index pour les fichiers
CREATE INDEX idx_file_owner_id ON File(owner_id);

-- Index pour les dossiers 
CREATE INDEX idx_dossier_parent_id ON Dossier(parent_id);

-- Index pour les utilisateurs
CREATE INDEX idx_utilisateur_role ON Utilisateur(role);
CREATE INDEX idx_utilisateur_google_id ON Utilisateur(google_id);
CREATE INDEX idx_utilisateur_provider ON Utilisateur(provider);
CREATE INDEX idx_utilisateur_email_provider ON Utilisateur(email, provider);

-- Index pour les logs d'activités
CREATE INDEX idx_activitylogs_user_id ON ActivityLogs(user_id);
CREATE INDEX idx_activitylogs_action_type ON ActivityLogs(action_type);

-- Index pour les fichiers partagés
CREATE INDEX idx_fileshares_file_id ON FileShares(file_id);
CREATE INDEX idx_fileshares_token ON FileShares(token);
CREATE INDEX idx_fileshares_expires_at ON FileShares(expires_at);
CREATE INDEX idx_fileshares_created_by ON FileShares(created_by);

-- Index pour les réinitialisations des mots de passe
CREATE INDEX idx_password_reset_tokens_token ON passwordresettokens(token);
CREATE INDEX idx_password_reset_tokens_email ON passwordresettokens(email);
CREATE INDEX idx_password_reset_tokens_expires_at ON passwordresettokens(expires_at);

-- Index pour les messages
CREATE INDEX idx_messages_type ON Messages(type);
CREATE INDEX idx_messages_status ON Messages(status);
CREATE INDEX idx_messages_priority ON Messages(priority);
CREATE INDEX idx_messages_sender_email ON Messages(sender_email);
CREATE INDEX idx_messages_recipient_email ON Messages(recipient_email);
CREATE INDEX idx_messages_created_at ON Messages(created_at);
CREATE INDEX idx_messages_read_at ON Messages(read_at);
CREATE INDEX idx_messages_thread_id ON Messages(thread_id);
CREATE INDEX idx_messages_reply_to ON Messages(reply_to);
CREATE INDEX idx_messages_message_id ON Messages(message_id);

-- Index pour les pièces jointes
CREATE INDEX idx_message_attachments_message_id ON MessageAttachments(message_id);

-- Index pour les notifications
CREATE INDEX idx_notifications_user_status ON Notifications(userId, status);
CREATE INDEX idx_notifications_type_priority ON Notifications(type, priority);
CREATE INDEX idx_notifications_created_at ON Notifications(created_at);
CREATE INDEX idx_notifications_status_created ON Notifications(status, created_at);
CREATE INDEX idx_notifications_expires_at ON Notifications(expires_at);
CREATE INDEX idx_notifications_priority ON Notifications(priority);
CREATE INDEX idx_notifications_status ON Notifications(status);

-- Index pour Reports
CREATE INDEX idx_reports_status ON Reports(status);
CREATE INDEX idx_reports_type ON Reports(type);
CREATE INDEX idx_reports_source ON Reports(source);
CREATE INDEX idx_reports_reported_user_id ON Reports(reported_user_id);
CREATE INDEX idx_reports_reporter_id ON Reports(reporter_id);
CREATE INDEX idx_reports_admin_id ON Reports(admin_id);
CREATE INDEX idx_reports_created_at ON Reports(created_at);
CREATE INDEX idx_reports_file_id ON Reports(file_id);
CREATE INDEX idx_reports_source_created_at ON Reports(source, created_at);

-- Index pour ModerationActions
CREATE INDEX idx_moderation_actions_user_id ON ModerationActions(user_id);
CREATE INDEX idx_moderation_actions_admin_id ON ModerationActions(admin_id);
CREATE INDEX idx_moderation_actions_action_type ON ModerationActions(action_type);
CREATE INDEX idx_moderation_actions_is_active ON ModerationActions(is_active);
CREATE INDEX idx_moderation_actions_start_date ON ModerationActions(start_date);
CREATE INDEX idx_moderation_actions_end_date ON ModerationActions(end_date);
CREATE INDEX idx_moderation_actions_report_id ON ModerationActions(report_id);
CREATE INDEX idx_moderation_actions_created_at ON ModerationActions(created_at);

-- Index composé pour les suspensions actives
CREATE INDEX idx_moderation_actions_active_suspensions ON ModerationActions(user_id, action_type, is_active, end_date) 
WHERE action_type = 'suspension' AND is_active = TRUE;

-- Index pour la période de grâce
CREATE INDEX idx_utilisateur_deleted_at ON Utilisateur(deleted_at);
CREATE INDEX idx_utilisateur_deletion_scheduled_at ON Utilisateur(deletion_scheduled_at);
CREATE INDEX idx_utilisateur_recovery_token ON Utilisateur(recovery_token);
CREATE INDEX idx_utilisateur_recovery_token_expires_at ON Utilisateur(recovery_token_expires_at);

-- Index pour améliorer les performances
CREATE INDEX idx_usersessions_user_id ON UserSessions(user_id);
CREATE INDEX idx_usersessions_ip_address ON UserSessions(ip_address);
CREATE INDEX idx_usersessions_session_start ON UserSessions(session_start);
CREATE INDEX idx_usersessions_last_activity ON UserSessions(last_activity);
CREATE INDEX idx_usersessions_is_active ON UserSessions(is_active);
CREATE INDEX idx_usersessions_is_suspicious ON UserSessions(is_suspicious);

-- Unicité des noms de dossiers à la racine pour un utilisateur (exclut le dossier système)
CREATE UNIQUE INDEX idx_dossier_racine_unique_nom ON Dossier(owner_id, name) WHERE parent_id IS NULL AND is_system_root = FALSE;

-- Unicité des noms de sous-dossiers dans un dossier parent
CREATE UNIQUE INDEX idx_dossier_sous_dossier_unique_nom ON Dossier(owner_id, parent_id, name) WHERE parent_id IS NOT NULL;

-- Index pour le dossier système racine
CREATE INDEX idx_dossier_system_root ON Dossier(is_system_root) WHERE is_system_root = TRUE;

-- ========================================
-- TRIGGERS
-- ========================================

-- Fonction générique pour mise à jour de updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer la fonction sur les tables
CREATE TRIGGER trg_user_updated
BEFORE UPDATE ON Utilisateur
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_file_updated
BEFORE UPDATE ON File
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


CREATE TRIGGER trg_dossier_updated
BEFORE UPDATE ON Dossier
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_fileshares_updated
BEFORE UPDATE ON FileShares
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_password_reset_tokens_updated
BEFORE UPDATE ON passwordresettokens
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_usersessions_updated
BEFORE UPDATE ON UserSessions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_messages_updated
BEFORE UPDATE ON Messages
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_notifications_updated
BEFORE UPDATE ON Notifications
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_reports_updated
BEFORE UPDATE ON Reports
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_moderation_actions_updated
BEFORE UPDATE ON ModerationActions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ========================================
-- DONNÉES INITIALES
-- ========================================

-- Créer le dossier racine système unique
INSERT INTO Dossier (name, name_original, owner_id, parent_id, is_system_root)
VALUES ('Hifadhui', 'Hifadhui', NULL, NULL, TRUE);
