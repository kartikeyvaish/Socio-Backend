const Joi = require("joi");

const MessageSchema = Joi.object({
  // These three fields are a must
  room_id: Joi.string().required(),
  message_type: Joi.string().required().valid("text", "file", "post"),

  // Now depending on the message type, message can be a text, file or post
  message: Joi.when("message_type", {
    is: Joi.string().valid("text"),
    then: Joi.string().required(),
    otherwise: Joi.string().optional().allow(""),
  }),

  // Validation of `file` field to be a buffer and required if `message_type` is `file`
  file: Joi.when("message_type", {
    is: "file",
    then: Joi.binary().required(),
    otherwise: Joi.optional(),
  }),

  // Validation of `preview_file` field to be a buffer and required if `message_type` is `file`
  preview_file: Joi.when("message_type", {
    is: "file",
    then: Joi.binary().required(),
    otherwise: Joi.optional(),
  }),

  // Validation of `mime_type` field to be a string and required if `message_type` is `file`
  mime_type: Joi.when("message_type", {
    is: "file",
    then: Joi.string().required(),
    otherwise: Joi.string().optional().allow(""),
  }),

  // Validation of `post_id` field to be a string and required if `message_type` is `post`
  post_id: Joi.string().when("message_type", {
    is: "post",
    then: Joi.string().required(),
    otherwise: Joi.string().optional().allow(""),
  }),
}).options({ allowUnknown: true });

// Function to validate a body of a request
const ValidateMessageReqBody = (req, res, next) => {
  let newBody = {
    room_id: req.body.room_id || "",
    message: req.body.message || "",
    user_id: req.body.user_details._id,
    message_type: req.body.message_type || "",
    file: req.files?.file?.[0].buffer ? req.files.file[0].buffer : null,
    preview_file: req.files?.preview_file?.[0].buffer
      ? req.files.preview_file[0].buffer
      : null,
    mime_type: req.files?.file?.[0].mimetype || "",
    post_id: req.body.post_id || "",
    read: req.body.read || false,
  };
  delete newBody.user_details;

  const { error } = MessageSchema.validate(newBody);
  if (error) return res.status(400).send(error.details[0].message);

  req.body = newBody;

  next();
};

exports.MessageSchema = MessageSchema;
exports.ValidateMessageReqBody = ValidateMessageReqBody;
