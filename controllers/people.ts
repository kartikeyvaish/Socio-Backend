// packages imports 
import { Request, Response } from "express";

// Local imports   
import followers from "../models/followers";
import following from "../models/following";
import followrequests from "../models/followrequests";
import users from "../models/users";

// get followers of a person
export async function GetFollowers(req: Request, res: Response) {
    try {
        const { user_id } = req.body;
        const current_user_id = req.body.user_details._id
        const isFetchingOwn = current_user_id.toString() === user_id.toString();

        // Check if user with user_id exists
        const user = await users.findById(user_id);
        if (!user) return res.status(404).send({ message: "User not found" });

        let followersInstance = await followers.findOne({ follower_of: user_id });

        const isProfilePrivate = user.private_profile;
        if (!isFetchingOwn && isProfilePrivate) {
            const isIncluded = followersInstance.people.findIndex(person => person.toString() === current_user_id.toString()) >= 0;
            if (!isIncluded)
                return res.status(403).send({ message: `This profile is private. Follow ${user.name} to see their follower's list` });
        }

        // get followers list with their details
        // go through followersInstance.people array and lookup for the details of user which are in this array
        const followersList = await users.aggregate([
            {
                $match: {
                    _id: { $in: followersInstance.people }
                }
            },
            // keep only the fields we need
            {
                $project: {
                    _id: 1,
                    name: 1,
                    username: 1,
                    profile_picture: 1,
                }
            }
        ]);

        return res.status(200).send({ message: "Followers fetched successfully", followers: followersList });
    } catch (error) {
        return res.status(500).send({ message: "Internal server error" });
    }
}

// get following of a person
export async function GetFollowing(req: Request, res: Response) {
    try {
        const { user_id } = req.body;
        const current_user_id = req.body.user_details._id
        const isFetchingOwn = current_user_id.toString() === user_id.toString();

        // Check if user with user_id exists
        const user = await users.findById(user_id);
        if (!user) return res.status(404).send({ message: "User not found" });

        let followingInstance = await following.findOne({ following_of: user_id });

        let otherUserFollowersInstance = await followers.findOne({ follower_of: user_id });

        const isProfilePrivate = user.private_profile;
        if (!isFetchingOwn && isProfilePrivate) {
            const isIncluded = otherUserFollowersInstance.people.findIndex(person => person.toString() === current_user_id.toString()) >= 0;
            if (!isIncluded)
                return res.status(403).send({ message: `This profile is private. Follow ${user.name} to see their follower's list` });
        }

        // get following list with their details
        // go through followingInstance.people array and lookup for the details of user which are in this array
        const followingList = await users.aggregate([
            {
                $match: {
                    _id: { $in: followingInstance.people }
                }
            },
            // keep only the fields we need
            {
                $project: {
                    _id: 1,
                    name: 1,
                    username: 1,
                    profile_picture: 1,
                }
            }
        ]);

        return res.status(200).send({ message: "Following fetched successfully", following: followingList });
    } catch (error) {
        return res.status(500).send({ message: "Internal server error" });
    }
}

// Follow or send follow request to a person
export async function Follow(req: Request, res: Response) {
    try {
        // if req.body.user_id and req.body.user_details._id are same then return error
        if (req.body.user_id.toString() == req.body.user_details._id.toString()) return res.status(400).send({ message: "You cannot follow yourself" });

        // check if user exist or not
        const user = await users.findById(req.body.user_id);
        if (!user) return res.status(404).send({ message: "User not found" });

        // find the followers instance
        let followersInstance = await followers.findOne({ follower_of: req.body.user_id });
        // if instance doesn't exist, create one
        if (!followersInstance) followersInstance = new followers({ follower_of: req.body.user_id });

        // Check if other user follows you
        const otherUserFollowingInstance = await following.findOne({ following_of: req.body.user_id });
        const user_follows_you = otherUserFollowingInstance.people.findIndex(person => person.toString() === req.body.user_details._id.toString()) >= 0;

        // find the current user's following instance
        let followingInstance = await following.findOne({ following_of: req.body.user_details._id });
        // if instance doesn't exist, create one
        if (!followingInstance) followingInstance = new following({ following_of: req.body.user_details._id });

        // check if user is already following or not
        const isFollowing = followersInstance.people.findIndex(person => person.toString() === req.body.user_details._id.toString());
        // check if user is already following or not
        const isFollowed = followingInstance.people.findIndex(person => person.toString() === req.body.user_id.toString());

        if (isFollowed >= 0 && isFollowing >= 0) {
            return res.status(400).send({
                message: "You are already following this person",
                you_follow_user: true,
                user_follows_you: user_follows_you
            });
        }

        // check profile privateness
        const isProfilePrivate = user.private_profile;

        // If profile is private then send follow request
        if (isProfilePrivate) {
            // check if request is already there or not
            const isRequestExist = await followrequests.findOne({ request_from: req.body.user_details._id, request_to: req.body.user_id });
            if (isRequestExist) return res.status(400).send({
                message: "You have already sent a follow request to this person",
                you_sent_request: true, you_sent_request_id: isRequestExist._id
            });

            const checkRequestCame = await followrequests.findOne({ request_from: req.body.user_id, request_to: req.body.user_details._id });
            if (checkRequestCame) return res.status(400).send({
                message: "You have already received a follow request from this person",
                user_sent_request: true, user_sent_request_id: checkRequestCame._id
            });

            // Create request
            const newRequest = new followrequests({ request_from: req.body.user_details._id, request_to: req.body.user_id });

            // save the request
            await newRequest.save();
            // response
            return res.send({
                message: `Follow request sent to ${user.name}.`,
                you_follow_user: false, user_follows_you: user_follows_you,
                you_sent_request: true, you_sent_request_id: newRequest._id
            });
        }
        // otherwise add the person to followers list
        else {
            // Add person to followers list
            followersInstance.people.push(req.body.user_details._id);
            // add person to following list
            followingInstance.people.push(req.body.user_id);
            // save the followers instance
            await followersInstance.save();
            // save the following instance
            await followingInstance.save();
            // send response
            return res.send({ message: `You are now following ${user.name}`, you_follow_user: true, user_follows_you: user_follows_you });
        }
    } catch (error) {
        return res.status(500).send({ message: "Internal server error" });
    }
}

