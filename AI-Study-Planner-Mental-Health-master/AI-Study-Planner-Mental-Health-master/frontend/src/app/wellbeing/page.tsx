"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Legend } from "recharts"
import { Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MicroInterventions } from "@/components/dashboard/micro-interventions"

type AdditionalMetrics = {
  focus_level: number
  burnout_indicator: "not_at_all" | "a_little" | "noticeable" | "a_lot"
  productivity_confidence: number
  workload_perception: "yes" | "okay" | "a_bit_much" | "overwhelming"
  physical_state: "fine" | "tired" | "sore" | "low_energy" | "headache" | "stiff_or_tense"
  social_connectedness: "yes_positive" | "yes_neutral" | "yes_stressful" | "not_yet"
  stress_sources: string[]
  motivation_type: "obligation" | "curiosity" | "fear_pressure" | "excitement" | "routine"
  cognitive_load: number
  emotional_intensity: number
  sleep_quality: "great" | "good" | "okay" | "poor" | "very_poor"
  task_aversion: string
  free_time_confidence: "flexible" | "balanced" | "structured"
  gratitude: string
  distraction_triggers: string[]
}

type CheckinState = {
  mood_valence: "very_positive" | "positive" | "neutral" | "negative" | "very_negative"
  energy_level: number
  stress_level: number
  anxiety_level: number
  sleep_hours_last_night: number
  note: string
  additional_metrics: AdditionalMetrics
}
import api from "@/lib/api"
import { useAuthStore } from "@/store/auth"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"

// Activity data (weekly, computed from mood logs)
const initialActivity: { name: string; hours: number }[] = []

