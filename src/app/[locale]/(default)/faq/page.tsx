import FAQ from "@/components/blocks/faq";
import { getLandingPage } from "@/services/page";

export default async function FAQPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const page = await getLandingPage(locale);

  return <>{page.faq && <FAQ section={page.faq} />}</>;
}

