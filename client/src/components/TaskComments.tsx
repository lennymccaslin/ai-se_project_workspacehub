import { useId, useState, type FormEvent } from "react";
import { useAuth } from "../hooks/useAuth";
import { commentService } from "../services/commentService";
import type { Comment, User } from "../types/models";
import { formatDateTime } from "../utils/date";
import { canManageComment } from "../utils/permissions";

interface TaskCommentsProps {
  taskId: string;
  users: User[];
  commentCount: number;
}

export const TaskComments = ({
  taskId,
  users,
  commentCount,
}: TaskCommentsProps) => {
  const { user } = useAuth();
  const panelId = useId();
  const [isExpanded, setIsExpanded] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadState, setLoadState] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const loadComments = async (): Promise<void> => {
    setLoadState("loading");
    setLoadError(null);
    try {
      const loaded = await commentService.list(taskId);
      setComments(loaded);
      setLoadState("ready");
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Unable to load comments",
      );
      setLoadState("error");
    }
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    const trimmed = content.trim();
    if (!user || !trimmed || busy) return;
    setActionError(null);
    setBusy(true);
    try {
      const comment = await commentService.create(taskId, { content: trimmed });
      setComments((current) => [comment, ...current]);
      setContent("");
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to create comment",
      );
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async (comment: Comment): Promise<void> => {
    const trimmed = editContent.trim();
    if (!canManageComment(user, comment) || !trimmed || busy) return;
    setActionError(null);
    setBusy(true);
    try {
      const updated = await commentService.update(taskId, comment._id, {
        content: trimmed,
      });
      setComments((current) =>
        current.map((item) => (item._id === updated._id ? updated : item)),
      );
      setEditingId(null);
      setEditContent("");
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to update comment",
      );
    } finally {
      setBusy(false);
    }
  };

  const deleteComment = async (comment: Comment): Promise<void> => {
    if (!canManageComment(user, comment) || busy) return;
    setActionError(null);
    setBusy(true);
    try {
      await commentService.delete(taskId, comment._id);
      setComments((current) =>
        current.filter((item) => item._id !== comment._id),
      );
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to delete comment",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        aria-controls={isExpanded ? panelId : undefined}
        aria-expanded={isExpanded}
        className="ml-auto rounded-[10px] bg-ink px-4 py-2 text-sm font-medium text-white transition hover:opacity-80 active:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => {
          if (!isExpanded && loadState === "idle") {
            void loadComments();
          }
          setIsExpanded((current) => !current);
        }}
        type="button"
      >
        {isExpanded
          ? "Hide Comments"
          : `Show Comments (${loadState === "ready" ? comments.length : commentCount})`}
      </button>
      {isExpanded ? (
        <div
          className="mt-4 basis-full space-y-4 rounded-2xl border border-slate-200 p-4"
          id={panelId}
        >
          {loadState === "loading" ? (
            <p className="text-sm text-slate-500" role="status">
              Loading comments...
            </p>
          ) : loadState === "error" ? (
            <div className="space-y-2">
              <p className="text-sm text-danger" role="alert">
                {loadError}
              </p>
              <button
                className="text-sm text-ink underline"
                onClick={() => void loadComments()}
                type="button"
              >
                Retry loading comments
              </button>
            </div>
          ) : loadState === "ready" ? (
            <>
              <form
                className="space-y-3"
                onSubmit={(event) => void handleSubmit(event)}
              >
                <textarea
                  aria-label="Write a comment"
                  className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 transition hover:border-slate-300 disabled:bg-slate-100"
                  disabled={busy}
                  maxLength={1000}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Write a comment"
                  value={content}
                />
                <button
                  className="rounded-[10px] bg-ink px-4 py-2 text-sm font-medium text-white transition hover:opacity-80 active:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!user || !content.trim() || busy}
                  type="submit"
                >
                  Add comment
                </button>
              </form>
              {actionError ? (
                <p className="text-sm text-danger" role="alert">
                  {actionError}
                </p>
              ) : null}
              {comments.length ? (
                <ul className="space-y-3">
                  {comments.map((comment) => {
                    const author = users.find(
                      (candidate) => candidate._id === comment.authorId,
                    );
                    const canManage = canManageComment(user, comment);

                    return (
                      <li
                        className="rounded-2xl border border-slate-200 px-4 py-3"
                        key={comment._id}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-ink">
                            {author
                              ? `${author.firstName} ${author.lastName}`
                              : "Unknown user"}
                          </p>
                          <div className="flex flex-wrap items-center gap-3">
                            <time
                              className="text-sm text-slate-500"
                              dateTime={comment.createdAt}
                            >
                              {formatDateTime(comment.createdAt)}
                            </time>
                            {canManage && editingId !== comment._id ? (
                              <>
                                <button
                                  className="text-sm text-slate-500 transition hover:opacity-80"
                                  disabled={busy}
                                  onClick={() => {
                                    setEditingId(comment._id);
                                    setEditContent(comment.content);
                                  }}
                                  type="button"
                                >
                                  Edit
                                </button>
                                <button
                                  className="text-sm text-danger transition hover:opacity-80"
                                  disabled={busy}
                                  onClick={() => void deleteComment(comment)}
                                  type="button"
                                >
                                  Delete
                                </button>
                              </>
                            ) : null}
                          </div>
                        </div>
                        {editingId === comment._id && canManage ? (
                          <div className="mt-2 space-y-2">
                            <textarea
                              aria-label="Edit comment"
                              className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 transition hover:border-slate-300 disabled:bg-slate-100"
                              disabled={busy}
                              maxLength={1000}
                              onChange={(event) =>
                                setEditContent(event.target.value)
                              }
                              value={editContent}
                            />
                            <div className="flex gap-3">
                              <button
                                className="rounded-[10px] bg-ink px-4 py-2 text-sm font-medium text-white transition hover:opacity-80 active:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={!editContent.trim() || busy}
                                onClick={() => void saveEdit(comment)}
                                type="button"
                              >
                                Save
                              </button>
                              <button
                                className="rounded-[10px] px-4 py-2 text-sm text-slate-500 transition hover:opacity-80"
                                disabled={busy}
                                onClick={() => setEditingId(null)}
                                type="button"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-500">
                            {comment.content}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No comments yet.</p>
              )}
            </>
          ) : null}
        </div>
      ) : null}
    </>
  );
};
