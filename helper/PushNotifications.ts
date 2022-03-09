// Packages Imports  
import FirebaseApp from "../utils/Firebase";
import messages from "../config/messages";
import users from "../models/users";

const SendPushNotification = async ({
    push_token = null,
    data = {},
    title,
    body,
    channelId = process.env.default_channel_id,
    imageUrl = null,
}) => {
    try {
        if (push_token === null || push_token.length === 0)
            return { status: 403, data: "Push Token is required", ok: false };

        const response = await FirebaseApp.messaging().send({
            token: push_token,
            notification: {
                title: title,
                body: body,
                ...(imageUrl && {
                    imageUrl: imageUrl,
                }),
            },
            android: {
                notification: {
                    channelId: channelId,
                    // include imageUrl only if its not null
                    ...(imageUrl && {
                        imageUrl: imageUrl,
                    }),
                },
            },
            data: {
                ...data,
                // include imageUrl only if its not null
                ...(imageUrl && {
                    bigPictureUrl: imageUrl,
                    largeIconUrl: imageUrl,
                }),
            },
        });

        return { status: 200, data: response, ok: true };
    } catch (error) {
        return { status: 501, data: messages.serverError, ok: false };
    }
}; // Push Notify a particular user 

// Send a Push notification to a user if he/she has allowed it
export async function send_push_to_user(user_id, body) {
    try {
        // Get user who posted the product
        const user = await users.findById(user_id);

        if (!user) return;

        if (!user.allow_push_notification) return;

        let notification_payload = {
            push_token: user.push_notification_token,
            ...body,
        };


        const response = await SendPushNotification(notification_payload);

        return response;
    } catch (error) {
    }
}

