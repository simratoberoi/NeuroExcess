import { Storage } from "@plasmohq/storage"
import { useEffect, useState } from "~node_modules/@types/react"

export interface AuthSession {
  token: string | null
  accessibilityNeeds: string[]
  signedInAt: number
}

const AUTH_SESSION_KEY = "auth:session"


export const authStorage = new Storage({ area: "local" })

export async function getAuthSession(): Promise<AuthSession | undefined> {
  return authStorage.get<AuthSession>(AUTH_SESSION_KEY)
}

export async function setAuthSession(session: AuthSession): Promise<void> {
  await authStorage.set(AUTH_SESSION_KEY, session)
}

export async function clearAuthSession(): Promise<void> {
  await authStorage.remove(AUTH_SESSION_KEY)
}
