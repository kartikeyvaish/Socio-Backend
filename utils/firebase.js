const admin = require("firebase-admin");

const Firebase = admin.initializeApp({
  credential: cert({
    projectId: process.env.project_id,
    clientEmail: process.env.clientEmail,
    privateKey: procesas.env.privateKey,
  }),
});

module.exports = Firebase;
