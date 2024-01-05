// signup.mjs

// Import Firebase Admin SDK
import admin from 'firebase-admin';
require ('dotenv').config();

// Initialize Firebase Admin SDK with service account credentials
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

export async function handler(event) {
  try {
    // Access request body parameters sent from the frontend
    const { email, password } = JSON.parse(event.body);

    // Create user using Firebase Admin SDK
    const userRecord = await admin.auth().createUser({
      email,
      password,
    });

    // Return success response if user creation is successful
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'User created successfully', user: userRecord.toJSON() }),
    };
  } catch (error) {
    // Return error response if user creation fails
    // if email already in use, will return the following:
    /**
     * 
     * Object { error: "The email address is already in use by another account." }
     */
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}

