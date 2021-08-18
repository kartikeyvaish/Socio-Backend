const Configuration = {
  Port: process.env.PORT || 3000,
  db_config: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  },
  messages: {
    serverError: "Server Error. Please try again Later",
    unauthorized:
      "You are not authorized to access this link. Contact the admin of the Socio for more information.",
    tokenMissing: "Authentication Token Required",
    accountMissing: "Account with this Email does exist!",
    currentPasswordError: "Invalid Current Password",
    invalidCredentials: "Invalid Credentials",
    emailAlreadyInUse: "Account with this Email already exist.",
    UsernameAlreadyInUse: "Account with this Username already exist.",
    passwordChanged: "Password Changed Successfully",
    accountDeleted: "Account Deleted Successfully",
    fileMissing: "File Missing",
    postLiked: "Post Liked",
    postAlreadyLiked: "Post Already Liked",
    postDisLiked: "Post Disliked",
    postAlreadyDisLiked: "Post Not Liked",
    postMissing: "Post not Found",
    postNotFound: "Post ID required",
    commentedSuccess: "Comment Success",
    commentedDeleted: "Comment Deleted",
    commentMissing: "Comment Not Found",
  },
};

module.exports = Configuration;
