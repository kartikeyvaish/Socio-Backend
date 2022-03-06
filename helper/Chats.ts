import { UploadFile } from "../utils/Cloudinary";

// Upload a file for a chat room and return a payload with desired format
export async function UploadChatFile(destination, buffer, mimeType) {
    try {
        const fileUploadResponse: any = await UploadFile(buffer, destination);

        if (fileUploadResponse?.secure_url) {
            let payload: any = {
                _id: fileUploadResponse.asset_id,
                uri: fileUploadResponse.secure_url,
                public_id: fileUploadResponse.public_id,
                width: fileUploadResponse.width,
                height: fileUploadResponse.height,
                mimeType: mimeType,
            };

            // If file type is audio, then add duration property to the payload
            if (mimeType?.slice(0, 5) !== "image")
                payload.duration = fileUploadResponse.duration * 1000;

            return { file: payload, message: "File upload Successfull", ok: true };
        } else {
            return { message: "File upload failed", ok: false };
        }
    } catch (error) {
        return { message: "File upload failed", ok: false };
    }
}