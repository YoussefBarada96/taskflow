"use server";

import bcrypt from "bcrypt";
import { AuthError } from "next-auth";
import { Prisma } from "@prisma/client";
import * as z from "zod";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { LoginSchema, SignupSchema, type FormState } from "@/lib/definitions";
import { safeNextPath } from "@/lib/redirect";

const str = (value: FormDataEntryValue | null) =>
  typeof value === "string" ? value : "";

export async function signup(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = { name: str(formData.get("name")), email: str(formData.get("email")) };

  const parsed = SignupSchema.safeParse({
    ...values,
    password: str(formData.get("password")),
  });
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const { name, email, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await prisma.user.create({ data: { name, email, passwordHash } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        errors: { email: ["An account with this email already exists."] },
        values,
      };
    }
    throw error;
  }

  // On success signIn throws a redirect, which Next.js handles.
  await signIn("credentials", {
    email,
    password,
    redirectTo: safeNextPath(formData.get("next")),
  });
}

export async function login(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = { email: str(formData.get("email")) };
  const invalid = { message: "Invalid email or password.", values };

  const parsed = LoginSchema.safeParse({
    ...values,
    password: str(formData.get("password")),
  });
  if (!parsed.success) return invalid;

  try {
    await signIn("credentials", {
      ...parsed.data,
      redirectTo: safeNextPath(formData.get("next")),
    });
  } catch (error) {
    if (error instanceof AuthError) return invalid;
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
