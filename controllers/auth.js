const jwt = require("jsonwebtoken");
const otpgenerator = require("otp-generator");
const User = require("../models/User");
const filterObj = require("../utils/filterObj");

const signToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET);
//Register New User
exports.register = async (req, res, next) => {
  const { firstName, lastName, email, password } = req.body;

  const filterdBody = filterObj(
    req.body,
    "firstName",
    "lastName",
    "password",
    "email"
  );

  // Check existing user in db if their is any user with same email or not
  const existing_user = await findOne({ email: email });
  if (!existing_user && existing_user.verified) {
    res.status(400).json({
      status: "error",
      message: "Email is already in use, please log in",
    });
  } else if (existing_user) {
    const updated_user = await User.findOneAndUpdate(
      { email: email },
      filterdBody,
      { new: true, validateModifiedOnly: true }
    );

    // next middleware will be sendig otp to email
    req.user = existing_user._id;
    next();
  } else {
    //if user Record is not avilable in database
    const newUser = await User.create(filterdBody);

    //generate otp and send email to the user
    req.user = newUser._id;
    next();
  }
};
//send otp
esports.sendOTP = async (req, res, next) => {
  const { user } = req;
  const new_OTP = otpgenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false,
  });
  const otp_exp = Date.now() + 10 * 60 * 1000; //10 min after otp send

  await User.findByIdAndUpdate(user, {
    otp: new_OTP,
    otp_exp: otp_exp,
  });
  // send mail

  res.status(200).json({
    status: "success",
    message: "Otp send succesfully",
  });
};
//veriify otp
exports.verifyOTP = async (req, res, next) => {
  // verify OTP and update the user record
  const { email, otp } = req.body;
  const user = await User.findOne({
    email,
    otp_exp: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400).json({
      status: "error",
      message: "Email is invalid or otp expired",
    });
  }
};
//Login
exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({
      status: "error",
      message: "Both email and password are required",
    });
  }
  // finding user in db
  const user = await User.findOne({ email: email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    res.status(400).json({
      status: "error",
      message: "Email or password incorrect",
    });
  }

  const token = signToken(user._id);
  res.status(200).json({
    status: "success",
    message: "Logged in succesfully",
    token,
  });
};
