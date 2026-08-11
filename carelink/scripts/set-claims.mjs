// Assign CareLink role claims to a Firebase Auth user.
//
// Custom claims are the source of truth for RBAC and can ONLY be set from a
// trusted server environment with the Admin SDK — never from the browser.
//
// Setup:
//   npm i -D firebase-admin
//   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
//
// Usage:
//   node scripts/set-claims.mjs <email> facility --facilityId fac_riverside
//   node scripts/set-claims.mjs <email> driver   --driverId drv_martinez
//   node scripts/set-claims.mjs <email> ceo
//
// The user must sign out / refresh their ID token for new claims to take effect.

import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const [, , email, role, ...rest] = process.argv;

const VALID_ROLES = new Set(["facility", "driver", "ceo"]);

if (!email || !role || !VALID_ROLES.has(role)) {
  console.error(
    "Usage: node scripts/set-claims.mjs <email> <facility|driver|ceo> [--facilityId <id>] [--driverId <id>]",
  );
  process.exit(1);
}

function readFlag(name) {
  const idx = rest.indexOf(`--${name}`);
  return idx >= 0 ? rest[idx + 1] : undefined;
}

const claims = { role };
if (role === "facility") {
  const facilityId = readFlag("facilityId");
  if (!facilityId) {
    console.error("Facility users require --facilityId <id>");
    process.exit(1);
  }
  claims.facilityId = facilityId;
}
if (role === "driver") {
  const driverId = readFlag("driverId");
  if (!driverId) {
    console.error("Driver users require --driverId <id>");
    process.exit(1);
  }
  claims.driverId = driverId;
}

initializeApp({ credential: applicationDefault() });

const auth = getAuth();
const user = await auth.getUserByEmail(email);
await auth.setCustomUserClaims(user.uid, claims);

console.log(`Set claims for ${email} (${user.uid}):`, claims);
console.log("The user must refresh their ID token (re-login) to pick these up.");
