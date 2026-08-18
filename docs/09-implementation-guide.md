# 09 — Інструкція реалізації

Цей документ відповідає на питання «я відкрив папку, що робити далі».
Він передбачає, що коду ще немає — є специфікація, схема БД, OpenAPI та макети.

---

## 1. Порядок збірки

Послідовність підібрана так, щоб мінімізувати переробки. Кожен крок спирається на попередній.

| # | Крок | Результат | Чому саме тут |
|---|---|---|---|
| 1 | Каркас монорепо | pnpm workspaces, Turborepo, спільні конфіги | Без цього кожен пакет обростає своїм tsconfig |
| 2 | `packages/contracts` | Zod-схеми з `openapi.yaml` | Контракт — перший. Далі фронт і бек не розійдуться |
| 3 | `packages/db` | Prisma-схема, міграції, seed | Дані — фундамент усього іншого |
| 4 | Каркас NestJS | auth, users, categories, media. **Без AI** | Найнудніше, але без нього AI нема куди вбудовувати |
| 5 | **AI-модуль на `MockProvider`** | Увесь пайплайн, жодного виклику OpenAI | ⭐ Ключовий крок — див. нижче |
| 6 | Nuxt: AI Seller flow | Головний екран продукту на мок-даних | Тут вилизується UX без витрат на токени |
| 7 | `OpenAiProvider` | Підміна провайдера, промпти, eval-тести | Змінюється один рядок конфігурації |
| 8 | Каталог, картка товару, пошук | Спершу FTS, потім гібридний з векторами | SEO-критичні сторінки |
| 9 | Чат + WebSocket | | |
| 10 | Біллінг, ліміти, entitlements | | Раніше нема чого лімітувати |
| 11 | Модерація + адмін-панель | | |
| 12 | Спостережуваність + AI-дашборд | | **До запуску, не після** |

### Чому крок 5 ключовий

Побудова всього AI-шару спочатку на моці означає:

- новий розробник робить `pnpm dev` і бачить працюючий продукт **без ключів і без витрат**;
- e2e-тести детерміновані — не падають через те, що модель сьогодні написала інший заголовок;
- продуктовий флоу можна показувати інвесторам без залежності від доступності OpenAI;
- коли підключається справжній провайдер, змінюється **одна змінна оточення**.

Спокуса «спочатку підключимо OpenAI, а мок додамо потім» призводить до того,
що мок ніколи не додається, а розробка стає повільною і дорогою.

---

## 2. Локальний запуск

```bash
pnpm install
cp .env.example .env          # AI_PROVIDER=mock — працює одразу
docker compose up -d          # postgres + redis + minio
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Після цього:

| Адреса | Що |
|---|---|
| http://localhost:3000 | Nuxt |
| http://localhost:4000 | NestJS API |
| http://localhost:4000/docs | Swagger UI з `openapi.yaml` |
| http://localhost:9001 | MinIO console (локальна заміна S3) |

Щоб увімкнути справжній AI: `AI_PROVIDER=openai` + `OPENAI_API_KEY=sk-...`.

---

## 3. Змінні оточення

`.env.example` — шаблон, який комітиться. `.env` — ніколи.

```bash
# ── Загальне ─────────────────────────────────────────────────────────────
NODE_ENV=development
APP_URL=http://localhost:3000
API_URL=http://localhost:4000

# ── База даних ───────────────────────────────────────────────────────────
DATABASE_URL=postgresql://aitrade:aitrade@localhost:5432/aitrade

# ── Redis (кеш, черги, rate limit) ───────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ── AI ───────────────────────────────────────────────────────────────────
AI_PROVIDER=mock                    # mock | openai
OPENAI_API_KEY=
AI_MODEL_VISION=                    # флагманська vision-модель
AI_MODEL_TEXT=                      # mini-клас: опис, діагностика, чат
AI_MODEL_CHEAP=                     # nano-клас: парсинг пошуку, модерація
AI_MODEL_EMBEDDING=text-embedding-3-small
AI_DAILY_BUDGET_USD=50              # hard cap на добові витрати платформи
AI_REQUEST_TIMEOUT_MS=25000
AI_CACHE_TTL_EMBEDDING_S=2592000    # 30 днів
AI_CACHE_TTL_MARKET_S=21600         # 6 годин
AI_CACHE_TTL_SEARCH_S=300           # 5 хвилин

