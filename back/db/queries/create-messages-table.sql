CREATE TABLE IF NOT EXISTS messages (
        id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        game_id    INT UNSIGNED NOT NULL,
        user_id    INT UNSIGNED NOT NULL,
        message    TEXT             NOT NULL,
        timestamp  TIMESTAMP        DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
