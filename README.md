# card-game
Card game for campus

## Database Initialization

1. Ensure you have MySQL root credentials.
2. Temporarily update `.env.dev` to use root user:
   ```bash
   # ...existing env...
   DB_USER=root
   DB_PASSWORD=<your_root_password>
   ```
3. From the `back` folder run:
   ```bash
   npm run db:init
   ```
   This will create the `card_game` database and all tables.
4. Restore `.env.dev` to the game user:
   ```bash
   DB_USER=vtesliuk
   DB_PASSWORD=securepass
   ```
5. Grant privileges to `vtesliuk` (can also be done manually via MySQL root shell):
   ```sql
   GRANT ALL PRIVILEGES ON card_game.* TO 'vtesliuk'@'localhost';
   FLUSH PRIVILEGES;
   ```
