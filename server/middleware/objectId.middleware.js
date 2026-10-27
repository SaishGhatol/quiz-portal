const mongoose = require('mongoose');

/**
 * Use with router.param('<name>', objectIdParam) so a malformed id answers
 * 400 instead of reaching Mongoose and surfacing as a 500 CastError.
 */
exports.objectIdParam = (req, res, next, value, name) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return res.status(400).json({ message: `Invalid ${name === 'id' ? 'ID' : name}` });
  }
  next();
};

exports.isObjectId = value => mongoose.Types.ObjectId.isValid(value);
