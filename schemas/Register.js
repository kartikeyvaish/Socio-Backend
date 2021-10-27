const Joi = require("joi");

const RegisterSchema = Joi.object({
  Name: Joi.string().required(),
  Email: Joi.string().email().required(),
  Username: Joi.string().required(),
  Password: Joi.string().min(3).max(15).required(),
}).options({ allowUnknown: true });

// Function to validate a file and body of a request
const ValidateRegisterBody = (req, res, next) => {
  let newBody = {
    ...req.body,
    ...(req.file?.buffer && {
      ProfilePicture: req.file.buffer,
    }),
  };

  const { error } = RegisterSchema.validate(newBody);
  if (error) return res.status(400).send(error.details[0].message);

  req.body = newBody;

  next();
};

exports.RegisterSchema = RegisterSchema;
exports.ValidateRegisterBody = ValidateRegisterBody;
