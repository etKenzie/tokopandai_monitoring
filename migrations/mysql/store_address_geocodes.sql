-- MySQL: pre-geocoded store addresses for map markers
-- Run this on your MySQL server (NOT on Supabase — use the postgres migration there)

CREATE TABLE IF NOT EXISTS store_address_geocodes (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id CHAR(36) DEFAULT NULL,
  store_name VARCHAR(255) DEFAULT NULL,
  address_normalized VARCHAR(768) NOT NULL,
  address_raw TEXT NOT NULL,
  latitude DOUBLE NOT NULL,
  longitude DOUBLE NOT NULL,
  geocode_source VARCHAR(50) DEFAULT 'import',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_store_address_geocodes_normalized (address_normalized),
  KEY idx_store_address_geocodes_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
