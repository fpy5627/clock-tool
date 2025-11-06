import { LandingPage } from "@/types/pages/landing";

export async function getLandingPage(locale: string): Promise<LandingPage> {
  return (await getPage("landing", locale)) as LandingPage;
}

export async function getShowcasePage(locale: string): Promise<LandingPage> {
  const landingPage = await getLandingPage(locale);
  // Return only the showcase section from landing page
  return {
    showcase: landingPage.showcase,
  } as LandingPage;
}

export async function getPricingPage(locale: string): Promise<LandingPage> {
  const landingPage = await getLandingPage(locale);
  // Return only the pricing section from landing page
  return {
    pricing: landingPage.pricing,
  } as LandingPage;
}

export async function getPage(
  name: string,
  locale: string
): Promise<LandingPage> {
  try {
    if (locale === "zh-CN") {
      locale = "zh";
    }

    return await import(
      `@/i18n/pages/${name}/${locale.toLowerCase()}.json`
    ).then((module) => module.default);
  } catch (error) {
    console.warn(`Failed to load ${locale}.json, falling back to en.json`);

    return await import(`@/i18n/pages/${name}/en.json`).then(
      (module) => module.default
    );
  }
}