# ── Сховище ──────────────────────────────────────────────────────────────
S3_ENDPOINT=http://localhost:9000   # MinIO локально; порожньо для AWS
S3_REGION=eu-central-1
S3_BUCKET=aitrade-media
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
CDN_URL=http://localhost:9000/aitrade-media

# ── Авторизація ──────────────────────────────────────────────────────────
JWT_SECRET=                         # openssl rand -base64 48
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# ── Пошта і SMS ──────────────────────────────────────────────────────────
RESEND_API_KEY=
EMAIL_FROM=noreply@aitrade.ua
SMS_PROVIDER_KEY=                   # верифікація телефону

# ── Платежі ──────────────────────────────────────────────────────────────
PAYMENT_PROVIDER=liqpay
LIQPAY_PUBLIC_KEY=
LIQPAY_PRIVATE_KEY=

# ── Спостережуваність ────────────────────────────────────────────────────
SENTRY_DSN=
POSTHOG_KEY=
LOG_LEVEL=debug
```

**Правило:** жодного секрету в коді, жодного `.env` у git.
Валідація env через Zod при старті — застосунок падає одразу, а не через годину на першому запиті.

---

## 4. docker-compose для локальної розробки

```yaml
services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_USER: aitrade
      POSTGRES_PASSWORD: aitrade
      POSTGRES_DB: aitrade
    ports: ["5432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U aitrade"]
      interval: 5s

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports: ["9000:9000", "9001:9001"]
    volumes: ["miniodata:/data"]

volumes:
  pgdata:
  miniodata:
```

Образ `pgvector/pgvector:pg16` — а не звичайний `postgres` — бо векторний пошук потрібен
з першого дня, і краще не виявити цього під час першої міграції.

---

## 5. Скрипти

```jsonc
{
  "scripts": {
    "dev":        "turbo dev",
    "build":      "turbo build",
    "lint":       "turbo lint",
    "typecheck":  "turbo typecheck",
    "test":       "turbo test",
    "test:e2e":   "playwright test",

    "db:migrate": "prisma migrate dev --schema packages/db/schema.prisma",
    "db:deploy":  "prisma migrate deploy --schema packages/db/schema.prisma",
    "db:seed":    "tsx packages/db/seed.ts",
    "db:studio":  "prisma studio --schema packages/db/schema.prisma",
    "db:reset":   "prisma migrate reset --schema packages/db/schema.prisma",

    "api:client": "openapi-typescript openapi/openapi.yaml -o packages/contracts/src/generated/api.ts",
    "ai:eval":    "tsx packages/ai-evals/run.ts"
  }
}
```

---

## 6. Що створити першим — конкретно

### 6.1 `packages/contracts`

Zod-схеми, що дублюють `openapi/openapi.yaml`. Починати з тих, що потрібні для AI-флоу:

```ts
// packages/contracts/src/listing.ts
import { z } from 'zod';

export const ItemCondition = z.enum(['NEW','LIKE_NEW','GOOD','ACCEPTABLE','FOR_PARTS']);

export const CreateListingSchema = z.object({
  title:       z.string().min(10).max(70),
  description: z.string().min(50).max(5000),
  priceKop:    z.number().int().nonnegative(),
  categoryId:  z.string(),
  condition:   ItemCondition,
  attributes:  z.record(z.unknown()).default({}),
  mediaIds:    z.array(z.string()).min(1).max(10),
  cityId:      z.string().optional(),
  aiJobId:     z.string().optional(),
  aiAcceptedFields: z.array(
    z.enum(['title','description','price','category','condition','attributes','keywords'])
  ).default([]),
  publishNow:  z.boolean().default(false),
});
export type CreateListingDto = z.infer<typeof CreateListingSchema>;
```

Ця схема одночасно: валідує форму (`zodResolver`), валідує тіло запиту (`ZodValidationPipe`)
і дає типи API-клієнту.

### 6.2 `packages/db`

Скопіювати `prisma/schema.prisma`, згенерувати першу міграцію, потім додати SQL-міграцію
з тим, що Prisma не покриває (розширення, українська FTS-конфігурація, тригер `search_vector`,
HNSW-індекс, часткові індекси, check-констрейнти). Готовий SQL — у
[`03-database.md`](03-database.md), розділ 4.

Seed наповнює: регіони й міста, дерево категорій з `attributeSchema`, тарифи, feature flags,
а для `local`/`preview` — демо-контент (3 користувачі, 40 оголошень, чати, відгуки).

### 6.3 `modules/ai` — скелет

```
modules/ai/
├── ai.module.ts
├── provider/
│   ├── ai-provider.interface.ts     ← контракт, який знає бізнес-логіка
│   ├── openai.provider.ts
│   ├── mock.provider.ts             ← детермінований, з реалістичними фікстурами
│   ├── cached.provider.ts           ← декоратор: Redis-кеш
│   └── metered.provider.ts          ← декоратор: AiJob, токени, вартість, квоти
├── pipelines/
│   ├── seller-analyze.pipeline.ts   ← головний флоу
│   ├── listing-diagnose.pipeline.ts
│   └── search-parse.pipeline.ts
├── prompts/
│   ├── vision.recognize.v4.ts
│   ├── copy.generate.v2.ts
│   └── price.explain.v1.ts
├── schemas/                         ← JSON Schema для structured outputs
└── market/
    └── market-stats.service.ts      ← SQL, БЕЗ LLM. Медіана, перцентилі, час продажу
