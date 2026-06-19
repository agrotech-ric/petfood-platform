# Руководство для AI-агентов (PetFood beta)

Документ описывает правила и соглашения этого репозитория. **Читай его перед любыми изменениями** — в Cursor это принудительно через `.cursor/rules/read-agents-md.mdc` (`alwaysApply: true`).

---

## Главные правила (обязательно)

### 1. Git-коммиты — только пользователь

**Агент НЕ создаёт коммиты сам**, если пользователь явно не попросил «сделай коммит» / «закоммить».

После завершения работы:
- опиши, что изменилось;
- дай готовые команды `git add` и `git commit` (через HEREDOC);
- **не выполняй** `git commit` и **не делай** `git push` без прямой просьбы.

Пользователь несколько раз просил не коммитить автоматически (в т.ч. из‑за неверного автора в сообщении коммита).

### 2. Минимальный diff

Меняй только то, что нужно для задачи. Не рефактори «заодно», не добавляй лишние абстракции и тесты без запроса.

### 3. Sandbox vs main

| Область | Рабочая директория | Не трогать |
|--------|---------------------|------------|
| Backend (beta) | `backend-main-sandbox/` | `backend-main/` |
| Frontend (beta UI) | `frontend-next/` | `frontend-main/` (legacy) |
| Docker | `docker-compose.sandbox.yml` | compose main-проекта |

Sandbox — **отдельная** БД, пользователи и порты. Подробности: `README_SANDBOX_BACKEND.md`.

### 4. Поддержка AGENTS.md

Этот файл — **источник правды** для агентов. Cursor подключает его автоматически через правило в `.cursor/rules/read-agents-md.mdc`.

**Обновляй `AGENTS.md` в той же задаче**, если изменилось что-то, что будущим агентам нужно учитывать:

- архитектура или паттерны (layout, роутинг, контексты, структура сервисов);
- соглашения (i18n, тема, API, миграции, gateway, docker);
- новые ограничения («не трогать X», «всегда делать Y»);
- устаревшие инструкции в документе — **исправь или убери**, а не дописывай поверх.

**Не добавляй** в `AGENTS.md`:

- текущие номера миграций, списки «что уже переведено», порты/IP «на сегодня»;
- детали одноразовых задач и временные workaround'ы;
- дублирование `README_SANDBOX_BACKEND.md` и других README — лучше ссылка.

Пиши **устойчивые правила**, а не снимок состояния репозитория. Diff по `AGENTS.md` — минимальный, по делу.

---

## Запуск окружения

Из корня репозитория:

```bash
./run-beta.sh start    # docker compose + frontend-next dev (порт 5174)
./run-beta.sh stop
./run-beta.sh update   # git pull + rebuild
./run-beta.sh status
./run-beta.sh logs     # логи frontend-контейнера
```

- Frontend dev: порт **5174** (см. `run-beta.sh` и `frontend-next/README.md`)
- Адреса sandbox-сервисов и gateway — в `README_SANDBOX_BACKEND.md` (не дублировать здесь: могут меняться)
- Frontend в Docker: контейнер `petfood_frontend_next_dev`

После изменений **Java-сервисов** пересобирай нужный контейнер:

```bash
docker compose -f docker-compose.sandbox.yml up -d --build account-service-sandbox
# аналогично: gateway-service-sandbox, auth-service-sandbox, pets-service-sandbox, notifications-service-sandbox
```

Проверка логов:

```bash
docker logs pets_sandbox_account_service --tail 50
docker logs pets_sandbox_notifications_service --tail 50
```

### Переменные окружения

- Корневой `.env` — SMTP и прочее для Docker Compose (**не коммитить секреты**).
- `frontend-next/.env` — `VITE_API_PROXY_TARGET` (по умолчанию sandbox gateway).

Если не приходят email-коды — проверь SMTP в `.env` и логи `notifications-service-sandbox`.

---

## Frontend-next: архитектура

```
frontend-next/
├── context/          # AuthContext, ThemeContext, LanguageContext
├── i18n/             # ru.ts, en.ts, kz.ts — все ключи переводов
├── services/         # profileService, petService, …
└── src/
    ├── pages/        # страницы
    ├── components/   # UI-компоненты
    ├── styles/       # CSS Modules (*.module.css)
    └── styles.css    # глобальные переменные темы
```

