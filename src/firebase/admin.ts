import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let app: App;
let db: Firestore;

// Hardcoded Firebase Service Account
// To get your service account key:
// 1. Go to Firebase Console: https://console.firebase.google.com/
// 2. Select project: sabpepgs
// 3. Project Settings > Service Accounts
// 4. Generate New Private Key
// 5. Replace the values below
const FIREBASE_CONFIG = {
    projectId: "sabpepgs",
    // Add your private key here from the service account JSON
    privateKey: "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n",
    clientEmail: "firebase-adminsdk-xxxxx@sabpepgs.iam.gserviceaccount.com",
};

// Initialize Firebase Admin
function initializeFirebaseAdmin() {
    if (getApps().length === 0) {
        try {
            // Try with hardcoded credentials first
            if (FIREBASE_CONFIG.privateKey !== "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n") {
                app = initializeApp({
                    credential: cert({
                        projectId: FIREBASE_CONFIG.projectId,
                        privateKey: FIREBASE_CONFIG.privateKey,
                        clientEmail: FIREBASE_CONFIG.clientEmail,
                    }),
                });
                console.log("Firebase initialized with hardcoded credentials");
            } else {
                // Fallback: Try with default credentials (works in Cloud Run, GCP environments)
                app = initializeApp({
                    projectId: FIREBASE_CONFIG.projectId,
                });
                console.log("Firebase initialized with default credentials");
            }
        } catch (error) {
            console.error("Firebase initialization error:", error);
            // Last resort: initialize with just project ID
            app = initializeApp({
                projectId: FIREBASE_CONFIG.projectId,
            });
            console.log("Firebase initialized with project ID only");
        }

        db = getFirestore(app);
    } else {
        app = getApps()[0];
        db = getFirestore(app);
    }

    return db;
}

export function getAdminDb(): Firestore {
    if (!db) {
        return initializeFirebaseAdmin();
    }
    return db;
}

