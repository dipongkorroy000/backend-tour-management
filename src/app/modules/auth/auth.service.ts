import AppError from "../../errorHelpers/AppError";
import { IUser } from "../user/user.interface";
import { User } from "../user/user.model";
import httpStatus from "http-status-codes";
import bcrypt from "bcryptjs";
import { createNewAccessTokenWithRefreshToken, createUserTokens } from "../../utils/userTokens";
import { JwtPayload } from "jsonwebtoken";
import { envVars } from "../../config/env";

const credentialsLogin = async (payload: Partial<IUser>) => {
  const { email, password } = payload;

  const isUserExist = await User.findOne({ email });

  if (!isUserExist) {
    throw new AppError(httpStatus.BAD_REQUEST, "Email does not exist");
  }

  const isPasswordMatched = await bcrypt.compare(password as string, isUserExist.password as string);

  if (!isPasswordMatched) {
    throw new AppError(httpStatus.BAD_REQUEST, "Incorrect Password");
  }

  // const jwtPayload = { userId: isUserExist._id, email: isUserExist.email, role: isUserExist.role };
  // // jwt token give user
  // // const accessToken = jwt.sign(jwtPayload, "secret", { expiresIn: "1d" });
  // const accessToken = generateToken(jwtPayload, envVars.JWT_ACCESS_SECRET, envVars.JWT_ACCESS_EXPIRES);

  // const refreshToken = generateToken(jwtPayload, envVars.JWT_REFRESH_SECRET, envVars.JWT_REFRESH_EXPIRES);

  const userTokens = createUserTokens(isUserExist);

  const { password: pass, ...rest } = isUserExist.toObject();

  return { accessToken: userTokens.accessToken, refreshToken: userTokens.refreshToken, user: rest };
};

const getNewAccessToken = async (refreshToken: string) => {
  const newAccessToken = await createNewAccessTokenWithRefreshToken(refreshToken);

  return { accessToken: newAccessToken };
};

const resetPassword = async (oldPassword: string, newPassword: string, decodedToken: JwtPayload) => {
  const user = await User.findById(decodedToken.userId);

  const isOldPasswordMatch = await bcrypt.compare(oldPassword, user?.password as string);

  if (!isOldPasswordMatch) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Old Password does not matched");
  }

  user.password = await bcrypt.hash(newPassword, Number(envVars.BCRYPT_SALT_ROUND));

  user?.save();
};

// user -> login - token (email, role, _id) -booking - token / payment cancel - token

export const AuthServices = { credentialsLogin, getNewAccessToken, resetPassword };
