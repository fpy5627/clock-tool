import Footer from "@/components/blocks/footer";
import Header from "@/components/blocks/header";
import FullscreenHandler from "./FullscreenHandler";
import { ReactNode } from "react";
import { getLandingPage } from "@/services/page";

export default async function ClockLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const page = await getLandingPage(locale);

  return (
    <>
      <FullscreenHandler />
      {page.header && <Header header={page.header} />}
      <main className="overflow-x-hidden">{children}</main>
      {page.footer && <Footer footer={page.footer} />}
    </>
  );
}

