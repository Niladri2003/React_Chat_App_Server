const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "Fist Name is required"],
  },
  lastName: {
    type: String,
    required: [true, "Last Name is required"],
  },
  avatar: {
    type: String,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    validate: {
      validator: function (email) {
        return String(email)
          .toLowerCase()
          .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
          );
      },
      message: (props) => `Email (${props.value}) is invalid`,
    },
  },
  password: {
    type: String,
  },
  passwordConfirm: {
    type: String,
  },
  passwordChangetAt: {
    type: Date,
  },
  passwordResetToken: {
    type: String,
  },
  passwordResetExpires: {
    type: Date,
  },
  createdAt: {
    type: Date,
  },
  updatedAt: {
    type: Date,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  otp: {
    type: Number,
  },
  otp_exp: {
    type: Date,
  },
  socket_id: {
    type: String,
  },
  friends: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  ],
  status: {
    type: String,
    enum: ["Online", "Offline"],
  },
});

//OTP hashing and storing in db
userSchema.pre("save", async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified("otp") || !this.otp) return next();

  // Hash the otp with cost of 12
  this.otp = await bcrypt.hash(this.otp.toString(), 12);

  console.log(this.otp.toString(), "FROM PRE SAVE HOOK");

  next();
});

// Password Hashing

// userSchema.pre("save", async function (next) {
//   // Only run this function if password was actually modified
//   if (!this.isModified("password") || !this.password) return next();

//   // Hash the password with cost of 12
//   this.password = await bcrypt.hash(this.password, 12);

//   //! Shift it to next hook // this.passwordChangedAt = Date.now() - 1000;

//   next();
// });

// Password checking
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// otp decrypt
userSchema.methods.correctOtp = async function (candidateOtp, userOtp) {
  // candidateOtp = candidateOtp.toString();
  // userOtp = userOtp.toString();
  return await bcrypt.compare(candidateOtp, userOtp);
};

//Password Reset token generating
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(12).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};
// checking password change token and login time for extra security
userSchema.methods.changePasswordAfter = function (timestamp) {
  return timestamp < this.passwordChangetAt;
};

//const User = new mongoose.model("User", userSchema);
module.exports = mongoose.model("User", userSchema);
