const jwt = require("jsonwebtoken");
const otpgenerator = require("otp-generator");
const User = require("../models/User");
const filterObj = require("../utils/filterObj");
const crypto = require("crypto");
const { promisify } = require("util");
const mailSender = require("../services/mailer");
const emailTemplate = require("../mail/otpmailtemp");
const resetTmp = require("../mail/resetPassword");

const signToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET);
//Register New User
exports.register = async (req, res, next) => {
  const { firstName, lastName, email, password } = req.body;
  console.log(req.body);
  const filterdBody = filterObj(
    req.body,
    "firstName",
    "lastName",
    "password",
    "email"
  );

  // Check existing user in db if their is any user with same email or not
  const existing_user = await User.findOne({ email: email });
  console.log(existing_user);
  if (existing_user && existing_user.verified) {
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
exports.sendOTP = async (req, res, next) => {
  const { user } = req;
  const details = await User.findById(user);
  const new_OTP = otpgenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false,
  });
  const otp_exp = Date.now() + 30 * 60 * 1000; //10 min after otp send

  await User.findByIdAndUpdate(user, {
    otp: new_OTP,
    otp_exp: otp_exp,
  });
  // send mail
  console.log("mail id->", details.email);
  const mailResponse = await mailSender(
    details.email,
    "Verification email",
    emailTemplate(user.firstName, new_OTP)
  );
  console.log("Email sent successfully: ", mailResponse);

  res.status(200).json({
    status: "success",
    message: "Otp send succesfully",
  });
};
//veriify otp
exports.verifyOTP = async (req, res, next) => {
  // verify OTP and update the user record
  const { email, otp } = req.body;
  // console.log("Email & otp is->", email, otp);
  const user = await User.findOne({
    email,
    // otp_exp: { $gt: Date.now() },
  });
  // console.log("User ", user);

  if (!user) {
    res.status(400).json({
      status: "error",
      message: "Email is invalid or otp expired",
    });
  }
  if (user.verified) {
    return res.status(400).json({
      status: "error",
      message: "Email is already verified",
    });
  }
  // console.log("HEllo 1");
  // console.log(typeof otp);

  // console.log("Response", await user.correctOtp(otp, user.otp));
  // if (!(await user.correctOtp(otp, user.otp))) {
  //   res.status(400).json({
  //     status: "error",
  //     message: "Otp is invalid",
  //   });
  //   return;
  // }
  db_otp = user.otp.toString();
  // console.log(typeof db_otp);
  if (otp.toString() == !db_otp) {
    console.log("Hello-3");
    res.status(400).json({
      status: "error",
      message: "Otp is invalid",
    });
  }

  // console.log("HEllo 2");
  //otp is correct
  user.verified = true;
  user.otp = undefined;
  await user.save({ new: true });

  const token = signToken(user._id);
  res.status(200).json({
    status: "success",
    message: "Logged in succesfully",
    token,
  });
};
//Login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({
        status: "error",
        message: "Both email and password are required",
      });
    }
    // finding user in db
    const user = await User.findOne({ email: email }).select("+password");
    console.log("Db USer", user);

    if (!user || !(await user.correctPassword(password, user.password))) {
      res.status(400).json({
        status: "error",
        message: "Email or password incorrect",
      });
    }

    //password checking
    // if (password !== user.password) {
    //   res.status(400).json({
    //     status: "error",
    //     message: "Email or password incorrect",
    //   });
    // }
    const token = signToken(user._id);
    console.log(token);
    const options = {
      expires: new Date(Date.now() + 3 * 24 * 60 * 1000),
      httpOnly: true,
    };

    // res.cookie("token", token, options).status(200).json({
    //   status: "success",
    //   token,
    //   message: "Logged in succesfully",
    // });
    res.status(200).json({
      status: "success",
      message: "Logged in successfully!",
      token,
      user_id: user._id,
    });
  } catch (e) {
    console.log(e);
    // Return 500 Internal Server Error status code with error message
    res.status(500).json({
      success: false,
      message: "Log in failure please try Again",
    });
  }
};
//protect route
exports.protect = async (req, res, next) => {
  // getting a token (jwt) and then check if its actually there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  } else {
    req.status(400).json({
      status: "error",
      message: "You are not logged in, Please log in to continue",
    });
  }
  //verification of token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //check user is still exist
  const this_user = await User.findByIdAndUpdate(decoded.userId);
  if (!this_user) {
    res.status(400).json({
      status: "error",
      message: "User doesn't exist",
    });
  }

  //cechk if user changed their password after token was issued.
  if (this_user.changePasswordAfter(decoded.iat)) {
    res.status(400).json({
      status: "error",
      message: "User recently updated password! please log in again",
    });
  }
  req.user = this_user;
  next();
};

//forgot password

//types of routes -> protected (only logged in users can acces there) & unprotected routes
exports.forgotPassword = async (req, res, next) => {
  // get user email
  const { email } = req.body;
  const user = await User.findOne({ email: email });
  //validating user
  if (!user) {
    res.status(400).json({
      status: "error",
      message: "No user found with given email address",
    });
  }
  // generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  console.log("token", resetToken);
  const resetURL = `https://localhost:4000/auth/reset-password/?code=${resetToken}`;

  try {
    //TODO => Send email with reset
    const mailResponse = await mailSender(
      email,
      "Password Reset email",
      emailTemplate(user.firstName, resetURL)
    );
    console.log("Reset email response", mailResponse);
    res.status(200).json({
      status: "success",
      message: "Email send succesfully",
    });
  } catch (e) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateBeforeSave: false });

    return res.status(500).json({
      message: "There was an error sending the email. Try again later!",
    });
  }
};

//reset Password
exports.resetPassword = async (req, res, next) => {
  console.log("Inside ResetPassword");
  // get the user based on token
  console.log("Recived Token", req.body.token);
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.body.token)
    .digest("hex");
  console.log(hashedToken);
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  //if token has exired or submission after time window
  if (!user) {
    res.status(400).json({
      status: "error",
      message: "Token is invalid or expired",
    });
  }
  //update password and set reset token and expiry to unedfined
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  // Log in the user and send new jwt

  //TODO send user that password updated .
  const token = signToken(user._id);
  res.status(200).json({
    status: "success",
    message: "Password updated succesfully",
    token,
  });
};
