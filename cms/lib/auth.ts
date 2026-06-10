import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { TeamMember } from "./types";

function getTeamMembers(): TeamMember[] {
  try {
    return JSON.parse(process.env.TEAM_MEMBERS_JSON || "[]");
  } catch {
    return [];
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const member = getTeamMembers().find(
          (m) => m.email.toLowerCase() === credentials.email.toLowerCase()
        );
        if (!member || member.password !== credentials.password) return null;
        return { id: member.email, email: member.email, name: member.name, role: member.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = (user as any).role;
      return token;
    },
    session({ session, token }) {
      if (session.user) (session.user as any).role = token.role;
      return session;
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};
