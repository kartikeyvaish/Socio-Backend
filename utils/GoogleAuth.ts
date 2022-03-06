// Packages ImportsF
import { OAuth2Client } from "google-auth-library";

// Initialize the client
const client = new OAuth2Client(process.env.webClientID);

// function to verify an ID token
export async function VerifyTokenID(token) {
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.webClientID
        });

        return {
            ok: true,
            ticket: ticket,
            message: "Ticket Verified",
        };
    } catch (error) {
        return {
            ok: false,
            message: "Some Error Occured",
            error: error,
        };
    }
}
