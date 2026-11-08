// Wspólny stan listy zamówień (ilości + dodane pozycje), zapisany w Netlify Blobs.
// GET  /api/state  -> cały stan
// POST /api/state  -> scala zmiany z telefonu (wygrywa nowszy znacznik czasu dla każdej pozycji), zwraca cały stan
import { getStore } from "@netlify/blobs";

const KEY = "state";
const TABS = ["w", "v", "m", "p", "d"];
const UNITS = ["szt.", "kg", "g", "opak."];
const MAX_CUSTOM = 500;

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

const isObj = (x) => x && typeof x === "object" && !Array.isArray(x);
const clean = (s) => ({ q: isObj(s?.q) ? s.q : {}, c: isObj(s?.c) ? s.c : {}, p: isObj(s?.p) ? s.p : {} });

function merge(base, inc) {
  const maxT = Date.now() + 60_000;

  for (const [id, e] of Object.entries(inc.q)) {
    if (id.length > 80 || !Array.isArray(e)) continue;
    const v = Number(e[0]);
    const t = Math.min(Number(e[1]), maxT);
    if (!Number.isFinite(v) || !Number.isFinite(t)) continue;
    const cur = base.q[id];
    if (!cur || t > cur[1]) base.q[id] = [Math.max(0, Math.min(100000, v)), t];
  }

  // Ceny (Chefs Culinar): p[id] = [cena w zł albo null, czas]
  for (const [id, e] of Object.entries(inc.p)) {
    if (id.length > 80 || !Array.isArray(e)) continue;
    const v = e[0] === null ? null : Number(e[0]);
    const t = Math.min(Number(e[1]), maxT);
    if (v !== null && (!Number.isFinite(v) || v < 0 || v > 100000)) continue;
    if (!Number.isFinite(t)) continue;
    const cur = base.p[id];
    if (!cur || t > cur[1]) base.p[id] = [v, t];
  }

  for (const [id, e] of Object.entries(inc.c)) {
    if (id.length > 40 || !isObj(e)) continue;
    if (!TABS.includes(e.tab) || !UNITS.includes(e.u)) continue;
    if (typeof e.n !== "string" || !e.n.trim() || e.n.length > 80) continue;
    const t = Math.min(Number(e.t), maxT);
    if (!Number.isFinite(t)) continue;
    const cur = base.c[id];
    if (!cur && Object.keys(base.c).length >= MAX_CUSTOM) continue;
    if (!cur || t > cur.t) base.c[id] = { tab: e.tab, n: e.n.trim(), u: e.u, t, del: e.del === true };
  }
  return base;
}

export default async (req) => {
  const store = getStore({ name: "zamowienia", consistency: "strong" });

  if (req.method === "GET") {
    return json(clean(await store.get(KEY, { type: "json" })));
  }

  if (req.method === "POST") {
    let body;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Niepoprawny JSON" }, 400);
    }
    const base = clean(await store.get(KEY, { type: "json" }));
    merge(base, clean(body));
    await store.setJSON(KEY, base);
    return json(base);
  }

  return json({ error: "Metoda niedozwolona" }, 405);
};

export const config = { path: "/api/state" };
