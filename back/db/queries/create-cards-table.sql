CREATE TABLE IF NOT EXISTS cards (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100)    NOT NULL,
  image_url    VARCHAR(255)    NOT NULL,
  attack       INT             NOT NULL,
  defense      INT             NOT NULL,
  cost         INT             NOT NULL,
  type         ENUM('COMMON','RARE','EPIC','MYTHICAL','LEGENDARY') DEFAULT 'COMMON',
  categories   JSON            NOT NULL,
  description  VARCHAR(500)    DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
