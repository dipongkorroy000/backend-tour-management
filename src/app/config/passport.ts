import passport from "passport";
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from "passport-google-oauth20";
import { envVars } from "./env";
import { User } from "../modules/user/user.model";
import { IsActive, Role } from "../modules/user/user.interface";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import AppError from "../errorHelpers/AppError";
import httpStatus from "http-status-codes";

passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    async (email: string, password: string, done) => {
      try {
        const isUserExist = await User.findOne({ email });
        // if (!isUserExist) return done(null, false, { message: "User Does Not Exist" });
        // alternative
        if (!isUserExist) return done("User Does Not Exist");

        const isGoogleAuthenticated = isUserExist.auths.some(
          (providerObjects) => providerObjects.provider === "google"
        );
        if (isGoogleAuthenticated && !isUserExist.password) {
          return done(
            "You have authenticated through Google. So if you want to login with credentials, then at first with google and set a password your Gmail and then you can login with email and password"
          );
        }

        if (isUserExist.isActive === IsActive.BLOCKED || isUserExist.isActive === IsActive.INACTIVE)
          return done(`User is ${isUserExist.isActive}`);

        if (!isUserExist.isVerified) return done("User is not verified");
        if (isUserExist.isDeleted) {
          // return done("User is Deleted");
          throw new AppError(httpStatus.BAD_REQUEST, "User is Deleted");
        }

        const isPasswordMatched = await bcrypt.compare(password as string, isUserExist.password as string);
        if (!isPasswordMatched) return done(null, false, { message: "Password Does Not Matched" });

        return done(null, isUserExist);
      } catch (err) {
        done(err);
      }
    }
  )
);

passport.use(
  new GoogleStrategy(
    {
      clientID: envVars.GOOGLE_CLIENT_ID,
      clientSecret: envVars.GOOGLE_CLIENT_SECRET,
      callbackURL: envVars.GOOGLE_CALLBACK_URL,
    },
    async (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
      try {
        const email = profile.emails?.[0].value;
        if (!email) return done(null, false, { message: "No Email Found" });

        let isUserExist = await User.findOne({ email });

        if (isUserExist && (isUserExist.isActive === IsActive.BLOCKED || isUserExist.isActive === IsActive.INACTIVE))
          return done(`User is ${isUserExist.isActive}`);

        if (isUserExist && !isUserExist.isVerified) return done(null, false, { message: "User is not verified" });

        if (isUserExist && isUserExist.isDeleted) return done(null, false, { message: "User is Deleted" });

        if (!isUserExist) {
          isUserExist = await User.create({
            email,
            name: profile.displayName,
            picture: profile.photos?.[0].value,
            role: Role.USER,
            isVerified: true,
            auths: [{ provider: "google", providerId: profile.id }],
          });
        }

        return done(null, isUserExist);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user: any, done: (err: any, id?: unknown) => void) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done: any) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// frontend localhost : 5173 -> localhost:5000/api/v1/auth/google -> passport -> Google OAuth Constant -> gmail login -> successful -> callback url: localhost:5000/api/v1/auth/google/callback

// Bridge -----
// Custom -> email, password, role: USER , name ..... -> registration -> DB

// Google -> req -> google -> successful : JWT Token : Role, email, -> DB -store -> token - api access
