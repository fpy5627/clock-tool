import { redirect } from "@/i18n/navigation";
import { newStripeClient } from "@/integrations/stripe";
import { handleCheckoutSession } from "@/services/stripe";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const session_id = searchParams.get("session_id");
  const order_no = searchParams.get("order_no");

  const locale = searchParams.get("locale") || "en";
  let redirectUrl = "";

  try {
    if (!session_id || !order_no) {
      throw new Error("invalid params");
    }

    const client = newStripeClient();

    const session = await client
      .stripe()
      .checkout.sessions.retrieve(session_id);

    await handleCheckoutSession(client.stripe(), session);

    console.log("stripe callback session: ", session);

    redirectUrl = process.env.NEXT_PUBLIC_PAY_SUCCESS_URL || "/";
  } catch (e) {
    console.log("handle stripe callback failed: ", e);
    redirectUrl = process.env.NEXT_PUBLIC_PAY_FAIL_URL || "/";
  }

  // Build full redirect URL with locale
  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || "";
  const fullRedirectUrl = locale === "en" 
    ? `${baseUrl}${redirectUrl}`
    : `${baseUrl}/${locale}${redirectUrl}`;

  // Use NextResponse.redirect to add X-Robots-Tag header
  return NextResponse.redirect(fullRedirectUrl, {
    headers: {
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
