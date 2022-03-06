// Packages Imports
import { omit } from "lodash";

// Local imports 
import JWT from "./JWT";
import { UploadFile, UploadRemoteFile } from "../utils/Cloudinary";

// function to get the user data while logging in
export function get_login_payload_data(user: any) {
    // Create payload
    const payload = omit(user.toObject(), [
        "password",
        "__v",
        "push_notification_token",
        "account_created_at",
        "account_updated_at",
        "last_updated_at",
    ]);

    return payload;
}

// encode the user data using JWT key
export function get_encoded_data(user: any) {
    // Create payload
    let payload = get_login_payload_data(user);

    const tokens = get_tokens(user._id);

    payload = { ...payload, ...tokens };

    // Return the encoded data
    return JWT.payloadEncode(payload);
}

// get tokens for an _id
export function get_tokens(_id: string) {
    let payload: any = {};

    payload.access_token = JWT.createAccessToken(_id);
    payload.refresh_token = JWT.createRefreshToken(_id);

    return payload;
}

// get refresh payload
export function get_refresh_payload(_id: any) {
    // Create payload
    const payload = get_tokens(_id);

    // Return the encoded data
    return JWT.payloadEncode(payload);
}

// upload profile picture
export function uploadProfilePicture(profile_picture: Buffer | string, destination: string) {
    if (!destination) return null;

    if (profile_picture instanceof Buffer) {
        const uploadResponse = UploadFile(profile_picture, destination);
        return uploadResponse;
    } else if (typeof profile_picture === "string") {
        const uploadResponse = UploadRemoteFile(profile_picture, destination);
        return uploadResponse;
    }

    return null;
}