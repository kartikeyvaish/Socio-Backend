const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.googleApiClientID);

async function VerifyTokenID(token) {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.googleApiClientID,
  });

  return ticket;
}

exports.VerifyTokenID = VerifyTokenID;
