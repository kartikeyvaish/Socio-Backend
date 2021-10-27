const messages = {
  // General
  serverError: "Server Error. Please try again Later",
  unauthorized:
    "You are not authorized to access this link. Contact the admin of the Socio for more information.",
  tokenMissing: "Authentication Token Required",

  // Auth
  accountMissing: "Account with this Email does exist!",
  emailRequired: "Email is Required",
  currentPasswordError: "Invalid Current Password",
  invalidCredentials: "Invalid Credentials",
  emailAlreadyInUse: "Account with this Email already exist.",
  UsernameAlreadyInUse: "Account with this Username already exist.",
  passwordChanged: "Password Changed Successfully",
  accountDeleted: "Account Deleted Successfully",
  loggedtOut: "Logged Out Successfully",
  associatedAccount: `There's an account associated with this email. Proceed to login.`,

  // Files
  fileMissing: "File Missing",

  // Post
  postLiked: "Post Liked",
  postAlreadyLiked: "Post Already Liked",
  postDisLiked: "Post Disliked",
  postAlreadyDisLiked: "Post Not Liked",
  postMissing: "Post not Found",
  postNotFound: "Post ID required",
  postCreated: "Post Created Successfully",
  postUpdated: "Post Updated Successfully",
  postDeleted: "Post Deleted Successfully",
  postDeletionNotAllowed: "You are not authorized to perform this operation",

  // COMMENT
  commentedSuccess: "Commented Successfully",
  commentedDeleted: "Comment Deleted Successfully",
  commentMissing: "Comment Not Found",

  // OTP
  incorrectOTP: "You've entered an incorrect OTP",
  expiredOTP: "OTP is Expired",
  otpVerified: "OTP Verified Successfully",

  // chats
  chatMissing: "Chat Not Found",
  invalidChatCreation: "Cannot Create a chat room with yourself",
  chatDeleted: "Chat Deleted Successfully",
};

module.exports = messages;
