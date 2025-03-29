import { Hono } from "hono";
import tournamentsRoute from "./tournaments-route";

export const protectedRoutes = new Hono();

protectedRoutes.route("/tournaments", tournamentsRoute);
