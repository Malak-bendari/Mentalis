"use client"

// Profile page for viewing and updating core user details.
// - Fetches current user and settings on mount
// - Allows updating full name, institution, timezone
// - Persists optional extras under privacy preferences
// - Handles a local-only profile photo preview

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import api from "@/lib/api"
import { useAuthStore } from "@/store/auth"
import { useTranslations } from "next-intl"

interface ProfileExtras {
  grade_level?: string
  academic_year?: string
  major_program?: string
  contact_number?: string
}

export default function ProfilePage() {
  const t = useTranslations("profile")
  const { setUser } = useAuthStore()
  const [fullName, setFullName] = useState<string>("")
  const [email, setEmail] = useState<string>("")
  const [institution, setInstitution] = useState<string>("")
  const [timezone, setTimezone] = useState<string>("UTC")
  const [extras, setExtras] = useState<ProfileExtras>({})
  const [isSaving, setIsSaving] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string>("")

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [meRes, settingsRes] = await Promise.allSettled([
          api.get("/users/me"),
          api.get("/users/me/settings"),
        ])
        if (meRes.status === "fulfilled") {
          const me = meRes.value
          setFullName(me.data.full_name || "")
          setEmail(me.data.email || "")
          setInstitution(me.data.institution || "")
          setTimezone(me.data.timezone || "UTC")
          setUser(me.data)
        }
        if (settingsRes.status === "fulfilled") {
          const privacy = settingsRes.value.data?.privacy_preferences || {}
          const stored = (privacy.profile_extras || {}) as ProfileExtras
          setExtras(stored)
        }
      } catch {}
      try {
        const raw = typeof window !== "undefined" ? window.localStorage.getItem("mentalis.profile.photo") : null
        if (raw) setPhotoPreview(raw)
      } catch {}
    }
    fetchAll()
  }, [setUser])

  // Save profile core fields and extras
  const handleSave = async () => {
    setIsSaving(true)
    try {
      await api.put("/users/me", { full_name: fullName, institution, timezone })
      const privacy_preferences = { profile_extras: extras }
      await api.put("/users/me/settings", { privacy_preferences })
    } finally {
      setIsSaving(false)
    }
  }

  // Local-only photo preview (not uploaded)
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const url = String(reader.result)
      setPhotoPreview(url)
      try { window.localStorage.setItem("mentalis.profile.photo", url) } catch {}
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>{t("essentialDetails")}</CardTitle>
            <CardDescription>{t("manageDetails")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                {photoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoPreview} alt={t("profileAlt")} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm text-gray-500">{t("noPhoto")}</span>
                )}
              </div>
              <div>
                <Label>{t("profilePhoto")}</Label>
                <Input type="file" accept="image/*" onChange={handlePhotoChange} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("fullName")}</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>{t("email")}</Label>
              <Input value={email} readOnly />
            </div>

            <div className="space-y-2">
              <Label>{t("institution")}</Label>
              <Input value={institution} onChange={(e) => setInstitution(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>{t("timezone")}</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger><SelectValue placeholder={t("selectTimezone")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">America/New_York</SelectItem>
                  <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
                  <SelectItem value="Europe/London">Europe/London</SelectItem>
                  <SelectItem value="Asia/Kolkata">Asia/Kolkata</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("password")}</Label>
              <div className="text-sm text-muted-foreground">{t("passwordDescription")}</div>
              <Button variant="outline" onClick={() => window.alert(t("changePasswordAlert"))}>{t("changePassword")}</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>{t("educationContact")}</CardTitle>
            <CardDescription>{t("optionalInfo")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t("gradeLevel")}</Label>
              <Input value={extras.grade_level || ""} onChange={(e) => setExtras({ ...extras, grade_level: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t("academicYear")}</Label>
              <Input value={extras.academic_year || ""} onChange={(e) => setExtras({ ...extras, academic_year: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t("majorProgram")}</Label>
              <Input value={extras.major_program || ""} onChange={(e) => setExtras({ ...extras, major_program: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t("contactNumber")}</Label>
              <Input value={extras.contact_number || ""} onChange={(e) => setExtras({ ...extras, contact_number: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <div className="col-span-3">
          <Button onClick={handleSave} disabled={isSaving}>{isSaving ? t("saving") : t("saveChanges")}</Button>
        </div>
      </div>
    </div>
  )
}

