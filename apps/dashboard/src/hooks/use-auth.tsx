import { signIn, signUp, useSession, signOut } from "@/lib/auth-client";

export const useAuth = () => {
  const { data: session, isPending, error, refetch } = useSession();

  return {
    user: session?.user || null,
    session: session?.session || null,
    isPending,
    error,
    refetch,
    isAuthenticated: !!session?.user,
    signIn,
    signOut,
    signUp,
  };
};
