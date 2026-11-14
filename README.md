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
| Join as a Healer / Reader | `/#join` |

## Folder structure

```
soulora/
├── index.html          ← the single page shell
├── styles.css          ← all styling (theme colours taken from the logo)
├── data.js             ← ✏️ EDIT THIS: practitioners, rates, hours, QR codes, email, form links
├── app.js              ← pages, calendar, booking flow
├── logo-full.jpg       ← full Soulora logo
├── logo-mark.jpg       ← lotus emblem (header and hero)
├── favicon.png
├── vercel.json
└── README.md
```

## Adding or editing a practitioner

Open `data.js`. Each practitioner looks like this:

```js
{
  id: "tala", name: "Healer Tala", title: "Usui Reiki Master",
  photo: "tala.jpg",           // "" = elegant placeholder
  bio: "Holds a soft, nurturing space…",
  rate: 1500, duration: 60, mode: "Online / Distance", sameDay: true,
  hours: { 1: ["09:00","17:00"], 3: ["13:00","20:00"] },   // 0=Sun … 6=Sat
  payment: { method: "GCash", accountName: "T*** S.", qr: "tala-gcash.png" }
}
```

1. Upload the photo to the top level of the repository (a square or 4:3 JPG of about 800 px works well).
2. Upload the GCash, Maya or bank QR image the same way.
3. Fill in the rate, hours and payment details. Until a real QR image is added, a QR clearly marked **SAMPLE** is shown.

Your email, phone, location and social links are at the top of `data.js`, in `SOULORA_CONFIG`.

## Where bookings and messages go

All settings are at the top of `data.js` (`SOULORA_CONFIG`):

| Setting | What it does |
|---|---|
| `email` | Shown across the site. Contact and feedback messages open the visitor's email app addressed to it. Currently `subscribechrisb@gmail.com` for testing. |
| `bookingFormUrl` | The booking form used for **all services**. It is embedded in step 3 of every booking, where clients enter their details and upload their proof of payment. |
| `joinFormUrl` | The sign-up form for healers and tarot readers, shown on the **Join** page (`/#join`). While it is empty, applicants are asked to email you. |

**Important:** booking notifications are sent by your form provider (LeadConnector / GoHighLevel), not by this website. In the form's settings, set the notification email to the address where you want booking and payment alerts.

**Booking flow:** choose a date and time → pay by scanning the healer's QR code → fill in the booking form (paste the booking details with the *Copy booking details* button, upload the payment screenshot) → confirmation screen with a reference number.

> The calendar marks some time slots as "taken" for the demo (`slotsFor` in `app.js`). Once you have a real booking system, replace that line with real availability so two clients can't book the same slot.

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
