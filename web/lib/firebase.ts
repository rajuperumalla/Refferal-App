import { initializeApp, getApps, getApp as _getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, collection, query, where, limit, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export const firebaseConfig = {
  apiKey:            'AIzaSyDDz9KIuH4iCan7GqVvcjgImawUMg3wjlQ',
  authDomain:        'xlcare-partner.firebaseapp.com',
  projectId:         'xlcare-partner',
  storageBucket:     'xlcare-partner.firebasestorage.app',
  messagingSenderId: '269800696958',
  appId:             '1:269800696958:web:cc94ebcb99bb59fb4f7c2f',
  measurementId:     'G-BH9CB8NVQG',
};

function getOrInit(name?: string): FirebaseApp {
  const n = name ?? '[DEFAULT]';
  return getApps().find(a => a.name === n) ??
    (name ? initializeApp(firebaseConfig, name) : initializeApp(firebaseConfig));
}

export const app       = getOrInit();
export const db        = getFirestore(app);
export const auth      = getAuth(app);

// Secondary app — used only for agent/manager phone OTP verification.
// Keeps admin's own auth session untouched.
export function getVerifyAuth() {
  return getAuth(getOrInit('otp-verify'));
}

// ── Admin profile seed ────────────────────────────────────────────────────────
// Creates the admin Firestore profile for 9182799751 if it doesn't exist yet.
// Call once on admin portal boot.
export async function ensureAdminProfile() {
  const PHONE  = '+91 91827 99751';
  const DOC_ID = 'ADMIN001';
  try {
    const q = query(collection(db, 'agents'), where('phone', '==', PHONE), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) return; // already exists
    await setDoc(doc(db, 'agents', DOC_ID), {
      name:           'System Admin',
      phone:          PHONE,
      role:           'admin',
      status:         'active',
      agentId:        DOC_ID,
      commissionRate: 0,
      email:          '',
      city:           'Hyderabad',
      state:          'Telangana',
      createdAt:      serverTimestamp(),
    });
  } catch {
    // Fail silently — app still works without the seed
  }
}

// ── Firestore helpers ─────────────────────────────────────────────────────────
export { doc, setDoc, collection, serverTimestamp };
export type { FirebaseApp };
