# دیدار گلد — سامانه عملیاتی طلا

پلتفرم B2B عملیاتی دیدار گلد: کاتالوگ و QC، صدور UID، قیمت‌گذاری، پیش‌فاکتور، اعتبار، دفتر معین دوگانه و استعلام اصالت.

زنده: [https://didar.cls9.com](https://didar.cls9.com)

**وضعیت و مسیر معماری (برای همه):** [`docs/BACKLOG.md`](docs/BACKLOG.md) · [`docs/capability-map.md`](docs/capability-map.md)

**راهنمای کاربری و جریان‌ها (فارسی):** [`docs/user-guide/handbook.md`](docs/user-guide/handbook.md)

---

## وضعیت فعلی (اوت ۲۰۲۶)

### انجام‌شده
- UI هشت‌نقشه (Farsi / RTL) روی Next.js + PWA
- Backend جدا در `backend/` → سرور `/var/www/didar-api` (FastAPI + Postgres Docker)
- Frontend روی `/var/www/didar` (PM2 `didar` :3014)
- API روی `127.0.0.1:8014` با پروکسی nginx فقط برای `/api/v1/`
- JWT برای ورود و عملیات نوشتن
- جریان تعاملی متصل به DB:
  - QC: ایجاد SKU → صف QC → تأیید/رد
  - انبار: صدور UID قفل‌شده + موجودی خزانه + دفتر معین
  - فروش: قفل قیمت → پیش‌فاکتور + کنترل اعتبار
  - قیمت‌گذاری: درخواست نرخ / قوانین اجرت
  - مالی: دفتر دوگانه + سند اصلاحی
  - تحویل: تأیید OTP
  - خرده‌فروش: سفارش
  - عمومی: `/verify/[uid]` از دارایی‌های مهرشده
- داده seed رابطه‌دار در Postgres (قابل پاک‌سازی قبل از کسب‌وکار واقعی)
- **بدون بلاکچین** — منبع حقیقت: `domain_events` append-only + پروجکشن‌ها

### محدودیت‌های فعلی
- پیامک واقعی نیست — **OTP همیشه `1234`**
- بکاپ Postgres عمداً فعلاً انجام نمی‌شود (داده واقعی نیست)
- قبل از go-live: wipe کردن seed و ورود داده واقعی

### مسیر جلو (پیشنهادی)
1. OTP/SMS واقعی وقتی نیاز شد
2. درگاه پرداخت / تسویه بانکی
3. بکاپ و مانیتورینگ وقتی داده واقعی شد
4. سخت‌گیری بیشتر Auth سازمانی (SSO و …)

---

## معماری استقرار

| | Frontend | Backend |
|---|---|---|
| کد محلی | ریشهٔ ریپو | `backend/` |
| سرور | `/var/www/didar` | `/var/www/didar-api` |
| PM2 | `didar` | `didar-api` |
| پورت | `127.0.0.1:3014` | `127.0.0.1:8014` |
| DB | — | Docker `didar-postgres` → `127.0.0.1:5436` |

API عمومی: `https://didar.cls9.com/api/v1/...`  
اسناد OpenAPI: روی سرور از طریق همان مسیر یا لوکال `http://127.0.0.1:8000/docs`

---

## اجرا لوکال

```bash
# Frontend
npm install
# .env.local → NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
npm run dev

# Backend
cd backend
python3.10 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

بدون `NEXT_PUBLIC_API_URL`، فرانت به حالت ذخیره‌سازی مرورگر برمی‌گردد (برای توسعه آفلاین).

جزئیات API: [`backend/README.md`](backend/README.md)

---

## نقش‌ها

رمز مشترک محیط فعلی: `didar123`

| نقش | کاربر | مسیر |
| --- | --- | --- |
| مدیر کل | `leila` | `/app/admin` |
| کاتالوگ و QC | `maryam` | `/app/qc` |
| UID و انبار | `hossein` | `/app/warehouse` |
| قیمت‌گذاری | `nima` | `/app/pricing` |
| ایجنت فروش | `navid` | `/app/agent` |
| خرده‌فروش | `sara` | `/app/retailer` |
| مدیر مالی | `kambiz` | `/app/finance` |
| مشتری نهایی | `aida` | `/app/customer` + `/verify` |

---

## فناوری

Next.js · TypeScript · Tailwind · Framer Motion · Lucide · PWA · FastAPI · Postgres · JWT

فونت برند: **Doran**

<!-- trigger vercel build -->
