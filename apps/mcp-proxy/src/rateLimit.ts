import {
  initializeApp,
  getApps,
  cert,
  applicationDefault,
} from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const FREE_TIER_LIMIT = 10; // per month

function ensureFirebase() {
  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID || "demo-datalens";

    // Configure for emulator if FIRESTORE_EMULATOR_HOST is set
    if (process.env.FIRESTORE_EMULATOR_HOST) {
      initializeApp({ projectId });
      // The emulator host is already set in process.env
    } else if (
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.FIREBASE_CONFIG
    ) {
      initializeApp({ projectId });
    } else {
      // Use ADC if available, else initialize with project only (for emulator)
      try {
        initializeApp({ credential: applicationDefault(), projectId });
      } catch {
        initializeApp({ projectId });
      }
    }
  }
}

export type RateLimitResult = { allowed: boolean; remaining: number };

export async function enforceMonthlyRateLimit(
  bucketId: string
): Promise<RateLimitResult> {
  ensureFirebase();
  const db = getFirestore();
  const now = new Date();
  const monthKey = `${now.getUTCFullYear()}-${String(
    now.getUTCMonth() + 1
  ).padStart(2, "0")}`;
  const ref = db.doc(`usage/${bucketId}/months/${monthKey}`);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = (snap.exists && (snap.get("count") as number)) || 0;
    if (current >= FREE_TIER_LIMIT) {
      return; // do not increment beyond limit
    }
    tx.set(
      ref,
      {
        count: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });

  const snapAfter = await ref.get();
  const newCount =
    (snapAfter.exists && (snapAfter.get("count") as number)) || 0;
  return {
    allowed: newCount <= FREE_TIER_LIMIT,
    remaining: Math.max(FREE_TIER_LIMIT - newCount, 0),
  };
}
