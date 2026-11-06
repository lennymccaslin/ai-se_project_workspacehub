export interface BookingFormState {
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
}

export type BookingField = keyof BookingFormState;
export type BookingFormErrors = Partial<Record<BookingField, string>>;

// Mirrors the server's booking rules so obvious mistakes fail before the request.
export const validateBookingFormState = (
  formState: BookingFormState,
): BookingFormErrors => {
  const errors: BookingFormErrors = {};
  const startsAt = new Date(formState.startsAt);
  const endsAt = new Date(formState.endsAt);

  if (!formState.title.trim()) {
    errors.title = "Title is required";
  } else if (formState.title.trim().length < 2) {
    errors.title = "Title must be at least 2 characters";
  }

  if (!formState.startsAt) {
    errors.startsAt = "Start time is required";
  } else if (Number.isNaN(startsAt.getTime())) {
    errors.startsAt = "Start time must be a valid date";
  }

  if (!formState.endsAt) {
    errors.endsAt = "End time is required";
  } else if (Number.isNaN(endsAt.getTime())) {
    errors.endsAt = "End time must be a valid date";
  }

  if (!errors.startsAt && !errors.endsAt && startsAt >= endsAt) {
    errors.endsAt = "End time must be after the start time";
  }

  return errors;
};
