import { Router } from "express";
import { AuthenticatedUserController } from "./controllers/AuthenticateUserController";

const router = Router();

router.post("/authenticate", new AuthenticatedUserController().handle);

export { router };