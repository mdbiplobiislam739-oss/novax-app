import { adminDb } from "./src/server/firebaseAdmin.js";

async function run() {
  if (adminDb) {
     const snap = await adminDb.collection("users").limit(1).get();
     console.log("Found users:", snap.size);
     console.log("Service account works perfectly.");
  } else {
     console.log("Firebase Admin is NOT initialized.");
  }
}
run();
