import { notFound } from "next/navigation";

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  // Page is disabled
  notFound();
}
