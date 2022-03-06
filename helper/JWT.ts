// packages Imports
import jwt from "jsonwebtoken";

// function to encode a payload
function payloadEncode(payload: any) {
    // Return the encoded data
    return jwt.sign(payload, process.env.payload_key_creator);
}

// function to create access token
function createAccessToken(_id: any) {
    // return the encoded access token
    return jwt.sign({ _id }, process.env.access_token_key_creator, {
        expiresIn: "5m",
    });
}

// function to verify a authToken
async function access_token_validator(token: string) {
    return new Promise((resolve: any, reject: any): any => {
        jwt.verify(token, process.env.access_token_key_creator, (err, decoded) => {
            if (err) resolve({
                ok: false, error: {
                    name: err.name,
                    message: err.message,
                    status: 401,
                }
            });
            resolve({
                ok: true, decoded,
                status: 200, message: "Token Verified"
            });
        });
    });
}

// function to create refresh token
function createRefreshToken(_id: any) {
    // return the encoded refresh token
    return jwt.sign({ _id }, process.env.refresh_token_key_creator, {
        expiresIn: "7d",
    });
}

// function to verify a refreshToken
async function refresh_token_validator(token: string) {
    return new Promise((resolve: any, reject: any): any => {
        jwt.verify(token, process.env.refresh_token_key_creator, (err, decoded) => {
            if (err) resolve({
                ok: false, error: {
                    name: err.name,
                    message: err.message,
                    status: 401,
                }
            });
            resolve({
                ok: true, decoded,
                status: 200, message: "Token Verified"
            });
        });
    });
}



export default {
    access_token_validator,
    createAccessToken,
    createRefreshToken,
    refresh_token_validator,
    payloadEncode
}