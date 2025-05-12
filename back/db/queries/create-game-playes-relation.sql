CREATE TABLE IF NOT EXISTS game_players (
        id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        game_id    INT UNSIGNED NOT NULL,
        user_id    INT UNSIGNED NOT NULL,
        score      INT DEFAULT 0,
        joined_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_game_user (game_id, user_id),
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;