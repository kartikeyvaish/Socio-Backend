const admin = require("firebase-admin");

var serviceAccount = require("./SocioFirebaseSDK.json");

const Firebase = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = Firebase;
