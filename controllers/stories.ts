// packages imports 
import { Request, Response } from "express";
import { omit } from "lodash";

// Local imports
import { DeleteAFile, UploadFile } from "../utils/Cloudinary";
import following from "../models/following";
import messages from "../config/messages";
import stories from "../models/stories";
import users from "../models/users";

// function to get stories for a user
export const getStories = async (req: Request, res: Response) => {
    try {
        // Get the current user
        const current_user = req.body.user_details._id

        // Get the user's following list
        const followingInstance = await following.findOne({ following_of: req.body.user_details._id });
        const followingList = followingInstance ? followingInstance.people : [];

        // Get stories whose story_owner_id is in the following list 
        // exclude stories with story_owner_id as req.body.user_details._id
        const allStories = await stories.aggregate([
            {
                $match: {
                    $and: [
                        { story_owner_id: { $in: followingList } },
                        { story_owner_id: { $ne: current_user } }
                    ]
                }
            },
            // sort by _id
            {
                $sort: { _id: -1 }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "story_owner_id",
                    foreignField: "_id",
                    as: "user_details"
                }
            },
            {
                $unwind: {
                    path: "$user_details",
                    preserveNullAndEmptyArrays: true
                }
            },
            // Keep only the fields we need
            {
                $project: {
                    _id: 1,
                    story_owner_id: 1,
                    viewed_by: 1,
                    file: 1,
                    user_details: {
                        _id: 1,
                        username: 1,
                        profile_picture: 1,
                        name: 1
                    }
                }
            }
        ]);

        let resultant = [];
        for (let i = 0; i < allStories.length; i++) {
            let toPush = {
                file: allStories[i].file,
                // viewed_by: allStories[i].viewed_by,
                viewed_by_you: allStories[i].viewed_by.findIndex(item => item.toString() === current_user.toString()) === -1 ? false : true,
                view_count: allStories[i].viewed_by.length,
                _id: allStories[i]._id,
            }

            let checkInstance = resultant.findIndex(x => x._id.toString() === allStories[i].story_owner_id.toString());
            if (checkInstance === -1) {
                resultant.push({
                    _id: allStories[i].story_owner_id,
                    username: allStories[i].user_details.username,
                    profile_picture: allStories[i].user_details.profile_picture,
                    stories: [toPush],
                });
            } else {
                resultant[checkInstance].stories.push(toPush);
            }
        }

        for (let j = 0; j < resultant.length; j++) {
            let viewed_by_you = true;

            for (let k = 0; k < resultant[j].stories.length; k++) {
                // if (resultant[j].stories[k].viewed_by.findIndex(item => item.toString() === current_user.toString()) === -1) {
                if (!resultant[j].stories[k].viewed_by_you) {
                    viewed_by_you = false;
                    break;
                }
            }

            resultant[j].viewed_by_you = viewed_by_you;
        }

        const userStories = await stories.find(
            {
                story_owner_id: current_user
            },
            {
                story_owner_id: 0, __v: 0
            }
        ).sort({ _id: -1 });

        let user_stories = [];

        for (let i = 0; i < userStories.length; i++) {
            user_stories.push({
                file: userStories[i].file,
                _id: userStories[i]._id,
                viewed_by_you: userStories[i].viewed_by.findIndex(item => item.toString() === current_user.toString()) === -1 ? false : true,
                view_count: userStories[i].viewed_by.length,
            });
        }

        let own_viewed = true;
        for (let j = 0; j < user_stories.length; j++) {
            if (!user_stories[j].viewed_by_you) {
                own_viewed = false;
                break;
            }
        }

        return res.status(200).send({
            feed_stories: resultant,
            message: "List of Stories",
            profile_stories: { stories: user_stories, viewed_by_you: own_viewed }
        })
    } catch (error) {
        return res.status(500).send({ message: messages.serverError });
    }
};

// function to post a story
export const postStory = async (req: Request, res: Response) => {
    const newStory = new stories({
        story_owner_id: req.body.user_details._id,
    })

    // Destination for post file
    const destination = `Socio/users/${req.body.user_details._id}/stories/${newStory._id}`;

    const fileUpload: any = await UploadFile(req.body.file, destination);
    if (fileUpload?.secure_url?.length) {
        newStory.file = {
            _id: fileUpload.asset_id,
            uri: fileUpload.secure_url,
            public_id: fileUpload.public_id,
            width: fileUpload.width,
            height: fileUpload.height,
            mimeType: `${fileUpload.resource_type}/${fileUpload.format}`,
        }
    }

    let payload: any = omit(newStory.toObject(), [
        "story_owner_id",
        "__v",
        "viewed_by",
    ]);

    payload = {
        ...payload,
        viewed_by_you: false,
        view_count: 0
    }

    await newStory.save();

    return res.status(200).send({ story: payload, message: "Post a story" })
};

// function to mark a story as read
export const markStoryAsRead = async (req: Request, res: Response) => {
    try {
        const findStory = await stories.findById(req.body.story_id);
        if (!findStory) return res.status(404).send({ message: "Story has been deleted or Invalid Story ID" });

        const checkUser = findStory.viewed_by.findIndex(x => x.toString() === req.body.user_details._id.toString());
        if (checkUser === -1) {
            findStory.viewed_by.push(req.body.user_details._id);
            await findStory.save();
        }

        return res.status(200).send({ message: "Mark a story as read" })
    } catch (error) {
        return res.status(500).send({ message: messages.serverError });
    }
}

// function to delete a story
export const deleteStory = async (req: Request, res: Response) => {
    try {
        const findStory = await stories.findById(req.body.story_id);
        if (!findStory) return res.status(404).send({ message: "Story has been deleted or Invalid Story ID" });

        await DeleteAFile(findStory.file.public_id, findStory.file.mimeType);

        await findStory.delete();

        return res.status(200).send({ message: "Delete Story" })
    } catch (error) {
        return res.status(500).send({ message: messages.serverError });
    }
}

// function to get views on a story
export const getViews = async (req: Request, res: Response) => {
    try {
        const findStory = await stories.findById(req.body.story_id);
        if (!findStory) return res.status(404).send({ message: "Story has been deleted or Invalid Story ID" });

        const viewedUsers = await users.aggregate([
            {
                $match: {
                    _id: { $in: findStory.viewed_by }
                }
            },
            // take only the fields we need
            {
                $project: {
                    _id: 1,
                    username: 1,
                    profile_picture: 1,
                    name: 1,
                }
            }
        ])

        return res.status(200).send({ viewed_by: viewedUsers, message: "Views For a story" })
    } catch (error) {
        return res.status(500).send({ message: messages.serverError });
    }
}
