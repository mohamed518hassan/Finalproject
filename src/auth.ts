import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const SIGN_IN_URL = "https://ecommerce.routemisr.com/api/v1/auth/signin";

function readToken(value: unknown): string | undefined {
  if (
    typeof value === "object" &&
    value !== null &&
    "token" in value &&
    typeof value.token === "string" &&
    value.token.length > 0
  ) {
    return value.token;
  }
  return undefined;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (
          typeof credentials.email !== "string" ||
          typeof credentials.password !== "string"
        ) {
          return null;
        }

        let response: Response;
        try {
          response = await fetch(SIGN_IN_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
            cache: "no-store",
          });
        } catch {
          return null;
        }

        if (!response.ok) return null;

        let body: unknown;
        try {
          body = await response.json();
        } catch {
          return null;
        }

        const backendToken = readToken(body);
        if (!backendToken) return null;

        return {
          id: credentials.email,
          email: credentials.email,
          backendToken,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.backendToken) token.backendToken = user.backendToken;
      return token;
    },
    session({ session }) {
      return session;
    },
  },
});
