import z from "zod";
import { Role } from "./user.interface";

export const createUserZodSchema = z.object({
  name: z
    .string({ invalid_type_error: "Name must be string" })
    .min(3, { message: "Name must be at least 3 characters long." })
    .max(50, { message: "Name cannot exceed 50 characters." }),

  email: z
    .string({ invalid_type_error: "Email must be string" })
    .email({ message: "Invalid email address format." })
    .min(5, { message: "Email must be at least 5 characters long." })
    .max(100, { message: "Email cannot exceed 100 characters." }),

  // 1 uppercase, 1 special character, 1 digit, 8 characters min
  password: z
    .string()
    .min(8)
    .regex(/^(?=.*[A-Z])/, { message: "Password must contain at least 1 uppercase" })
    .regex(/^(?=.*[!@#$%^&*])/, { message: "Password must contain at least 1 uppercase letter." })
    .regex(/^(?=.*\d)/, { message: "Password must contain at least 1 number." }),

  phone: z
    .string({ invalid_type_error: "Phone Number must be string" })
    .regex(/^(?:\+8801\d{9})$/, {
      message: "Phone Number must be valid for Bangladesh. Format: +8801XXXXXXXXX or 01XXXXXXXXX",
    })
    .optional(),

  address: z
    .string({ invalid_type_error: "Address must be string" })
    .max(200, { message: "Address cannot exceed 200 characters." })
    .optional(),
});

export const updateUserZodSchema = z.object({
  name: z
    .string({ invalid_type_error: "Name must be string" })
    .min(3, { message: "Name must be at least 3 characters long." })
    .max(50, { message: "Name cannot exceed 50 characters." })
    .optional(),

  // 1 uppercase, 1 special character, 1 digit, 8 characters min
  password: z
    .string()
    .min(8)
    .regex(/^(?=.*[A-Z])/, { message: "Password must contain at least 1 uppercase" })
    .regex(/^(?=.*[!@#$%^&*])/, { message: "Password must contain at least 1 uppercase letter." })
    .regex(/^(?=.*\d)/, { message: "Password must contain at least 1 number." })
    .optional(),

  phone: z
    .string({ invalid_type_error: "Phone Number must be string" })
    .regex(/^(?:\+8801\d{9})$/, {
      message: "Phone Number must be valid for Bangladesh. Format: +8801XXXXXXXXX or 01XXXXXXXXX",
    })
    .optional(),

  address: z
    .string({ invalid_type_error: "Address must be string" })
    .max(200, { message: "Address cannot exceed 200 characters." })
    .optional(),

  // .enum(["ADMIN", "GUIDE", "USER", "SUPER_ADMIN"])
  role: z.enum(Object.values(Role) as [string]).optional(),

  isActive: z.boolean({ error: "isDelete must be true or false" }).optional(),

  isVerified: z.boolean({ error: "isVerified must be true or false" }).optional(),
});
