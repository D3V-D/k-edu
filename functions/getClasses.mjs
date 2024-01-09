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

        const { uid } = JSON.parse(event.body);

        if (!uid) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required parameters' }),
            };
        }

        const classesCollection = admin.firestore().collection('Classes');
        const teachersClasses = await classesCollection.where('teacherId', '==', uid).get();

        if (teachersClasses.empty) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'No classes found' }),
            };
        }

        // make an array
        let classes = teachersClasses.docs.map((doc) => doc.data());

        // include classId 
        for (let i = 0; i < classes.length; i++) {
            classes[i].classId = teachersClasses.docs[i].id
        }

        // order classes by createdAt (newest first)
        classes.sort((a, b) => b.createdAt - a.createdAt);

        return {
            statusCode: 200,
            body: JSON.stringify(classes),
        };
    } catch (error) {
        console.error(error);
        // Return error response if user creation fails
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
}   