import App from "./lib/server";
import { config as configDotenv } from "dotenv";
import { printAppInfo } from "./utils/print-app-info";
import moment = require("moment");

configDotenv();
moment.locale("id");

const app = new App();
const express = app.express;

const port = process.env.API_PORT || 3000;
express.listen(port, () => {
  // console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
  printAppInfo(
    `http://localhost:${port}`,
    process.env.NODE_ENV || "DEVELOPMENT"
  );
});

process.on("SIGINT", async () => {
  await app.disconnectPrisma();
  console.log("\n⚡️[server]: Server is stopped");
  process.exit();
});
