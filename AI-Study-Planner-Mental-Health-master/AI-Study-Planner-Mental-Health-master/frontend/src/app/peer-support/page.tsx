"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import api from "@/lib/api"
import { useTranslations } from "next-intl"

interface Group {
  id: number
  name: string
  description: string
}

export default function PeerSupportPage() {
  const t = useTranslations("peerSupport")
  const [groups, setGroups] = useState<Group[]>([])
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await api.get("/peer-groups/")
        setGroups(res.data)
      } catch {
        setGroups([])
      }
    }
    fetchGroups()
  }, [])

  const handleCreate = async () => {
    if (!name.trim()) {
      return
    }
    try {
      const res = await api.post("/peer-groups/", { name, description })
      setGroups(prev => [res.data, ...prev])
      setOpen(false)
      setName("")
      setDescription("")
    } catch {
      // no-op
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("yourGroups")}</CardTitle>
              <CardDescription>{t("description")}</CardDescription>
            </div>
            <Button onClick={() => setOpen(true)}>{t("createGroup")}</Button>
          </div>
        </CardHeader>
        <CardContent>
          {groups.length === 0 ? (
            <p className="text-muted-foreground">{t("noGroups")}</p>
          ) : (
            <ul className="space-y-3">
              {groups.map(g => (
                <li key={g.id} className="border rounded-md p-3">
                  <div className="font-medium">{g.name}</div>
                  <div className="text-sm text-muted-foreground">{g.description}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("createGroup")}</DialogTitle>
            <DialogDescription>{t("createDescription")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="group-name" className="text-right">{t("groupName")}</Label>
              <Input id="group-name" className="col-span-3" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="group-desc" className="text-right">{t("groupDescription")}</Label>
              <Textarea id="group-desc" className="col-span-3" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button>
            <Button onClick={handleCreate}>{t("createGroup")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
