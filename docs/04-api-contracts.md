# 04 — API-контракти

Формальна специфікація: `openapi/openapi.yaml` (OpenAPI 3.1, 70 операцій, валідовано Redocly).
Цей документ — про **чому саме так**, і про наскрізні сценарії.

---

## 1. Загальні правила

| Правило | Деталі |
|---|---|
| Базовий шлях | `/v1` — версія в URL, а не в заголовку. Простіше кешувати й дебажити. |
| Гроші | Завжди `*Kop` — цілі копійки. `priceKop: 2449000` = 24 490 ₴. |
| Час | ISO-8601 UTC. |
| Пагінація | Курсорна (`cursor` + `limit`). Offset-пагінація на 400 тис. оголошень дає `OFFSET 50000` — а це послідовне сканування. |
| Помилки | RFC 9457 `application/problem+json`. |
| Ідемпотентність | `Idempotency-Key` на `POST /billing/checkout` і `POST /listings` — щоб подвійний клік не створив два платежі. |
| AI-ендпоінти | `202 Accepted` + `jobId`. Синхронний HTTP на 20-секундну операцію — це таймаути й обірвані з'єднання. |
| Деградація | Заголовок `X-Ai-Degraded: true`, коли відповідь дав фолбек-провайдер. |

### Формат помилки

```json
{
  "type": "https://aitrade.ua/errors/limit-exceeded",
  "title": "Вичерпано ліміт AI-створень",
  "status": 403,
  "detail": "Тариф FREE дозволяє 5 AI-створень на місяць. Використано 5.",
  "instance": "/v1/ai/seller/analyze",
  "upgradeUrl": "/pricing?from=ai-limit"
}
```

`upgradeUrl` у тілі помилки — навмисно. Фронтенд не має здогадуватись, куди вести користувача
при впиранні в ліміт; сервер знає це краще, бо знає поточний тариф.

---

## 2. Наскрізний сценарій: «Продай за мене»

Це головний флоу продукту. Він проходить через 5 викликів.

```
┌── 1. Presign ─────────────────────────────────────────────────────────────┐
POST /v1/media/presign
{ "files": [{ "mimeType": "image/jpeg", "sizeBytes": 3_400_000 }, ...] }
→ 200 [{ "mediaId": "med_01", "uploadUrl": "https://s3...", "expiresIn": 900 }]

┌── 2. Завантаження напряму в S3 (браузер → S3, минаючи API) ───────────────┐
PUT https://s3.../originals/med_01.jpg

┌── 3. Підтвердження → запуск обробки ──────────────────────────────────────┐
POST /v1/media/med_01/confirm  → 202

┌── 4. Запуск AI-аналізу ───────────────────────────────────────────────────┐
POST /v1/ai/seller/analyze
{ "mediaIds": ["med_01","med_02","med_03"],
  "hint": "iPhone 13 Pro, 128 ГБ, є подряпина на рамці",
  "enhancePhotos": true }
→ 202 { "jobId": "job_7c2", "status": "QUEUED", "estimatedSeconds": 18 }

┌── 5. Прогрес (WebSocket) ─────────────────────────────────────────────────┐
ws: ai.job.progress { jobId, step: "Аналізую ринок", index: 6, total: 8, percent: 75 }
ws: ai.job.completed { jobId, result: {...} }
   (фолбек для клієнтів без WS — поллінг GET /v1/ai/jobs/job_7c2 раз на 1.5 с)
```

### Результат аналізу