Точка входа: `src/main.tsx` → `ThemeProvider` → `App` → `AuthProvider` → `LanguageProvider` → роуты.

API: `src/utils/apiClient.ts` — всегда `credentials: 'include'` (cookie `sid`).

---

## Новая страница: тема (dark/light)

Тема уже глобальная. При вёрстке:

1. **Не хардкодить цвета** (`#fff`, `#333`, …) — использовать CSS-переменные из `src/styles.css`:
   - `--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-accent`, `--color-border`, …
2. В CSS Modules — только `var(--color-…)`.
3. Переключение темы — через `useTheme()` из `context/ThemeContext.tsx` (не локальный state).
4. Иконки из `src/assets/icons/*.svg` — это **растровые PNG внутри SVG**; в тёмной теме они уже инвертируются глобальным правилом в `styles.css`:
   ```css
   [data-theme='dark'] svg:has(image) { filter: … }
   ```
   Vector-иконки (react-icons, inline SVG с `currentColor`) — задавать `color` через CSS / `var(--color-icon)`.

---

## Новая страница: язык (i18n)

Язык **сохраняется в профиле** (`users.language`: `ru` | `en` | `kz`) и подтягивается при входе. До логина — fallback из `localStorage` (`settings.language`).

### Как правильно сделать страницу с переводами

1. **Не писать пользовательский текст литералами** в JSX (кроме данных с API).

2. Подключить хук:
   ```tsx
   import { useTranslation } from '../../context/LanguageContext';

   export function MyPage() {
     const { t } = useTranslation();
     return <h1>{t('myPage.title')}</h1>;
   }
   ```

3. **Добавить ключи во все три файла** (обязательно):
   - `frontend-next/i18n/ru.ts`
   - `frontend-next/i18n/en.ts`
   - `frontend-next/i18n/kz.ts`

   Именование: `раздел.элемент`, например `pets.listTitle`, `common.save`.

4. Плейсхолдеры:
   ```tsx
   t('modal.resendIn', { seconds: 30 })
   // в переводе: 'Отправить снова через {{seconds}} сек.'
   ```

5. Сообщения валидации — тоже через `t()`, либо возвращать **ключ** из validator и переводить в компоненте.

6. Даты/числа — учитывать locale:
   ```tsx
   const { t, locale } = useTranslation();
   const dateLocale = locale === 'kz' ? 'kk-KZ' : locale === 'en' ? 'en-US' : 'ru-RU';
   date.toLocaleDateString(dateLocale, { … });
   ```

7. Новая страница должна быть **внутри** `LanguageProvider` (уже обёрнуто в `App.tsx`). Auth-страницы тоже переводить — до входа работает `localStorage`.

8. Перед добавлением ключей — поиск по `i18n/` (`grep`), чтобы не дублировать существующие.

---

## Frontend: типичные паттерны

### Роутинг и layout

- Защищённые страницы — через `PrivateRoute` в `App.tsx`.
- **Sidebar** — общий `AppLayout` (`src/layout/AppLayout.tsx`): sidebar + `<main>` + `<Outlet />`. Подключение через nested routes и `PrivateLayoutRoute` (см. `App.tsx`).
- Новая страница **с sidebar**: добавить `<Route>` внутрь нужной группы `PrivateLayoutRoute` (по ролям), контент страницы — только разметка без `<Sidebar />`.
- Страницы **без sidebar** (auth, Help, EditProfile, RegisterPet и т.д.) — отдельный `PrivateRoute` + свой layout.
- **Внимание:** в `PrivateRoute.tsx` может быть флаг dev-режима с отключённой auth-проверкой — смотри актуальное значение в файле.

### Сервисы API

- Профиль: `services/profileService.ts` → `GET/PATCH /api/v1/account`, `GET /api/v1/account/profile/me`
- Фото/аватар: presigned URL через `petService` (MinIO sandbox)
- Не дублировать `fetch` — расширять существующие service-файлы

### Навигация «назад» с Edit Profile

При переходе на редактирование профиля передавать `state: { returnTo: '/profile' }`, иначе по умолчанию вернёт на `/settings` (`EditProfile.tsx`).

### Стили

