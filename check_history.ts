import { adminDb } from './src/server/firebaseAdmin.ts';

async function check() {
  const historyRef = adminDb.collection('tradeHistory');
  const snapshot = await historyRef.orderBy('closeTime', 'desc').limit(5).get();
  snapshot.forEach(doc => {
    console.log(doc.id, '=>', doc.data());
  });
  
  const posRef = adminDb.collection('tradePositions');
  const posSnap = await posRef.get();
  console.log("Current positions:");
  posSnap.forEach(doc => {
    console.log(doc.id, '=>', doc.data());
  });
}

check().catch(console.error);
