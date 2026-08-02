CREATE TABLE posts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  slug VARCHAR(190) NOT NULL UNIQUE,
  excerpt VARCHAR(320) NULL,
  content MEDIUMTEXT NOT NULL,
  featured_image VARCHAR(255) NULL,
  status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  published_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_posts_status_date (status,published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE admin_users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  role ENUM('admin','secretaria') NOT NULL DEFAULT 'admin',
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE patients (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  cpf VARCHAR(20) NOT NULL UNIQUE,
  birth_date DATE NULL,
  whatsapp VARCHAR(60) NOT NULL,
  email VARCHAR(190) NULL,
  address TEXT NULL,
  city VARCHAR(120) NULL,
  consent_accepted_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_patients_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pre_anesthetic_assessments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id BIGINT UNSIGNED NOT NULL,
  surgery_date DATE NULL,
  surgeon_name VARCHAR(180) NULL,
  hospital VARCHAR(180) NULL,
  procedure_name VARCHAR(220) NOT NULL,
  anesthesia_type VARCHAR(160) NULL,
  allergies TEXT NULL,
  previous_surgeries TEXT NULL,
  current_medications TEXT NULL,
  known_conditions TEXT NULL,
  smoking TEXT NULL,
  alcohol_use TEXT NULL,
  functional_capacity TEXT NULL,
  cardiovascular_symptoms TEXT NULL,
  respiratory_symptoms TEXT NULL,
  dental_status TEXT NULL,
  exams TEXT NULL,
  anesthesia_problems TEXT NULL,
  observations TEXT NULL,
  ai_report MEDIUMTEXT NULL,
  ai_report_generated_at DATETIME NULL,
  report_status ENUM('pending','generated','failed') NOT NULL DEFAULT 'pending',
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  status ENUM('new','awaiting_medical_review','reviewed','contacted','archived') NOT NULL DEFAULT 'awaiting_medical_review',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_pre_anesthetic_patient_created (patient_id, created_at),
  INDEX idx_pre_anesthetic_status_created (status, created_at),
  CONSTRAINT fk_pre_anesthetic_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE patient_access_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id BIGINT UNSIGNED NOT NULL,
  assessment_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  purpose ENUM('status') NOT NULL DEFAULT 'status',
  expires_at DATETIME NOT NULL,
  access_count INT UNSIGNED NOT NULL DEFAULT 0,
  last_accessed_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_patient_access_assessment (assessment_id),
  INDEX idx_patient_access_expires (expires_at),
  CONSTRAINT fk_patient_access_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_patient_access_assessment FOREIGN KEY (assessment_id) REFERENCES pre_anesthetic_assessments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE submission_rate_limits (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  scope_hash CHAR(64) NOT NULL UNIQUE,
  attempts INT UNSIGNED NOT NULL DEFAULT 0,
  first_seen_at DATETIME NOT NULL,
  last_seen_at DATETIME NOT NULL,
  INDEX idx_submission_rate_first_seen (first_seen_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE medication_guidance_rules (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  rule_key VARCHAR(120) NOT NULL UNIQUE,
  category VARCHAR(120) NOT NULL,
  medication_aliases MEDIUMTEXT NOT NULL,
  condition_keywords MEDIUMTEXT NOT NULL,
  requires_condition TINYINT(1) NOT NULL DEFAULT 0,
  action_label VARCHAR(40) NOT NULL,
  action_text VARCHAR(180) NOT NULL,
  timing_text VARCHAR(255) NOT NULL,
  suspend_days_min TINYINT UNSIGNED NULL,
  suspend_days_max TINYINT UNSIGNED NULL,
  reason TEXT NOT NULL,
  source_label VARCHAR(180) NOT NULL,
  source_url VARCHAR(255) NOT NULL,
  priority INT NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_medication_guidance_active_priority (active, priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
