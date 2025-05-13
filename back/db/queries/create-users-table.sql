CREATE TABLE IF NOT EXISTS users (
        id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        username      VARCHAR(100)  NOT NULL UNIQUE,
        email         VARCHAR(255)  NOT NULL UNIQUE,
        password_hash VARCHAR(255)  NOT NULL,
        avatar        VARCHAR(255),
        games_played  INT UNSIGNED DEFAULT 0,
        games_won     INT UNSIGNED DEFAULT 0,
        games_lost    INT UNSIGNED DEFAULT 0,
        games_tied    INT UNSIGNED DEFAULT 0,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;