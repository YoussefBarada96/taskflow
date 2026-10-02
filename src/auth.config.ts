import type { NextAuthConfig } from "next-auth";

// Kept free of Prisma/bcrypt so proxy.ts can import it without loading native modules.
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage =
        nextUrl.pathname === "/login" || nextUrl.pathname === "/signup";

      if (isAuthPage) {
        return isLoggedIn
          ? Response.redirect(new URL("/dashboard", nextUrl))
          : true;
      }
      return isLoggedIn;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
} satisfies NextAuthConfig;
