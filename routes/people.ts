// package and other modules 
import express from "express";

// static imports   
import { AcceptFollowRequest, DeleteFollowRequest, Follow, GetFollowers, GetFollowing, GetFollowRequests, RemoveFollower, Search, Unfollow } from "../controllers/people";
import { UserAuth } from "../middlewares/AuthValidator";
import { validatePeopleGetID, validateRequestID, validateSearchPeople } from "../middlewares/PeopleValidator";

// Initialize router
const router = express.Router();

const PeopleRoutes = router;

// get followers of a person
PeopleRoutes.get("/get-followers", UserAuth, validatePeopleGetID, GetFollowers)

// get following of a person
PeopleRoutes.get("/get-following", UserAuth, validatePeopleGetID, GetFollowing)

// follow a person or send follow request to a person with private profile
PeopleRoutes.post("/follow", UserAuth, validatePeopleGetID, Follow)

// accept follow request from a person
PeopleRoutes.put("/accept-follow-request", UserAuth, validateRequestID, AcceptFollowRequest)

// delete follow request from a person
PeopleRoutes.delete("/delete-follow-request", UserAuth, validateRequestID, DeleteFollowRequest)

// unfollow a person whom you are following
PeopleRoutes.post("/unfollow", UserAuth, validatePeopleGetID, Unfollow)

// remove a person from your followers
PeopleRoutes.delete("/remove-follower", UserAuth, validatePeopleGetID, RemoveFollower)

// get follow requests of a person
PeopleRoutes.get("/get-follow-requests", UserAuth, GetFollowRequests)

// search for people
PeopleRoutes.get("/search", UserAuth, validateSearchPeople, Search)

// export router
export default PeopleRoutes;
