
// --- Modération visage ---
const BAN_DURATION_MS = 24 * 60 * 60 * 1000;
const STRIKE_WINDOW_MS = 15 * 60 * 1000;
const STRIKES_TO_BAN = 2;

const bans = new Map();
const strikes = new Map();

function isBanned(maskedIp) {
  const exp = bans.get(maskedIp);
  if (!exp) return false;
  if (Date.now() > exp) { bans.delete(maskedIp); return false; }
  return true;
}

function addStrike(maskedIp) {
  const now = Date.now();
  const s = strikes.get(maskedIp) || {count:0, firstTs:now};
  if (now - s.firstTs > STRIKE_WINDOW_MS) { s.count = 0; s.firstTs = now; }
  s.count++;
  strikes.set(maskedIp, s);
  if (s.count >= STRIKES_TO_BAN) {
    bans.set(maskedIp, now + BAN_DURATION_MS);
    return { banned: true };
  }
  return { banned: false, strikes: s.count };
}

function logModeration(evt, maskedIp, extra = "") {
  const line = `${new Date().toISOString()},${evt},${maskedIp},${extra}\n`;
  try { fs.appendFile('/var/log/legalshufflecam/moderation.log', line, ()=>{}); } catch {}
}
