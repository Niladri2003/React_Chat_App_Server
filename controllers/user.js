const User = require("../models/User");
const FriendRequest = require("../models/friendRequest");
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

exports.getUsers = async (req, res, next) => {
  const all_users = await User.find({
    verified: true,
  }).select("firstName lastName _id");

  const this_user = req.user;
  const remaining_users = all_users.filter(
    (user) =>
      !this_user.friends.includes(user._id) &&
      user._id.toString() !== req.user._id.toString()
  );
  res.status(200).json({
    status: "success",
    data: remaining_users,
    message: "users found succesfully",
  });
};

exports.getRequests = async (req, res, next) => {
  const requests = await FriendRequest.find({
    recipent: req.user._id,
  }).populate("sender", "_id firstNama lastName");
  res.status(200).json({
    status: "success",
    data: requests,
    message: "friends request found succesfully",
  });
};

exports.getFriends = async (req, res, next) => {
  const this_users = await User.findById(req.user._id).populate(
    "friends",
    "_id firstName lastName"
  );

  res.status(200).json({
    status: "success",
    data: this_users.friends,
    message: "friends found succesfully",
  });
};
