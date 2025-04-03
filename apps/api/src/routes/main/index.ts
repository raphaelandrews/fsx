import { Hono } from "hono";
import playersRoute from "./players-route";
import postsRoute from "./posts-route";

export const mainRoutes = new Hono();

mainRoutes.route("/players", playersRoute);
mainRoutes.route("/posts", postsRoute);
