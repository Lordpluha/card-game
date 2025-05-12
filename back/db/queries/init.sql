CREATE DATABASE IF NOT EXISTS card_game
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;


CREATE USER IF NOT EXISTS 'vtesliuk'@'localhost'
IDENTIFIED BY 'securepass';

GRANT ALL PRIVILEGES
  ON card_game.*
  TO 'vtesliuk'@'localhost'
  WITH GRANT OPTION;

FLUSH PRIVILEGES;
