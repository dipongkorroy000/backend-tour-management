import crypto from "crypto";
import { User } from "../user/user.model";
import { redisClient } from "../../config/redis.config";
import { sendEmail } from "../../utils/sendEmail";
import AppError from "../../errorHelpers/AppError";

const OTP_EXPIRATION = 2 * 60; // 2minute

const generateOtp = (length = 6) => {
  // default 6 digit otp
  const otp = crypto.randomInt(10 ** (length - 1), 10 ** length).toString(); // output -> 100,000-999,999
  return otp;
};

const sendOTP = async (email: string, name: string) => {
  const otp = generateOtp();

  const redisKey = `otp:${email}`;

  await redisClient.set(redisKey, otp, {
    expiration: {
      type: "EX",
      value: OTP_EXPIRATION,
    },
  });

  await sendEmail({
    to: email,
    subject: "Your OTP Code",
    templateName: "otp",
    templateData: {
      name: name,
      otp: otp,
    },
  });

  // ----
};

const verifyOTP = async (email: string, otp: string) => {
  const user = await User.findOne({ email });

  if (!user) throw new AppError(401, "User Not Found");
  if (user?.isVerified) throw new AppError(401, "You are already verified");

  const redisKey = `otp:${email}`;

  const savedOtp = await redisClient.get(redisKey);

  if (!savedOtp) throw new AppError(401, "Invalid OTP");

  if (savedOtp !== otp) throw new AppError(401, "Invalid OTP");

  await Promise.all([
    await User.updateOne({ email }, { isVerified: true }, { runValidators: true }),
    await redisClient.del([redisKey]),
  ]);
};

export const OTPService = {
  sendOTP,
  verifyOTP,
};
