import AppError from "../../errorHelpers/AppError";
import { IUser } from "../user/user.interface";
import { User } from "../user/user.model";
import httpStatus from "http-status-codes";
import bcrypt from "bcryptjs";
import { generateToken } from "../../utils/jwt";
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

  const jwtPayload = { userId: isUserExist._id, email: isUserExist.email, role: isUserExist.role };
  // jwt token give user
  // const accessToken = jwt.sign(jwtPayload, "secret", { expiresIn: "1d" });
  const accessToken = generateToken(jwtPayload, envVars.JWT_ACCESS_SECRET, envVars.JWT_ACCESS_EXPIRES);

  const refreshToken = generateToken(jwtPayload, envVars.JWT_REFRESH_SECRET, envVars.JWT_REFRESH_EXPIRES);

  const { password: pass, ...rest } = isUserExist.toObject();

  return { accessToken, refreshToken, user: rest };
};

// user -> login - token (email, role, _id) -booking - token / payment cancel - token

export const AuthServices = { credentialsLogin };
