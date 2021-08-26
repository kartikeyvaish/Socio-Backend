const FirebaseApp = require("./Firebase");
const config = require("./Configurations");

const SendPushNotification = async ({
  PushToken = null,
  Data = null,
  notification = null,
  channel_id = "SocioDefault",
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
      android: {
        notification: {
          channel_id: channel_id,
        },
      },
      data: Data,
    };

    const response = await FirebaseApp.messaging().send(message);

    return { status: 200, data: response };
  } catch (error) {
    return { status: 501, data: config.messages.serverError };
  }
}; // Push Notify a particular user

const SendGenericNotification = async ({ PushTokens = null, Data = null }) => {
  try {
    if (PushTokens === null || PushTokens.length === 0)
      return { status: 403, data: "Push Token is required" };

    if (Data === null) return { status: 403, data: "Data is required" };

    if (Array.isArray(PushTokens) === false)
      return {
        status: 403,
        data: "Push Token must be an array of Push tokens",
      };

    if (typeof Data !== "object")
      return { status: 403, data: "Data must be a valid object" };

    let message = {
      data: Data,
      tokens: PushTokens,
    };

    const response = await FirebaseApp.messaging().sendMulticast(message);

    return { status: 200, data: response };
  } catch (error) {
    return { status: 501, data: config.messages.serverError };
  }
}; // Single Messsage but different many tokens

const BatchPush = async ({ Messages = null }) => {
  try {
    if (Messages === null || Array.isArray(Messages) === false)
      return {
        status: 403,
        data: "Messages Should be an array of objects containing Data and Token",
      };

    if (Messages.length === 0)
      return { status: 403, data: "Messages should not be empty" };

    const response = await FirebaseApp.messaging().sendAll(Messages);

    return { status: 200, data: response };
  } catch (error) {
    return { status: 501, data: config.messages.serverError };
  }
}; // An array of Push messages with data and token individually

exports.SendPushNotification = SendPushNotification;
exports.SendGenericNotification = SendGenericNotification;
exports.BatchPush = BatchPush;
