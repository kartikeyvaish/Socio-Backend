// packages imports 
import { Request, Response } from "express";

// Local imports 
import comments from "../models/comments";
import { DeleteAFile, UploadFile } from "../utils/Cloudinary";
import following from "../models/following";
import likes from "../models/likes";
import messages from "../config/messages";
import posts from "../models/Posts";
import mongoose from "mongoose";

// Get List of all Posts
export async function getPosts(req: Request, res: Response) {
    try {
        // Get the current user
        const current_user = req.body.user_details._id

        // Check if request has a last_post_id as query param 
        // get the _id and convert it to objectID
        const last_id_query = req.body?.last_post_id ? new mongoose.Types.ObjectId(req.body.last_post_id.toString()) : null;

        // Create a filter if last_post_id is present
        let after_this_id_filter = last_id_query
            ? { _id: { $lt: last_id_query } }
            : {};

        // Get the user's following list
        const followingInstance = await following.findOne({ following_of: req.body.user_details._id });
        const followingList = followingInstance ? followingInstance.people : [];

        // Get posts whose post_owner_id is in the following list
        // Get posts after last_id_query
        // Also add posts with post_owner_id as req.body.user_details._id

        const postsList = await posts.aggregate([
            // Match with filter and user_id, also with the people user is following
            {
                $match: {
                    ...after_this_id_filter,
                    $or: [
                        { post_owner_id: req.body.user_details._id },
                        {
                            post_owner_id: { $in: followingList },
                        },
                    ],
                },
            },
            // sort them in descending order of _id
            {
                $sort: {
                    _id: -1,
                },
            },
            // limit to 10
            {
                $limit: req.body.limit ? parseInt(req.body.limit) : 10,
            },
            // Get post_owner_details
            {
                $lookup: {
                    from: "users",
                    localField: "post_owner_id",
                    foreignField: "_id",
                    as: "post_owner_details",
                },
            },
            // Unwind post_owner_details
            {
                $unwind: {
                    path: "$post_owner_details",
                    preserveNullAndEmptyArrays: true,
                },
            },
            // Check if current_user has liked the post
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "post_id",
                    as: "likes_on_post",
                },
            },
            {
                $addFields: {
                    is_liked: {
                        $cond: {
                            if: {
                                $eq: [
                                    {
                                        $arrayElemAt: ["$likes_on_post.liked_by", 0],
                                    },
                                    current_user,
                                ],
                            },
                            then: true,
                            else: false,
                        },
                    },
                },
            },
            // Keep only the required fields
            {
                $project: {
                    _id: 1,
                    caption: 1,
                    location: 1,
                    likes_count: 1,
                    comments_count: 1,
                    post_datetime: 1,
                    post_owner_id: 1,
                    file: 1,
                    thumbnail_image: 1,
                    is_liked: 1,
                    post_owner_details: {
                        _id: 1,
                        name: 1,
                        username: 1,
                        profile_picture: 1,
                    }
                }
            }
        ]);

        return res.send({ message: "List of all Posts", posts: postsList });
    } catch (error) {
        return res.status(500).send({ message: messages.serverError });
    }
}

// Create a new Post
export async function createPost(req: Request, res: Response) {
    try {
        const newPost = new posts();

        if (req.body.caption) newPost.caption = req.body.caption;
        if (req.body.location) newPost.location = req.body.location;

        newPost.post_owner_id = req.body.user_details._id;

        // Destination for post file
        const destination = `Socio/users/${req.body.user_details._id}/posts/${newPost._id}`;

        const fileUpload: any = await UploadFile(req.body.file, destination);
        if (fileUpload?.secure_url?.length) {
            newPost.file = {
                _id: fileUpload.asset_id,
                uri: fileUpload.secure_url,
                public_id: fileUpload.public_id,
                width: fileUpload.width,
                height: fileUpload.height,
                mimeType: `${fileUpload.resource_type}/${fileUpload.format}`,
            }
        }

        // Upload thumbnail image if mimeType is video
        if (req.body.mimeType.slice(0, 5) === "video") {
            const thumbnailUpload: any = await UploadFile(req.body.thumbnail_image, `${destination}/thumbnail`);
            if (thumbnailUpload?.secure_url?.length) {
                newPost.thumbnail_image = {
                    _id: thumbnailUpload.asset_id,
                    uri: thumbnailUpload.secure_url,
                    public_id: thumbnailUpload.public_id,
                    width: thumbnailUpload.width,
                    height: thumbnailUpload.height,
                    mimeType: `${thumbnailUpload.resource_type}/${thumbnailUpload.format}`,
                }
            }
        }

        await newPost.save();

        return res.send({ message: "New Post Created", post: newPost });
    } catch (error) {
        return res.status(500).send({ message: messages.serverError });
    }
}

