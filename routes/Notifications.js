// package and other modules
const express = require("express");

// static imports
const { AdminAuth, UserAuth } = require("../schemas/Auth");
const { notifications } = require("../models/Notifications");
const messages = require("../config/messages");
const { requests } = require("../models/Requests");
const { SendPushNotification } = require("../utils/push_notifications");

// Initialize router
const router = express.Router();

// Get List of all notifications in Database
router.get("/get-all-notifications-list", AdminAuth, async (req, res) => {
  try {
    const notificationsList = await notifications.find();

    return res.status(200).send({ Notification: notificationsList });
  } catch (error) {
    return res.status(500).send(messages.serverError);
  }
});

// Get List of all notifications for a specific user
router.get("/get-notifications-user", UserAuth, async (req, res) => {
  try {
    const notificationsList = await notifications.aggregate([
      // mathcing the user_details._id with notify_to
      {
        $match: {
          notify_to: req.body.user_details._id,
        },
      },
      // Get the user details of the user who is sending the notification
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "notified_by",
        },
      },
      // Change notified_by to an object
      {
        $unwind: {
          path: "$notified_by",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Get Post Details
      {
        $lookup: {
          from: "posts",
          localField: "post_id",
          foreignField: "_id",
          // Get only preview_file and _id of post
          as: "post_details",
        },
      },
      // If notification is a comment then include comment details
      {
        $lookup: {
          from: "comments",
          localField: "operation_type_id",
          foreignField: "_id",
          // Get only comment_text and _id of comment
          as: "comment_details",
        },
      },
      // Change the comment_details to object
      {
        $unwind: {
          path: "$comment_details",
          preserveNullAndEmptyArrays: true,
        },
      },
      // change post_details to an object
      {
        $unwind: {
          path: "$post_details",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Remove unneccesary fields
      {
        $project: {
          post_id: 0,
          notify_to: 0,
          __v: 0,
          operation_type_id: 0,
        },
      },
    ]);

    // Get count of follow request sent to user_details._id and also add a field for the first item in the array
    const followRequests = await requests.aggregate([
      // mathcing the user_details._id
      {
        $match: {
          request_sent_to: req.body.user_details._id,
        },
        // Get the user details of the user
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user_details",
        },
      },
      // Change user_details to an object
      {
        $unwind: {
          path: "$user_details",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Remove unneccesary fields
      {
        $project: {
          user_id: 0,
          request_sent_to: 0,
          __v: 0,
        },
      },
    ]);

    return res.status(200).send({
      Notifications: notificationsList,
      FollowRequestsCount: followRequests.length,
      PreviewRequestPicture:
        followRequests.length > 0
          ? followRequests[0].user_details.ProfilePicture
          : null,
    });
  } catch (error) {
    return res.status(500).send(messages.serverError);
  }
});

router.post("/send-push-notification", AdminAuth, async (req, res) => {
  try {
    const notificationResponse = await SendPushNotification(req.body);
    return res
      .status(notificationResponse.status)
      .send(notificationResponse.data);
  } catch (error) {
    return res.status(500).send("Error");
  }
});

// export router
module.exports = router;
