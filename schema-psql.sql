-- ========================================
-- SUPPRESSION DES TABLES (POUR LE DÉVELOPPEMENT)
-- ========================================
-- L'ordre est important à cause des clés étrangères
DROP TABLE IF EXISTS FileShares CASCADE;
DROP TABLE IF EXISTS Certificate CASCADE;
DROP TABLE IF EXISTS File CASCADE;
DROP TABLE IF EXISTS Dossier CASCADE;
DROP TABLE IF EXISTS ActivityLogs CASCADE;
DROP TABLE IF EXISTS Utilisateur CASCADE;

-- ========================================
-- TABLE : Utilisateur
-- ========================================
CREATE TABLE Utilisateur (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- hashé
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- TABLE : Dossier
-- ========================================
CREATE TABLE Dossier (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    owner_id UUID NOT NULL REFERENCES Utilisateur(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES Dossier(id) ON DELETE CASCADE, -- Colonne pour la hiérarchie
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
-- TABLE : Certificate
-- ========================================
CREATE TABLE Certificate (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    root_file_id UUID NOT NULL REFERENCES File(id) ON DELETE CASCADE,
    pdf_url TEXT NOT NULL,
    date_generated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- TABLE : ActivityLogs
-- ========================================
CREATE TABLE ActivityLogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES Utilisateur(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- ex: 'FILE_UPLOAD', 'FOLDER_CREATE', 'FILE_DELETE'
    details JSONB, -- { "fileId": "...", "fileName": "...", "folderId": "..." }
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
-- INDEXES (performance)
-- ========================================
CREATE INDEX idx_file_owner_id ON File(owner_id);
CREATE INDEX idx_certificate_root_file_id ON Certificate(root_file_id);
CREATE INDEX idx_dossier_parent_id ON Dossier(parent_id);
CREATE INDEX idx_utilisateur_role ON Utilisateur(role);
CREATE INDEX idx_activitylogs_user_id ON ActivityLogs(user_id);
CREATE INDEX idx_activitylogs_action_type ON ActivityLogs(action_type);
CREATE INDEX idx_fileshares_file_id ON FileShares(file_id);
CREATE INDEX idx_fileshares_token ON FileShares(token);
CREATE INDEX idx_fileshares_expires_at ON FileShares(expires_at);
CREATE INDEX idx_fileshares_created_by ON FileShares(created_by);

-- Unicité des noms de dossiers à la racine pour un utilisateur
CREATE UNIQUE INDEX idx_dossier_racine_unique_nom ON Dossier(owner_id, name) WHERE parent_id IS NULL;

-- Unicité des noms de sous-dossiers dans un dossier parent
CREATE UNIQUE INDEX idx_dossier_sous_dossier_unique_nom ON Dossier(owner_id, parent_id, name) WHERE parent_id IS NOT NULL;

-- ========================================
-- TRIGGERS
-- ========================================

-- Fonction pour créer un certificat automatiquement après l'insertion d'un fichier
CREATE OR REPLACE FUNCTION create_certificate_after_file()
RETURNS TRIGGER AS $$
BEGIN
    -- Insère un certificat avec une URL temporaire. Le backend la mettra à jour.
    -- Utilise root_file_id : si c'est une nouvelle version, utilise parent_file_id, sinon l'id du fichier
    INSERT INTO Certificate (root_file_id, pdf_url)
    VALUES (COALESCE(NEW.parent_file_id, NEW.id), 'pending_generation');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger qui se déclenche après chaque insertion dans la table 'file'
CREATE TRIGGER trg_file_insert_certificate
AFTER INSERT ON File
FOR EACH ROW
EXECUTE FUNCTION create_certificate_after_file();

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

CREATE TRIGGER trg_certificate_updated
BEFORE UPDATE ON Certificate
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