```json
{
  "recognition": {
    "productType": "Смартфон",
    "brand": "Apple",
    "model": "iPhone 13 Pro",
    "categoryId": "cat_electronics_phones",
    "categoryPath": ["Електроніка", "Смартфони"],
    "confidence": 0.93,
    "uncertainFields": ["storage"]
  },
  "condition": {
    "value": "GOOD",
    "reasoning": "Легкі потертості на рамці, екран без подряпин, комплект неповний",
    "evidence": [
      { "mediaId": "med_02", "note": "Потертість на нижній грані" }
    ]
  },
  "copy": {
    "title": "iPhone 13 Pro 128GB Graphite, ідеальний стан батареї",
    "description": "Продаю iPhone 13 Pro у кольорі Graphite...",
    "keywords": ["iphone 13 pro", "айфон 13 про", "128gb", "graphite"],
    "alternativeTitles": ["Apple iPhone 13 Pro 128 ГБ — акумулятор 89%"]
  },
  "attributes": { "brand": "Apple", "model": "iPhone 13 Pro", "storage": 128,
                  "color": "Graphite", "batteryHealth": 89 },
  "price": {
    "quickSaleKop": 2100000,
    "optimalKop":   2450000,
    "maximumKop":   2790000,
    "market": { "medianKop": 2480000, "p25Kop": 2250000, "p75Kop": 2700000,
                "sampleSize": 43, "medianSellDays": 11 },
    "reasoning": {
      "quickSale": "На 14% нижче медіани — такі оголошення зазвичай знаходять покупця за 3–5 днів",
      "optimal":   "Близько до медіани по 43 схожих оголошеннях за останні 60 днів",
      "maximum":   "Реально при повному комплекті та ідеальних фото; очікуйте 25–35 днів"
    },
    "confidence": 0.81,
    "disclaimer": "Рекомендація базується на ринкових даних і не є експертною оцінкою майна."
  },
  "forecast": { "sellProbability": 78, "estimatedDays": 9,
                "explanation": "Висока за оптимальної ціни: попит у категорії стабільний" },
  "photoAdvice": {
    "missingAngles": [
      { "angle": "screen_on", "label": "Фото з увімкненим екраном",
        "impact": "+18% до довіри покупців" },
      { "angle": "box", "label": "Фото коробки та комплекту",
        "impact": "+9% до ціни продажу" }
    ],
    "lowQualityMediaIds": ["med_03"]
  }
}
```

### Публікація

```http
POST /v1/listings
{
  "title": "...", "description": "...", "priceKop": 2450000,
  "categoryId": "cat_electronics_phones", "condition": "GOOD",
  "attributes": {...}, "mediaIds": ["med_01","med_02","med_03"],
  "aiJobId": "job_7c2",
  "aiAcceptedFields": ["title","description","category","condition","attributes"],
  "publishNow": true
}
```

`aiAcceptedFields` — це не декорація. Клієнт порівнює фінальні значення з AI-виводом і надсилає
список полів, які користувач **не змінив**. Це єдиний спосіб виміряти, чи AI справді працює.
Якщо `title` систематично відсутній у цьому списку — промпт заголовків поганий, і це видно на дашборді.

**Можливі 403:**

| `type` | Коли |
|---|---|
| `phone-not-verified` | Перша публікація без верифікованого телефону |
| `listing-limit-exceeded` | FREE вже має 2 активних оголошення |
| `ai-limit-exceeded` | Вичерпано AI-створення за місяць |

---

## 3. AI-пошук

```http
GET /v1/search?q=Ноутбук%20для%20ігор%20до%2030000%20грн
```

```json
{
  "parsed": {
    "usedAi": true,
    "categoryId": "cat_electronics_laptops",
    "priceMaxKop": 3000000,
    "attributes": { "gpu": "discrete", "usage": "gaming" },
    "semanticQuery": "ігровий ноутбук"
  },
  "items": [ /* ListingCard[] */ ],
  "facets": {
    "brand": [{ "value": "ASUS", "count": 34 }, { "value": "Lenovo", "count": 28 }],
    "ram":   [{ "value": "16", "count": 41 }]
  },
  "nextCursor": "eyJzIjowLjcyLCJpZCI6ImxzdF8..."
}
```

`parsed` повертається клієнту навмисно — UI показує його як **редаговані чіпси**
(«Ноутбуки ✕», «до 30 000 ₴ ✕», «дискретна відеокарта ✕»). Користувач бачить,
як AI зрозумів запит, і може виправити. Без цього незрозуміло, чому в результатах саме це,
і пошук здається «магічним, але неконтрольованим».

Якщо `usedAi: false` — LLM був недоступний, спрацював евристичний парсер + FTS.
Результати гірші, але пошук працює. **Пошук не має падати ніколи.**

