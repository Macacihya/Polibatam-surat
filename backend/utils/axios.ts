import axios from "axios";
import https from "https";
import * as cheerio from "cheerio";

import { ENV } from "../constants";

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

const polibatamInstance = axios.create({
  baseURL: "https://sid.polibatam.ac.id/api/v1.php",
  headers: {
    "Content-Type": "multipart/form-data",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    Expires: "0",
  },
  httpsAgent,
});

// catch error response
polibatamInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 403) {
      const html = error.response.data;

      console.log("HTML:", html);

      try {
        const $ = cheerio.load(html);
        const title = $("title").text();
        const heading = $("h1").text();
        const paragraph = $("p").text();

        const errorMessage = `[POLIBATAM API] ${title} - ${heading}: ${paragraph}`;
        console.error("Error Message:", errorMessage);

        // Return a custom error message
        return Promise.reject(new Error(errorMessage));
      } catch (parsingError) {
        console.error("Error parsing HTML:", (parsingError as any).message);
        return Promise.reject(new Error("An unknown 403 error occurred."));
      }
    }

    // For other errors, pass them along as is
    return Promise.reject(error);
  }
);

export { polibatamInstance };
