import express from "express";
import {
  createApplication,
  getApplications,
  getApplicationById,
} from "../controllers/applicationController";

const router = express.Router();

router.route("/").post(createApplication).get(getApplications);
router.route("/:id").get(getApplicationById);

export default router;