---

## 4. AI Advisor

```http
GET /v1/listings/lst_88/advice
```

```json
{
  "healthScore": 54,
  "locked": false,
  "findings": [
    {
      "axis": "price", "severity": "high",
      "finding": "Ціна на 15% вище медіани по 43 схожих оголошеннях",
      "evidence": { "yourKop": 2850000, "medianKop": 2480000, "sampleSize": 43 },
      "action": { "id": "act_1", "type": "set_price",
                  "label": "Знизити до 24 800 ₴", "payload": { "priceKop": 2480000 } },
      "expectedEffect": "+65% ймовірності продажу за 14 днів"
    },
    {
      "axis": "photos", "severity": "medium",
      "finding": "3 фото проти 7 у топ-оголошень цієї категорії",
      "action": { "id": "act_2", "type": "add_photos",
                  "label": "Додати фото", "payload": { "suggestedAngles": ["back","box"] } },
      "expectedEffect": "+22% переглядів"
    }
  ]
}
```

Для тарифу FREE: `locked: true`, у `findings` — лише одна знахідка з `severity: high`
і без `action`/`expectedEffect`. Це чесний тизер: користувач бачить, що проблема реальна
й конкретна, але не отримує рішення. Головна точка апселу в продукті.

```http
POST /v1/listings/lst_88/advice/apply
{ "adviceId": "adv_5", "actionIds": ["act_1"] }
→ 200 Listing (з оновленою ціною)
```

---

## 5. WebSocket

Namespace `/ws`, автентифікація через `access_token` у handshake.

**Сервер → клієнт:**

| Подія | Payload |
|---|---|
| `ai.job.progress` | `{ jobId, step, index, total, percent }` |
| `ai.job.completed` | `{ jobId, result }` |
| `ai.job.failed` | `{ jobId, error, degraded }` |
| `chat.message` | `{ threadId, message }` |
| `chat.typing` | `{ threadId, userId }` |
| `chat.read` | `{ threadId, messageIds }` |
| `listing.status` | `{ listingId, status, reason? }` |
| `notification` | `{ notification }` |
| `bulk.progress` | `{ importId, processed, total, errors }` |

**Клієнт → сервер:** `chat.join { threadId }`, `chat.typing { threadId }`, `chat.read { threadId }`.

Кожна WS-подія має HTTP-еквівалент для поллінгу — WebSocket є оптимізацією, а не єдиним шляхом.
Мобільні мережі рвуть з'єднання постійно; продукт не має від цього ламатися.

---

## 6. Ліміти запитів

| Група | Ліміт | Ключ |
|---|---|---|
| Публічне читання | 300/хв | IP |
| Автентифіковане читання | 600/хв | userId |
| Мутації | 60/хв | userId |
| **AI-ендпоінти** | 20/хв + місячна квота тарифу | userId |
| Пошук | 60/хв | IP + userId |
| Реєстрація / magic-link | 5/год | IP + email |
| SMS-верифікація | 3/год | телефон |
| Вебхуки платежів | без ліміту, перевірка підпису | — |

Реалізація — sliding window на Redis. Заголовки відповіді: `X-RateLimit-Limit`,
`X-RateLimit-Remaining`, `Retry-After`.

---

## 7. Кешування

| Ендпоінт | Стратегія |
|---|---|
| `GET /categories` | `Cache-Control: public, max-age=3600` + ETag |
| `GET /listings/{slug}` | ISR на Next.js, ревалідація 60 с; інвалідація вебхуком при редагуванні |
| `GET /listings` (каталог) | `s-maxage=60, stale-while-revalidate=300` |
| `GET /search` | Redis 5 хв на нормалізований запит (економить і LLM-виклики) |
| `GET /users/me` | `no-store` |
| Ембеддинги | Redis, ключ = sha256(тексту), TTL 30 днів |
| Аналіз ринку | Redis, ключ = категорія+атрибути+стан, TTL 6 год |

Останні два рядки — це прямі гроші. Кеш ембеддингів і ринкових зрізів знімає
70–80% повторюваних викликів OpenAI (розрахунок — у `05-ai-architecture.md`).
