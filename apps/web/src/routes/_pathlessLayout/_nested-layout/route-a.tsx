import { useAuth } from '@/hooks/use-auth';
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/_pathlessLayout/_nested-layout/route-a')(
  {
    component: LayoutAComponent,
  },
)

function LayoutAComponent() {
  const { user, isPending, isAuthenticated } = useAuth();

  if (isPending) {
    return (
      <main className="container mx-auto py-12 min-h-[50vh] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-gray-300 border-t-blue-500 animate-spin" />
          <p className="text-lg font-medium text-gray-700">Loading...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <main className="container mx-auto py-12 min-h-[50vh] flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please sign in to access this content
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/login"
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Login
            </Link>
            <span className="self-center text-gray-500">or</span>
            <Link
              to="/register"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Register
            </Link>
          </div>
        </div>
      </main>
    );
  }
  
  return <div>I'm layout A!</div>
}
