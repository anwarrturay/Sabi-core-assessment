import express from "express"
import { extractMetadata } from "../controllers/pdf.js";
const uploadRouter = express.Router();

uploadRouter.post('/upload', extractMetadata);

export default uploadRouter;