// Accept a follow request from a person
export async function AcceptFollowRequest(req: Request, res: Response) {
    try {
        const accpeting_user = req.body.user_details._id;
        const request_id = req.body.request_id;

        // check if followrequest instance exist or not
        const followRequest = await followrequests.findById(request_id);
        if (!followRequest) return res.status(404).send({ message: "Follow request not found" });

        // get the user who sent the request
        const request_from = followRequest.request_from;

        // Check if accpepting user and current user is not same
        if (accpeting_user.toString() === request_from.toString())
            return res.status(403).send({ message: "You cannot accept your own request" });

        // check if accepting user is same as request_to
        if (accpeting_user.toString() !== followRequest.request_to.toString())
            return res.status(403).send({ message: "You cannot accept this request" });

        // check if user exist or not
        const user = await users.findById(request_from);
        if (!user) return res.status(404).send({ message: "User not found" });

        let currentFollowing = await following.findOne({ following_of: accpeting_user });
        if (!currentFollowing) {
            currentFollowing = new following({ following_of: accpeting_user });
            await currentFollowing.save();
        }
        // Check if  user who made the call is following the person
        const currentFollowsUser = currentFollowing.people.findIndex(person => person.toString() === request_from.toString()) >= 0;

        // find the followers instance
        let followersInstance = await followers.findOne({ follower_of: accpeting_user }); // Instance of User B that has list of people that follows B
        // if instance doesn't exist, create one
        if (!followersInstance) followersInstance = new followers({ follower_of: accpeting_user });
        // find the current user's following instance
        let followingInstance = await following.findOne({ following_of: request_from }); // Instance of User A that has list of people that A follows to.
        // if instance doesn't exist, create one
        if (!followingInstance) followingInstance = new following({ following_of: request_from });

        // check if user already is there in followers list
        const isFollowing = followersInstance.people.findIndex(person => person.toString() === request_from.toString());
        if (isFollowing < 0) {
            // add person to followers list
            followersInstance.people.push(request_from);
        }

        // check if user already is there in following list
        const isFollowed = followingInstance.people.findIndex(person => person.toString() === accpeting_user.toString());
        if (isFollowed < 0) {
            // add person to following list
            followingInstance.people.push(accpeting_user);
        }

        // save the followers instance
        await followersInstance.save();
        // save the following instance
        await followingInstance.save();

        // delete the request
        await followRequest.delete();

        // response
        return res.send({
            message: "Follow Request Accepted",
            current_user_followers_count: followersInstance.people.length,
            you_follow_user: currentFollowsUser,
            user_follows_you: true,
            user_sent_request: false,
            you_sent_request: false
        });
    } catch (error) {
        return res.status(500).send({ message: "Internal server error" });
    }
}

// Delete a follow request from a person
export async function DeleteFollowRequest(req: Request, res: Response) {
    try {
        const deleting_user = req.body.user_details._id;
        const request_id = req.body.request_id;

        // check if followrequest instance exist or not
        const followRequest = await followrequests.findById(request_id);
        if (!followRequest) return res.status(404).send({ message: "Follow request not found" });

        // get the user who sent the request
        const request_from = followRequest.request_from;
        const request_to = followRequest.request_to;

        // Check if accpepting user and current user is not same
        if (deleting_user.toString() !== request_from.toString() && deleting_user.toString() !== request_to.toString())
            return res.status(403).send({ message: "You cannot delete this request" });

        // delete the request
        await followRequest.delete();

        // response
        return res.send({ message: "Follow Request Deleted" });
    } catch (error) {
        return res.status(500).send({ message: "Internal server error" });
    }
}

