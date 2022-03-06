// package and other modules 
import express from "express";

// static imports   
import { commentOnPost, createPost, deleteComment, deletePost, getComments, getLikes, getPostDetails, getPosts, likePost, unlikePost } from "../controllers/posts";
import { CommentBodyValidate, CommentIDVBodyValidate, PostIDVBodyValidate, PostsBodyValidate, GetPostsBodyValdiate } from "../middlewares/PostsValidator";
import { UserAuth } from "../middlewares/AuthValidator";
import Multer from "../utils/Multer";

// Initialize router
const router = express.Router();

const PostsRoutes = router;

// New Post File Upload configs
const PostsUploadConfigs = [
    { name: "file", maxCount: 1 },
    { name: "thumbnail_image", maxCount: 1 },
]

// Get Posts endpoint
router.get("/get-posts", UserAuth, GetPostsBodyValdiate, getPosts);

// Create Posts endpoint
router.post("/create-post", Multer.fields(PostsUploadConfigs), UserAuth, PostsBodyValidate, createPost);

// Delete Posts endpoint
router.delete("/delete-post", UserAuth, PostIDVBodyValidate, deletePost);

// Like a Post endpoint
router.post("/like-post", UserAuth, PostIDVBodyValidate, likePost);

// unlike a Post endpoint
router.delete("/unlike-post", UserAuth, PostIDVBodyValidate, unlikePost);

// get likes on a post
router.get("/get-likes", UserAuth, getLikes);

// comment on a post
router.post("/post-comment", UserAuth, CommentBodyValidate, commentOnPost);

// delete a comment
router.delete("/delete-comment", UserAuth, CommentIDVBodyValidate, deleteComment);

// get comments on a post
router.get("/get-comments", UserAuth, getComments);

// get post details
router.get("/get-post-details", UserAuth, PostIDVBodyValidate, getPostDetails);

// export router
export default PostsRoutes;
