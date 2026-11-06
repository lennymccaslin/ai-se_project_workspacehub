import { Types } from "mongoose";
import { Comment } from "../models/Comment";
import type { AuthPayload } from "../types/domain";
import { AppError } from "../utils/appError";
import { requireString } from "../utils/validators";
import { canManageComment } from "./permissionService";
import { getTaskById } from "./taskService";

const MAX_COMMENT_LENGTH = 1000;

const assertValidId = (id: string, field: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(`${field} is invalid`, 400);
  }
};

const parseContent = (value: unknown) => {
  const content = requireString(value, "Content");

  if (content.length > MAX_COMMENT_LENGTH) {
    throw new AppError(
      `Content must be at most ${MAX_COMMENT_LENGTH} characters`,
      400,
    );
  }

  return content;
};

// Rejects bad ids, then confirms the task exists in the actor's organization.
const ensureTaskAccessible = async (actor: AuthPayload, taskId: string) => {
  assertValidId(taskId, "Task ID");
  return getTaskById(actor.organizationId, taskId);
};

const getCommentForTask = async (
  actor: AuthPayload,
  taskId: string,
  commentId: string,
) => {
  await ensureTaskAccessible(actor, taskId);
  assertValidId(commentId, "Comment ID");

  const comment = await Comment.findOne({
    _id: commentId,
    taskId,
    organizationId: actor.organizationId,
  });

  if (!comment) {
    throw new AppError("Comment not found", 404);
  }

  return comment;
};

export const listComments = async (actor: AuthPayload, taskId: string) => {
  await ensureTaskAccessible(actor, taskId);

  return Comment.find({
    taskId,
    organizationId: actor.organizationId,
  }).sort({ createdAt: 1 });
};

export const createComment = async (
  actor: AuthPayload,
  taskId: string,
  payload: Record<string, unknown>,
) => {
  await ensureTaskAccessible(actor, taskId);
  const content = parseContent(payload.content);

  return Comment.create({
    taskId,
    authorId: actor.userId,
    organizationId: actor.organizationId,
    content,
  });
};

export const updateComment = async (
  actor: AuthPayload,
  taskId: string,
  commentId: string,
  payload: Record<string, unknown>,
) => {
  const comment = await getCommentForTask(actor, taskId, commentId);

  if (!canManageComment(actor, String(comment.authorId))) {
    throw new AppError("You do not have permission to edit this comment", 403);
  }

  comment.content = parseContent(payload.content);
  await comment.save();
  return comment;
};

export const deleteComment = async (
  actor: AuthPayload,
  taskId: string,
  commentId: string,
) => {
  const comment = await getCommentForTask(actor, taskId, commentId);

  if (!canManageComment(actor, String(comment.authorId))) {
    throw new AppError(
      "You do not have permission to delete this comment",
      403,
    );
  }

  await comment.deleteOne();
  return { deleted: true };
};
