"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import api from "@/lib/api"
import { useTranslations } from "next-intl"
// import { useAuthStore } from "@/store/auth"

export default function SettingsPage() {
    const t = useTranslations("settings")
    // const { user, setUser } = useAuthStore()
    const [settings, setSettings] = useState({
        max_daily_study_hours: 8,
        checkin_frequency: "daily",
        theme: "system",
        notifications_enabled: true,
        task_reminders: true,
        assignment_deadlines: true,
        google_calendar_connected: false,
        outlook_calendar_connected: false,
        default_priority: "medium" as "low" | "medium" | "high",
        recurring_tasks_enabled: true,
    })
    const [isLoading, setIsLoading] = useState(false)
    const [breakTitlesText, setBreakTitlesText] = useState<string>(() => {
        try {
            const raw = typeof window !== 'undefined' ? window.localStorage.getItem('mentalis.excludedBreakTitles') : null
            if (raw) {
                const parsed = (() => { try { return JSON.parse(raw) as string[] } catch { return [] } })()
                if (Array.isArray(parsed) && parsed.length) return parsed.join(", ")
            }
        } catch {}
        return "Quick Break"
    })

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get("/users/me/settings")
                const data = response.data
                setSettings({
                    max_daily_study_hours: data.max_daily_study_hours,
                    checkin_frequency: data.wellbeing_settings?.checkin_frequency || "daily",
                    theme: "system",
                    notifications_enabled: Boolean(data.notification_preferences?.email),
                    task_reminders: Boolean(data.notification_preferences?.task_reminders ?? true),
                    assignment_deadlines: Boolean(data.notification_preferences?.assignment_deadlines ?? true),
                    google_calendar_connected: Boolean(data.notification_preferences?.calendar_connections?.google ?? false),
                    outlook_calendar_connected: Boolean(data.notification_preferences?.calendar_connections?.outlook ?? false),
                    default_priority: (data.wellbeing_settings?.task_goal_preferences?.default_priority ?? "medium") as "low" | "medium" | "high",
                    recurring_tasks_enabled: Boolean(data.wellbeing_settings?.task_goal_preferences?.recurring_tasks_enabled ?? true),
                })
            } catch (error) {
                console.error("Failed to fetch settings", error)
            }
        }
        fetchSettings()
    }, [])

    const handleSave = async () => {
        setIsLoading(true)
        try {
            const payload = {
                max_daily_study_hours: settings.max_daily_study_hours,
                wellbeing_settings: {
                    checkin_frequency: settings.checkin_frequency,
                    task_goal_preferences: {
                        default_priority: settings.default_priority,
                        recurring_tasks_enabled: settings.recurring_tasks_enabled,
                    },
                },
                notification_preferences: {
                    email: settings.notifications_enabled,
                    push: settings.notifications_enabled,
                    task_reminders: settings.task_reminders,
                    assignment_deadlines: settings.assignment_deadlines,
                    calendar_connections: {
                        google: settings.google_calendar_connected,
                        outlook: settings.outlook_calendar_connected,
                    },
                },
            }
            await api.put("/users/me/settings", payload)
            setIsLoading(false)
        } catch (error) {
            console.error("Failed to save settings", error)
            setIsLoading(false)
        }
    }

    const handleSaveBreakFilters = () => {
        const items = breakTitlesText
            .split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0)
        try {
            window.localStorage.setItem('mentalis.excludedBreakTitles', JSON.stringify(items))
        } catch {}
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>{t("studyPreferences")}</CardTitle>
                        <CardDescription>{t("studyDescription")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>{t("maxDailyHours")}</Label>
                            <Input
                                type="number"
                                value={Number.isFinite(settings.max_daily_study_hours) ? settings.max_daily_study_hours : 0}
                                onChange={(e) => {
                                    const parsed = parseInt(e.target.value, 10)
                                    setSettings({ ...settings, max_daily_study_hours: Number.isFinite(parsed) ? parsed : 0 })
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{t("preferredStudyTime")}</Label>
                            <Select defaultValue="evening">
                                <SelectTrigger>
                                    <SelectValue placeholder={t("selectTime")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="morning">{t("morningTime")}</SelectItem>
                                    <SelectItem value="afternoon">{t("afternoonTime")}</SelectItem>
                                    <SelectItem value="evening">{t("eveningTime")}</SelectItem>
                                    <SelectItem value="night">{t("nightTime")}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>{t("wellbeingNotifications")}</CardTitle>
                        <CardDescription>{t("wellbeingDescription")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="notifications">{t("enableNotifications")}</Label>
                            <Switch
                                id="notifications"
                                checked={settings.notifications_enabled}
                                onCheckedChange={(checked) => setSettings({ ...settings, notifications_enabled: checked })}
                            />
                        </div>
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="taskReminders">{t("taskReminders")}</Label>
                            <Switch
                                id="taskReminders"
                                checked={settings.task_reminders}
                                onCheckedChange={(checked) => setSettings({ ...settings, task_reminders: checked })}
                            />
                        </div>
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="assignmentDeadlines">{t("assignmentDeadlines")}</Label>
                            <Switch
                                id="assignmentDeadlines"
                                checked={settings.assignment_deadlines}
                                onCheckedChange={(checked) => setSettings({ ...settings, assignment_deadlines: checked })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{t("checkinFrequency")}</Label>
                            <Select
                                value={settings.checkin_frequency}
                                onValueChange={(val) => setSettings({ ...settings, checkin_frequency: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t("selectFrequency")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">{t("daily")}</SelectItem>
                                    <SelectItem value="weekly">{t("weekly")}</SelectItem>
                                    <SelectItem value="never">{t("never")}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>{t("breakFilters")}</CardTitle>
                        <CardDescription>{t("breakDescription")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>{t("excludedBreakTitles")}</Label>
                            <Input
                                value={breakTitlesText}
                                onChange={(e) => setBreakTitlesText(e.target.value)}
                                placeholder={t("breakPlaceholder")}
                            />
                        </div>
                        <Button variant="outline" onClick={handleSaveBreakFilters}>{t("saveBreakFilters")}</Button>
                    </CardContent>
                </Card>

                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>{t("connectedCalendars")}</CardTitle>
                        <CardDescription>{t("calendarDescription")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="googleCal">{t("googleCalendar")}</Label>
                            <Switch
                                id="googleCal"
                                checked={settings.google_calendar_connected}
                                onCheckedChange={(checked) => setSettings({ ...settings, google_calendar_connected: checked })}
                            />
                        </div>
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="outlookCal">{t("outlookCalendar")}</Label>
                            <Switch
                                id="outlookCal"
                                checked={settings.outlook_calendar_connected}
                                onCheckedChange={(checked) => setSettings({ ...settings, outlook_calendar_connected: checked })}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>{t("taskGoalPreferences")}</CardTitle>
                        <CardDescription>{t("taskGoalDescription")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>{t("defaultPriority")}</Label>
                            <Select
                                value={settings.default_priority}
                                onValueChange={(val: "low" | "medium" | "high") => setSettings({ ...settings, default_priority: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t("selectPriority")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">{t("low")}</SelectItem>
                                    <SelectItem value="medium">{t("medium")}</SelectItem>
                                    <SelectItem value="high">{t("high")}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="recurring">{t("recurringTasks")}</Label>
                            <Switch
                                id="recurring"
                                checked={settings.recurring_tasks_enabled}
                                onCheckedChange={(checked) => setSettings({ ...settings, recurring_tasks_enabled: checked })}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>{t("dangerZone")}</CardTitle>
                        <CardDescription>{t("dangerDescription")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button variant="destructive" onClick={async () => {
                            if (!confirm(t("deleteConfirm"))) return
                            try {
                                await api.delete("/users/me")
                                try { window.localStorage.clear() } catch {}
                                try { document.cookie = "mentalis_token=; Max-Age=0; path=/" } catch {}
                                window.location.href = "/register"
                            } catch (e) {
                                console.error(e)
                            }
                        }}>{t("deleteAccount")}</Button>
                    </CardContent>
                </Card>

                <div className="col-span-4">
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading ? t("saving") : t("saveChanges")}
                    </Button>
                </div>
            </div>
        </div>
    )
}
