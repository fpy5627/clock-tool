import { Footer as FooterType } from "@/types/blocks/footer";
import Icon from "@/components/icon";
import { Link } from "@/i18n/navigation";

export default function Footer({ footer }: { footer: FooterType }) {
  if (footer.disabled) {
    return null;
  }

  return (
    <section id={footer.name} className="py-16" data-footer>
      <div className="w-full flex justify-center" style={{ paddingLeft: 'clamp(8px, 2vw, 32px)', paddingRight: 'clamp(8px, 2vw, 32px)' }}>
        <div className="inline-block w-full" style={{
          minWidth: '280px',
          maxWidth: 'min(1400px, 95vw)'
        }}>
          <footer className="px-2 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-10 text-center lg:flex-row lg:text-left">
            <div className="flex w-full max-w-96 shrink flex-col items-center justify-between gap-6 lg:items-start">
              {footer.brand && (
                <div>
                  <div className="flex items-center justify-center gap-2 lg:justify-start">
                    {footer.brand.logo && (
                      <img
                        src={footer.brand.logo.src}
                        alt={footer.brand.logo.alt || footer.brand.title}
                        className="h-11"
                        style={{ background: 'transparent' }}
                      />
                    )}
                    {footer.brand.title && (
                      <p className="text-3xl font-semibold">
                        {footer.brand.title}
                      </p>
                    )}
                  </div>
                  {footer.brand.description && (
                    <p className="mt-6 text-md text-gray-500 dark:text-slate-500">
                      {footer.brand.description}
                    </p>
                  )}
                </div>
              )}
              {footer.social && (
                <ul className="flex items-center space-x-6 text-gray-500 dark:text-slate-500">
                  {footer.social.items?.map((item, i) => (
                    <li key={i} className="font-medium hover:text-primary">
                      {item.url ? (
                        <a href={item.url} target={item.target}>
                          {item.icon && (
                            <Icon name={item.icon} className="size-4" />
                          )}
                        </a>
                      ) : (
                        <span>
                          {item.icon && (
                            <Icon name={item.icon} className="size-4" />
                          )}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex justify-end">
              <div className="grid grid-cols-3 gap-6 lg:gap-20">
                {footer.nav?.items?.map((item, i) => (
                  <div key={i} className="text-right">
                    <p className="mb-6 font-bold">{item.title}</p>
                    <ul className="space-y-4 text-sm text-gray-500 dark:text-slate-500">
                      {item.children?.map((iitem, ii) => (
                        <li key={ii} className="font-medium hover:text-primary">
                          {iitem.url ? (
                            <Link href={iitem.url} target={iitem.target}>
                              {iitem.title}
                            </Link>
                          ) : (
                            <span>{iitem.title}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-8 flex flex-col justify-between gap-4 border-t pt-8 text-center text-sm font-medium text-gray-500 dark:text-slate-500 lg:flex-row lg:items-center lg:text-left">
            {footer.copyright && (
              <p>
                {footer.copyright}
                {process.env.NEXT_PUBLIC_SHOW_POWERED_BY === "false" ? null : (
                  <a
                    href="https://clock.toolina.com"
                    target="_blank"
                    className="px-2 text-primary hover:underline underline-offset-4 font-semibold"
                    style={{ color: 'hsl(var(--primary))' }}
                  >
                    build with Timero
                  </a>
                )}
              </p>
            )}

            {footer.agreement && (
              <ul className="flex justify-center gap-4 lg:justify-start">
                {footer.agreement.items?.map((item, i) => (
                  <li key={i} className="hover:text-primary">
                    {item.url ? (
                      <Link href={item.url} target={item.target}>
                        {item.title}
                      </Link>
                    ) : (
                      <span>{item.title}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          </footer>
        </div>
      </div>
    </section>
  );
}
