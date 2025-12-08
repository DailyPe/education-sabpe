import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let app: App;
let db: Firestore;

// Initialize Firebase Admin
function initializeFirebaseAdmin() {
    if (getApps().length === 0) {
        // For local development or if service account JSON is available
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            app = initializeApp({
                credential: cert(serviceAccount),
                projectId: 'sabpepgs',
            });
        }
        // For production with individual environment variables
        else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
            app = initializeApp({
                credential: cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                }),
            });
        }
        // For Cloud Run or environments with default credentials
        else {
            app = initializeApp({
                projectId: 'sabpepgs',
            });
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

