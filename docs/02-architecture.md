# 02 — Архітектура системи

## 1. Огляд (C4 · Рівень 1 — контекст)

```
                       ┌──────────────────────────────┐
   Продавець ─────────▶│                              │◀──── Покупець
   (веб, мобільний веб)│         AI TRADE             │      (веб, SEO-трафік)
                       │                              │
   Бізнес ────────────▶│  Next.js  ·  NestJS  ·  PG   │◀──── Адміністратор
   (масовий імпорт)    │                              │
                       └───────┬──────────┬───────────┘
                               │          │
              ┌────────────────┘          └────────────────┐
              ▼                                            ▼
    ┌──────────────────┐                        ┌────────────────────┐
    │  OpenAI API      │                        │  Інфраструктура    │
    │  · gpt-4o (vision)│                       │  · AWS S3 (медіа)  │
    │  · gpt-4o-mini    │                       │  · Redis (кеш/черги)│
    │  · embeddings     │                       │  · Resend (email)  │
    └──────────────────┘                        │  · LiqPay (платежі)│
                                                └────────────────────┘
```

---

## 2. Контейнери (C4 · Рівень 2)

```
┌────────────────────────────────────────────────────────────────────────┐
│  apps/web · Next.js 15 (App Router) · Vercel                           │
│  SSR/ISR для SEO · React Server Components · Tailwind · shadcn/ui      │
└──────────────┬─────────────────────────────────────────┬───────────────┘
               │ REST (JSON) + WebSocket                 │ прямий upload
               ▼                                          ▼
┌──────────────────────────────────────────┐    ┌──────────────────────┐
│  apps/api · NestJS 11 · Railway/Fly.io   │    │  AWS S3 (presigned)  │
│                                          │    │  оригінали + варіанти│
│  Модулі:                                 │    └──────────────────────┘
│  auth · users · listings · categories    │
│  media · ai · search · chat · billing    │
│  promotions · reviews · admin · notify   │
└───┬──────────────┬──────────────┬────────┘
    │              │              │
    ▼              ▼              ▼
┌─────────┐  ┌──────────┐  ┌──────────────────────────────┐
│PostgreSQL│  │  Redis   │  │  apps/worker · BullMQ        │
│+pgvector │  │ кеш·черги│  │  ai-vision · ai-copy         │
│Prisma    │  │ rate-lim │  │  image-processing · embed    │
└─────────┘  └──────────┘  │  bulk-import · advisor-scan   │
                            │  notifications · cleanup      │
                            └───────────┬──────────────────┘
                                        ▼
                            ┌───────────────────────┐
                            │  OpenAI / MockProvider│
                            └───────────────────────┘
```

**Чому worker окремо від api:** AI-задачі — довгі (5–30 с) і дорогі по CPU/пам'яті при обробці зображень.
Якщо тримати їх в одному процесі з HTTP-сервером, черга AI-задач з'їдає event loop і звичайні
запити (перегляд каталогу) починають гальмувати. Розділення дозволяє масштабувати worker'и
незалежно — за глибиною черги, а не за RPS.

---

## 3. Структура монорепозиторію

