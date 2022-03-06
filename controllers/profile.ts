// packages imports 
import { Request, Response } from "express";

// Local imports
import messages from "../config/messages";
import followers from "../models/followers";
import following from "../models/following";
import followrequests from "../models/followrequests";
import posts from "../models/Posts";
import users from "../models/users";

// Get Profile Data for a user
export const getProfile = async (req: Request, res: Response) => {
    try {
        let requested_by = req.body.user_details._id;
        let user_id = req.body.user_id;
        let requesting_own = requested_by.toString() === user_id.toString();

        // Get the profile of the user whose data is being requested
        let user_profile = await users.findById(user_id);
        let isProfilePrivate = user_profile.private_profile;
        let canSendPost = false;
        let followersList = null;
        let followingList = null;
        let postsList = null;
        let you_follow_user = null;
        let user_follows_you = null;
        let you_sent_request = null;
        let user_sent_request = null;

        // Get Followers and Following List
        followersList = await followers.findOne({ follower_of: user_id });
        followingList = await following.findOne({ following_of: user_id });

        // If user is requesting own profile, then don't get these data
        if (!requesting_own) {
            you_follow_user = followersList.people.findIndex(person => person.toString() === requested_by.toString()) > -1;
            user_follows_you = followingList.people.findIndex(person => person.toString() === requested_by.toString()) > -1;
            you_sent_request = await followrequests.findOne({ request_from: requested_by, request_to: user_id });
            user_sent_request = await followrequests.findOne({ request_from: user_id, request_to: requested_by });
        }

        // If yes, then check if the profile owner has private profile
        // If Yes then send the profile data only if the user is following the profile owner
        if (requesting_own) {
            canSendPost = true;
        } else {
            if (isProfilePrivate) {
                if (you_follow_user) canSendPost = true;
            } else canSendPost = true;
        }

        // If canSendPost is true, then get posts of the user
        if (canSendPost) postsList = await posts.find({ post_owner_id: user_id }, {}, {
            sort: {
                _id: -1
            }
        });

        return res.status(200).send({
            user_details: {
                name: user_profile.name,
                username: user_profile.username,
                profile_picture: user_profile.profile_picture,
                bio: user_profile.bio,
                private_profile: user_profile.private_profile,
            },
            followers_count: followersList.people.length,
            following_count: followingList.people.length,
            posts: postsList ?? [],


            // Add these fields conditionally 
            ...(!requesting_own ? {
                you_follow_user: you_follow_user ? true : false,
                user_follows_you: user_follows_you ? true : false,
                you_sent_request: you_sent_request ? true : false,
                user_sent_request: user_sent_request ? true : false,
            } : {}),
            ...(you_sent_request ? { you_sent_request_id: you_sent_request._id } : {}),
            ...(user_sent_request ? { user_sent_request_id: user_sent_request._id } : {}),
        });
    } catch (error) {
        res.status(500).send({ message: messages.serverError });
    }
}