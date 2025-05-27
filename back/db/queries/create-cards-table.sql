CREATE TABLE IF NOT EXISTS cards (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100)    NOT NULL,
  image_url    VARCHAR(255)    NOT NULL,
  attack       INT             NOT NULL,
  defense      INT             NOT NULL,
  cost         INT             NOT NULL,
  description  VARCHAR(255)    DEFAULT NULL,
	type         ENUM('COMMON','RARE','EPIC', 'MYTHICAL', 'LEGENDARY') DEFAULT 'COMMON'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
