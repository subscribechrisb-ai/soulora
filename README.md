# Soulora — Healing & Wellness Collective

> *Where the soul finds its light.*

The booking website for Soulora. Clients can find **Reiki healers**, **tarot readers**, **quantum healing practitioners**, and **senior healers who mentor newer practitioners**. They view each practitioner's rates and hours, book from a calendar (or book a same-day slot), pay by scanning the practitioner's QR code, and upload their proof of payment.

It is a plain HTML, CSS and JavaScript site with **no build step**, so it deploys to Vercel as is.

---

## Pages

| Page | URL |
|---|---|
| Home | `/#home` |
| Reiki Healing | `/#reiki` |
| Consultation for Healers | `/#mentorship` |
| Tarot Reading (General Reading, ₱1,000–₱1,500 / hr) | `/#tarot` |
| Quantum Healing (in person only, 45–60 min, no same-day bookings) | `/#quantum` |
| About Us | `/#about` |
| Contact Us | `/#contact` |
| Comments & Feedback | `/#feedback` |

## Folder structure

```
soulora/
├── index.html          ← the single page shell
├── css/styles.css      ← all styling (theme colours taken from the logo)
├── js/data.js          ← ✏️ EDIT THIS: practitioners, rates, hours, QR codes, contact info
├── js/app.js           ← pages, calendar, booking flow, forms
├── assets/
│   ├── logo-full.jpg   ← full Soulora logo
│   ├── logo-mark.jpg   ← lotus emblem (header and hero)
│   ├── favicon.png
│   ├── healers/        ← put practitioner photos here
│   └── qr/             ← put payment QR code images here
├── vercel.json
└── README.md
```

## Adding or editing a practitioner

Open `js/data.js`. Each practitioner looks like this:

```js
{
  id: "tala", name: "Healer Tala", title: "Usui Reiki Master",
  photo: "assets/healers/tala.jpg",           // "" = elegant placeholder
  bio: "Holds a soft, nurturing space…",
  rate: 1500, duration: 60, mode: "Online / Distance", sameDay: true,
  hours: { 1: ["09:00","17:00"], 3: ["13:00","20:00"] },   // 0=Sun … 6=Sat
  payment: { method: "GCash", accountName: "T*** S.", qr: "assets/qr/tala-gcash.png" }
}
```

1. Put the photo in `assets/healers/` (a square or 4:3 JPG of about 800 px works well).
2. Put the GCash, Maya or bank QR image in `assets/qr/`.
3. Fill in the rate, hours and payment details. Until a real QR image is added, a QR clearly marked **SAMPLE** is shown.

Your email, phone, location and social links are at the top of `js/data.js`, in `SOULORA_CONFIG`.

## ⚠️ Receiving bookings (important before going live)

The site has no server yet. While `endpoints` in `js/data.js` is empty, bookings, contact messages and feedback are **only kept in the visitor's own browser**, so you will not receive them.

To receive submissions **and the proof-of-payment upload** by email, create a form endpoint and paste its URL:

```js
endpoints: {
  booking:  "https://formspree.io/f/xxxxxxx",  // must support file uploads
  contact:  "https://formspree.io/f/yyyyyyy",
  feedback: "https://formspree.io/f/zzzzzzz"
}
```

Services that work with no code: **Formspree** (file uploads need a paid plan), **Getform**, **Basin**, or a **Make.com / Zapier webhook** that saves to Google Drive or Sheets and emails you. The form sends all booking fields plus the uploaded file as `proof`.

You then verify each payment and email the client to confirm whether the appointment will push through, as the site tells them you will.

> Also note: the calendar marks some time slots as "taken" for the demo (`slotsFor` in `js/app.js`). Once you have a real booking backend (such as Supabase or Google Calendar), replace that line with real availability so two clients can't book the same slot.

## Run locally

Open `index.html` in a browser, or run:

```bash
npx serve .
```

## Push to GitHub

```bash
cd soulora
git init
git add .
git commit -m "Initial Soulora website"
git branch -M main
git remote add origin https://github.com/<your-username>/soulora.git
git push -u origin main
```

## Deploy on Vercel

1. Go to **vercel.com → Add New → Project**.
2. Import the `soulora` GitHub repository.
3. Framework preset: **Other**. Leave Build Command and Output Directory **empty**.
4. Click **Deploy**. Each push to `main` redeploys the site automatically.
5. (Optional) Add your domain, e.g. `soulora.ph`, under **Settings → Domains**.

---

© Soulora Healing & Wellness Collective · AWAKEN • ALIGN • HEAL
