"use client";

import * as React from "react";
import { signIn } from "@/lib/auth-client";
import { requestMagicLink } from "@/app/actions/auth";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Icons } from "@/components/icons";

export function UserAuthForm({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const [isSuccess, setIsSuccess] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState<boolean>(false);
  const [isAppleLoading, setIsAppleLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const email = formData.get("email") as string;

    try {
      const rateLimitResult = await requestMagicLink(email.toLowerCase());

      if (!rateLimitResult.success) {
        setError(rateLimitResult.error || "Too many requests.");
        setIsLoading(false);
        return;
      }

      const result = await signIn.magicLink({
        email: email.toLowerCase(),
        callbackURL: "/",
      });

      setIsLoading(false);

      if (result?.error) {
        setError(result.error.message || "Failed to send magic link");
        return;
      }

      setIsSuccess(true);
    } catch (error) {
      console.error("Sign in error:", error);
      setError("An unexpected error occurred.");
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <div className={cn("grid gap-6", className)} {...props}>
        <div className="flex flex-col items-center justify-center space-y-4 rounded-[2rem] border border-emerald-500/20 bg-emerald-500/10 p-10 text-center glass-card">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/20">
            <Icons.check className="h-8 w-8 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-emerald-400">
              Check your email
            </h3>
            <p className="text-sm text-white/40 leading-relaxed">
              We sent you a login link. Be sure to check your spam too.
            </p>
          </div>
          <button
            onClick={() => setIsSuccess(false)}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "rounded-2xl mt-4",
            )}
          >
            Try different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <form onSubmit={onSubmit}>
        <div className="grid gap-4">
          <div className="grid gap-1">
            <label className="sr-only" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              disabled={isLoading || isGoogleLoading || isAppleLoading}
              className="flex h-14 w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-2 text-base text-white placeholder:text-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
            />
            {error && (
              <p className="text-xs text-rose-400 mt-2 font-bold uppercase tracking-wider">
                {error}
              </p>
            )}
          </div>
          <button
            className={cn(
              buttonVariants(),
              "h-14 rounded-2xl font-black uppercase text-sm",
            )}
            disabled={isLoading}
          >
            {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Sign In with Email
          </button>
        </div>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/5" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
          <span className="bg-[#0a0a0c] px-4 text-white/20">
            Or continue with
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-14 rounded-2xl",
          )}
          onClick={async () => {
            setIsGoogleLoading(true);
            await signIn.social({
              provider: "google",
              callbackURL: "/",
            });
          }}
          disabled={isLoading || isGoogleLoading || isAppleLoading}
        >
          {isGoogleLoading ? (
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Icons.google className="mr-2 h-4 w-4" />
          )}
          Google
        </button>
        <button
          type="button"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-14 rounded-2xl",
          )}
          onClick={async () => {
            setIsAppleLoading(true);
            await signIn.social({
              provider: "apple",
              callbackURL: "/",
            });
          }}
          disabled={isLoading || isGoogleLoading || isAppleLoading}
        >
          {isAppleLoading ? (
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Icons.apple className="mr-2 h-4 w-4" />
          )}
          Apple
        </button>
      </div>
    </div>
  );
}
