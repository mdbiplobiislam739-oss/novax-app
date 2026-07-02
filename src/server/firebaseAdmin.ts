import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin if Service Account is provided
export function initFirebaseAdmin() {
  let serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (!serviceAccountStr) {
    console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT not found in environment. Backend cannot securely update database for games.");
    return null;
  }

  try {
    if (!admin.apps.length) {
      // Fix if user pasted without curly braces
      let cleanStr = serviceAccountStr.trim();
      if (!cleanStr.startsWith("{")) cleanStr = "{" + cleanStr;
      if (!cleanStr.endsWith("}")) cleanStr = cleanStr + "}";
      cleanStr = cleanStr.replace(/}+$/, '}'); // remove multiple trailing braces

      const serviceAccount = JSON.parse(cleanStr);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    
    // In many AI studio apps, the database ID is ai-studio-something 
    return getFirestore(admin.app(), "(default)");
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    return null;
  }
}

export const adminDb = initFirebaseAdmin();
export { admin };
