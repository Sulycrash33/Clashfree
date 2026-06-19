import NextAuth, { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from './db'
import { compare } from 'bcryptjs'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: 'SA' | 'IA' | 'TO' | 'LC' | 'ST'
      institutionId?: string
      facultyId?: string
    }
  }
  interface User {
    id: string
    email: string
    name: string
    role: 'SA' | 'IA' | 'TO' | 'LC' | 'ST'
    institutionId?: string | null
    facultyId?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: 'SA' | 'IA' | 'TO' | 'LC' | 'ST'
    institutionId?: string | null
    facultyId?: string | null
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            name: true,
            passwordHash: true,
            role: true,
            institutionId: true,
            facultyId: true,
            isActive: true,
          },
        })

        if (!user || !user.isActive) {
          return null
        }

        const passwordMatch = await compare(credentials.password, user.passwordHash)

        if (!passwordMatch) {
          return null
        }

        // Update last login
        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as 'SA' | 'IA' | 'TO' | 'LC' | 'ST',
          institutionId: user.institutionId,
          facultyId: user.facultyId,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.institutionId = user.institutionId
        token.facultyId = user.facultyId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.institutionId = token.institutionId ?? undefined
        session.user.facultyId = token.facultyId ?? undefined
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
