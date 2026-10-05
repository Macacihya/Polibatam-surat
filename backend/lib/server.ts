import express, { Application, Response, Request } from "express";
import cors from "cors";
import logger from "morgan";
import cookieParser from "cookie-parser";
import routes from "../routes";
import prisma from "../lib/prisma";
import path from "path";
import { InternalServerError } from "../utils/api-response";
import { ErrorHandler } from "../middlewares/error-handler";
import { logWithoutConsole } from "./logger";

class App {
  public express: Application;

  constructor() {
    this.express = express();

    this.middlewares();
    this.disableSettings();
    this.routes();
    this.errorHandler();

    this.connectPrisma().catch((e) => {
      logWithoutConsole({
        level: "error",
        message: e,
      });
      throw e;
    });
  }

  private middlewares(): void {
    this.express
      .use(cors())
      .use(logger("dev"))
      .use(express.json())
      .use(express.urlencoded({ extended: false }))
      .use(cookieParser())
      .use(express.static("public"));
  }

  private disableSettings(): void {
    this.express.disable("x-powered-by");
  }

  private routes(): void {
    const apiVersion = process.env.API_VERSION || "v1";
    const preRoute = `/${apiVersion}`;

    this.express.use(`${preRoute}/`, routes);

    // document
    const publicDir = path.join(process.cwd(), "public");
    this.express.use("/repository", express.static(publicDir));

    this.express.get("/", (req: Request, res: Response) => {
      res.sendFile(path.join(publicDir, "index.html"));
    });
  }

  private errorHandler(): void {
    // this.express.use(ErrorHandler);
    console.log("error");
  }

  // ===============================================================================
  // PRISMA
  // ===============================================================================

  public async connectPrisma(): Promise<void> {
    await prisma.$connect();
  }

  public async disconnectPrisma(): Promise<void> {
    await prisma.$disconnect();
  }
}

export default App;
