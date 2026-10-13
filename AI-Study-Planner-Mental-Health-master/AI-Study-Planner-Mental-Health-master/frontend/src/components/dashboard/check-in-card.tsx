"use client"

import { useRouter } from "next/navigation"
import { Smile } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"

export function CheckInCard() {
    const t = useTranslations("dashboard")
    const router = useRouter()

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm h-full flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
                <Smile className="h-8 w-8 text-primary-700" />
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("howFeeling")}</h3>
            <p className="text-sm text-gray-600 text-center mb-4">
                {t("checkInDescription")}
            </p>

            <Button
                onClick={() => router.push("/wellbeing")}
                className="w-full bg-accent-400 text-foreground hover:bg-accent-500"
            >
                {t("checkInNow")}
            </Button>
        </div>
    )
}
