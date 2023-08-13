const User = require("../models/User");
const filterObj = require("../utils/filterObj");

exports.updateMe = async (req, res, next) => {
  const { user } = req;
  const filteredbody = filterObj(
    req.body,
    "firstName",
    "lastName",
    "about",
    "avatar"
  );
  const updateduser = await User.findByIdAndUpdate(user._id, filteredbody, {
    new: true,
  });

  res.status(200).json({
    status: "success",
    message: "User updated succesfullly",
    data: updateduser,
  });
};
