/**
 * Auth stub — no authentication in local-first architecture.
 * Returns null user/session so existing code that checks `if (user)` still works.
 * Will be removed entirely once all auth references are cleaned up.
 */

export function useAuth() {
  return {
    user: null as null,
    session: null as null,
    loading: false,
    signUp: async (_email: string, _password: string) => ({ error: new Error('No auth') }),
    signIn: async (_email: string, _password: string) => ({ error: new Error('No auth') }),
    signOut: async () => {},
  }
}
