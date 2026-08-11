/**
 * Firebase initialization.
 *
 * The app is designed to run in two modes:
 *  1. LIVE   — when all NEXT_PUBLIC_FIREBASE_* env vars are present, we init
 *              the real SDK and the data layer talks to Cloud Firestore.
 *  2. MOCK   — when config is absent (e.g. local preview / CI), the data layer
 *              falls back to seeded in-memory data. See lib/data/*.
 *
 * `isFirebaseConfigured` lets the data layer branch without throwing.
 */
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

function readConfig(): FirebaseWebConfig | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  if (
    !apiKey ||
    !authDomain ||
    !projectId ||
    !storageBucket ||
    !messagingSenderId ||
    !appId
  ) {
    return null;
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
}

const config = readConfig();

export const isFirebaseConfigured: boolean = config !== null;

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

if (config) {
  app = getApps().length ? getApp() : initializeApp(config);
  db = getFirestore(app);
  auth = getAuth(app);
}

export { app, db, auth };
