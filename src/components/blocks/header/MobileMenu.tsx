"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Header as HeaderType } from "@/types/blocks/header";
import Icon from "@/components/icon";
import { Link } from "@/i18n/navigation";
import { Menu } from "lucide-react";
import LocaleToggle from "@/components/locale/toggle";
import { cn } from "@/lib/utils";
import ClockNavItemsMobile from "./ClockNavItemsMobile";

export default function MobileMenu({ header }: { header: HeaderType }) {
  return (
    <div className="block lg:hidden">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2"
        >
          {header.brand?.logo?.src && (
            <img
              src={header.brand.logo.src}
              alt={header.brand?.title || "Timero Logo"}
              className="w-8"
              style={{ background: 'transparent' }}
            />
          )}
          {header.brand?.title && (
            <span className="text-xl font-bold">
              {header.brand?.title || ""}
            </span>
          )}
        </Link>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="default" size="icon">
              <Menu className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>
                <Link
                  href="/"
                  className="flex items-center gap-2"
                >
                  {header.brand?.logo?.src && (
                    <img
                      src={header.brand.logo.src}
                      alt={header.brand?.title || "Timero Logo"}
                      className="w-8 mix-blend-screen"
                      style={{ background: 'transparent' }}
                    />
                  )}
                  {header.brand?.title && (
                    <span className="text-xl font-bold">
                      {header.brand?.title || ""}
                    </span>
                  )}
                </Link>
              </SheetTitle>
            </SheetHeader>
            <div className="mb-8 mt-8 flex flex-col gap-4">
              <ClockNavItemsMobile />
              <Accordion type="single" collapsible className="w-full">
                {header.nav?.items?.map((item, i) => {
                  if (item.children && item.children.length > 0) {
                    return (
                      <AccordionItem
                        key={i}
                        value={item.title || ""}
                        className="border-b-0"
                      >
                        <AccordionTrigger className="mb-4 py-0 font-semibold hover:no-underline text-left">
                          {item.title}
                        </AccordionTrigger>
                        <AccordionContent className="mt-2">
                          {item.children.map((iitem, ii) => (
                            <Link
                              key={ii}
                              className={cn(
                                "flex select-none gap-4 rounded-md p-3 leading-none outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                              )}
                              href={iitem.url as any}
                              target={iitem.target}
                            >
                              {iitem.icon && (
                                <Icon
                                  name={iitem.icon}
                                  className="size-4 shrink-0"
                                />
                              )}
                              <div>
                                <div className="text-sm font-semibold">
                                  {iitem.title}
                                </div>
                                <p className="text-sm leading-snug text-muted-foreground">
                                  {iitem.description}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  }
                  return (
                    <Link
                      key={i}
                      href={item.url as any}
                      target={item.target}
                      className="font-semibold my-4 flex items-center gap-2 px-4"
                    >
                      {item.icon && (
                        <Icon
                          name={item.icon}
                          className="size-4 shrink-0"
                        />
                      )}
                      {item.title}
                    </Link>
                  );
                })}
              </Accordion>
            </div>
            <div className="flex-1"></div>
            <div className="border-t pt-4">
              <div className="mt-2 flex flex-col gap-3">
                {header.buttons?.map((item, i) => {
                  return (
                    <Button key={i} variant={item.variant}>
                      <Link
                        href={item.url as any}
                        target={item.target || ""}
                        className="flex items-center gap-1"
                      >
                        {item.title}
                        {item.icon && (
                          <Icon
                            name={item.icon}
                            className="size-4 shrink-0"
                          />
                        )}
                      </Link>
                    </Button>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center gap-2">
                {header.show_locale && <LocaleToggle />}
                <div className="flex-1"></div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

