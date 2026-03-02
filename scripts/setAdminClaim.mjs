import fs from 'node:fs';
import admin from 'firebase-admin';

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT;
const adminEmail = process.env.ADMIN_EMAIL;

if (!serviceAccountPath) {
  throw new Error('Set FIREBASE_SERVICE_ACCOUNT to your service account JSON path.');
}
if (!adminEmail) {
  throw new Error('Set ADMIN_EMAIL to the admin user email.');
}

const raw = fs.readFileSync(serviceAccountPath, 'utf8');
const serviceAccount = JSON.parse(raw);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const user = await admin.auth().getUserByEmail(adminEmail);
await admin.auth().setCustomUserClaims(user.uid, { admin: true });

console.log(`Admin claim set for ${adminEmail} (${user.uid}).`);
