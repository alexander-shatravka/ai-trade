# 03 — Модель даних

PostgreSQL 16 + pgvector. Схема — `prisma/schema.prisma` (33 моделі, 18 enum'ів, валідовано Prisma 6).

---

## 1. Карта сутностей

```
                          ┌──────────┐
                    ┌────▶│ Category │◀───┐  attributeSchema (JSON Schema)
                    │     └──────────┘    │  керує і AI-виводом, і фільтрами
                    │                     │
┌──────┐   1:N   ┌──┴──────┐   1:N   ┌────┴────┐
│ User │────────▶│ Listing │────────▶│  Media  │
└──┬───┘         └──┬───┬──┘         └─────────┘
   │                │   │
   │                │   └──1:N──▶ AiJob · SellerAdvice · Promotion · Valuation
   │                │                    ListingDailyStat · ViewEvent · Report
   │                │
   │             ┌──▼─────────┐   1:N   ┌─────────────┐
   │             │ ChatThread │────────▶│ ChatMessage │
   │             └────────────┘         └─────────────┘
   │
   ├──1:1──▶ Subscription ──N:1──▶ Plan
   ├──1:1──▶ BusinessProfile
   ├──1:N──▶ Payment ──1:N──▶ Promotion / Valuation
   ├──1:N──▶ Review (author) / Review (target)
   ├──1:N──▶ AiUsageCounter          ← ліміти тарифу без сканування ai_jobs
   ├──1:N──▶ SavedListing · SavedSearch · SearchEvent · Notification
   └──1:N──▶ BulkImport ──1:N──▶ BulkImportRow ──1:1──▶ Listing
```

---

## 2. Рішення, які варто пояснити

### 2.1 Гроші — `Int` у копійках

```prisma
priceKop  Int      // 2 499 000 = 24 990,00 ₴
```

Ніяких `Float`, ніяких `Decimal`. `Float` дає класичне `0.1 + 0.2 = 0.30000000000000004`
і рано чи пізно з'їдає копійку в звірці платежів. `Decimal` коректний, але тягне
серіалізацію в JSON і не має нативного типу в JS. Ціле число копійок — просто, швидко,
однозначно. Форматування у «24 990 ₴» — на рівні UI (`packages/utils/money.ts`).

Витрати на AI — у **мікрокопійках** (`costMicroKop`), бо один виклик `gpt-4o-mini` коштує
частки копійки, і округлення до копійки знищило б статистику.

### 2.2 Характеристики товару — JSONB, а не таблиця на категорію

Класична альтернатива — EAV (`attribute_values`) або окрема таблиця під кожну категорію.
EAV перетворює будь-який фільтр на каскад JOIN'ів; таблиця на категорію означає міграцію
щоразу, коли з'являється нова категорія — а їх буде десятки.

```prisma
attributes Json @default("{}")
@@index([attributes], type: Gin)
```

Валідність гарантує не БД, а `Category.attributeSchema` (JSON Schema) —
її перевіряє і бекенд при збереженні, і AI при генерації. Фільтрація:

```sql
WHERE attributes @> '{"brand":"Apple"}'
  AND (attributes->>'storage')::int BETWEEN 128 AND 512
```

GIN-індекс покриває оператор `@>`. Для числових діапазонів у гарячих категоріях
додаємо часткові B-tree індекси за виразом (приклад — у міграції нижче).

### 2.3 Три види пошуку в одній таблиці

| Колонка | Тип | Індекс | Для чого |
|---|---|---|---|
| `searchVector` | `tsvector` | GIN | точні збіги слів, бренди, моделі |
| `embedding` | `vector(1536)` | HNSW | сенс запиту («щось для походів у гори») |
| `attributes` | `jsonb` | GIN | структуровані фільтри |

Один `SELECT`, жодного зовнішнього пошукового кластера на MVP.

### 2.4 Денормалізовані лічильники

`Listing.viewsCount`, `User.ratingAvg`, `ChatThread.buyerUnread` — свідома денормалізація.
Рахувати `COUNT(*)` по `view_events` на кожен рендер картки — це смерть під навантаженням.
Лічильники оновлюються інкрементально (`UPDATE ... SET viewsCount = viewsCount + 1`),
а нічна джоба звіряє їх з джерелом правди й виправляє дрейф.

### 2.5 `AiUsageCounter` замість агрегації по `AiJob`

Перевірка ліміту тарифу відбувається **перед кожним** AI-викликом. Якщо це `COUNT(*)`
по таблиці на мільйони рядків — кожне натискання «Створити оголошення» коштує сканування.
Один рядок на користувача×місяць з інкрементом — O(1).

### 2.6 `aiAcceptedFields` — метрика, яка вбудована в схему

```prisma
aiAcceptedFields String[] @default([])   // ["title","description","condition"]
```

Показує, які AI-поля користувач залишив без правок. Без цього поля неможливо відповісти
на найважливіше продуктове питання: **AI справді працює чи люди мовчки все переписують?**
Метрика збирається з першого дня, а не додається постфактум.

### 2.7 `ReportReason.AI_INACCURACY` — окремий тип скарги

Скарги «AI написав неправду про товар» треба відрізняти від звичайного спаму:
це прямий сигнал про деградацію якості моделі або промпту. Окремий enum-кейс
дозволяє побудувати алерт на сплеск таких скарг після зміни `promptVersion`.

### 2.8 Видалення акаунта (GDPR)

`UserStatus.DELETED` + `deletedAt`, а не фізичний `DELETE`. Фізичне видалення каскадом
знесло б чужі чати й відгуки, спотворивши історію інших користувачів.
Процедура: PII (`email`, `phone`, `name`, `avatarUrl`, `bio`) замінюються на анонімні значення,
оголошення → `ARCHIVED`, сесії відкликаються, зв'язки зберігаються. Через 30 днів
`ai_jobs.input/output` цього користувача очищаються джобою `cleanup`.

---

## 3. Індексна стратегія

Кожен індекс відповідає конкретному запиту з продукту — зайвих немає, бо кожен індекс
уповільнює запис і їсть диск.

| Індекс | Запит, який він обслуговує |
|---|---|
| `listings(status, publishedAt DESC)` | стрічка «нові оголошення» |
| `listings(categoryId, status, priceKop)` | категорія + фільтр ціни (основний шлях каталогу) |
| `listings(userId, status, createdAt DESC)` | «Мої оголошення» в кабінеті |
| `listings(status, boostScore DESC, publishedAt DESC)` | видача з урахуванням платного просування |
| `listings(attributes) GIN` | фасетні фільтри по характеристиках |
| `listings(embedding) HNSW` | семантичний пошук |
| `listings(searchVector) GIN` | повнотекстовий пошук |
| `chat_threads(sellerId, lastMessageAt DESC)` | список діалогів |
| `chat_messages(threadId, createdAt)` | прокрутка історії треда |
| `ai_jobs(type, status, createdAt DESC)` | AI-дашборд і алерти |
| `ai_usage_counters(userId, period)` UNIQUE | перевірка ліміту перед кожним AI-викликом |
| `promotions(isActive, endsAt)` | джоба деактивації просувань |

---

## 4. Міграції, які Prisma не покриває

Prisma не вміє описувати тригери, спеціальні індекси й партиціонування.
Це йде окремою SQL-міграцією (`prisma/migrations/xxx_postgres_extras/migration.sql`):

```sql
-- ── 1. Розширення ───────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS citext;

-- ── 2. Українська FTS-конфігурація ──────────────────────────────────────────
-- Без цього «шини» і «шина» не матчаться, а це половина пошукових запитів.
CREATE TEXT SEARCH CONFIGURATION ukrainian ( COPY = simple );
ALTER TEXT SEARCH CONFIGURATION ukrainian
  ALTER MAPPING FOR hword, hword_part, word WITH unaccent, simple;
-- Продакшн: підключити словник hunspell uk_UA замість simple.

-- ── 3. Автонаповнення search_vector ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION listings_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
      setweight(to_tsvector('ukrainian', coalesce(NEW.title, '')), 'A')
   || setweight(to_tsvector('ukrainian', array_to_string(NEW.keywords, ' ')), 'B')
   || setweight(to_tsvector('ukrainian',
        coalesce((SELECT string_agg(value, ' ')
                  FROM jsonb_each_text(NEW.attributes)), '')), 'B')
   || setweight(to_tsvector('ukrainian', coalesce(NEW.description, '')), 'C');
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER listings_search_vector_trg
  BEFORE INSERT OR UPDATE OF title, description, keywords, attributes ON listings
  FOR EACH ROW EXECUTE FUNCTION listings_search_vector_update();

CREATE INDEX listings_search_vector_idx ON listings USING GIN ("searchVector");

-- Заголовок ще й триграмами — щоб «айфон 13» знаходив «iPhone 13» через опечатки
CREATE INDEX listings_title_trgm_idx ON listings USING GIN (title gin_trgm_ops);

-- ── 4. Векторний індекс ─────────────────────────────────────────────────────
-- HNSW, а не IVFFlat: не потребує навчання на даних і дає кращий recall
-- на змінному наборі (оголошення додаються й архівуються постійно).
CREATE INDEX listings_embedding_idx ON listings
  USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- ── 5. Часткові індекси під гарячі шляхи ────────────────────────────────────
-- 95% запитів каталогу — тільки по ACTIVE. Часткові індекси втричі менші.
-- Колонки в схемі — camelCase (у Prisma `@@map` є лише на таблицях, на полях немає),
-- тому імена беруться в лапки: published_at без лапок Postgres не знайде.
CREATE INDEX listings_active_recent_idx ON listings ("publishedAt" DESC)
  WHERE status = 'ACTIVE' AND "deletedAt" IS NULL;

CREATE INDEX listings_active_price_idx ON listings ("categoryId", "priceKop")
  WHERE status = 'ACTIVE' AND "deletedAt" IS NULL;

-- Приклад числового фільтра по JSONB для гарячої категорії
CREATE INDEX listings_storage_idx ON listings ((("attributes"->>'storage')::int))
  WHERE status = 'ACTIVE' AND "attributes" ? 'storage';

-- ── 6. Партиціонування подій ────────────────────────────────────────────────
-- view_events і search_events ростуть швидше за все інше разом узяте.
-- Партиції по місяцях: старі відчіпляються одним DETACH замість DELETE на мільйони рядків.
-- (Створюється як partitioned table у власній міграції; pg_partman керує ротацією.)

-- ── 7. Захист від «мінусової» ціни та інших інваріантів ─────────────────────
ALTER TABLE listings ADD CONSTRAINT listings_price_positive
  CHECK ("priceKop" >= 0);
ALTER TABLE listings ADD CONSTRAINT listings_sold_has_date
  CHECK (status <> 'SOLD' OR "soldAt" IS NOT NULL);
ALTER TABLE reviews ADD CONSTRAINT reviews_rating_range
  CHECK (rating BETWEEN 1 AND 5);
```

---

## 5. Seed-дані

`prisma/seed.ts` наповнює:

1. **Регіони й міста** — 25 областей, ~120 міст з населенням > 20 тис.
2. **Категорії** — 13 кореневих + ~70 підкатегорій, кожна з `attributeSchema` та `aiHints`.
3. **Тарифи** — FREE / PREMIUM / BUSINESS з лімітами з `01-product-spec.md`.
4. **Feature flags** — усі відкладені фічі вимкнені.
5. **Демо-контент** (тільки `local`/`preview`): 3 користувачі (FREE/PREMIUM/BUSINESS),
   40 оголошень з реалістичними фото-заглушками, 5 чатів, 12 відгуків,
   готові `AiJob` у мок-режимі — щоб демо працювало одразу після `pnpm db:seed`.

---

## 6. Оцінка обсягів (12 місяців, консервативний сценарій)

| Таблиця | Рядків | Розмір з індексами |
|---|---|---|
| `listings` | 400 тис. | ~4.5 ГБ (з них ~2.4 ГБ — embedding + HNSW) |
| `media` | 2.4 млн | ~1.2 ГБ (метадані; самі файли в S3, ~8 ТБ) |
| `view_events` | 120 млн | ~14 ГБ (партиціоновано, зберігаємо 6 міс.) |
| `ai_jobs` | 3 млн | ~6 ГБ (input/output очищаються через 90 днів) |
| `chat_messages` | 8 млн | ~2 ГБ |

Висновок: інстанс на 8 vCPU / 32 ГБ RAM / 500 ГБ SSD витримує перший рік із запасом.
Перше вузьке місце буде не CPU, а **вартість embedding-ів та зберігання HNSW у пам'яті** —
тому в `05-ai-architecture.md` описано кешування й батчинг.