```

Композиція провайдерів при старті:

```ts
const base   = env.AI_PROVIDER === 'openai' ? new OpenAiProvider(cfg) : new MockProvider();
const cached = new CachedProvider(base, redis);
export const ai = new MeteredProvider(cached, prisma);
```

`market-stats.service.ts` лежить **поза** `provider/` навмисно: це не AI, це SQL.
Розділення на рівні файлової структури нагадує, що числа рахує база, а LLM їх лише пояснює.

---

## 7. Definition of Done для Етапу 1

Функціональність:

- [ ] Реєстрація через Google і magic-link, верифікація телефону перед першою публікацією
- [ ] Каталог категорій з `attributeSchema`, seed заповнений
- [ ] **AI Seller працює end-to-end:** фото → розпізнавання → текст → ціна → публікація
- [ ] `AI_PROVIDER=mock` дає повністю робочий продукт без жодного ключа
- [ ] Обробка фото: варіанти, blurhash, **EXIF-strip**, видалення фону
- [ ] Каталог, картка товару (SSR/ISR), базовий пошук
- [ ] Чат покупець↔продавець із WebSocket
- [ ] Особистий кабінет зі статистикою
- [ ] Тарифи, ліміти, платежі, вебхуки
- [ ] Модерація з `riskScore`, адмін-панель

Якість:

- [ ] E2E покриває: реєстрація → AI-флоу → публікація; пошук → чат; оплата
- [ ] `pnpm ai:eval` проходить пороги (категорія ≥ 92%)
- [ ] Sentry, Prometheus, PostHog підключені
- [ ] **AI-дашборд показує вартість, латентність, частку фолбеків і field acceptance rate**
- [ ] LCP < 2.0 с на головній і картці товару
- [ ] Перевірено WCAG 2.1 AA у світлій і темній темах
- [ ] `openapi.yaml` відповідає реальній поведінці API

Останній пункт AI-блоку — не «приємно мати». Без `field acceptance rate` по кожному полю
неможливо зрозуміти, який промпт треба переписувати, і команда рік покращуватиме AI навпомацки.

---

## 8. Типові пастки

| Пастка | Наслідок | Як уникнути |
|---|---|---|
| Почати з `OpenAiProvider`, мок «потім» | Мок не з'явиться ніколи; розробка дорога й нестабільна | Крок 5 — мок першим |
| `Float` для цін «поки що» | Розбіжність у звірці платежів через пів року | `Int` копійки з першого рядка |
| Питати ціну в LLM | Галюциновані числа, юридичний ризик | SQL рахує, LLM пояснює |
| Проксувати фото через API | Пам'ять і смуга Node-сервера | Presigned upload напряму в S3 |
| Забути EXIF-strip | Витік GPS-координат квартири продавця | Обов'язковий крок обробки |
| Синхронний HTTP на AI-аналіз | Таймаути, обірвані з'єднання | `202` + `jobId` + WebSocket-прогрес |
| Додати dark mode «в кінці» | Нечитабельні посилання, контраст нижче AA | Токени обох тем із самого початку |
| Відкласти cost-tracking | Не видно, що Premium збитковий | `AiJob` з першого AI-виклику |
| `OFFSET`-пагінація | Sequential scan на 400 тис. оголошень | Курсорна пагінація |
| Дозволити публікацію без телефону | Наплив шахраїв | Верифікація перед першою публікацією |
