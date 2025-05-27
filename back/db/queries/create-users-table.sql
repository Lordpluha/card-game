CREATE TABLE IF NOT EXISTS users (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username        VARCHAR(100)    NOT NULL UNIQUE,
  email           VARCHAR(100)    NOT NULL UNIQUE,
  password_hash   VARCHAR(255)    NOT NULL,
  avatar_url      VARCHAR(255)    DEFAULT NULL,

	created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_game_date  DATETIME        DEFAULT NULL,

  card_ids        JSON            NOT NULL,
  coins           INT UNSIGNED    NOT NULL DEFAULT 0,
  fragments       INT UNSIGNED    NOT NULL DEFAULT 0,

	rating          INT             NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;