- CSS Modules: `*.module.css` рядом или в `src/styles/`
- Глобальные reset/тема — только `src/styles.css`

---

## Backend-sandbox: типичные паттерны

### Миграции

Flyway-миграции лежат в `db/migration/` каждого сервиса (например account: `backend-main-sandbox/services/account/src/main/resources/db/migration/`).

Именование: `V{n}__short_description.sql`, где `{n}` — **следующий свободный номер** (посмотри существующие файлы в папке и возьми max + 1).

У других сервисов (pets и т.д.) — свои каталоги миграций.

### Изменение профиля

- DTO: `UpdateProfileRequest` (record)
- Ответ: `ProfileResponse`
- Логика: `AccountService.updateProfile()`
- Пользовательские настройки (в т.ч. язык) — через поля профиля; допустимые коды языка см. в DTO/валидации бэкенда и `i18n/locales.ts` на фронте

### Gateway и авторизация

`backend-main-sandbox/platform/gateway/src/main/resources/application.yml` — список `public-paths`.

**Не добавляй** в public пути, которые требуют JWT. Перед изменением сверься с тем, как endpoint защищён в сервисе (типичная ошибка — вынести confirm/change в public, когда нужна сессия).

Auth: cookie `sid` → gateway меняет на JWT.

### Email

SMTP из корневого `.env` → `notifications-service-sandbox`. Без SMTP коды могут быть только в логах account-service (`grep 'REG CONFIRM'`).

---

## Чеклист: новая страница во frontend-next

- [ ] Route в `App.tsx`: в группе `PrivateLayoutRoute` (с sidebar) или отдельный `PrivateRoute` (без)
- [ ] Все UI-строки через `t('…')` + ключи в `ru.ts`, `en.ts`, `kz.ts`
- [ ] Цвета через CSS-переменные темы
- [ ] Sidebar/layout: не дублировать `<Sidebar />` — layout уже в `AppLayout`
- [ ] API через `apiClient` / service, `credentials: 'include'`
- [ ] Нет хардкода русского в placeholder/error без i18n
- [ ] Проверить в светлой и тёмной теме
- [ ] Проверить смену языка (ru / en / kz) в Settings
- [ ] При изменении устойчивых соглашений — обновить `AGENTS.md` (см. §4)

---

## Чеклист: изменение backend

- [ ] Правки только в `backend-main-sandbox/`
- [ ] Flyway-миграция при изменении схемы
- [ ] DTO + Service + Controller согласованы
- [ ] Gateway `public-paths` проверен
- [ ] Пересобран нужный Docker-сервис
- [ ] Пользователю даны команды для коммита (не коммитить самому)
- [ ] При изменении устойчивых соглашений — обновить `AGENTS.md` (см. §4)

---

## Чего не делать

- Не коммитить и не пушить без явной просьбы
- Не менять `git config`
- Не коммитить `.env` с секретами
- Не править `backend-main/` и `frontend-main/` для beta-задач
- Не ставить `react-i18next` — свой лёгкий i18n в `frontend-next/i18n/`
- Не хардкодить цвета и русский текст на новых страницах
- Не добавлять пути в gateway `public-paths` «на всякий случай»
- Не создавать пустые/очевидные тесты

---

## Полезные файлы

| Файл | Зачем |
|------|--------|
| `run-beta.sh` | Старт/стоп beta |
| `README_SANDBOX_BACKEND.md` | Порты, sandbox, SMTP |
| `frontend-next/README.md` | Vite, proxy |
| `context/ThemeContext.tsx` | Тема |
| `context/LanguageContext.tsx` | Язык + `useTranslation` |
| `context/AuthContext.tsx` | Логин, сессия |
| `src/layout/AppLayout.tsx` | Shell: sidebar + main + Outlet |
| `services/profileService.ts` | Профиль и язык |
| `docker-compose.sandbox.yml` | Все sandbox-сервисы |

---

## Шаблон команд для пользователя (после задачи)

```bash
cd /home/iot/PetFood/petfood_platforma-beta

git status
git diff

git add path/to/changed/files

git commit -m "$(cat <<'EOF'
Краткое описание зачем, не что.

EOF
)"
```

Пользователь сам выполняет commit — агент только предлагает текст и список файлов.
