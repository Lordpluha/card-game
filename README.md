# Card Game

Карточная игра с возможностью регистрации, авторизации, создания и подключения к комнатам, а также ведения истории игр.

## Технологии

- Frontend
  - HTML, CSS (Tailwind + кастомные стили)
  - JavaScript (ES Modules, GSAP, AOS)
- Backend
  - Node.js, Express
  - MySQL
  - JWT (jsonwebtoken), bcryptjs
  - WebSocket (ws)
- Инструменты
  - dotenv, live-server, mysql2, cookie-parser, cors

## Структура проекта

```
card-game/
├── back/           # Серверная часть (Express API)
│   ├── config.js
│   ├── db/         # Скрипты и подключение к БД
│   ├── modules/    # Маршруты и сервисы (Auth, User, Game, Profile и др.)
│   ├── utils/      # JWT-утилиты, хэширование паролей
│   └── index.js    # Точка входа
├── front/          # Клиентская часть
│   ├── src/
│   │   ├── pages/      # HTML-страницы (регистрация, логин, меню и др.)
│   │   ├── utils/      # Скрипты (auth, пре-загрузчик, меню)
│   │   ├── style/      # CSS
│   │   └── index.js    # live-server
│   └── package.json
├── .env.*          # Конфиги окружений
└── package.json    # Скрипты установки и запуска обоих сервисов
```

## Установка

1. Клонировать репозиторий:
   ```bash
   git clone https://github.com/Lordpluha/card-game.git
   cd card-game
   ```
2. Установить зависимости:
   ```bash
   npm run install
   ```
3. Создать файлы `.env.dev`, `.env.local` и заполнить их по образцу в корне (`.env.prod`).

## Инициализация базы данных

1. Временно в `.env.dev` указать учётку `root`:
   ```dotenv
   DB_USER=root
   DB_PASSWORD=<root_password>
   ```
2. Запустить скрипт:
   ```bash
   cd back
   npm run db:init
   ```
3. Вернуть в `.env.dev` обычного пользователя и права:
   ```sql
   GRANT ALL PRIVILEGES ON card_game.* TO 'your_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

## Запуск проекта

- В режиме разработки:
  ```bash
  npm run start
  ```
  — одновременно запустятся сервер (Express) и фронтенд (live-server на порту 3000).

- Отдельно:
  ```bash
  npm run start:back
  npm run start:front
  ```

Перейти в браузере на http://localhost:3000

## Особенности

- HTTP-only `access` и `refresh` токены в cookie
- Обновление токена (refresh) при каждом запросе
- Защищённые роуты через middleware (`requireAccessToken`, `requireRefreshToken`)
- Анимации прелоадера (GSAP) и эффекты прокрутки (AOS)
- JSON-поля в таблице `games` для хранения участников

## Лицензия

Apache License 2.0
