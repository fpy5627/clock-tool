import SignForm from "@/components/sign/form";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { isAuthEnabled } from "@/lib/auth";
import { Metadata } from "next";
import { getCanonicalUrl } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    alternates: {
      canonical: getCanonicalUrl('/auth/signin', locale),
    },
  };
}

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl: string | undefined }>;
}) {
  const { locale } = await params;
  
  // Don't redirect if auth is disabled, allow access to signin page
  // if (!isAuthEnabled()) {
  //   return redirect(`/${locale}`);
  // }

  const { callbackUrl } = await searchParams;
  const session = await auth();
  
  // Only redirect if user is already logged in and has a callbackUrl
  // Allow access to signin page even if already logged in (for switching accounts, etc.)
  if (session && callbackUrl) {
    // Check if callbackUrl already has locale prefix
    const hasLocale = callbackUrl.startsWith('/en/') || callbackUrl.startsWith('/zh/') || callbackUrl === '/en' || callbackUrl === '/zh';
    if (hasLocale) {
      return redirect(callbackUrl);
    } else {
      // Add locale prefix if missing
      return redirect(`/${locale}${callbackUrl.startsWith('/') ? callbackUrl : '/' + callbackUrl}`);
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="flex h-6 w-6 items-center justify-center rounded-md border text-primary-foreground">
            <img src="/logo.svg" alt="Timero" className="size-4" style={{ background: 'transparent' }} />
          </div>
          {process.env.NEXT_PUBLIC_PROJECT_NAME}
        </a>
        <SignForm />
      </div>
    </div>
  );
}
