import dotenv from "dotenv";

dotenv.config();

interface EnvConfig {
  PROT: string;
  MONGO_URI: string;
  NODE_ENV: "development" | "production";
}

const loadEnvVariables = (): EnvConfig => {
  const requiredEnvVariables: string[] = ["PORT", "MONGO_URI", "NODE_ENV"];

  requiredEnvVariables.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`Missing require environment variable ${key}`);
    }
  });

  return {
    PROT: process.env.PORT as string,
    MONGO_URI: process.env.MONGO_URI as string,
    NODE_ENV: process.env.NODE_ENV as "development" | "production",
  };
};

export const envVars = loadEnvVariables();
