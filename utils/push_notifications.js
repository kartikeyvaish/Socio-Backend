const FirebaseApp = require("./firebase");

const messages = require("../config/messages");

const SendPushNotification = async ({
  PushToken = null,
  Data = null,
  notification = null,
}) => {
  try {
    if (PushToken === null || PushToken.length === 0)
      return { status: 403, data: "Push Token is required" };

    if (Data === null) return { status: 403, data: "Data is required" };

    if (notification === null)
      return { status: 403, data: "notification is required" };

    if (typeof PushToken !== "string")
      return { status: 403, data: "Push Token must be a string" };

    if (typeof Data !== "object")
      return { status: 403, data: "Data must be a valid object" };

    if (typeof notification !== "object")
      return { status: 403, data: "notification must be a valid object" };

    let message = {
      token: PushToken,
      notification: notification,
      data: Data,
    };

    const response = await Firebase.messaging().send(message);

    return { status: 200, data: response };
  } catch (error) {
    return { status: 501, data: messages.serverError };
  }
}; // Push Notify a particular user

exports.SendPushNotification = SendPushNotification;
