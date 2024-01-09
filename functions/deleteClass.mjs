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

        const { uid, classId } = JSON.parse(event.body);

        if (!uid || !classId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required parameters' }),
            };
        }

        const classRef = admin.firestore().collection('Classes').doc(classId);
        const classDoc = await classRef.get();

        if (!classDoc.exists) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Class not found' }),
            };
        }

        const classData = classDoc.data();

        if (!classData.teacherId || classData.teacherId !== uid) {
            return {
                statusCode: 403,
                body: JSON.stringify({ error: 'Unauthorized to delete this class' }),
            };
        }

        await classRef.delete();

        // now, remove class from teacher's classes list
        const teacherRef = admin.firestore().collection('Teachers').doc(uid);
        const teacherDoc = await teacherRef.get();

        if (!teacherDoc.exists) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Teacher not found' }),
            }
        }

        const teacherData = teacherDoc.data();
        let currentClasses = teacherData.classes || [];

        const index = currentClasses.indexOf(classId);
        if (index !== -1) {
            currentClasses.splice(index, 1);
        }

        await teacherRef.update({
            classes: currentClasses
        })

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Class deleted successfully."}),
        };
    } catch (error) {
        // Return error response if user creation fails
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
}