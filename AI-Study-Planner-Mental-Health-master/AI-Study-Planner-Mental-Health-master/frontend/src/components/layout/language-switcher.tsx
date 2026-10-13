"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { useLocaleStore, type Locale } from "@/store/locale"

export function LanguageSwitcher() {
    const t = useTranslations("common")
    const { locale, setLocale } = useLocaleStore()

    const switchLocale = (nextLocale: Locale) => {
        if (nextLocale !== locale) setLocale(nextLocale)
    }

    return (
        <div className="flex items-center rounded-md border border-gray-200 p-0.5" aria-label={t("language")}>
            <Button
                type="button"
                variant={locale === "en" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => switchLocale("en")}
                aria-pressed={locale === "en"}
            >
                EN
            </Button>
            <Button
                type="button"
                variant={locale === "fr" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => switchLocale("fr")}
                aria-pressed={locale === "fr"}
            >
                FR
            </Button>
        </div>
    )
}
