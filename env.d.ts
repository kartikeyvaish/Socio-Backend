declare namespace NodeJS {
    export interface ProcessEnv {
        NODE_ENV: "development" | "production" | "test";

        DB_PORT: number;

        atlas_url: string;
        compassURL: string;
        access_token_key_creator: string;
        refresh_token_key_creator: string;
        payload_key_creator: string;
        OTP_Email_Send_Key: string;
        SignUP_API_KEY: string;
        apiVersion: string;

        email: string;
        password: string;

        auth: string;
        posts: string;
        otp: string;
        people: string;
        stories: string;
        chats: string;

        CLOUDINARY_URL: string;
        CLOUDINARY_NAME: string;
        CLOUDINARY_API_KEY: string;
        CLOUDINARY_API_SECRET: string;

        default_profile_picture: string;
        default_channel_id: string;

        projectId: string;
        clientEmail: string;
        privateKey: string;

        googleApiClientID: string;
        webClientID: string;
    }
}