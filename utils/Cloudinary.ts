// Packages imports
import CLOUDINARY from "cloudinary";
import streamifier from "streamifier";

let cloudinary = CLOUDINARY.v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

// Upload file from remote
export const UploadRemoteFile = (url: any, folderName: string) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
            url,
            {
                folder: folderName,
                resource_type: "auto",
            },
            (error: any, result: any) => {
                if (result) resolve(result);
                else reject(error);
            }
        );
    });
};

// Upload a file to Cloudinary
export const UploadFile = (buffer: any, folderName: string) => {
    return new Promise((resolve, reject) => {
        let cloud_upload_stream = cloudinary.uploader.upload_stream(
            {
                folder: folderName,
                resource_type: "auto",
            },
            (error: any, result: any) => {
                if (result) resolve(result);
                else reject(error);
            }
        );

        streamifier.createReadStream(buffer).pipe(cloud_upload_stream);
    });
};

// Delete a folder from Cloudinary
export const DeleteAFolder = async (folderName: string) => {
    const deleteResponse = await cloudinary.api.delete_resources_by_prefix(folderName);

    return deleteResponse;
};

// Delete a file from Cloudinary
export const DeleteAFile = (public_id: string, mimeType: string) => {
    return new Promise((resolve, reject) => {
        cloudinary.api.delete_resources(
            [public_id],
            {
                resource_type: mimeType.slice(0, 5)
            },
            (error, result) => {
                if (result) {
                    resolve(result);
                } else {
                    reject(error);
                }
            }
        );
    });
};

export default cloudinary;