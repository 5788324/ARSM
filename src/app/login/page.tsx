import { signIn } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session) redirect('/');

  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 rounded-xl bg-white p-8 shadow-lg dark:bg-zinc-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">ARSM</h1>
          <p className="mt-1 text-sm text-zinc-500">Private Audio Library</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-center text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
            Invalid username or password.
          </div>
        )}

        <form
          action={async (formData) => {
            'use server';
            try {
              await signIn('credentials', {
                username: formData.get('username') as string,
                password: formData.get('password') as string,
                redirectTo: '/',
              });
            } catch (e) {
              // NextAuth throws on invalid credentials
              redirect('/login?error=CredentialsSignin');
            }
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="username" className="block text-sm font-medium">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
