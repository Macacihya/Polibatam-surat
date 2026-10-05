import { config as configDotenv } from "dotenv";

configDotenv();

export const ENV = {
  APP_URL: process.env.APP_URL ?? "https://sk.polibatam.ac.id/backend",
  POLIBATAM_API_URL:
    process.env.POLIBATAM_API_URL ?? "https://sid.polibatam.ac.id/api/v1.php",

  API_VERSION: process.env.API_VERSION ?? "api/v1",
  API_PORT: process.env.API_PORT ?? "3000",

  LOG_DIR: process.env.LOG_DIR ?? "./logs",

  ENCRYPTION_KEY:
    process.env.ENCRYPTION_KEY ?? "sdfsdfsd345jbjbefjsh345hj34g5hjg",

  JWT_SECRET: process.env.JWT_SECRET ?? "ca15ea787cbba167897603f9c0ec7b96",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
};
