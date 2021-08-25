const express = require("express");
const router = express.Router();

const config = require("../config/Configurations");

const { Helper } = require("../config/Helper");
const { SendPushNotification } = require("../config/PushNotifications");
const { Followers } = require("../models/Followers");
const { Following } = require("../models/Following");
const { Requests } = require("../models/Requests");
const { Users } = require("../models/Users");

const { CheckAdminAccess, CheckAuthToken } = Helper;
const BaseURL = process.env.BaseURL;

router.get("/get-all-requests", CheckAdminAccess, async (req, res) => {
  try {
    const requests = await Requests.find();
    return res
      .status(200)
      .send({ RequestsCount: requests.length, Requests: requests });
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.get("/get-all-requests-for-user", CheckAuthToken, async (req, res) => {
  try {
    const requests = await Requests.find({
      "RequestedTo.UserID": req.body.CalledBy._id,
    });

    return res
      .status(200)
      .send({ RequestsCount: requests.length, Requests: requests });
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.post("/send-follow-request", CheckAuthToken, async (req, res) => {
  try {
    if (req.body.SendRequestTo.toString() === req.body.CalledBy._id.toString())
      return res.status(403).send("Cannot Send Follow Request to yourself");

    const UserOne = await Users.findOne({ _id: req.body.CalledBy._id });
    if (!UserOne) return res.status(404).send(config.messages.accountMissing);

    const UserTwo = await Users.findOne({ _id: req.body.SendRequestTo });
    if (!UserTwo) return res.status(404).send(config.messages.accountMissing);

    const checkFollowers = await Followers.findOne({
      FollowerOf: req.body.SendRequestTo,
      UserID: req.body.CalledBy._id,
    });

    if (checkFollowers)
      return res.status(403).send("You already follow this user.");

    const checkRequests = await Requests.findOne({
      "RequestedBy.UserID": UserOne._id,
      "RequestedTo.UserID": UserTwo._id,
    });

    if (checkRequests)
      return res.status(403).send("You already sent a request to this user");

    const checkCameRequests = await Requests.findOne({
      "RequestedTo.UserID": UserOne._id,
      "RequestedBy.UserID": UserTwo._id,
    });

    if (checkCameRequests)
      return res
        .status(403)
        .send("You already sent have a pending request from this user.");

    if (UserTwo.Private === false) {
      const checkIfFollower = await Followers.findOne({
        UserID: UserOne._id,
        FollowerOf: UserTwo._id,
      });
      if (!checkIfFollower) {
        const newFollower = new Followers({
          UserID: UserOne._id,
          Username: UserOne.Username,
          Name: UserOne.Name,
          ProfilePicture: UserOne.ProfilePicture,
          FollowerOf: UserTwo._id,
        });

        await newFollower.save();
      }

      const checkIfFollowing = await Following.findOne({
        UserID: UserTwo._id,
        FollowingOf: UserOne._id,
      });
      if (!checkIfFollowing) {
        const newFollowing = new Following({
          UserID: UserTwo._id,
          Username: UserTwo.Username,
          Name: UserTwo.Name,
          ProfilePicture: UserTwo.ProfilePicture,
          FollowingOf: UserOne._id,
        });

        await newFollowing.save();
      }

      return res.send("Request Sent");
    }

    const newRequest = new Requests({
      RequestedBy: {
        UserID: UserOne._id,
        Username: UserOne.Username,
        Name: UserOne.Name,
        ProfilePicture: UserOne.PicURL,
      },
      RequestedTo: {
        UserID: UserTwo._id,
        Username: UserTwo.Username,
        Name: UserTwo.Name,
        ProfilePicture: UserTwo.PicURL,
      },
    });

    if (UserTwo.PushToken) {
      await SendPushNotification({
        PushToken: UserTwo.PushToken,
        Data: {
          showInForeGround: "false",
          GoTo: "FollowRequests",
        },
        notification: {
          body: `${UserOne.Username} has sent you a follow request.`,
          title: "Socio",
          image: BaseURL + UserOne.PicURL,
        },
      });
    }

    await newRequest.save();

    return res.send("Request Sent");
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.post("/delete-follow-request", CheckAuthToken, async (req, res) => {
  try {
    const checkRequests = await Requests.findOne({ _id: req.body.RequestID });
    if (!checkRequests) return res.status(403).send("Request not Found");

    await checkRequests.delete();

    return res.send("Request Deleted");
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.post("/accept-follow-request", CheckAuthToken, async (req, res) => {
  try {
    const checkRequests = await Requests.findOne({ _id: req.body.RequestID });
    if (!checkRequests) return res.status(403).send("Request not Found");

    let UserOne = checkRequests.RequestedBy;
    let UserTwo = checkRequests.RequestedTo;

    const checkFollowers = await Followers.findOne({
      FollowerOf: UserTwo.UserID,
      UserID: UserOne.UserID,
    });
    if (checkFollowers)
      return res.status(403).send("You already follow this user.");

    const newFollower = new Followers({
      UserID: UserOne.UserID,
      Username: UserOne.Username,
      Name: UserOne.Name,
      ProfilePicture: UserOne.ProfilePicture,
      FollowerOf: UserTwo.UserID,
    });

    const checkFollowing = await Following.findOne({
      FollowingOf: UserOne.UserID,
      UserID: UserTwo.UserID,
    });
    if (!checkFollowing) {
      const newFollowing = new Following({
        UserID: UserTwo.UserID,
        Username: UserTwo.Username,
        Name: UserTwo.Name,
        ProfilePicture: UserTwo.ProfilePicture,
        FollowingOf: UserOne.UserID,
      });
      await newFollowing.save();
    }

    await newFollower.save();
    await checkRequests.delete();

    const checkRequestedUser = await Users.findOne({
      _id: UserOne.UserID,
    });

    const checkAccpetedUser = await Users.findOne({
      _id: UserTwo.UserID,
    });

    if (checkRequestedUser) {
      if (checkRequestedUser.PushToken) {
        await SendPushNotification({
          PushToken: checkRequestedUser.PushToken,
          Data: {
            showInForeGround: "false",
            GoTo: "PersonProfile",
            Params: JSON.stringify({
              _id: UserTwo.UserID,
            }),
          },
          notification: {
            body: `${UserTwo.Username} has accepted your follow request.`,
            title: "Socio",
            image: BaseURL + checkAccpetedUser.PicURL,
          },
        });
      }
    }

    return res.send(`You now follow ${UserTwo.Name}`);
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.post("/unfollow-a-user", CheckAuthToken, async (req, res) => {
  try {
    const checkFollowers = await Followers.findOne({
      UserID: req.body.CalledBy._id,
      FollowerOf: req.body.Unfollow,
    });

    if (checkFollowers) {
      await checkFollowers.delete();
    }

    const checkFollowing = await Following.findOne({
      UserID: req.body.Unfollow,
      FollowingOf: req.body.CalledBy._id,
    });

    if (checkFollowing) {
      await checkFollowing.delete();
    }

    return res.send(`You have unfollowed`);
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.post("/remove-from-my-followers", CheckAuthToken, async (req, res) => {
  try {
    let name = "";
    const checkFollowers = await Followers.findOne({
      FollowerOf: req.body.CalledBy._id,
      UserID: req.body.Remove,
    });

    if (checkFollowers) {
      name = checkFollowers.Name;
      await checkFollowers.delete();
    }

    const checkFollowing = await Following.findOne({
      FollowingOf: req.body.Remove,
      UserID: req.body.CalledBy._id,
    });

    if (checkFollowing) {
      await checkFollowing.delete();
    }

    return res.send(`You have removed ${name} from your followers`);
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.get("/get-users-followers-list", CheckAuthToken, async (req, res) => {
  try {
    if (req.query?.user_id) {
      const followersList = await Followers.find({
        FollowerOf: req.query?.user_id.toString(),
      });
      return res.send(followersList);
    }

    return res.status(404).send("User ID is required");
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.get("/get-users-following-list", CheckAuthToken, async (req, res) => {
  try {
    if (req.query?.user_id) {
      const followingList = await Following.find({
        FollowingOf: req.query?.user_id.toString(),
      });
      return res.send(followingList);
    }

    return res.status(404).send("User ID is required");
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

module.exports = router;
