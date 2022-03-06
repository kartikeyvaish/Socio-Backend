// Packages Imports
import multer from "multer";

// Multer configuration
const Multer = multer({ storage: multer.memoryStorage() });

export default Multer;