// Delete a Post
export async function deletePost(req: Request, res: Response) {
    try {
        // Check if post exists
        const post = await posts.findById(req.body.post_id);
        if (!post) return res.status(404).send({ message: messages.postNotFound });

        // Check if post belongs to the user
        if (post.post_owner_id.toString() !== req.body.user_details._id.toString())
            return res.status(403).send({ message: messages.notOwnerOfPost });

        // Delete Files from Cloudinary  
        await DeleteAFile(post.file.public_id, post.file.mimeType);
        if (post.thumbnail_image) await DeleteAFile(post.thumbnail_image.public_id, post.thumbnail_image.mimeType);

        await post.delete();

        return res.send({ message: "Post Deleted" });
    } catch (error) {
        return res.status(500).send({ message: messages.serverError });
    }
}

// Like a post
export async function likePost(req: Request, res: Response) {
    try {
        // Check if post exists
        const post = await posts.findById(req.body.post_id);
        if (!post) return res.status(404).send({ message: messages.postNotFound });


        // check if user has already liked the post
        const checkLike = await likes.findOne({ post_id: req.body.post_id, liked_by: req.body.user_details._id });
        if (checkLike) return res.status(200).send({ message: messages.alreadyLikedPost, likes_count: post.likes_count });

        // Create a new like
        const newLike = new likes({ post_id: req.body.post_id, liked_by: req.body.user_details._id });
        await newLike.save();

        // Get likes count
        const likes_count_after_like = await likes.countDocuments({ post_id: req.body.post_id });

        // Update post likes
        post.likes_count = likes_count_after_like;
        await post.save();

        return res.send({ message: messages.likedPost, likes_count: post.likes_count });
    } catch (error) {
        return res.status(500).send({ message: messages.serverError });
    }
}

// Unlike a post
export async function unlikePost(req: Request, res: Response) {
    try {
        // Check if post exists
        const post = await posts.findById(req.body.post_id);
        if (!post) return res.status(404).send({ message: messages.postNotFound });

        // check if user has liked the post
        const checkLike = await likes.findOne({ post_id: req.body.post_id, liked_by: req.body.user_details._id });
        if (!checkLike) return res.status(200).send({
            message: "You cannot dislike the post because you have not liked the post yet.",
            likes_count: post.likes_count
        });

        // Delete like
        await checkLike.delete();

        // Get likes count
        const likes_count_after_like = await likes.countDocuments({ post_id: req.body.post_id });

        // Update post likes
        post.likes_count = likes_count_after_like;
        await post.save();

        return res.send({ message: messages.likedPost, likes_count: post.likes_count });
    } catch (error) {
        return res.status(500).send({ message: messages.serverError });
    }
}

// Get likes on a post
export async function getLikes(req: Request, res: Response) {
    try {
        // check if post_id is provided
        if (!req.query.post_id) return res.status(400).send({ message: messages.postIdRequired });

        // Check if post exists
        const post = await posts.findById(req.query.post_id);
        if (!post) return res.status(404).send({ message: messages.postNotFound });

        // get the _id and convert it to objectID
        const postObjectId = new mongoose.Types.ObjectId(req.query.post_id.toString());

        // Get likes on the post
        const likesList = await likes.aggregate([
            { $match: { post_id: postObjectId } },
            // Get the name, username and profile picture of the user who liked the post
            { $lookup: { from: "users", localField: "liked_by", foreignField: "_id", as: "liked_by" } },
            { $unwind: "$liked_by" },
            // Keep only the required fields
            {
                $project: {
                    _id: 1,
                    like_datetime: 1,
                    liked_by: {
                        _id: 1,
                        name: 1,
                        username: 1,
                        profile_picture: 1,
                    }
                }
            }
        ]);

        return res.send({ message: "Likes on Post", post_id: req.query.post_id, likes: likesList });
    } catch (error) {
        return res.status(500).send({ message: messages.serverError });
    }
}

