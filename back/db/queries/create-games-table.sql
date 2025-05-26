CREATE TABLE IF NOT EXISTS games (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  game_code     VARCHAR(50)  NOT NULL UNIQUE,
  host_user_id  INT UNSIGNED,
  status        ENUM('CREATED','IN_PROGRESS','ENDED') DEFAULT 'CREATED',
  user_ids      JSON         NOT NULL,
  game_state    JSON         NOT NULL,
  winner_id     INT UNSIGNED,

  FOREIGN KEY (host_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (winner_id)    REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;