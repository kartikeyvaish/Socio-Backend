// package and other modules 
import express from "express";

// static imports   
import { deleteStory, getStories, getViews, markStoryAsRead, postStory } from './../controllers/stories';
import Multer from "../utils/Multer";
import { validateNewStoryBody, validateStoryBody } from "../middlewares/StoryValidator";
import { UserAuth } from "../middlewares/AuthValidator";

// Initialize router
const router = express.Router();

// Stories Router
const StoriesRouter = router;

// Route to get stories
StoriesRouter.get("/get-stories", UserAuth, getStories);

// Post a story
StoriesRouter.post("/post-story", Multer.single("file"), UserAuth, validateNewStoryBody, postStory);

// Mark a story as viewed
StoriesRouter.put("/mark-story-as-viewed", validateStoryBody, UserAuth, markStoryAsRead);

// Delete a story
StoriesRouter.delete("/delete-story", validateStoryBody, UserAuth, deleteStory);

// get views on a story
StoriesRouter.get("/get-views", validateStoryBody, UserAuth, getViews);

// export router
export default StoriesRouter;
