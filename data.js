/* ==========================================================================
   SOULORA — PLATFORM DATA
   --------------------------------------------------------------------------
   This is the ONLY file you need to edit to add / update practitioners.

   For each practitioner:
     id          unique, lowercase, no spaces (used in links)
     name        the healer's preferred display name on the platform
     title       short title shown under the name
     photo       path to their photo, e.g. "assets/healers/tala.jpg"
                 (leave "" to show the elegant placeholder portrait)
     bio         1–2 sentences
     rate        price in PHP for one session
     rateMax     (optional) upper price if the rate is a range
     duration    session length in minutes (used to build time slots)
     durationLabel (optional) text shown instead of minutes, e.g. "45–60 min"
     mode        "Online / Distance", "In-person", or "Online & In-person"
     location    (optional) shown for in-person sessions
     sameDay     true  -> "Book for today" option is enabled
     hours       weekly schedule. Day numbers: 0=Sun, 1=Mon ... 6=Sat
                 Each entry: [startTime, endTime] in 24h "HH:MM"
     payment     method + account name + QR image path.
                 qr: "assets/qr/tala-gcash.png"  (leave "" for sample QR)
   ========================================================================== */

window.SOULORA_CONFIG = {
  brand: "Soulora",
  tagline: "Where the soul finds its light.",
  email: "hello@soulora.ph",           // <- replace with your real email
  phone: "+63 917 000 0000",            // <- replace
  location: "Metro Manila, Philippines",// <- replace
  facebook: "https://facebook.com/",    // <- replace with your page
  instagram: "https://instagram.com/",  // <- replace
  timezoneLabel: "Philippine Time (PHT)",
  verifyHours: 24,                      // how soon you confirm payments

  /* OPTIONAL: where booking / contact / feedback forms are sent.
     Leave "" while testing: submissions are kept in the visitor's browser.
     Later you can paste a Formspree, Getform, Make.com or your own API URL. */
  endpoints: {
    booking: "",
    contact: "",
    feedback: ""
  }
};

/* Weekly hour templates (re-used below to keep things tidy) */
const WEEKDAYS_9_5 = { 1: ["09:00", "17:00"], 2: ["09:00", "17:00"], 3: ["09:00", "17:00"], 4: ["09:00", "17:00"], 5: ["09:00", "17:00"] };

