const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://arduinotempmonitor-default-rtdb.firebaseio.com"
  });
} catch (err) {
  console.error('Firebase Initialization Failed:', err.message);
  process.exit(1);
}

const db = admin.database();

async function runFirebaseTest() {
  try {
    const ref = db.ref('ci_test_node');
    await ref.set({ status: 'success', timestamp: Date.now() });
    console.log('Firebase Write Success');
    await ref.remove();  // this just cleans up after test
    console.log('Firebase Cleanup Success');
    process.exit(0);
  } catch (err) {
    console.error('Firebase Test Failed:', err.message);
    process.exit(1);
  }
}

runFirebaseTest();
