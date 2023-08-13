const {
  login,
  register,
  sendOTP,
  verifyOTP,
  forgotPassword,
  resetPassword,
} = require("../controllers/auth");

const router = require("express").Router();

router.post("/login", login);
router.post("/register", register, sendOTP);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
