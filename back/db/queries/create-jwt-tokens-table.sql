CREATE TABLE IF NOT EXISTS jwt_tokens (
  token      VARCHAR(512)   PRIMARY KEY,
  user_id    INT UNSIGNED   NOT NULL,
  type       ENUM('access','refresh') NOT NULL,
  created_at DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
