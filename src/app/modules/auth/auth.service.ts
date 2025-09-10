import AppError from "../../errorHelpers/AppError";
import { User } from "../user/user.model";
import httpStatus from "http-status-codes";
import bcrypt from "bcryptjs";
import { createNewAccessTokenWithRefreshToken } from "../../utils/userTokens";
import { JwtPayload } from "jsonwebtoken";
import { envVars } from "../../config/env";
import { IAuthProvider, IsActive } from "../user/user.interface";
import jwt from "jsonwebtoken";
import { sendEmail } from "../../utils/sendEmail";

// const credentialsLogin = async (payload: Partial<IUser>) => {
//   const { email, password } = payload;

//   const isUserExist = await User.findOne({ email });

//   if (!isUserExist) throw new AppError(httpStatus.BAD_REQUEST, "Email does not exist");

//   const isPasswordMatched = await bcrypt.compare(password as string, isUserExist.password as string);

//   if (!isPasswordMatched) throw new AppError(httpStatus.BAD_REQUEST, "Incorrect Password");

//   // const jwtPayload = { userId: isUserExist._id, email: isUserExist.email, role: isUserExist.role };
//   // // jwt token give user
//   // // const accessToken = jwt.sign(jwtPayload, "secret", { expiresIn: "1d" });
//   // const accessToken = generateToken(jwtPayload, envVars.JWT_ACCESS_SECRET, envVars.JWT_ACCESS_EXPIRES);

//   // const refreshToken = generateToken(jwtPayload, envVars.JWT_REFRESH_SECRET, envVars.JWT_REFRESH_EXPIRES);

//   const userTokens = createUserTokens(isUserExist);

//   const { password: pass, ...rest } = isUserExist.toObject();

//   return { accessToken: userTokens.accessToken, refreshToken: userTokens.refreshToken, user: rest };
// };

const getNewAccessToken = async (refreshToken: string) => {
  const newAccessToken = await createNewAccessTokenWithRefreshToken(refreshToken);

  return { accessToken: newAccessToken };
};

const changePassword = async (oldPassword: string, newPassword: string, decodedToken: JwtPayload) => {
  const user = await User.findById(decodedToken.userId);

  const isOldPasswordMatch = await bcrypt.compare(oldPassword, user?.password as string);

  if (!isOldPasswordMatch) throw new AppError(httpStatus.UNAUTHORIZED, "Old Password does not matched");

  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User Not Found");

  user.password = await bcrypt.hash(newPassword, Number(envVars.BCRYPT_SALT_ROUND));

  user?.save();
};

const setPassword = async (userId: string, plainPassword: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(404, "User Not Found");
  }

  if (user.password && user.auths.some((providerObject) => providerObject.provider === "google")) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "you have already set you password. Now you can change the password from your profile password update"
    );
  }

  const hashPassword = await bcrypt.hash(plainPassword, Number(envVars.BCRYPT_SALT_ROUND));
  user.password = hashPassword;

  const credentialProvider: IAuthProvider = {
    provider: "credentials",
    providerId: user.email,
  };
  const auths: IAuthProvider[] = [...user.auths, credentialProvider];
  user.auths = auths;

  await user.save();
};

const forgotPassword = async (email: string) => {
  const isUserExist = await User.findOne({ email });

  if (!isUserExist) throw new AppError(httpStatus.BAD_REQUEST, "User does not exist");

  if (isUserExist.isActive === IsActive.BLOCKED || isUserExist.isActive === IsActive.INACTIVE) {
    throw new AppError(httpStatus.BAD_REQUEST, `User is ${isUserExist.isActive}`);
  }

  if (isUserExist.isDeleted) throw new AppError(httpStatus.BAD_REQUEST, "User is Deleted");
  if (!isUserExist.isVerified) throw new AppError(httpStatus.BAD_REQUEST, "User is not verified");

  const jwtPayload = {
    userId: isUserExist._id,
    email: isUserExist.email,
    role: isUserExist.role,
  };

  const resetToken = jwt.sign(jwtPayload, envVars.JWT_ACCESS_SECRET, { expiresIn: "10m" });

  const resetUILink = `${envVars.FRONTEND_URL}/reset-password?id=${isUserExist._id}&token=${resetToken}`;

  sendEmail({
    to: isUserExist.email,
    subject: "Password Reset",
    templateName: "forgetPassword",
    templateData: {
      name: isUserExist.name,
      resetUILink: resetUILink,
    },
  });

  /**
   * http://localhost:5173/reset-password?id=68bf9ec02871dd56638d6196&token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGJmOWVjMDI4NzFkZDU2NjM4ZDYxOTYiLCJlbWFpbCI6ImRpcG9uZ2tvcnJveTAwMDAwQGdtYWlsLmNvbSIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzU3MzkwMDAzLCJleHAiOjE3NTczOTA2MDN9.oa5KAgKXKBfBxg7GEWvI8qcNrk1f_Y1t-cSzxBwOEjk
   */

  // -----
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const resetPassword = async (payload: Record<string, any>, decodedToken: JwtPayload) => {
  if (payload.id !== decodedToken.userId) throw new AppError(401, "You can not reset your password");

  const isUserExist = await User.findById(decodedToken.userId);
  if (!isUserExist) throw new AppError(401, "User does not exit");

  const hashPassword = await bcrypt.hash(payload.newPassword, Number(envVars.BCRYPT_SALT_ROUND));

  isUserExist.password = hashPassword;

  await isUserExist.save();
};

// user -> login - token (email, role, _id) -booking - token / payment cancel - token

export const AuthServices = {
  // credentialsLogin,
  getNewAccessToken,
  changePassword,
  setPassword,
  forgotPassword,
  resetPassword,
};
