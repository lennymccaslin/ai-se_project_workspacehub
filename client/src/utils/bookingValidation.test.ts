import { describe, expect, it } from "vitest";
import {
  validateBookingFormState,
  type BookingFormState,
} from "./bookingValidation";

const validState: BookingFormState = {
  title: "Team sync",
  description: "Weekly meeting",
  startsAt: "2026-06-01T09:00",
  endsAt: "2026-06-01T10:00",
};

const validate = (overrides: Partial<BookingFormState>) =>
  validateBookingFormState({ ...validState, ...overrides });

describe("validateBookingFormState", () => {
  it("returns an empty object for a valid form", () => {
    expect(validateBookingFormState(validState)).toEqual({});
  });

  it("returns an empty object when the description is blank", () => {
    expect(validate({ description: "" })).toEqual({});
  });

  describe("title", () => {
    it("requires a title when it is empty", () => {
      expect(validate({ title: "" }).title).toBe("Title is required");
    });

    it("requires a title when it is only whitespace", () => {
      expect(validate({ title: "   " }).title).toBe("Title is required");
    });

    it("rejects a one-character title", () => {
      expect(validate({ title: "a" }).title).toBe(
        "Title must be at least 2 characters",
      );
    });

    it("rejects a title that is only one character after trimming", () => {
      expect(validate({ title: "  a  " }).title).toBe(
        "Title must be at least 2 characters",
      );
    });

    it("accepts a two-character title", () => {
      expect(validate({ title: "ab" }).title).toBeUndefined();
    });
  });

  describe("start and end required", () => {
    it("requires a start time when it is empty", () => {
      expect(validate({ startsAt: "" }).startsAt).toBe(
        "Start time is required",
      );
    });

    it("requires an end time when it is empty", () => {
      expect(validate({ endsAt: "" }).endsAt).toBe("End time is required");
    });

    it("reports every missing field at once", () => {
      expect(validate({ title: "", startsAt: "", endsAt: "" })).toEqual({
        title: "Title is required",
        startsAt: "Start time is required",
        endsAt: "End time is required",
      });
    });
  });

  describe("invalid date strings", () => {
    it("rejects an unparseable start time", () => {
      expect(validate({ startsAt: "not-a-date" }).startsAt).toBe(
        "Start time must be a valid date",
      );
    });

    it("rejects an unparseable end time", () => {
      expect(validate({ endsAt: "not-a-date" }).endsAt).toBe(
        "End time must be a valid date",
      );
    });

    it("does not add an ordering error when a date is invalid", () => {
      expect(validate({ startsAt: "not-a-date" }).endsAt).toBeUndefined();
    });
  });

  describe("end time after start time", () => {
    it("rejects an end time earlier than the start time", () => {
      expect(
        validate({ startsAt: "2026-06-01T10:00", endsAt: "2026-06-01T09:00" })
          .endsAt,
      ).toBe("End time must be after the start time");
    });

    it("rejects an end time exactly equal to the start time", () => {
      expect(
        validate({ startsAt: "2026-06-01T09:00", endsAt: "2026-06-01T09:00" })
          .endsAt,
      ).toBe("End time must be after the start time");
    });

    it("accepts an end time one minute after the start time", () => {
      expect(
        validate({ startsAt: "2026-06-01T09:00", endsAt: "2026-06-01T09:01" }),
      ).toEqual({});
    });

    it("attaches the ordering error to endsAt, not startsAt", () => {
      const errors = validate({
        startsAt: "2026-06-01T10:00",
        endsAt: "2026-06-01T09:00",
      });

      expect(errors.startsAt).toBeUndefined();
    });
  });
});
