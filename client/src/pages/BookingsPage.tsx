import { useEffect, useState, type FormEvent } from "react";
import { PageHeader } from "../components/PageHeader";
import { StatusPanel } from "../components/StatusPanel";
import { useAuth } from "../hooks/useAuth";
import { bookingService } from "../services/bookingService";
import type { Booking } from "../types/models";
import { formatDateTimeInput } from "../utils/date";
import { canDeleteResources, canEditBooking } from "../utils/permissions";
import {
  validateBookingFormState,
  type BookingField,
  type BookingFormState,
} from "../utils/bookingValidation";

type BookingTouched = Partial<Record<BookingField, boolean>>;

const allFieldsTouched: Record<BookingField, boolean> = {
  title: true,
  description: true,
  startsAt: true,
  endsAt: true,
};

const buildBookingFormState = (booking: Booking): BookingFormState => ({
  title: booking.title,
  description: booking.description,
  startsAt: formatDateTimeInput(booking.startsAt),
  endsAt: formatDateTimeInput(booking.endsAt),
});

export const BookingsPage = () => {
  const { isFeatureEnabled, user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingEdits, setBookingEdits] = useState<
    Record<string, BookingFormState>
  >({});
  const [createState, setCreateState] = useState<BookingFormState>({
    title: "",
    description: "",
    startsAt: "",
    endsAt: "",
  });
  const [createTouched, setCreateTouched] = useState<BookingTouched>({});
  const [editTouched, setEditTouched] = useState<
    Record<string, BookingTouched>
  >({});
  const [loading, setLoading] = useState(true);
  const [createError, setCreateError] = useState<string | null>(null);
  const [bookingErrors, setBookingErrors] = useState<Record<string, string>>(
    {},
  );

  useEffect(() => {
    const loadBookings = async () => {
      if (!isFeatureEnabled("scheduling")) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setCreateError(null);

      try {
        const nextBookings = await bookingService.list();
        setBookings(nextBookings);
        setBookingEdits(
          Object.fromEntries(
            nextBookings.map((booking) => [
              booking._id,
              buildBookingFormState(booking),
            ]),
          ),
        );
      } catch (loadError) {
        setCreateError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load bookings",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadBookings();
  }, [isFeatureEnabled]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateError(null);

    if (Object.keys(validateBookingFormState(createState)).length) {
      setCreateTouched(allFieldsTouched);
      return;
    }

    try {
      const booking = await bookingService.create(createState);
      setBookings((current) =>
        [...current, booking].sort((left, right) =>
          left.startsAt.localeCompare(right.startsAt),
        ),
      );
      setBookingEdits((current) => ({
        ...current,
        [booking._id]: buildBookingFormState(booking),
      }));
      setCreateState({
        title: "",
        description: "",
        startsAt: "",
        endsAt: "",
      });
      setCreateTouched({});
      setCreateError(null);
    } catch (createError) {
      setCreateError(
        createError instanceof Error
          ? createError.message
          : "Unable to create booking",
      );
    }
  };

  const handleEdit = (
    bookingId: string,
    field: keyof BookingFormState,
    value: string,
  ) => {
    setBookingEdits((current) => ({
      ...current,
      [bookingId]: {
        ...current[bookingId],
        [field]: value,
      },
    }));
  };

  const handleSave = async (bookingId: string) => {
    const booking = bookings.find((item) => item._id === bookingId);

    if (!booking || !canEditBooking(user, booking)) {
      return;
    }

    setBookingErrors((current) => ({ ...current, [bookingId]: "" }));

    const formState = bookingEdits[bookingId] ?? buildBookingFormState(booking);
    if (Object.keys(validateBookingFormState(formState)).length) {
      setEditTouched((current) => ({
        ...current,
        [bookingId]: allFieldsTouched,
      }));
      return;
    }

    try {
      const updatedBooking = await bookingService.update(bookingId, formState);
      setBookings((current) =>
        current.map((booking) =>
          booking._id === bookingId ? updatedBooking : booking,
        ),
      );
      setBookingEdits((current) => ({
        ...current,
        [bookingId]: buildBookingFormState(updatedBooking),
      }));
      setEditTouched((current) => ({ ...current, [bookingId]: {} }));
      setBookingErrors((current) => ({ ...current, [bookingId]: "" }));
    } catch (saveError) {
      setBookingErrors((current) => ({
        ...current,
        [bookingId]:
          saveError instanceof Error
            ? saveError.message
            : "Unable to update booking",
      }));
    }
  };

  const handleDelete = async (bookingId: string) => {
    try {
      await bookingService.delete(bookingId);
      setBookings((current) =>
        current.filter((booking) => booking._id !== bookingId),
      );
    } catch (deleteError) {
      setBookingErrors((current) => ({
        ...current,
        [bookingId]:
          deleteError instanceof Error
            ? deleteError.message
            : "Unable to delete booking",
      }));
    }
  };

  const touchCreateField = (field: BookingField) =>
    setCreateTouched((current) => ({ ...current, [field]: true }));

  const touchEditField = (bookingId: string, field: BookingField) =>
    setEditTouched((current) => ({
      ...current,
      [bookingId]: { ...current[bookingId], [field]: true },
    }));

  const createErrors = validateBookingFormState(createState);

  if (!isFeatureEnabled("scheduling")) {
    return (
      <StatusPanel
        title="Scheduling disabled"
        message="This page is hidden by the organization feature flags."
      />
    );
  }

  if (loading) {
    return (
      <StatusPanel
        title="Loading bookings"
        message="Fetching schedule items."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="Manage simple shared bookings with conflict prevention on the API."
        title="Bookings"
      />
      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <form
          className="rounded-3xl bg-white p-6 shadow-sm"
          onSubmit={(event) => void handleCreate(event)}
        >
          <h2 className="text-xl font-semibold text-ink">Create booking</h2>
          <div className="mt-4 space-y-4">
            <div>
              <input
                className="w-full rounded-2xl border border-slate-200 transition hover:border-slate-300 px-4 py-3 placeholder:text-[#94A3B880]"
                onBlur={() => touchCreateField("title")}
                onChange={(event) =>
                  setCreateState((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="Booking title"
                value={createState.title}
              />
              {createTouched.title && createErrors.title ? (
                <p className="mt-1 text-sm text-danger">{createErrors.title}</p>
              ) : null}
            </div>
            <textarea
              className="min-h-28 w-full rounded-2xl border border-slate-200 transition hover:border-slate-300 px-4 py-3 placeholder:text-[#94A3B880]"
              onChange={(event) =>
                setCreateState((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Booking description"
              value={createState.description}
            />
            <div>
              <input
                className="w-full rounded-2xl border border-slate-200 transition hover:border-slate-300 px-4 py-3"
                onBlur={() => touchCreateField("startsAt")}
                onChange={(event) =>
                  setCreateState((current) => ({
                    ...current,
                    startsAt: event.target.value,
                  }))
                }
                type="datetime-local"
                value={createState.startsAt}
              />
              {createTouched.startsAt && createErrors.startsAt ? (
                <p className="mt-1 text-sm text-danger">
                  {createErrors.startsAt}
                </p>
              ) : null}
            </div>
            <div>
              <input
                className="w-full rounded-2xl border border-slate-200 transition hover:border-slate-300 px-4 py-3"
                onBlur={() => touchCreateField("endsAt")}
                onChange={(event) =>
                  setCreateState((current) => ({
                    ...current,
                    endsAt: event.target.value,
                  }))
                }
                type="datetime-local"
                value={createState.endsAt}
              />
              {createTouched.endsAt && createErrors.endsAt ? (
                <p className="mt-1 text-sm text-danger">
                  {createErrors.endsAt}
                </p>
              ) : null}
            </div>
            {createError ? (
              <p className="text-sm text-danger">{createError}</p>
            ) : null}
            <button
              className="rounded-[12px] bg-ink px-4 py-3 font-medium text-white transition hover:opacity-80 active:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
              type="submit"
            >
              Create booking
            </button>
          </div>
        </form>
        {bookings.length ? (
          <ul className="space-y-4">
            {bookings.map((booking) => {
              const canEdit = canEditBooking(user, booking);
              const formState =
                bookingEdits[booking._id] ?? buildBookingFormState(booking);
              const errors = validateBookingFormState(formState);
              const touched = editTouched[booking._id] ?? {};

              return (
                <li key={booking._id}>
                  <article className="rounded-3xl bg-white p-6 shadow-sm">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <input
                          className="w-full rounded-2xl border border-slate-200 transition hover:border-slate-300 px-4 py-3 disabled:bg-slate-100"
                          disabled={!canEdit}
                          onBlur={() => touchEditField(booking._id, "title")}
                          onChange={(event) =>
                            handleEdit(booking._id, "title", event.target.value)
                          }
                          value={formState.title}
                        />
                        {touched.title && errors.title ? (
                          <p className="mt-1 text-sm text-danger">
                            {errors.title}
                          </p>
                        ) : null}
                      </div>
                      <textarea
                        className="min-h-24 rounded-2xl border border-slate-200 transition hover:border-slate-300 px-4 py-3 disabled:bg-slate-100 md:col-span-2"
                        disabled={!canEdit}
                        onChange={(event) =>
                          handleEdit(
                            booking._id,
                            "description",
                            event.target.value,
                          )
                        }
                        value={formState.description}
                      />
                      <div>
                        <input
                          className="w-full rounded-2xl border border-slate-200 transition hover:border-slate-300 px-4 py-3 disabled:bg-slate-100"
                          disabled={!canEdit}
                          onBlur={() => touchEditField(booking._id, "startsAt")}
                          onChange={(event) =>
                            handleEdit(
                              booking._id,
                              "startsAt",
                              event.target.value,
                            )
                          }
                          type="datetime-local"
                          value={formState.startsAt}
                        />
                        {touched.startsAt && errors.startsAt ? (
                          <p className="mt-1 text-sm text-danger">
                            {errors.startsAt}
                          </p>
                        ) : null}
                      </div>
                      <div>
                        <input
                          className="w-full rounded-2xl border border-slate-200 transition hover:border-slate-300 px-4 py-3 disabled:bg-slate-100"
                          disabled={!canEdit}
                          onBlur={() => touchEditField(booking._id, "endsAt")}
                          onChange={(event) =>
                            handleEdit(
                              booking._id,
                              "endsAt",
                              event.target.value,
                            )
                          }
                          type="datetime-local"
                          value={formState.endsAt}
                        />
                        {touched.endsAt && errors.endsAt ? (
                          <p className="mt-1 text-sm text-danger">
                            {errors.endsAt}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    {bookingErrors[booking._id] ? (
                      <p className="mt-4 text-sm text-danger">
                        {bookingErrors[booking._id]}
                      </p>
                    ) : null}
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        className="rounded-[10px] bg-ink px-4 py-2 text-sm font-medium text-white transition hover:opacity-80 active:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={!canEdit}
                        onClick={() => void handleSave(booking._id)}
                        type="button"
                      >
                        Save
                      </button>
                      {canDeleteResources(user) ? (
                        <button
                          className="rounded-[10px] px-5 py-2.5 text-sm font-normal text-danger transition hover:bg-rose-50 active:opacity-70"
                          onClick={() => void handleDelete(booking._id)}
                          type="button"
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        ) : (
          <StatusPanel
            title="No bookings"
            message="Add the first scheduling entry for this organization."
          />
        )}
      </section>
    </div>
  );
};
