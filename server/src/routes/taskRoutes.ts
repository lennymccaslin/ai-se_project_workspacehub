import { Router } from "express";
import {
  createTaskController,
  deleteTaskController,
  getTaskController,
  listTasksController,
  updateTaskController,
} from "../controllers/taskController";
import {
  createCommentController,
  deleteCommentController,
  listCommentsController,
  updateCommentController,
} from "../controllers/commentController";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(asyncHandler(requireAuth));

router.get("/", asyncHandler(listTasksController));
router.post("/", asyncHandler(createTaskController));
router.get("/:id", asyncHandler(getTaskController));
router.patch("/:id", asyncHandler(updateTaskController));
router.delete("/:id", asyncHandler(deleteTaskController));

router.get("/:id/comments", asyncHandler(listCommentsController));
router.post("/:id/comments", asyncHandler(createCommentController));
router.patch("/:id/comments/:commentId", asyncHandler(updateCommentController));
router.delete(
  "/:id/comments/:commentId",
  asyncHandler(deleteCommentController),
);

export default router;
