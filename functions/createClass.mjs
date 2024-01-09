// Import Firebase Admin SDK
import admin, { app } from 'firebase-admin';
require ('dotenv').config();

const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

export async function handler(event, context) {
    try {

        const { uid, className, classDesc } = JSON.parse(event.body);

        if (!uid || !className) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required parameters' }),
            };
        }

        const classesCollection = admin.firestore().collection('Classes');

        const timestamp = admin.firestore.FieldValue.serverTimestamp();
        const newClassRef = await classesCollection.add({
            className: className,
            classDesc: classDesc || '',
            teacherId: uid,
            students: [],
            createdAt: timestamp,
        })

        // now, add class to teacher's classes list
        const teacherRef = admin.firestore().collection('Teachers').doc(uid);
        
        const teacherDoc = await teacherRef.get();

        if (teacherDoc.exists) {
            const teacherData = teacherDoc.data();
            currentClasses = teacherData.classes || [];
        }

        // check if teacher has too many classes
        if (currentClasses.length >= 20) {
            return {
                statusCode: 403,
                body: JSON.stringify({ error: 'Teacher has too many classes' }),
            }
        }

        currentClasses.push(newClassRef.id);

        await teacherRef.update({
            classes: currentClasses
        })

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Class created and added to teacher successfully."}),
        };
    } catch (error) {
        // Return error response if user creation fails
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
}