window.SOULORA_SERVICES = {
  /* ----------------------------------------------------------------------
     1. REIKI HEALING
     ---------------------------------------------------------------------- */
  reiki: {
    id: "reiki",
    name: "Reiki Healing",
    short: "Gentle energy healing to restore balance, release blockages and calm the nervous system.",
    intro: "Choose a Reiki healer who resonates with you. Each healer sets their own rates and hours. Tap a healer to see their calendar, book for today, and view how to pay.",
    chips: ["Online & In-person", "Rates set by each healer", "Same-day slots available"],
    practitioners: [
      {
        id: "tala", name: "Healer Tala", title: "Usui Reiki Master",
        photo: "", bio: "Holds a soft, nurturing space for emotional release and deep rest.",
        rate: 1500, duration: 60, mode: "Online / Distance", sameDay: true,
        hours: { 1: ["09:00", "17:00"], 2: ["09:00", "17:00"], 3: ["13:00", "20:00"], 4: ["09:00", "17:00"], 6: ["10:00", "15:00"] },
        payment: { method: "GCash", accountName: "T*** S.", qr: "" }
      },
      {
        id: "amihan", name: "Healer Amihan", title: "Karuna & Usui Reiki Practitioner",
        photo: "", bio: "Focuses on stress, grief and heart-centred healing.",
        rate: 1200, duration: 60, mode: "Online & In-person", location: "Quezon City", sameDay: true,
        hours: { 2: ["10:00", "18:00"], 4: ["10:00", "18:00"], 5: ["10:00", "18:00"], 6: ["09:00", "14:00"] },
        payment: { method: "Maya", accountName: "A*** R.", qr: "" }
      },
      {
        id: "sinag", name: "Healer Sinag", title: "Reiki & Chakra Balancing",
        photo: "", bio: "Blends Reiki with chakra alignment for clarity and grounding.",
        rate: 1800, duration: 75, mode: "In-person", location: "Makati City", sameDay: false,
        hours: { 1: ["11:00", "19:00"], 3: ["11:00", "19:00"], 5: ["11:00", "19:00"] },
        payment: { method: "GCash", accountName: "S*** D.", qr: "" }
      },
      {
        id: "liwayway", name: "Healer Liwayway", title: "Holy Fire® Reiki Master",
        photo: "", bio: "Gentle, intuitive sessions for anxiety, sleep and inner peace.",
        rate: 1000, duration: 45, mode: "Online / Distance", sameDay: true,
        hours: { 0: ["14:00", "20:00"], 1: ["18:00", "21:00"], 3: ["18:00", "21:00"], 6: ["09:00", "18:00"] },
        payment: { method: "GCash", accountName: "L*** M.", qr: "" }
      },
      {
        id: "dalisay", name: "Healer Dalisay", title: "Reiki & Sound Healing",
        photo: "", bio: "Combines Reiki with singing bowls for a deeply restorative session.",
        rate: 2000, duration: 90, mode: "Online & In-person", location: "Pasig City", sameDay: true,
        hours: WEEKDAYS_9_5,
        payment: { method: "BPI / InstaPay", accountName: "D*** C.", qr: "" }
      },
      {
        id: "mayumi", name: "Healer Mayumi", title: "Animal & Family Reiki",
        photo: "", bio: "Distance Reiki for families, children and beloved pets.",
        rate: 900, duration: 45, mode: "Online / Distance", sameDay: true,
        hours: { 1: ["08:00", "12:00"], 2: ["08:00", "12:00"], 3: ["08:00", "12:00"], 4: ["08:00", "12:00"], 5: ["08:00", "12:00"] },
        payment: { method: "GCash", accountName: "M*** V.", qr: "" }
      }
    ]
  },

  /* ----------------------------------------------------------------------
     2. CONSULTATION FOR HEALERS (mentorship with senior healers)
     ---------------------------------------------------------------------- */
  mentorship: {
    id: "mentorship",
    name: "Consultation for Healers",
    short: "New to the practice? Consult senior, experienced healers for guidance, supervision and support.",
    intro: "For new and growing practitioners. Book a senior healer for a same-day consultation when you need guidance now, or schedule a non-urgent session for mentoring, case reviews and practice building.",
    chips: ["For practitioners", "Same-day or scheduled", "Online"],
    practitioners: [
      {
        id: "bayani", name: "Master Bayani", title: "Reiki Master Teacher · 15+ yrs",
        photo: "", bio: "Mentors new healers on ethics, energy hygiene and holding space.",
        rate: 2500, duration: 60, mode: "Online", sameDay: true,
        hours: { 1: ["10:00", "16:00"], 3: ["10:00", "16:00"], 5: ["10:00", "16:00"] },
        payment: { method: "GCash", accountName: "B*** A.", qr: "" }
      },
      {
        id: "luningning", name: "Mentor Luningning", title: "Senior Healer & Supervisor · 12 yrs",
        photo: "", bio: "Case reviews, client boundaries and building a sustainable practice.",
        rate: 2000, duration: 60, mode: "Online", sameDay: true,
        hours: { 2: ["13:00", "19:00"], 4: ["13:00", "19:00"], 6: ["09:00", "13:00"] },
        payment: { method: "Maya", accountName: "L*** P.", qr: "" }
      },
      {
        id: "dakila", name: "Mentor Dakila", title: "Energy Medicine Teacher · 10 yrs",
        photo: "", bio: "Helps healers deepen intuition and refine their session structure.",
        rate: 1800, duration: 60, mode: "Online", sameDay: false,
        hours: { 1: ["18:00", "21:00"], 2: ["18:00", "21:00"], 4: ["18:00", "21:00"] },
        payment: { method: "GCash", accountName: "D*** T.", qr: "" }
      }
    ]
  },

  /* ----------------------------------------------------------------------
     3. TAROT READING  (General Reading · ₱1,000 – ₱1,500 per hour)
     ---------------------------------------------------------------------- */
  tarot: {
    id: "tarot",
    name: "Tarot Reading",
    short: "A one-hour General Reading for guidance on love, career, purpose and the path ahead.",
    intro: "One-hour General Readings, ₱1,000 – ₱1,500 depending on the reader. Bring your questions, or simply come open to what the cards wish to reveal.",
    chips: ["General Reading", "₱1,000 – ₱1,500 / hour", "1 hour", "Online"],
    practitioners: [
      {
        id: "bituin", name: "Reader Bituin", title: "Intuitive Tarot Reader",
        photo: "", bio: "Clear, compassionate readings focused on next steps.",
        rate: 1000, duration: 60, mode: "Online", sameDay: true,
        hours: { 1: ["10:00", "18:00"], 2: ["10:00", "18:00"], 4: ["10:00", "18:00"], 6: ["10:00", "16:00"] },
        payment: { method: "GCash", accountName: "B*** L.", qr: "" }
      },
      {
        id: "hiraya", name: "Reader Hiraya", title: "Tarot & Oracle Reader",
        photo: "", bio: "Blends tarot and oracle cards for layered, soulful insight.",
        rate: 1250, duration: 60, mode: "Online", sameDay: true,
        hours: { 0: ["13:00", "19:00"], 3: ["15:00", "21:00"], 5: ["15:00", "21:00"] },
        payment: { method: "Maya", accountName: "H*** G.", qr: "" }
      },
      {
        id: "marikit", name: "Reader Marikit", title: "Senior Tarot Reader",
        photo: "", bio: "Deep-dive readings on relationships, purpose and life transitions.",
        rate: 1500, duration: 60, mode: "Online & In-person", location: "Taguig City", sameDay: false,
        hours: { 2: ["11:00", "17:00"], 4: ["11:00", "17:00"], 6: ["11:00", "17:00"] },
        payment: { method: "GCash", accountName: "M*** F.", qr: "" }
      }
    ]
  },

  /* ----------------------------------------------------------------------
     4. QUANTUM HEALING (in person only · no same-day booking · 45–60 min)
     ---------------------------------------------------------------------- */
  quantum: {
    id: "quantum",
    name: "Quantum Healing",
    short: "Science-based, in-person healing. 45 minutes to 1 hour depending on the depth of the session.",
    intro: "Quantum Healing is done in person only. Sessions last 45 minutes to 1 hour, depending on how deep the healing needs to go. Book at least one day ahead (no same-day appointments).",
    chips: ["In-person only", "45 – 60 minutes", "Book at least 1 day ahead"],
    noSameDay: true,
    minLeadDays: 1,
    practitioners: [
      {
        id: "kalinaw", name: "Practitioner Kalinaw", title: "Quantum Healing Practitioner",
        photo: "", bio: "Science-informed sessions for body–mind alignment and recovery.",
        rate: 3500, duration: 60, durationLabel: "45–60 min", mode: "In-person", location: "BGC, Taguig City", sameDay: false,
        hours: { 2: ["10:00", "17:00"], 4: ["10:00", "17:00"], 6: ["09:00", "15:00"] },
        payment: { method: "BDO / InstaPay", accountName: "K*** N.", qr: "" }
      },
      {
        id: "dayang", name: "Practitioner Dayang", title: "Quantum & Biofield Practitioner",
        photo: "", bio: "Restores energetic coherence through precise, guided sessions.",
        rate: 3000, duration: 60, durationLabel: "45–60 min", mode: "In-person", location: "Alabang, Muntinlupa", sameDay: false,
        hours: { 1: ["09:00", "16:00"], 3: ["09:00", "16:00"], 5: ["09:00", "16:00"] },
        payment: { method: "GCash", accountName: "D*** S.", qr: "" }
      }
    ]
  }
};
