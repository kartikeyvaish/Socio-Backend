// package and other modules 
import express from "express";

// static imports
import { getProfile } from "../controllers/profile";
import { UserAuth } from "../middlewares/AuthValidator";
import { validatePeopleGetID } from "../middlewares/PeopleValidator";

// Initialize router
const router = express.Router();

const ProfileRoutes = router;

// Get Profile Data
ProfileRoutes.get("/get-profile", UserAuth, validatePeopleGetID, getProfile);

// export router
export default ProfileRoutes;