// comment on a post
export async function commentOnPost(req: Request, res: Response) {
    try {
        // Check if post exists
        const post = await posts.findById(req.body.post_id);
        if (!post) return res.status(404).send({ message: messages.postNotFound });

        // Create a new comment
        const newComment = new comments({
            post_id: req.body.post_id,
            commented_by: req.body.user_details._id,
            comment: req.body.comment,
        });

        // Save the comment
        await newComment.save();

        // Get total comments count
        const comments_count = await comments.countDocuments({ post_id: req.body.post_id });

        // Update post comments
        post.comments_count = comments_count;
        await post.save();

        let payload: any = newComment.toObject();
        payload.commented_by = { ...req.body.user_details }
        delete payload.commented_by.email;

        return res.send({ message: "Comment Successfully Added", comment: payload, comments_count: post.comments_count });
    } catch (error) {
        return res.status(500).send({ message: messages.serverError });
    }
}

// delete a comment
export async function deleteComment(req: Request, res: Response) {
    try {
        // Check if comment exists
        const comment = await comments.findById(req.body.comment_id);
        if (!comment) return res.status(404).send({ message: "Comment Not Found" });

        // find post
        const checkPost = await posts.findById(comment.post_id);
        if (!checkPost) return res.status(404).send({ message: messages.postNotFound });

        // Delete comment
        await comment.delete();

        // Get total comments count
        const comments_count = await comments.countDocuments({ post_id: comment.post_id });

        // Update post comments
        checkPost.comments_count = comments_count;
        await checkPost.save();

        return res.send({ message: "Comment Deleted", comments_count: checkPost.comments_count });
    } catch (error) {
        return res.status(500).send({ message: messages.serverError });
    }
}

// get comments on a post
export async function getComments(req: Request, res: Response) {
    try {
        // check if post_id is provided
        if (!req.query.post_id) return res.status(400).send({ message: messages.postIdRequired });

        // Check if post exists
        const post = await posts.findById(req.query.post_id);
        if (!post) return res.status(404).send({ message: messages.postNotFound });

        // get the _id and convert it to objectID
        const postObjectId = new mongoose.Types.ObjectId(req.query.post_id.toString());

        // Get comments on the post
        const commentsList = await comments.aggregate([
            { $match: { post_id: postObjectId } },
            // Get the name, username and profile picture of the user who liked the post
            // Sort by _id
            { $sort: { _id: -1 }, },
            { $lookup: { from: "users", localField: "commented_by", foreignField: "_id", as: "commented_by" } },
            { $unwind: "$commented_by" },
            // Keep only the required fields
            {
                $project: {
                    _id: 1,
                    comment: 1,
                    comment_datetime: 1,
                    commented_by: {
                        _id: 1,
                        name: 1,
                        username: 1,
                        profile_picture: 1,
                    }
                }
            }
        ]);

        return res.send({ message: "Comments on Post", post_id: req.query.post_id, comments: commentsList });
    } catch (error) {
        return res.status(500).send({ message: messages.serverError });
    }
}

// get posts details
export async function getPostDetails(req: Request, res: Response) {
    try {
        // Check if post exists
        const post = await posts.findById(req.body.post_id);
        if (!post) return res.status(404).send({ message: messages.postNotFound });

        // Check if current user has liked the post
        const checkLike = await likes.findOne({ post_id: post._id, liked_by: req.body.user_details._id });
        const payload: any = post.toObject();
        payload.is_liked = checkLike ? true : false;

        return res.status(200).send({ message: "Post Details", post: payload });

    } catch (error) {
        return res.status(500).send({ message: messages.serverError });
    }
}