const admin = require("firebase-admin");

let serviceAccount = require("../config/socio_firebasSDK.json");

const Firebase = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = Firebase;
