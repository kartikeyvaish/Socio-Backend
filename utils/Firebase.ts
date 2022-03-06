import admin from "firebase-admin";

const Firebase = admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.projectId,
        clientEmail: process.env.clientEmail,
        privateKey: process.env.privateKey?.replace(/\\n/g, "\n"),
    }),
});

export default Firebase;
