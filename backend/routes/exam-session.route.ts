import express from "express";
import { examSessionController } from "@controllers/exam-session";
import { authorizeRole } from "@middleware/authorize-role";
import { authenticateUser  } from "@middleware/authenticate-user";
import { asyncHandler } from "@middleware/async-handler";
import { examController } from "@controllers/exam/index"; 

const router = express.Router();

router.get("/committee", authenticateUser, authorizeRole("committee"), asyncHandler(examController.getExamByCommitteeController));
router.get("/student/schedule", authenticateUser, authorizeRole("student"), asyncHandler(examSessionController.getScheduleByStudentController));
router.get("/batchId", authenticateUser, authorizeRole("admin"), asyncHandler(examSessionController.getExamSessionByBatchController));

//add committee into exam session
router.post("/add-committee", authenticateUser, authorizeRole("admin"), asyncHandler(examSessionController.addComitteeToExamSessionController));
router.get("/applicant/:id", authenticateUser,authorizeRole("committee", "admin"), asyncHandler(examSessionController.getApplicantByExamSessionController));

//create exam session
router.post("/:batchId", authenticateUser, authorizeRole("admin"), asyncHandler(examSessionController.createExamSessionController));

//update exam session
router.patch("/:id", authenticateUser, authorizeRole("admin"), asyncHandler(examSessionController.updateExamSessionController));
router.get("/:id",authenticateUser, authorizeRole("admin", "committee"), asyncHandler(examSessionController.getExamSessionDetailController));
router.get("/batch/:id", authenticateUser, authorizeRole("admin"), asyncHandler(examSessionController.getExamSessionByBatchController));

export default router;
