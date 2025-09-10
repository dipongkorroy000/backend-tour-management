import AppError from "../../errorHelpers/AppError";
import { IAuthProvider, IUser, Role } from "./user.interface";
import { User } from "./user.model";
import httpStatus from "http-status-codes";
import bcrypt from "bcryptjs";
import { envVars } from "../../config/env";
import { JwtPayload } from "jsonwebtoken";

const createUser = async (payload: Partial<IUser>) => {
  const { email, password, ...rest } = payload;

  const isUserExist = await User.findOne({ email });

  if (isUserExist) {
    throw new AppError(httpStatus.BAD_REQUEST, "User Already Exist");
  }

  // password hash by bcryptjs
  const hashedPassword = await bcrypt.hash(password as string, Number(envVars.BCRYPT_SALT_ROUND));
  // const isPasswordMatch = await bcrypt.compare(password as string, hashedPassword)

  const authProvider: IAuthProvider = await { provider: "credentials", providerId: email as string };

  const user = await User.create({ email, password: hashedPassword, auths: [authProvider], ...rest });

  return user;
};

const updateUser = async (userId: string, payload: Partial<IUser>, decodedToken: JwtPayload) => {
  if ((decodedToken.role === Role.USER || decodedToken.role === Role.GUIDE) && userId !== decodedToken.userId)
    throw new AppError(401, "You are not Authorized");

  const isUserExist = await User.findById(userId);
  if (!isUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }

  if (decodedToken.role === Role.ADMIN && isUserExist.role === Role.SUPER_ADMIN) throw new AppError(401, "You are not Authorized");

  if ((decodedToken.role === Role.USER || decodedToken.role === Role.GUIDE) && payload.role) {
    throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
  }

  if (payload.isActive || payload.isDeleted || payload.isVerified) {
    if (decodedToken.role === Role.USER || decodedToken.role === Role.GUIDE) {
      throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
    }
  }

  const newUpdatedUser = await User.findByIdAndUpdate(userId, payload, { new: true, runValidators: true });
  return newUpdatedUser;
};

const getAllUsers = async () => {
  const users = await User.find({});
  const totalUsers = await User.countDocuments();

  return { data: users, meta: { total: totalUsers } };
};

const getSingleUser = async (id: string) => {
  const user = await User.findById(id).select("-password");

  return { data: user };
};

const getMe = async (userId: string) => {
  const user = await User.findById(userId).select("-password");

  return { data: user };
};

export const UserServices = { createUser, getAllUsers, updateUser, getMe, getSingleUser };
