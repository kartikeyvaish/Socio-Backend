const Joi = require("joi");

// Schema to validate the body of a request
const EditProfileSchema = Joi.object({
  Name: Joi.string(),
  Username: Joi.string(),
  Bio: Joi.string().allow(""),
}).options({ allowUnknown: true });

// Function to validate a file and body of a request
const ValidateEditProfileBody = (req, res, next) => {
  let newBody = {
    ...req.body,
    user_id: req.body.user_details._id,
    ProfilePicture: req.file?.buffer ? req.file.buffer : null,
  };
  delete newBody.user_details;

  const { error } = EditProfileSchema.validate(newBody);
  if (error) return res.status(400).send(error.details[0].message);

  req.body = newBody;

  next();
};

exports.EditProfileSchema = EditProfileSchema;
exports.ValidateEditProfileBody = ValidateEditProfileBody;
