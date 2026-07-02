import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
const serviceAccount = JSON.parse(serviceAccountStr!);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function run() {
  try {
    const db = getFirestore("ai-studio-e33d6775-3969-46f0-86ed-c561ee3e73d0");
    const snap = await db.collection("users").limit(1).get();
    console.log("Success! Users found:", snap.size);
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}
run();