export default function WellBeingPage() {
  const locale = useLocale()
  const t = useTranslations("wellbeing")
  const dateLocale = locale === "fr" ? "fr-FR" : "en-US"
  const token = useAuthStore(state => state.token)
  const router = useRouter()
  const [checkin, setCheckin] = useState<CheckinState>({
        mood_valence: "neutral",
        energy_level: 3,
        stress_level: 5,
        anxiety_level: 5,
        sleep_hours_last_night: 7,
        note: "",
        additional_metrics: {
          focus_level: 3,
          burnout_indicator: "not_at_all",
          productivity_confidence: 3,
          workload_perception: "yes",
          physical_state: "fine",
          social_connectedness: "not_yet",
          stress_sources: [] as string[],
          motivation_type: "routine",
          cognitive_load: 3,
          emotional_intensity: 3,
          sleep_quality: "okay",
          task_aversion: "",
          free_time_confidence: "balanced",
          gratitude: "",
          distraction_triggers: [] as string[]
        }
    })
    const [moodHistory, setMoodHistory] = useState<{ date: string; score: number; energy: number; stress: number; cognitive?: number; emotion?: number; prod?: number; fullDate: string }[]>([])
    const [aiInsight, setAiInsight] = useState("")
    const [sleepError, setSleepError] = useState<string | null>(null)
    const [replanOpen, setReplanOpen] = useState(false)
    const [, setReplanSuggestions] = useState<Array<{ start_at: string; end_at: string; title?: string }>>([])
    const [replanAdjusted, setReplanAdjusted] = useState<Array<{ start_at: string; end_at: string; title?: string; selected?: boolean }>>([])
    const [activityData, setActivityData] = useState(initialActivity)
    const [engagementData, setEngagementData] = useState<{ name: string; value: number }[]>([])
    const [streak, setStreak] = useState(0)
    const [checkedInToday, setCheckedInToday] = useState(false)
    const [streakEmoji, setStreakEmoji] = useState("😴")
    const [suggestions, setSuggestions] = useState<Array<{ title: string; description: string; category: string }>>([])
    const [applyOpen, setApplyOpen] = useState(false)
    const [applyItem, setApplyItem] = useState<{ title: string; category: string } | null>(null)
    const [applyStart, setApplyStart] = useState<Date | null>(null)
    const [applyMinutes, setApplyMinutes] = useState<number>(30)

  const fetchMoodHistory = useCallback(async () => {
    try {
      if (!token) return
      const response = await api.get("/mood/", { params: { limit: 60 } })
      // Transform data for chart - mapping valence to score for visualization
            const valenceMap: Record<string, number> = {
                "very_negative": 1,
                "negative": 2,
                "neutral": 3,
                "positive": 4,
                "very_positive": 5
            }

            type MoodLog = { created_at: string; mood_valence: string; energy_level: number; stress_level: number; sleep_hours_last_night?: number; additional_metrics?: { cognitive_load?: number; emotional_intensity?: number; productivity_confidence?: number } }
            const logs = response.data as MoodLog[]
            const dateStrings = new Set(logs.map(l => new Date(l.created_at).toDateString()))
            const today = new Date()
            const isToday = dateStrings.has(today.toDateString())
            let c = 0
            const cursor = new Date(today)
            while (dateStrings.has(cursor.toDateString())) {
                c += 1
                cursor.setDate(cursor.getDate() - 1)
            }
            let emoji = "😴"
            if (c === 1) emoji = "🙂"
            else if (c <= 3) emoji = "😊"
            else if (c <= 6) emoji = "😎"
            else if (c <= 13) emoji = "🔥"
            else emoji = "🏆"
            setCheckedInToday(isToday)
            setStreak(c)
            setStreakEmoji(emoji)
            const formattedData = logs.map((log) => ({
                date: new Date(log.created_at).toLocaleDateString(dateLocale, { weekday: 'short' }),
                score: valenceMap[log.mood_valence] || 3,
                energy: log.energy_level,
                stress: log.stress_level,
                cognitive: Number(log.additional_metrics?.cognitive_load ?? 0) || undefined,
                emotion: Number(log.additional_metrics?.emotional_intensity ?? 0) || undefined,
                prod: Number(log.additional_metrics?.productivity_confidence ?? 0) || undefined,
                fullDate: log.created_at
            })).reverse().slice(0, 7).reverse()
            setMoodHistory(formattedData)
            const now = new Date()
            const sevenDaysAgo = new Date(now)
            sevenDaysAgo.setDate(now.getDate() - 7)
            const lastWeek = logs.filter(l => new Date(l.created_at) >= sevenDaysAgo)
            const sleepSum = lastWeek.reduce((sum, l) => sum + (Number(l.sleep_hours_last_night ?? 0) || 0), 0)
            const checkins = lastWeek.length
            const avgEnergy = lastWeek.length ? (lastWeek.reduce((sum, l) => sum + (Number(l.energy_level) || 0), 0) / lastWeek.length) : 0
            const avgStress = lastWeek.length ? (lastWeek.reduce((sum, l) => sum + (Number(l.stress_level) || 0), 0) / lastWeek.length) : 0
            const avgCognitive = lastWeek.length ? (lastWeek.reduce((sum, l) => sum + (Number(l.additional_metrics?.cognitive_load ?? 0) || 0), 0) / lastWeek.length) : 0

            setActivityData([
              { name: "Sleep (hrs)", hours: Math.round(sleepSum * 10) / 10 },
              { name: "Check-ins (count)", hours: checkins },
            ])
            setEngagementData([
              { name: "Energy (avg)", value: Math.round(avgEnergy * 10) / 10 },
              { name: "Stress (avg)", value: Math.round((avgStress / 2) * 10) / 10 },
              { name: "Cognitive (avg)", value: Math.round(avgCognitive * 10) / 10 },
            ])
        } catch (error) {
      const status = (error as unknown as { response?: { status?: number } })?.response?.status
      if (status === 401) {
        return
      }
      console.error("Failed to fetch mood history", error)
    }
  }, [token, dateLocale])

  const fetchAiInsight = useCallback(async () => {
    try {
      if (!token) return
      const response = await api.post("/mood/analyze")
      setAiInsight(response.data.insight)
        } catch (error) {
      const status = (error as unknown as { response?: { status?: number } })?.response?.status
      if (status === 401) {
        return
      }
      console.error("Failed to fetch AI insight", error)
    }
  }, [token])

  const fetchSuggestions = useCallback(async () => {
    try {
      if (!token) return
      const response = await api.get("/mood/suggestions")
      setSuggestions(response.data || [])
    } catch (error) {
      const status = (error as unknown as { response?: { status?: number } })?.response?.status
      if (status === 401) {
        return
      }
      console.error("Failed to fetch suggestions", error)
    }
  }, [token])

  const applySuggestion = async (s: { title: string; category: string }) => {
    try {
      if (!token) return
      setApplyItem({ title: s.title, category: s.category })
      const minutes = s.category === "focus" ? 45 : s.category === "planning" ? 30 : s.category === "movement" ? 10 : 15
      setApplyMinutes(minutes)
      const resp = await api.get("/assignments/", { params: { limit: 200 } })
      const tasks = (resp.data || []) as Array<{ due_at: string }>
      const now = new Date()
      const todays = tasks.filter(t => {
        const d = new Date(t.due_at)
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
      }).sort((a,b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime())
      let candidate = now
      for (let i = 0; i < todays.length; i++) {
        const sdt = new Date(todays[i].due_at)
        const edt = new Date(sdt.getTime() + 30*60000)
        if (candidate < sdt && (sdt.getTime() - candidate.getTime())/60000 >= minutes) {
          break
        }
        if (candidate < edt) {
          candidate = new Date(edt)
        }
      }
      setApplyStart(candidate)
      setApplyOpen(true)
    } catch {}
  }

  const handleReplan = async () => {
    try {
      if (!token) return
      const res = await api.post("/ai/replan-week")
      const items = (res.data || []) as Array<{ start_at: string; end_at: string; title?: string }>
      const scheduleRes = await api.get("/schedule/")
      const settingsRes = await api.get("/users/me/settings")
      const maxHours = Number(settingsRes?.data?.max_daily_study_hours ?? 8)
      const capacityMin = Math.max(30, Math.round(maxHours * 60))
      const existing = (scheduleRes?.data as Array<{ start_at: string; end_at: string }>) || []
      const byDay = new Map<string, Array<{ start: Date; end: Date }>>()
      for (const b of existing) {
        const s = new Date(b.start_at)
        const e = new Date(b.end_at)
        const key = s.toDateString()
        const arr = byDay.get(key) || []
        arr.push({ start: s, end: e })
        byDay.set(key, arr)
      }
      const fit = (baseline: Date, minutes: number) => {
        let dayCursor = new Date(baseline)
        dayCursor = new Date(dayCursor.getFullYear(), dayCursor.getMonth(), dayCursor.getDate(), 9, 0, 0, 0)
        for (let d = 0; d < 14; d++) {
          const key = dayCursor.toDateString()
          const occ = (byDay.get(key) || []).slice().sort((a, b) => a.start.getTime() - b.start.getTime())
          const used = occ.reduce((acc, o) => acc + Math.max(0, Math.round((o.end.getTime() - o.start.getTime()) / 60000)), 0)
          if (used + minutes > capacityMin) {
            dayCursor = new Date(dayCursor.getTime() + 24 * 60 * 60 * 1000)
            dayCursor = new Date(dayCursor.getFullYear(), dayCursor.getMonth(), dayCursor.getDate(), 9, 0, 0, 0)
            continue
          }
          let cursor = new Date(dayCursor)
          while (true) {
            const end = new Date(cursor.getTime() + minutes * 60000)
            let conflict = false
            for (const o of occ) {
              if (cursor < o.end && end > o.start) { conflict = true; cursor = new Date(o.end.getTime() + 15 * 60000); break }
            }
            if (!conflict) {
              occ.push({ start: cursor, end })
              byDay.set(key, occ)
              return { start: cursor, end }
            }
          }
        }
        const fallbackStart = new Date(baseline)
        const fallbackEnd = new Date(fallbackStart.getTime() + minutes * 60000)
        return { start: fallbackStart, end: fallbackEnd }
      }
      const adjusted = items.map((b) => {
        const s = new Date(b.start_at)
        const e = new Date(b.end_at)
        const minutes = Math.max(15, Math.round((e.getTime() - s.getTime()) / 60000))
        const slot = fit(s, minutes)
        return { start_at: slot.start.toISOString(), end_at: slot.end.toISOString(), title: b.title, selected: true }
      })
      setReplanSuggestions(items)
      setReplanAdjusted(adjusted)
      setReplanOpen(true)
    } catch {
      console.error("Failed to replan week")
    }
  }

  useEffect(() => {
    const stateToken = useAuthStore.getState().token
    let persistedToken: string | null = null
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem('auth-storage') : null
      if (raw) {
        const parsed = (() => { try { return JSON.parse(raw) } catch { return null } })()
        persistedToken = parsed?.state?.token ?? null
      }
    } catch {}
    let cookieToken: string | null = null
    try {
      if (typeof document !== 'undefined') {
        const m = document.cookie.split('; ').find((c) => c.startsWith('mentalis_token='))
        cookieToken = m ? decodeURIComponent(m.split('=')[1]) : null
      }
    } catch {}
    const currentToken = stateToken || persistedToken || cookieToken
    if (!currentToken) {
      router.replace('/login')
      return
    }
    const id = setTimeout(() => {
      fetchMoodHistory()
      fetchAiInsight()
      fetchSuggestions()
    }, 0)
    return () => clearTimeout(id)
  }, [token, router, fetchMoodHistory, fetchAiInsight, fetchSuggestions])

    const handleCheckIn = async () => {
        try {
            if (!token) return
            if (sleepError) return
            const payload = {
                mood_valence: checkin.mood_valence,
                energy_level: Number(checkin.energy_level),
                stress_level: Number(checkin.stress_level),
                anxiety_level: Number(checkin.anxiety_level),
                sleep_hours_last_night: Number(checkin.sleep_hours_last_night) || 0,
                note: checkin.note,
                additional_metrics: checkin.additional_metrics
            }
            await api.post("/mood/", payload)
            const local: Array<{ title: string; description: string; category: string }> = []
            if (Number(checkin.stress_level) >= 7) {
              local.push({ title: t("breathingTitle"), description: t("breathingDescription"), category: "rest" })
            }
            if (Number(checkin.energy_level) <= 2) {
              local.push({ title: t("lightFocusTitle"), description: t("lightFocusDescription"), category: "focus" })
            }
            local.push({ title: t("microPlanTitle"), description: t("microPlanDescription"), category: "planning" })
            local.push({ title: t("stretchTitle"), description: t("stretchDescription"), category: "movement" })
            setSuggestions(local)
            fetchSuggestions()
            setCheckin({
                mood_valence: "neutral",
                energy_level: 3,
                stress_level: 5,
                anxiety_level: 5,
                sleep_hours_last_night: 7,
                note: "",
                additional_metrics: {
                  focus_level: 3,
                  burnout_indicator: "not_at_all",
                  productivity_confidence: 3,
                  workload_perception: "yes",
                  physical_state: "fine",
                  social_connectedness: "not_yet",
                  stress_sources: [],
                  motivation_type: "routine",
                  cognitive_load: 3,
                  emotional_intensity: 3,
                  sleep_quality: "okay",
                  task_aversion: "",
                  free_time_confidence: "balanced",
                  gratitude: "",
                  distraction_triggers: []
                }
            })
            fetchMoodHistory()
            fetchAiInsight()
            if (typeof window !== 'undefined') {
                window.scrollTo({ top: 0, behavior: 'smooth' })
            }
        } catch (error) {
            console.error("Failed to save check-in", error)
        }
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
                <div className="flex items-center gap-3">
                  <div className={cn("text-sm", checkedInToday ? "text-success-700" : "text-muted-foreground")}>{checkedInToday ? t("checkedInToday") : t("noCheckInToday")}</div>
                  <Badge variant="secondary">{streakEmoji} {streak} {streak === 1 ? t("day") : t("days")}</Badge>
                  <Button size="sm" variant="outline" onClick={handleReplan}>{t("rescheduleTasks")}</Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Mood Check-in Column */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>{t("dailyCheckIn")}</CardTitle>
                        <CardDescription>{t("howFeelingToday")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>{t("moodValence")}</Label>
                                <Select
                                    value={checkin.mood_valence}
                                    onValueChange={(val) => setCheckin({ ...checkin, mood_valence: val as CheckinState["mood_valence"] })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t("selectMood")} />
                                    </SelectTrigger>
                                    <SelectContent className="z-[60]">
                                        <SelectItem value="very_positive">{t("veryPositive")}</SelectItem>
                                        <SelectItem value="positive">{t("positive")}</SelectItem>
                                        <SelectItem value="neutral">{t("neutral")}</SelectItem>
                                        <SelectItem value="negative">{t("negative")}</SelectItem>
                                        <SelectItem value="very_negative">{t("veryNegative")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>{t("energyLevel")}</Label>
                                    <span className="text-sm text-muted-foreground">{checkin.energy_level}</span>
                                </div>
                                <Slider
                                    value={[checkin.energy_level]}
                                    onValueChange={(val) => setCheckin({ ...checkin, energy_level: val[0] })}
                                    max={5}
                                    min={1}
                                    step={1}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>{t("stressLevel")}</Label>
                                    <span className="text-sm text-muted-foreground">{checkin.stress_level}</span>
                                </div>
                                <Slider
                                    value={[checkin.stress_level]}
                                    onValueChange={(val) => setCheckin({ ...checkin, stress_level: val[0] })}
                                    max={10}
                                    min={0}
                                    step={1}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>{t("sleepHours")}</Label>
                                <Input
                                    type="number"
                                    step="0.5"
                                    value={checkin.sleep_hours_last_night === 0 ? '' : checkin.sleep_hours_last_night}
                                    onChange={(e) => {
                                        const text = e.target.value
                                        const val = text === '' ? 0 : parseFloat(text)
                                        setCheckin({ ...checkin, sleep_hours_last_night: isNaN(val) ? 0 : val })
                                        const v = isNaN(val) ? 0 : val
                                        setSleepError(
                                            v > 20
                                                ? t("sleepImpossible", { hours: v })
                                                : v > 15
                                                    ? t("sleepCheck", { hours: v })
                                                    : null
                                        )
                                    }}
                                />
                                {sleepError && (
                                    <div className="text-red-600 text-xs mt-1">{sleepError}</div>
                                )}
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <Label>{t("focusLevel")}</Label>
                                <span className="text-sm text-muted-foreground">{checkin.additional_metrics.focus_level}</span>
                              </div>
                              <Slider
                                value={[checkin.additional_metrics.focus_level]}
                                onValueChange={(val) => setCheckin({ ...checkin, additional_metrics: { ...checkin.additional_metrics, focus_level: val[0] } })}
                                max={5}
                                min={1}
                                step={1}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>{t("burnoutIndicator")}</Label>
                              <Select
                                value={checkin.additional_metrics.burnout_indicator}
                                onValueChange={(val) => setCheckin({ ...checkin, additional_metrics: { ...checkin.additional_metrics, burnout_indicator: val as AdditionalMetrics["burnout_indicator"] } })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={t("selectBurnout")} />
                                </SelectTrigger>
                                <SelectContent className="z-[60]">
                                  <SelectItem value="not_at_all">{t("notAtAll")}</SelectItem>
                                  <SelectItem value="a_little">{t("aLittle")}</SelectItem>
                                  <SelectItem value="noticeable">{t("noticeably")}</SelectItem>
                                  <SelectItem value="a_lot">{t("aLot")}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <Label>{t("productivityConfidence")}</Label>
                                <span className="text-sm text-muted-foreground">{checkin.additional_metrics.productivity_confidence}</span>
                              </div>
                              <Slider
                                value={[checkin.additional_metrics.productivity_confidence]}
                                onValueChange={(val) => setCheckin({ ...checkin, additional_metrics: { ...checkin.additional_metrics, productivity_confidence: val[0] } })}
                                max={5}
                                min={1}
                                step={1}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>{t("workloadPerception")}</Label>
                              <Select
                                value={checkin.additional_metrics.workload_perception}
                                onValueChange={(val) => setCheckin({ ...checkin, additional_metrics: { ...checkin.additional_metrics, workload_perception: val as AdditionalMetrics["workload_perception"] } })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={t("selectPerception")} />
                                </SelectTrigger>
                                <SelectContent className="z-[60]">
                                  <SelectItem value="yes">{t("yes")}</SelectItem>
                                  <SelectItem value="okay">{t("itsOkay")}</SelectItem>
                                  <SelectItem value="a_bit_much">{t("aBitMuch")}</SelectItem>
                                  <SelectItem value="overwhelming">{t("overwhelming")}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>{t("physicalState")}</Label>
                              <div className="flex flex-wrap gap-2">
                                {[
                                  { key: "fine", label: t("fine") },
                                  { key: "tired", label: t("tired") },
                                  { key: "sore", label: t("sore") },
                                  { key: "low_energy", label: t("lowEnergy") },
                                  { key: "headache", label: t("headache") },
                                  { key: "stiff_or_tense", label: t("stiffOrTense") },
                                ].map(opt => (
                                  <button
                                    key={opt.key}
                                    type="button"
                                    className={cn(
                                      "px-3 py-1.5 rounded-md border text-xs",
                                      checkin.additional_metrics.physical_state === opt.key ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground"
                                    )}
                                    onClick={() => setCheckin({ ...checkin, additional_metrics: { ...checkin.additional_metrics, physical_state: opt.key as AdditionalMetrics["physical_state"] } })}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>{t("socialConnectedness")}</Label>
                              <Select
                                value={checkin.additional_metrics.social_connectedness}
                                onValueChange={(val) => setCheckin({ ...checkin, additional_metrics: { ...checkin.additional_metrics, social_connectedness: val as AdditionalMetrics["social_connectedness"] } })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={t("selectSocial")} />
                                </SelectTrigger>
                                <SelectContent className="z-[60]">
                                  <SelectItem value="yes_positive">{t("yesPositive")}</SelectItem>
                                  <SelectItem value="yes_neutral">{t("yesNeutral")}</SelectItem>
                                  <SelectItem value="yes_stressful">{t("yesStressful")}</SelectItem>
                                  <SelectItem value="not_yet">{t("notYet")}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex justify-end">
                              <Button variant="secondary" type="button" onClick={async () => {
                                try {
                                  if (!token) return
                                  const payload = {
                                    mood_valence: checkin.mood_valence,
                                    energy_level: Number(checkin.energy_level),
                                    stress_level: Number(checkin.stress_level),
                                    anxiety_level: Number(checkin.anxiety_level),
                                    sleep_hours_last_night: Number(checkin.sleep_hours_last_night) || 0,
                                    note: checkin.note,
                                    tags: [],
                                  }
                                  const res = await api.post("/mood/infer-metrics", payload)
                                  setCheckin({ ...checkin, additional_metrics: { ...checkin.additional_metrics, ...res.data } })
                                } catch {}
                              }}>{t("autoFillMetrics")}</Button>
                            </div>

                            <div className="space-y-2">
                              <Label>{t("stressSources")}</Label>
                              <div className="flex flex-wrap gap-2">
                                {[
                                  "academic","social","work","health","financial","uncertainty"
                                ].map(tag => {
                                  const active = checkin.additional_metrics.stress_sources.includes(tag)
                                  return (
                                    <button
                                      key={tag}
                                      type="button"
                                      className={cn(
                                        "px-3 py-1.5 rounded-md border text-xs",
                                        active ? "bg-destructive text-destructive-foreground border-destructive" : "bg-muted text-muted-foreground"
                                      )}
                                      onClick={() => {
                                        const current = checkin.additional_metrics.stress_sources
                                        const next = active ? current.filter(t => t !== tag) : [...current, tag]
                                        setCheckin({ ...checkin, additional_metrics: { ...checkin.additional_metrics, stress_sources: next } })
                                      }}
                                    >
                                      {t(tag as "academic" | "social" | "work" | "health" | "financial" | "uncertainty")}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>{t("motivationType")}</Label>
                              <Select
                                value={checkin.additional_metrics.motivation_type}
                                onValueChange={(val) => setCheckin({ ...checkin, additional_metrics: { ...checkin.additional_metrics, motivation_type: val as AdditionalMetrics["motivation_type"] } })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={t("selectMotivation")} />
                                </SelectTrigger>
                                <SelectContent className="z-[60]">
                                  <SelectItem value="obligation">{t("obligation")}</SelectItem>
                                  <SelectItem value="curiosity">{t("curiosity")}</SelectItem>
                                  <SelectItem value="fear_pressure">{t("fearPressure")}</SelectItem>
                                  <SelectItem value="excitement">{t("excitement")}</SelectItem>
                                  <SelectItem value="routine">{t("routine")}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <Label>{t("cognitiveLoad")}</Label>
                                <span className="text-sm text-muted-foreground">{checkin.additional_metrics.cognitive_load}</span>
                              </div>
                              <Slider
                                value={[checkin.additional_metrics.cognitive_load]}
                                onValueChange={(val) => setCheckin({ ...checkin, additional_metrics: { ...checkin.additional_metrics, cognitive_load: val[0] } })}
                                max={5}
                                min={1}
                                step={1}
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <Label>{t("emotionalIntensity")}</Label>
                                <span className="text-sm text-muted-foreground">{checkin.additional_metrics.emotional_intensity}</span>
                              </div>
                              <Slider
                                value={[checkin.additional_metrics.emotional_intensity]}
                                onValueChange={(val) => setCheckin({ ...checkin, additional_metrics: { ...checkin.additional_metrics, emotional_intensity: val[0] } })}
                                max={5}
                                min={1}
                                step={1}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>{t("sleepQuality")}</Label>
                              <Select
                                value={checkin.additional_metrics.sleep_quality}
                                onValueChange={(val) => setCheckin({ ...checkin, additional_metrics: { ...checkin.additional_metrics, sleep_quality: val as AdditionalMetrics["sleep_quality"] } })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={t("selectSleepQuality")} />
                                </SelectTrigger>
                                <SelectContent className="z-[60]">
                                  <SelectItem value="great">{t("great")}</SelectItem>
                                  <SelectItem value="good">{t("good")}</SelectItem>
                                  <SelectItem value="okay">{t("okay")}</SelectItem>
                                  <SelectItem value="poor">{t("poor")}</SelectItem>
                                  <SelectItem value="very_poor">{t("veryPoor")}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>{t("taskAversion")}</Label>
                              <Input
                                value={checkin.additional_metrics.task_aversion}
                                onChange={(e) => setCheckin({ ...checkin, additional_metrics: { ...checkin.additional_metrics, task_aversion: e.target.value } })}
                                placeholder={t("taskAvoiding")}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>{t("freeTimeConfidence")}</Label>
                              <Select
                                value={checkin.additional_metrics.free_time_confidence}
                                onValueChange={(val) => setCheckin({ ...checkin, additional_metrics: { ...checkin.additional_metrics, free_time_confidence: val as AdditionalMetrics["free_time_confidence"] } })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={t("selectPreference")} />
                                </SelectTrigger>
                                <SelectContent className="z-[60]">
                                  <SelectItem value="flexible">{t("flexibleYes")}</SelectItem>
                                  <SelectItem value="balanced">{t("balanced")}</SelectItem>
                                  <SelectItem value="structured">{t("structuredNo")}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>{t("gratitude")}</Label>
                              <Input
                                value={checkin.additional_metrics.gratitude}
                                onChange={(e) => setCheckin({ ...checkin, additional_metrics: { ...checkin.additional_metrics, gratitude: e.target.value } })}
                                placeholder={t("gratitudePlaceholder")}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>{t("distractionTriggers")}</Label>
                              <div className="flex flex-wrap gap-2">
                                {[
                                  "phone","social","overthinking","fatigue","noise","other"
                                ].map(tag => {
                                  const active = checkin.additional_metrics.distraction_triggers.includes(tag)
                                  return (
                                    <button
                                      key={tag}
                                      type="button"
                                      className={cn(
                                        "px-3 py-1.5 rounded-md border text-xs",
                                        active ? "bg-secondary text-secondary-foreground border-secondary" : "bg-muted text-muted-foreground"
                                      )}
                                      onClick={() => {
                                        const current = checkin.additional_metrics.distraction_triggers
                                        const next = active ? current.filter(t => t !== tag) : [...current, tag]
                                        setCheckin({ ...checkin, additional_metrics: { ...checkin.additional_metrics, distraction_triggers: next } })
                                      }}
                                    >
                                      {t(tag as "phone" | "social" | "overthinking" | "fatigue" | "noise" | "other")}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="note">{t("journalNote")}</Label>
                            <Textarea
                                id="note"
                                placeholder={t("whatsOnMind")}
                                value={checkin.note}
                                onChange={(e) => setCheckin({ ...checkin, note: e.target.value })}
                            />
                        </div>

                        <Button className="w-full" onClick={handleCheckIn}>
                            {t("saveCheckIn")}
                        </Button>
                    </CardContent>
                </Card>

                {/* Insights Column */}
                <div className="col-span-4 space-y-4">
                    {/* AI Insight Card */}
                    <Card className="bg-secondary border-border">
                        <CardHeader className="pb-2">
                            <div className="flex items-center space-x-2">
                                <Activity className="h-5 w-5 text-primary-700" />
                                <CardTitle className="text-lg text-foreground">{t("aiWellnessInsight")}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                {aiInsight || t("logMoodInsight")}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t("moodTrends")}</CardTitle>
                            <CardDescription>{t("moodTrendsDescription")}</CardDescription>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={moodHistory}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis yAxisId="left" domain={[0, 5]} fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis yAxisId="right" orientation="right" domain={[0, 10]} fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="score"
                                            stroke="var(--primary-700)"
                                            strokeWidth={2}
                                            dot={{ r: 4 }}
                                            activeDot={{ r: 6 }}
                                            name={t("mood")}
                                            yAxisId="left"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="energy"
                                            stroke="var(--primary-500)"
                                            strokeWidth={2}
                                            dot={{ r: 4 }}
                                            name={t("energy")}
                                            yAxisId="left"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="stress"
                                            stroke="var(--primary-300)"
                                            strokeWidth={2}
                                            dot={{ r: 4 }}
                                            name={t("stress")}
                                            yAxisId="right"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="cognitive"
                                            stroke="var(--primary-600)"
                                            strokeWidth={1.5}
                                            dot={false}
                                            name={t("cognitiveLoadChart")}
                                            yAxisId="left"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="emotion"
                                            stroke="var(--primary-400)"
                                            strokeWidth={1.5}
                                            dot={false}
                                            name={t("emotionalIntensityChart")}
                                            yAxisId="left"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t("activityBalance")}</CardTitle>
                            <CardDescription>{t("last7SleepCheckins")}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={activityData}>
                                        <defs>
                                          <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="var(--success-500)" stopOpacity={0.9} />
                                            <stop offset="100%" stopColor="var(--success-500)" stopOpacity={0.4} />
                                          </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis dataKey="name" tickFormatter={(value) => value === "Sleep (hrs)" ? t("sleepHoursChart") : value === "Check-ins (count)" ? t("checkinsCount") : value} fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip formatter={(val: number | string, name: string) => [val, name]} />
                                        <Legend />
                                        <Bar dataKey="hours" name={t("value")} fill="url(#activityGradient)" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-3">
                              <div className="rounded-md border p-2 text-xs">
                                <div className="text-muted-foreground">{t("avgSleepDay")}</div>
                                <div className="font-medium">{activityData.length ? (Math.round(((activityData[0]?.hours || 0)/7)*10)/10) : 0} h</div>
                              </div>
                              <div className="rounded-md border p-2 text-xs">
                                <div className="text-muted-foreground">{t("checkins7d")}</div>
                                <div className="font-medium">{activityData.find(a=>a.name.startsWith("Check-ins"))?.hours || 0}</div>
                              </div>
                              <div className="rounded-md border p-2 text-xs">
                                <div className="text-muted-foreground">{t("streak")}</div>
                                <div className="font-medium">{streak} {streak===1 ? t("day") : t("days")}</div>
                              </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t("engagementMix")}</CardTitle>
                            <CardDescription>{t("last7AverageScale")}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={engagementData}>
                                        <defs>
                                          <linearGradient id="engGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="var(--primary-500)" stopOpacity={0.9} />
                                            <stop offset="100%" stopColor="var(--primary-500)" stopOpacity={0.4} />
                                          </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis domain={[0,5]} fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip formatter={(val: number | string, name: string) => [val, name]} />
                                        <Legend />
                                        <Bar dataKey="value" name={t("average")} fill="url(#engGradient)" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t("personalizedSuggestions")}</CardTitle>
                            <CardDescription>{t("suggestionsDescription")}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {suggestions.length === 0 ? (
                                <div className="text-sm text-muted-foreground">{t("noSuggestions")}</div>
                            ) : (
                                <div className="space-y-2">
                                    {suggestions.map((s, i) => (
                                        <div key={i} className="border rounded-md p-3 flex items-center justify-between">
                                            <div>
                                              <div className="text-sm font-medium">{s.title}</div>
                                              <div className="text-sm text-muted-foreground">{s.description}</div>
                                            </div>
                                            <Button size="sm" variant="outline" onClick={() => applySuggestion(s)}>{t("apply")}</Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                      <MicroInterventions />
                </div>
            <Dialog open={replanOpen} onOpenChange={setReplanOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("fatigueAwarePlan")}</DialogTitle>
                  <DialogDescription>{t("shortStudyBlocks")}</DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  {replanAdjusted.length === 0 ? (
                    <div className="text-sm text-muted-foreground">{t("noSuggestionsShort")}</div>
                  ) : (
                    replanAdjusted.map((b, i) => {
                      const s = new Date(b.start_at)
                      const e = new Date(b.end_at)
                      return (
                        <div key={i} className="text-sm border rounded-md p-2 grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-1">
                            <input type="checkbox" checked={Boolean(b.selected)} onChange={(ev) => {
                              const val = ev.target.checked
                              setReplanAdjusted(prev => prev.map((p, idx) => idx === i ? { ...p, selected: val } : p))
                            }} />
                          </div>
                          <div className="col-span-5 font-medium truncate">{b.title || "Study"}</div>
                          <div className="col-span-6 text-muted-foreground text-right">{s.toLocaleString()} → {e.toLocaleTimeString()}</div>
                        </div>
                      )
                    })
                  )}
                </div>
                <DialogFooter>
                  <Button variant="secondary" onClick={() => setReplanOpen(false)}>{t("close")}</Button>
                  <Button onClick={async () => {
                    try {
                      const toCreate = replanAdjusted.filter(x => x.selected)
                      for (const b of toCreate) {
                        const payload = {
                          start_at: b.start_at,
                          end_at: b.end_at,
                          type: "STUDY",
                          status: "PLANNED",
                          title: b.title || "Study",
                          source: "AI_SUGGESTED",
                        }
                        await api.post("/schedule/", payload)
                      }
                      setReplanOpen(false)
                      try { window.dispatchEvent(new CustomEvent('scheduleUpdated')) } catch {}
                    } catch {}
                  }}>{t("saveChangesCalendar")}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("addToCalendar")}</DialogTitle>
                  <DialogDescription>{t("pickTimeConfirm")}</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="text-sm">{applyItem?.title}</div>
                  <div className="flex items-center gap-3">
                    <input
                      type="datetime-local"
                      className="border rounded-md px-2 py-1 text-sm"
                      value={applyStart ? new Date(applyStart.getTime() - (new Date().getTimezoneOffset()*60000)).toISOString().slice(0,16) : ""}
                      onChange={(e) => setApplyStart(new Date(e.target.value))}
                    />
                    <input
                      type="number"
                      className="border rounded-md px-2 py-1 text-sm w-20"
                      value={applyMinutes}
                      onChange={(e) => setApplyMinutes(Number(e.target.value))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="secondary" onClick={() => setApplyOpen(false)}>{t("cancel")}</Button>
                  <Button onClick={async () => {
                    if (!applyItem || !applyStart) return
                    const tz = applyStart.getTimezoneOffset()
                    const sign = tz <= 0 ? "+" : "-"
                    const abs = Math.abs(tz)
                    const offH = String(Math.floor(abs / 60)).padStart(2, "0")
                    const offM = String(abs % 60).padStart(2, "0")
                    const pad = (n: number) => String(n).padStart(2, "0")
                    const localISO = `${applyStart.getFullYear()}-${pad(applyStart.getMonth() + 1)}-${pad(applyStart.getDate())}T${pad(applyStart.getHours())}:${pad(applyStart.getMinutes())}:${pad(applyStart.getSeconds())}${sign}${offH}:${offM}`
                    const payload = {
                      title: applyItem.title,
                      due_at: localISO,
                      importance_level: "low",
                      status: "NOT_STARTED",
                      estimated_minutes: applyMinutes,
                    }
                    try {
                      await api.post("/assignments/", payload)
                      setApplyOpen(false)
                      window.dispatchEvent(new CustomEvent('assignmentAdded'))
                    } catch {}
                  }}>{t("apply")}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        </div>
        </div>
    )
}