```
ai-trade/
├── apps/
│   ├── web/                     Next.js 15 — публічний фронтенд
│   │   ├── app/
│   │   │   ├── (marketing)/     landing, для бізнесу, правила, політика, контакти
│   │   │   ├── (shop)/          каталог, /listing/[slug], /category/[...slug], /seller/[id]
│   │   │   ├── (app)/           /sell (AI-флоу), /dashboard/*, /chat/*, /settings
│   │   │   ├── (admin)/         адмін-панель
│   │   │   └── api/             BFF-роути: auth callback, revalidate, webhooks
│   │   ├── components/
│   │   │   ├── ui/              примітиви дизайн-системи (shadcn/ui-стиль)
│   │   │   ├── listing/         ListingCard, Gallery, PriceBlock, AttributeTable
│   │   │   ├── ai/              AiSellerWizard, PriceRecommendation, AdvisorPanel
│   │   │   └── chat/            ChatWindow, MessageList, AiSuggestions
│   │   ├── lib/                 api-client (типізований з OpenAPI), hooks, utils
│   │   └── styles/              tokens.css, globals.css
│   │
│   ├── api/                     NestJS 11 — REST + WebSocket
│   │   └── src/modules/
│   │       ├── auth/            Google OAuth, magic-link email, JWT + refresh, guards
│   │       ├── users/           профіль, налаштування, рейтинг, бейджі
│   │       ├── listings/        CRUD, публікація, статуси, статистика
│   │       ├── categories/      дерево категорій + attributeSchema
│   │       ├── media/           presigned URL, варіанти, порядок фото
│   │       ├── ai/              ⭐ AiProvider, пайплайни, промпти, cost-tracking
│   │       ├── search/          гібридний пошук, NL-парсинг, фасети
│   │       ├── recommendations/ персональна стрічка, схожі товари
│   │       ├── chat/            треди, повідомлення, WS-gateway, AI-підказки
│   │       ├── billing/         підписки, ліміти, entitlements, LiqPay webhooks
│   │       ├── promotions/      START/PREMIUM/VIP, буст у ранжуванні
│   │       ├── valuations/      платна AI-оцінка дорогих товарів
│   │       ├── reviews/         відгуки, антинакрутка
│   │       ├── moderation/      черга, AI-прескоринг, скарги
│   │       ├── admin/           усе адмінське
│   │       └── notifications/   email, in-app, push-ready
│   │
│   └── worker/                  BullMQ-процесори (той самий код модулів, інший entrypoint)
│
├── packages/
│   ├── contracts/               ⭐ Zod-схеми + типи, спільні для web і api. Джерело правди.
│   ├── db/                      Prisma schema, міграції, seed, клієнт
│   ├── ui/                      дизайн-токени як TS + Tailwind preset
│   ├── config/                  eslint, tsconfig, prettier, tailwind — спільні конфіги
│   └── utils/                   money, slug, formatters, i18n-хелпери
│
├── docker-compose.yml           postgres+pgvector · redis · minio (локальний S3)
├── turbo.json
└── pnpm-workspace.yaml
```

### Ключовий принцип: `packages/contracts` як джерело правди

```ts
// packages/contracts/src/listing.ts
export const CreateListingSchema = z.object({
  title:       z.string().min(10).max(70),
  description: z.string().min(50).max(5000),
  priceKop:    z.number().int().positive(),      // копійки, не гривні
  categoryId:  z.string().uuid(),
  attributes:  z.record(z.unknown()),
  mediaIds:    z.array(z.string().uuid()).min(1).max(10),
});
export type CreateListingDto = z.infer<typeof CreateListingSchema>;
```

Той самий об'єкт валідує форму на фронті (react-hook-form + zodResolver),
валідує тіло запиту на бекенді (ZodValidationPipe) і генерує типи для API-клієнта.
**Неможливо змінити контракт на одному боці й забути про інший — TypeScript не скомпілюється.**

---

## 4. Архітектура AI-модуля

Це найважливіша частина системи, тому вона спроєктована з розрахунку на заміну провайдера.

```ts
// apps/api/src/modules/ai/provider/ai-provider.interface.ts
export interface AiProvider {
  recognizeProduct(input: VisionInput): Promise<ProductRecognition>;
  generateCopy(input: CopyInput): Promise<ListingCopy>;
  suggestPrice(input: PriceInput): Promise<PriceRecommendation>;
  diagnoseListing(input: DiagnoseInput): Promise<SellerAdvice>;
  parseSearchQuery(query: string): Promise<StructuredQuery>;
  suggestChatReplies(input: ChatContext): Promise<string[]>;
  embed(texts: string[]): Promise<number[][]>;
}
```

Три реалізації:

| Реалізація | Коли використовується |
|---|---|
| `OpenAiProvider` | `AI_PROVIDER=openai`. Продакшн. |
| `MockProvider` | `AI_PROVIDER=mock`. Локальна розробка, e2e-тести, демо, **фолбек при аварії OpenAI**. |
| `CachedProviderDecorator` | Обгортка над будь-яким. Кешує ембеддинги й аналіз ринку в Redis. Завжди активна. |

