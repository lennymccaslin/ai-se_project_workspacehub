import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../hooks/useAuth";
import { commentService } from "../services/commentService";
import type { Comment, User } from "../types/models";
import { canManageComment } from "../utils/permissions";

interface TaskCommentsProps {
  taskId: string;
  users: User[];
}

export const TaskComments = ({ taskId, users }: TaskCommentsProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;

    const loadComments = async () => {
      setLoading(true);
      setError(null);

      try {
        const nextComments = await commentService.list(taskId);
        if (!cancelled) {
          setComments(nextComments);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load comments",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadComments();

    return () => {
      cancelled = true;
    };
  }, [taskId]);

  const authorName = (authorId: string) => {
    const author = users.find((candidate) => candidate._id === authorId);
    return author ? `${author.firstName} ${author.lastName}` : "Unknown user";
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!content.trim()) {
      setError("Comment is required");
      return;
    }

    setError(null);

    try {
      const comment = await commentService.create(taskId, { content });
      setComments((current) => [...current, comment]);
      setContent("");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to add comment",
      );
    }
  };

  const handleDelete = async (comment: Comment) => {
    if (!canManageComment(user, comment)) {
      setError("You do not have permission to delete this comment");
      return;
    }

    setError(null);

    try {
      await commentService.delete(taskId, comment._id);
      setComments((current) =>
        current.filter((candidate) => candidate._id !== comment._id),
      );
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete comment",
      );
    }
  };

  const startEdit = (comment: Comment) => {
    if (!canManageComment(user, comment)) {
      setError("You do not have permission to edit this comment");
      return;
    }

    setError(null);
    setEditingId(comment._id);
    setEditContent(comment.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
    setEditError(null);
  };

  const handleSaveEdit = async (comment: Comment) => {
    if (!canManageComment(user, comment)) {
      setEditError("You do not have permission to edit this comment");
      return;
    }

    if (!editContent.trim()) {
      setEditError("Comment is required");
      return;
    }

    setEditError(null);

    try {
      const updated = await commentService.update(taskId, comment._id, {
        content: editContent,
      });
      setComments((current) =>
        current.map((candidate) =>
          candidate._id === updated._id ? updated : candidate,
        ),
      );
      cancelEdit();
    } catch (saveError) {
      setEditError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update comment",
      );
    }
  };

  return (
    <section
      aria-label="Task comments"
      className="mt-6 border-t border-slate-100 pt-4"
    >
      <h3 className="text-sm font-semibold text-ink">Comments</h3>
      {loading ? (
        <p className="mt-2 text-sm text-slate-500">Loading comments...</p>
      ) : comments.length ? (
        <ul className="mt-3 space-y-3">
          {comments.map((comment) => (
            <li className="rounded-2xl bg-slate-50 px-4 py-3" key={comment._id}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-ink">
                  {authorName(comment.authorId)}
                </p>
                {canManageComment(user, comment) &&
                editingId !== comment._id ? (
                  <div className="flex gap-3">
                    <button
                      className="text-sm text-slate-500 transition hover:opacity-80"
                      onClick={() => startEdit(comment)}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="text-sm text-danger transition hover:opacity-80"
                      onClick={() => void handleDelete(comment)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                ) : null}
              </div>
              {editingId === comment._id ? (
                <div className="mt-2 space-y-2">
                  <textarea
                    className="min-h-16 w-full rounded-2xl border border-slate-200 transition hover:border-slate-300 px-4 py-3"
                    onChange={(event) => setEditContent(event.target.value)}
                    value={editContent}
                  />
                  {editError ? (
                    <p className="text-sm text-danger">{editError}</p>
                  ) : null}
                  <div className="flex gap-3">
                    <button
                      className="rounded-[10px] bg-ink px-4 py-2 text-sm font-medium text-white transition hover:opacity-80 active:opacity-70"
                      onClick={() => void handleSaveEdit(comment)}
                      type="button"
                    >
                      Save
                    </button>
                    <button
                      className="rounded-[10px] px-4 py-2 text-sm text-slate-500 transition hover:opacity-80"
                      onClick={cancelEdit}
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-500">
                  {comment.content}
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-500">No comments yet.</p>
      )}
      <form
        className="mt-3 space-y-2"
        onSubmit={(event) => void handleSubmit(event)}
      >
        <textarea
          className="min-h-16 w-full rounded-2xl border border-slate-200 transition hover:border-slate-300 px-4 py-3 placeholder:text-[#94A3B880]"
          onChange={(event) => setContent(event.target.value)}
          placeholder="Add a comment"
          value={content}
        />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button
          className="rounded-[10px] bg-ink px-4 py-2 text-sm font-medium text-white transition hover:opacity-80 active:opacity-70"
          type="submit"
        >
          Add comment
        </button>
      </form>
    </section>
  );
};
