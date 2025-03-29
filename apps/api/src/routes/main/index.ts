import { Hono } from "hono";
import playersRoute from "./players-route";

export const mainRoutes = new Hono();

mainRoutes.route("/players", playersRoute);