**Ланцюжок деградації:** `OpenAI` → (timeout/429/5xx, 2 ретраї з експоненційним backoff) →
`OpenAI з дешевшою моделлю` → (все ще падає) → `MockProvider` + прапорець `degraded: true` у відповіді.
Користувач бачить банер «AI працює в обмеженому режимі», але **флоу не ламається**.

Circuit breaker: після 10 помилок за 60 с — провайдер вимикається на 2 хвилини, весь трафік іде в мок.

Детально — у `05-ai-architecture.md`.

---

## 5. Обробка медіа

```
Браузер ──presigned PUT──▶ S3 (bucket: originals/)
   │
   └──POST /media/confirm──▶ API ──enqueue──▶ worker:image-processing
                                                 │
                                                 ├─ sharp: варіанти 320/640/1280/2560 у WebP+AVIF
                                                 ├─ blurhash для плейсхолдера
                                                 ├─ AI: видалення фону (опційно, за запитом)
                                                 ├─ upscale за низької роздільності
                                                 └─ EXIF-strip (приватність!) → S3 variants/
```

Завантаження йде **напряму в S3 через presigned URL** — не через API. Фото важать 3–8 МБ,
проксувати їх через Node-сервер означає марно палити пам'ять і смугу.

EXIF-очищення обов'язкове: фото з телефона містить GPS-координати квартири продавця.

---

## 6. Пошук

```
Запит користувача
   │
   ├─[LLM parse]─▶ StructuredQuery {category, priceRange, attributes, semanticText}
   │                    │ (фолбек при недоступності LLM: heuristic parser + FTS)
   │                    ▼
   ├──────────────▶ SQL: WHERE фільтри (категорія, ціна, гео, атрибути JSONB, статус)
   │                    │
   │                    ├─ FTS:    ts_rank_cd(search_vector, websearch_to_tsquery('ukrainian', q))
   │                    └─ Vector: 1 - (embedding <=> $queryEmbedding)
   │
   └──────────────▶ Ранжування:
                    score = 0.45·semantic + 0.30·fts + 0.10·freshness
                          + 0.10·sellerRating + 0.05·promotionBoost
```

Один `SELECT` з CTE, без окремого пошукового кластера. На обсягах MVP (< 1 млн оголошень)
pgvector з HNSW-індексом дає p95 < 80 мс. Винесення в окремий сервіс — це Етап 3, коли з'явиться потреба.

**Українська FTS-конфігурація** потребує розширення `pg_trgm` + власного словника —
без цього «шини» і «шина» не матчаться. Це закладено в міграції.

---

## 7. Авторизація та безпека

