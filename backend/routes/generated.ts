import { Router } from "express";
import { Polibatam } from "../lib/polibatam";

const generatedRoutes = Router()
  .get("/pegawai", Polibatam.GeneratePegawai)
  .get("/unit", Polibatam.GenerateUnit);

export { generatedRoutes };
