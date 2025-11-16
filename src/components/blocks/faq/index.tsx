import { Section as SectionType } from "@/types/blocks/section";

export default function FAQ({ section }: { section: SectionType }) {
  if (section.disabled) {
    return null;
  }

  return (
    <section id={section.name}>
        <div className="w-full flex justify-center" style={{ paddingLeft: 'clamp(8px, 2vw, 32px)', paddingRight: 'clamp(8px, 2vw, 32px)' }}>
          <div className="inline-block px-2 sm:px-6 pt-8 sm:pt-10 md:pt-12 pb-8 sm:pb-12" style={{
            width: '100%',
            minWidth: '280px',
            maxWidth: 'min(1400px, 95vw)'
          }}>
            <div className="text-center">
              <h2 className="mt-4 text-4xl font-semibold">{section.title}</h2>
              <p className="mt-6 font-medium text-gray-500 dark:text-slate-400">
                {section.description}
              </p>
            </div>
            <div className="mx-auto mt-14 grid gap-8 md:grid-cols-2 md:gap-12">
              {section.items?.map((item, index) => (
                <div key={index} className="flex gap-4">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-sm border border-primary font-mono text-xs text-primary">
                    {index + 1}
                  </span>
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                    </div>
                    <p className="text-md text-gray-500 dark:text-slate-400">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
    </section>
  );
}
