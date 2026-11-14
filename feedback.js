/* ==========================================================================
   SOULORA — Feedback API (Vercel serverless function)
   --------------------------------------------------------------------------
   GET  /api/feedback  -> latest feedback (newest first)
   POST /api/feedback  -> add feedback; it shows on the site right away

   Storage: Upstash Redis (free), connected through Vercel:
     Vercel project -> Storage -> Create Database -> Upstash for Redis
   Vercel then adds the environment variables this file reads
   (KV_REST_API_URL + KV_REST_API_TOKEN, or UPSTASH_REDIS_REST_URL + _TOKEN).
   No npm packages needed.

   To delete a feedback entry: open the database in Vercel -> "Open in Upstash"
   -> Data Browser -> key "soulora:feedback" and remove the item.
   ========================================================================== */

const LIST_KEY = "soulora:feedback";
const MAX_STORED = 500;   // keeps the newest 500
const MAX_RETURNED = 100; // shown on the site
const RATE_LIMIT = 3;     // posts per visitor...
const RATE_WINDOW = 600;  // ...per 10 minutes

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(command) {
  const res = await fetch(REDIS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(command)
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || `Redis error ${res.status}`);
  return data.result;
}

const clean = (v, max) =>
  String(v ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") { try { return JSON.parse(req.body); } catch { return {}; } }
  let raw = "";
  for await (const chunk of req) { raw += chunk; if (raw.length > 20000) break; }
  try { return JSON.parse(raw || "{}"); } catch { return {}; }
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (!REDIS_URL || !REDIS_TOKEN) {
    return res.status(503).json({ error: "Feedback storage is not connected yet." });
  }

  try {
    if (req.method === "GET") {
      const raw = await redis(["LRANGE", LIST_KEY, "0", String(MAX_RETURNED - 1)]);
      const items = (raw || []).map((s) => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
      return res.status(200).json({ items });
    }

    if (req.method === "POST") {
      const body = await readBody(req);

      // Bots fill in the hidden "website" field; quietly ignore them.
      if (body.website) return res.status(200).json({ item: null });

      const name = clean(body.name, 40) || "Anonymous";
      const comment = clean(body.comment, 1000);
      const service = clean(body.service, 60) || "Soulora";
      const practitioner = clean(body.practitioner, 60);
      const rating = Math.round(Number(body.rating));

      if (comment.length < 3) return res.status(400).json({ error: "Please write a little more in your comment." });
      if (!(rating >= 1 && rating <= 5)) return res.status(400).json({ error: "Please choose a rating from 1 to 5 stars." });

      // Simple rate limit per IP address
      const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
      const rlKey = `soulora:fb:rl:${ip}`;
      const count = await redis(["INCR", rlKey]);
      if (count === 1) await redis(["EXPIRE", rlKey, String(RATE_WINDOW)]);
      if (count > RATE_LIMIT) {
        return res.status(429).json({ error: "Thank you! You've shared a few already. Please try again in a few minutes." });
      }

      const item = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        name, rating, service, practitioner, comment,
        at: new Date().toISOString()
      };
      await redis(["LPUSH", LIST_KEY, JSON.stringify(item)]);
      await redis(["LTRIM", LIST_KEY, "0", String(MAX_STORED - 1)]);
      return res.status(201).json({ item });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("feedback api error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};