**Автентифікація:**
- Google OAuth 2.0 (основний шлях, ~70% користувачів)
- Magic link на email (без паролів — менше поверхні атаки, немає витоків паролів)
- JWT access (15 хв, у пам'яті) + refresh (30 днів, httpOnly + Secure + SameSite=Lax cookie) з ротацією
- Верифікація телефону (SMS) — **обов'язкова перед першою публікацією**. Це головний бар'єр проти шахраїв.

**Авторизація:** RBAC (`USER` / `BUSINESS` / `MODERATOR` / `ADMIN`) + ownership-guards на рівні ресурсу.
Entitlement-guard перевіряє ліміти тарифу (`@RequiresEntitlement('ai.generation')`).

**Захист:**

| Загроза | Захист |
|---|---|
| Брутфорс / DoS | Rate limiting на Redis: 100 req/min per IP, 20/min для AI-ендпоінтів, 5/год для реєстрації |
| Зловживання AI (дорого!) | Ліміти по тарифу + per-user квоти + аномалія-детектор + hard cap на добові витрати |
| XSS | React-екранування, CSP, санітизація AI-виводу (AI генерує текст — його не можна вставляти як HTML) |
| SQL-ін'єкції | Prisma (параметризовані запити); raw SQL тільки в пошуку, з `Prisma.sql` |
| Витік персональних даних | EXIF-strip, приховані телефони до контакту, шифрування PII у спокої |
| Prompt injection через фото/опис | Системні промпти з жорсткими межами, валідація виводу за JSON Schema, ніяких tool-calls з користувацького тексту |
| CSRF | SameSite cookies + CSRF-токен на мутації з cookie-авторизацією |
| Завантаження шкідливих файлів | Перевірка magic bytes (не розширення), ліміт розміру, окремий bucket без виконання |

---

## 8. Дані та стани

**Життєвий цикл оголошення:**

```
DRAFT ──publish──▶ PENDING_MODERATION ──approve──▶ ACTIVE ──┬──▶ SOLD
  ▲                        │                          │      ├──▶ ARCHIVED (30 днів неактивності)
  │                        └──reject──▶ REJECTED      │      └──▶ EXPIRED (60 днів)
  └────────────────────────────────────────edit───────┘
```

Автомодерація: AI-прескоринг ризику. `risk < 0.2` → одразу `ACTIVE`; `0.2–0.7` → черга модератора;
`> 0.7` → блокування + ручний розбір. На MVP ~85% оголошень мають проходити без людини.

**AI-джоби** зберігаються в `AiJob` з повним аудитом: вхід, вихід, модель, токени, вартість, латентність.
Це потрібно і для біллінгу, і для розбору скарг («AI написав неправду про мій товар»), і для донавчання.

---

## 9. Спостережуваність

| Шар | Інструмент | Що дивимось |
|---|---|---|
| Помилки | Sentry (web + api + worker) | error rate, регресії релізів |
| Метрики | Prometheus + Grafana | RPS, latency p50/p95/p99, глибина черг, DB pool |
| Логи | Pino (JSON) → Better Stack | структуровані, з `requestId` наскрізь |
| Продукт | PostHog | воронка AI-флоу, retention, A/B |
| **AI-специфічне** | власний дашборд | вартість/день, токени по кроках, частка фолбеків, точність категорій, частка правок AI-полів |

Останній рядок критичний. Без вимірювання **частки правок AI-полів** неможливо зрозуміти,
чи AI справді працює, чи користувачі мовчки все переписують.

---

## 10. Деплой

| Компонент | Платформа | Примітки |
|---|---|---|
| `apps/web` | Vercel | ISR, Edge для статики, автопрев'ю на PR |
| `apps/api` | Railway / Fly.io | 2+ інстанси за балансувальником, health checks |
| `apps/worker` | Railway / Fly.io | автоскейл за глибиною черги BullMQ |
| PostgreSQL | Neon / Supabase | pgvector увімкнений, PITR, read-репліка на Етапі 2 |
| Redis | Upstash | кеш + черги + rate limit |
| S3 | AWS S3 + CloudFront | eu-central-1 |
| CI/CD | GitHub Actions | lint → typecheck → test → e2e (Playwright) → міграції → deploy |

Середовища: `local` (docker-compose, `AI_PROVIDER=mock`) → `preview` (на кожен PR) →
`staging` (реальний OpenAI, тестові платежі) → `production`.

---

## 11. Точки розширення під відкладений функціонал

Функціонал поза MVP, але архітектура вже його передбачає:

| Майбутня фіча | Що вже закладено |
|---|---|
| Комісія з угод | `Payment.feeKop` (на MVP завжди `0`), `PaymentProvider` — інтерфейс |
| Безпечна оплата (ескроу) | В `PaymentPurpose` зарезервовані `ORDER` і `ESCROW`; `PaymentStatus` уже має `REFUNDED`. Сутність `Order` зі статусами `ESCROW_HELD` / `RELEASED` додається окремою міграцією на Етапі 4 — у схемі MVP її свідомо немає |
| Доставка | `Listing.deliveryOptions` (JSONB), інтерфейс `DeliveryProvider` під Нову Пошту |
| Мобільний застосунок | API вже headless; WS-gateway готовий; `notifications` має драйвер `push` (вимкнений) |
| AI Exchange (обмін) | `Listing.exchangeAccepted` (bool) — поле є, UI вимкнений feature flag'ом |
| Мультимовність | Усі користувацькі рядки через `next-intl`, `User.locale` у схемі (за замовчуванням `uk`) |

Усе це керується через `packages/config/feature-flags.ts` — вмикається без міграцій і релізу схеми.