// Unfollow a person
export async function Unfollow(req: Request, res: Response) {
    try {
        const unfollowing_user = req.body.user_details._id;
        const unfollowed_user = req.body.user_id;

        // check if unfollowing user and current user is not same
        if (unfollowing_user.toString() === unfollowed_user.toString())
            return res.status(403).send({ message: "You cannot unfollow yourself" });

        // check if user exist or not
        const user = await users.findById(unfollowed_user);
        if (!user) return res.status(404).send({ message: "User not found" });

        let currentUserFollowing = await following.findOne({ following_of: unfollowed_user });
        if (!currentUserFollowing) {
            currentUserFollowing = new following({ following_of: unfollowed_user });
            await currentUserFollowing.save();
        }

        // check if the user whom I am unfollowing is following me or not
        const currentFollowsUser = currentUserFollowing.people.findIndex(person => person.toString() === unfollowing_user.toString()) >= 0;

        // find the followers instance
        let followersInstance = await followers.findOne({ follower_of: unfollowed_user }); // Instance of User B that has list of people that follows B
        // if instance doesn't exist, create one
        if (!followersInstance) followersInstance = new followers({ follower_of: unfollowed_user });
        // find the current user's following instance
        let followingInstance = await following.findOne({ following_of: unfollowing_user }); // Instance of User A that has list of people that A follows to.
        // if instance doesn't exist, create one
        if (!followingInstance) followingInstance = new following({ following_of: unfollowing_user });

        // check if user is there in followers list
        const isFollowing = followersInstance.people.findIndex(person => person.toString() === unfollowing_user.toString());
        // remove person from followers list if found
        if (isFollowing >= 0) followersInstance.people.splice(isFollowing, 1);

        // check if user is there in following list
        const isFollowed = followingInstance.people.findIndex(person => person.toString() === unfollowed_user.toString());
        // remove person from following list if found
        if (isFollowed >= 0) followingInstance.people.splice(isFollowed, 1);

        // save the followers instance
        await followersInstance.save();
        // save the following instance
        await followingInstance.save();

        // response
        return res.send({
            message: `You no longer follow ${user.name}.`,
            current_user_following_count: followingInstance.people.length,
            you_follow_user: false,
            user_follows_you: currentFollowsUser,
            followers_count: followersInstance.people.length,
            following_count: currentUserFollowing.people.length
        });
    } catch (error) {
        return res.status(500).send({ message: "Internal server error" });
    }
}

// Get follow requests of a person
export async function GetFollowRequests(req: Request, res: Response) {
    try {
        const user_id = req.body.user_details._id;

        // get list of follow requests
        // lookup for users and gettheir details
        const followRequestsList = await followrequests.aggregate([
            {
                $match: {
                    request_to: user_id
                },
            },
            // Get request_from details
            {
                $lookup: {
                    from: "users",
                    localField: "request_from",
                    foreignField: "_id",
                    as: "request_from_details"
                }
            },
            // unwind request_from_details
            {
                $unwind: "$request_from_details"
            },
            // Keep only required fields
            {
                $project: {
                    _id: 1,
                    request_datetime: 1,
                    request_from: {
                        _id: "$request_from_details._id",
                        name: "$request_from_details.name",
                        profile_picture: "$request_from_details.profile_picture",
                        username: "$request_from_details.username"
                    },
                }
            }
        ])

        // Send Response
        return res.send({ follow_requests: followRequestsList, message: "List of Follow Requests" });

    } catch (error) {
        return res.status(500).send({ message: "Internal server error" });
    }
}

// Remove a person from your followers
export async function RemoveFollower(req: Request, res: Response) {
    try {
        // Constants
        const user_id = req.body.user_details._id;
        const removeId = req.body.user_id;

        // check if followersList instance exist or not
        const followersInstance = await followers.findOne({ follower_of: user_id });
        if (!followersInstance) return res.status(200).send({ message: "Followers list not found" });

        // check if user is there in followers list
        const isFollowing = followersInstance.people.findIndex(person => person.toString() === removeId.toString());

        // Remove the person from followers list
        if (isFollowing < 0) {
            followersInstance.people.splice(isFollowing, 1);
            // save the followers instance
            await followersInstance.save();
        }

        return res.status(200).send({
            message: `The requested person has been removed from your followers.`,
            current_user_followers_count: followersInstance.people.length
        });
    } catch (error) {
        return res.status(500).send({ message: "Internal server error" });
    }
}

// Search for a Person
export async function Search(req: Request, res: Response) {
    try {
        const query = req.body.query;
        if (!query) return res.status(400).send({ message: "Please enter a valid query" });

        // Get list of people that match the query
        const peopleList = await users.aggregate([
            // Match the query
            {
                $match: {
                    $or: [
                        { name: { $regex: query, $options: "i" } },
                        { username: { $regex: query, $options: "i" } }
                    ],
                    // Dont show the current user
                    _id: { $ne: req.body.user_details._id }
                },
            },
            // limit to 10
            {
                $limit: 10
            },
            // Keep only required fields
            {
                $project: {
                    _id: 1,
                    name: 1,
                    username: 1,
                    profile_picture: 1,
                    bio: 1,
                }
            }
        ]);

        return res.send({ results: peopleList, message: "List of people that match the query" });
    } catch (error) {
        return res.status(500).send({ message: "Internal server error" });
    }
}