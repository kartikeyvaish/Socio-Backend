const FirebaseApp = require("./firebase");

const messages = require("../config/messages");

const SendPushNotification = async ({
  PushToken = null,
  data = null,
  title,
  body,
  channelId = "SocioDefault",
  imageUrl = null,
}) => {
  try {
    if (PushToken === null || PushToken.length === 0)
      return { status: 403, data: "Push Token is required" };

    const response = await FirebaseApp.messaging().send({
      token: PushToken,
      // notification: notification,
      notification: {
        title: title,
        body: body,
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
      ...(data && {
        data: {
          ...data,
          // include imageUrl only if its not null
          ...(imageUrl && {
            bigPictureUrl: imageUrl,
            largeIconUrl: imageUrl,
          }),
        },
      }),
    });

    return { status: 200, data: response };
  } catch (error) {
    console.log(error);
    return { status: 501, data: messages.serverError };
  }
}; // Push Notify a particular user

exports.SendPushNotification = SendPushNotification;
