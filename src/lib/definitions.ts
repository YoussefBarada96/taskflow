import * as z from "zod";

export const SignupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  // bcrypt only uses the first 72 bytes, so longer passwords would be silently truncated
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password must be at most 72 characters."),
});

export const LoginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1),
});

export const NameSchema = z
  .string("Name is required.")
  .trim()
  .min(1, "Name is required.")
  .max(60, "Name must be at most 60 characters.");

export type NameFormState = { error?: string } | undefined;

export const TitleSchema = z
  .string("Title is required.")
  .trim()
  .min(1, "Title is required.")
  .max(200, "Title must be at most 200 characters.");

export const TaskUpdateSchema = z.object({
  title: TitleSchema,
  description: z.string().trim().max(5000, "Description is too long."),
  dueDate: z.union([z.iso.date("Enter a valid date."), z.literal("")]),
  assigneeId: z.string(),
});

export type TaskFormState = { error?: string; saved?: boolean } | undefined;

export const CommentSchema = z
  .string("Comment can't be empty.")
  .trim()
  .min(1, "Comment can't be empty.")
  .max(2000, "Comments are limited to 2000 characters.");

export const InviteSchema = z.object({
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  role: z.enum(["MEMBER", "ADMIN"], "Choose a valid role."),
});

export type InviteFormState = { error?: string; ok?: boolean } | undefined;

export type FormState =
  | {
      errors?: { name?: string[]; email?: string[]; password?: string[] };
      message?: string;
      values?: { name?: string; email?: string };
    }
  | undefined;
