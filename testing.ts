import admin from "firebase-admin";
try {
  admin.initializeApp();
  console.log("Success");
  const db = admin.firestore();
  db.collection("users").limit(1).get().then(snap => {
      console.log("Users size:", snap.size);
  }).catch(e => {
      console.log("DB Error:", e.message);
  });
} catch (e: any) {
  console.log("Error:", e.message);
}
