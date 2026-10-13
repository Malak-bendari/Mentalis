"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Wind, RefreshCcw, Droplet, Activity, Timer, Zap, Sparkles, Brain, Coffee, Play } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"
import { cn } from "@/lib/utils"

interface Intervention {
    id: number
    title: string
    description?: string
    category: string
    estimated_duration_minutes: number
    recommended_for?: Record<string, unknown>
    recommended?: boolean
}

interface MoodCheckin {
    created_at: string
    stress_level: number
}

interface InterventionSession {
    id: number
}

type IconType = React.ComponentType<{ className?: string }>
const iconMap: Record<string, IconType> = {
    "breathing": Wind,
    "cognitive": Brain,
    "physical": Activity,
    "hydration": Droplet,
    "focus": RefreshCcw,
    "rest": Coffee,
    "motivation": Zap,
    "default": Sparkles
}

const gradientMap: Record<string, string> = {
    "breathing": "bg-primary-500",
    "cognitive": "bg-primary-600",
    "physical": "bg-success-600",
    "hydration": "bg-primary-400",
    "focus": "bg-accent-500",
    "rest": "bg-primary-300",
    "motivation": "bg-accent-400",
    "default": "bg-primary-500"
}

export function MicroInterventions() {
    const t = useTranslations("wellbeing")
    const [interventions, setInterventions] = useState<Intervention[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [loadError, setLoadError] = useState(false)
    const [activeSession, setActiveSession] = useState<{ id: number; interventionId: number } | null>(null)
    const [startingInterventionId, setStartingInterventionId] = useState<number | null>(null)
    const [isCompleting, setIsCompleting] = useState(false)
    const [actionError, setActionError] = useState(false)

    useEffect(() => {
        let isMounted = true

        const fetchInterventions = async () => {
            setIsLoading(true)
            setLoadError(false)
            try {
                const [interventionsResult, moodResult] = await Promise.allSettled([
                    api.get<Intervention[]>("/interventions/", { params: { limit: 100 } }),
                    api.get<MoodCheckin[]>("/mood/", { params: { limit: 60 } }),
                ])

                if (interventionsResult.status !== "fulfilled") {
                    throw interventionsResult.reason
                }

                const moodHistory = moodResult.status === "fulfilled" && Array.isArray(moodResult.value.data)
                    ? moodResult.value.data
                    : []
                const latestMood = moodHistory
                    .slice()
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
                const highStress = Number(latestMood?.stress_level) >= 7
                const items = (Array.isArray(interventionsResult.value.data) ? interventionsResult.value.data : [])
                    .map((item) => ({
                        ...item,
                        recommended: highStress && item.recommended_for?.stress === "high",
                    }))
                    .sort((a, b) => Number(b.recommended) - Number(a.recommended))
                    .slice(0, 6)

                if (isMounted) setInterventions(items)
            } catch (error) {
                console.error("Failed to fetch interventions", error)
                if (isMounted) {
                    setInterventions([])
                    setLoadError(true)
                }
            } finally {
                if (isMounted) setIsLoading(false)
            }
        }

        void fetchInterventions()
        return () => { isMounted = false }
    }, [])

    const startIntervention = async (interventionId: number) => {
        if (activeSession || startingInterventionId !== null) return
        setStartingInterventionId(interventionId)
        setActionError(false)
        try {
            const response = await api.post<InterventionSession>("/interventions/session/start", {
                intervention_id: interventionId,
            })
            setActiveSession({ id: response.data.id, interventionId })
        } catch (error) {
            console.error("Failed to start intervention session", error)
            setActionError(true)
        } finally {
            setStartingInterventionId(null)
        }
    }

    const completeIntervention = async () => {
        if (!activeSession || isCompleting) return
        setIsCompleting(true)
        setActionError(false)
        try {
            await api.post(`/interventions/session/${activeSession.id}/complete`, {
                completed_at: new Date().toISOString(),
            })
            setActiveSession(null)
        } catch (error) {
            console.error("Failed to complete intervention session", error)
            setActionError(true)
        } finally {
            setIsCompleting(false)
        }
    }

    const getIcon = (category: string) => iconMap[category.toLowerCase()] || iconMap["default"]
    const getGradient = (category: string) => gradientMap[category.toLowerCase()] || gradientMap["default"]

    const recommendedCount = interventions.filter(i => i.recommended).length

    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-bold">{t("quickWellbeingBreaks")}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            {recommendedCount > 0 ? t("recommendedBreakCount", { count: recommendedCount }) : t("noRecommendedBreaks")}
                        </p>
                    </div>
                    <div className="p-2 rounded-lg bg-success-600 text-white">
                        <Sparkles className="h-5 w-5" />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {activeSession && (
                    <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="status">
                        {t("activeInterventionWarning")}
                    </div>
                )}
                {actionError && (
                    <div className="mb-4 text-sm text-destructive" role="alert">
                        {t("interventionActionError")}
                    </div>
                )}
                {isLoading ? (
                    <div className="grid grid-cols-2 gap-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-32 rounded-lg skeleton" />
                        ))}
                    </div>
                ) : loadError ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">{t("interventionsLoadError")}</div>
                ) : interventions.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">{t("noInterventionsAvailable")}</div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {interventions.map((intervention) => {
                            const Icon = getIcon(intervention.category)
                            const gradient = getGradient(intervention.category)

                            return (
                                <div
                                    key={intervention.id}
                                    className="group relative p-4 rounded-xl border bg-card hover:shadow-lg transition-all card-hover cursor-pointer"
                                >
                                    {intervention.recommended && (
                                        <Badge className="absolute -top-2 -right-2 bg-accent-200 text-foreground border-0 shadow-soft">
                                            <Sparkles className="h-3 w-3 mr-1" />
                                            {t("recommended")}
                                        </Badge>
                                    )}

                                    <div className="flex flex-col h-full">
                                        <div className={cn(
                                            "w-10 h-10 rounded-lg flex items-center justify-center mb-3",
                                            gradient
                                        )}>
                                            <Icon className="h-5 w-5 text-foreground" />
                                        </div>

                                        <h3 className="font-semibold text-sm mb-1">{intervention.title}</h3>
                                        {intervention.description && (
                                            <p className="text-xs text-muted-foreground mb-3 flex-1">
                                                {intervention.description}
                                            </p>
                                        )}

                                        <div className="flex items-center justify-between mt-auto">
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Timer className="h-3 w-3" />
                                                <span>{intervention.estimated_duration_minutes} min</span>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 px-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                                                disabled={Boolean(activeSession && activeSession.interventionId !== intervention.id) || startingInterventionId !== null || isCompleting}
                                                onClick={() => activeSession?.interventionId === intervention.id ? void completeIntervention() : void startIntervention(intervention.id)}
                                            >
                                                <Play className="h-3 w-3 mr-1" />
                                                {startingInterventionId === intervention.id
                                                    ? t("startingIntervention")
                                                    : activeSession?.interventionId === intervention.id
                                                        ? isCompleting ? t("completingIntervention") : t("completeIntervention")
                                                        : t("startIntervention")}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
