"use client"

import { NextIntlClientProvider } from "next-intl"
import { useEffect } from "react"
import en from "../../messages/en.json"
import fr from "../../messages/fr.json"
import { useLocaleStore } from "@/store/locale"

const messages = { en, fr }

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const locale = useLocaleStore((state) => state.locale)

    useEffect(() => {
        document.documentElement.lang = locale
    }, [locale])

    return (
        <NextIntlClientProvider locale={locale} messages={messages[locale]}>
            {children}
        </NextIntlClientProvider>
    )
}
