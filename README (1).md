# Soulora — Healing & Wellness Collective

> *Where the soul finds its light.*

The booking website for Soulora. Clients can find **healers**, **tarot readers**, **quantum healing practitioners**, and **senior healers who mentor newer practitioners**. They view each practitioner's rates and hours, book from a calendar (or book a same-day slot), pay by scanning the practitioner's QR code, and upload their proof of payment.

It is a plain HTML, CSS and JavaScript site with **no build step**, so it deploys to Vercel as is.

---

## Pages

| Page | URL |
|---|---|
| Home | `/#home` |
| Healing | `/#healing` |
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
├── api/feedback.js     ← feedback wall server function
├── vercel.json
└── README.md
```

## Adding or editing a practitioner

Open `data.js`. Each practitioner looks like this:

```js
{
  id: "tala", name: "Healer Tala", title: "Energy Healing Master",
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
| `email` | The public email shown across the site (`teamsouloraph@gmail.com`). |
| `inquiryEmail` | Private inbox for Contact Us inquiries and Feedback (`subscribechrisb@gmail.com`). It isn't displayed on the site, but customers see it in their email app when they send the message. |
| `bookingFormUrl` | The booking form used for **all services**. It is embedded in step 3 of every booking, where clients enter their details and upload their proof of payment. |
| `joinFormUrl` | The sign-up form for healers and tarot readers, shown on the **Join** page (`/#join`). While it is empty, applicants are asked to email you. |

**Important:** booking notifications are sent by your form provider (LeadConnector / GoHighLevel), not by this website. In the form's settings, set the notification email to the address where you want booking and payment alerts.

**Booking flow:** choose a date and time → pay by scanning the healer's QR code → fill in the booking form (paste the booking details with the *Copy booking details* button, upload the payment screenshot) → confirmation screen with a reference number.

> The calendar marks some time slots as "taken" for the demo (`slotsFor` in `app.js`). Once you have a real booking system, replace that line with real availability so two clients can't book the same slot.

## Feedback wall (shows new feedback to everyone right away)

The Comments & Feedback page posts each comment to `api/feedback.js`, a small Vercel function that stores it in a free **Upstash Redis** database. Each comment appears for every visitor straight away, under either the person's real name or an alias, whichever they choose. Their email is never shown.

**One-time setup (about 3 minutes):**

1. Make sure the repository has the file **`api/feedback.js`** (inside a folder named `api`).
2. In Vercel, open your project, go to the **Storage** tab, and click **Create Database**. Choose **Upstash for Redis** and the **Free** plan, pick the region closest to you (e.g. Singapore), and **connect it to this project** (all environments).
3. Go to **Deployments**, click **⋯** on the latest deployment, then **Redeploy**.

Until the database is connected, feedback is only saved in the visitor's own browser.

**Removing a comment:** in Vercel go to **Storage**, open the database, then **Open in Upstash** → **Data Browser** → key `soulora:feedback`, and delete the entry.

**Spam protection:** each visitor can post up to 3 times per 10 minutes, a hidden field catches simple bots, and all text is shown as plain text.

**Email copy:** with `feedbackEmailCopy: true` in `data.js`, after posting, the visitor's email app also opens with a copy addressed to `inquiryEmail`. Set it to `false` to skip that step.

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
