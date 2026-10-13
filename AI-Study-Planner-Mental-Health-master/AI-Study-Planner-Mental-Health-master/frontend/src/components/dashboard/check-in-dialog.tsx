"use client"

import { useState } from "react"
import { Smile, BatteryMedium, BatteryLow, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import api from "@/lib/api"
import { cn } from "@/lib/utils"

const CONTEXT_TAGS = ["Sleep", "Diet", "Social", "Study Load", "Health", "Family"]

export function CheckInDialog({ onCheckInComplete }: { onCheckInComplete?: () => void }) {
    const [open, setOpen] = useState(false)
    const [valence, setValence] = useState<number | null>(null) // 0 (Negative) to 1 (Positive)
    const [energy, setEnergy] = useState<number | null>(null)   // 0 (Low) to 1 (High)
    const [selectedTags, setSelectedTags] = useState<string[]>([])
    const [note, setNote] = useState("")

    const handleCheckIn = async () => {
        if (valence === null || energy === null) return

        try {
            // Map 2D coordinates to a 1-10 score for backward compatibility or store as complex object
            const moodScore = Math.round(((valence + energy) / 2) * 10)

            await api.post("/mood/", {
                score: moodScore,
                valence,
                energy,
                tags: selectedTags,
                note: note,
            })
            setOpen(false)
            resetForm()
            if (onCheckInComplete) onCheckInComplete()
        } catch (error) {
            console.error("Failed to save check-in", error)
        }
    }

    const resetForm = () => {
        setValence(null)
        setEnergy(null)
        setSelectedTags([])
        setNote("")
    }

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        )
    }

    // Helper to determine mood label based on quadrant
    const getMoodLabel = () => {
        if (valence === null || energy === null) return "Select your state"
        if (valence > 0.5 && energy > 0.5) return "Energized & Positive"
        if (valence <= 0.5 && energy > 0.5) return "Stressed / Anxious"
        if (valence > 0.5 && energy <= 0.5) return "Calm / Relaxed"
        if (valence <= 0.5 && energy <= 0.5) return "Tired / Depleted"
        return "Neutral"
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary-700">
                    Start Daily Check-in
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Daily Check-in</DialogTitle>
                    <DialogDescription>
                        How are you feeling right now?
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Mood Matrix */}
                    <div className="space-y-3">
                        <Label className="text-center block text-base font-medium text-primary-700">{getMoodLabel()}</Label>
                        <div className="relative h-64 w-full bg-muted/30 rounded-xl border-2 border-dashed border-muted-foreground/20 p-4">
                            {/* Axis Labels */}
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">High Energy</div>
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Low Energy</div>
                            <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Negative</div>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Positive</div>

                            {/* Quadrant Backgrounds (Subtle) */}
                            <div className="absolute inset-4 grid grid-cols-2 grid-rows-2 gap-1 opacity-50">
                                <div
                                    className={cn("rounded-tl-lg bg-primary-50 hover:bg-primary-100 transition-colors cursor-pointer flex items-center justify-center",
                                        valence !== null && valence <= 0.5 && energy !== null && energy > 0.5 && "bg-primary-200 ring-2 ring-primary-700")}
                                    onClick={() => { setValence(0.2); setEnergy(0.8) }}
                                >
                                    <Zap className="h-6 w-6 text-primary-500 opacity-70" />
                                </div>
                                <div
                                    className={cn("rounded-tr-lg bg-primary-100 hover:bg-primary-200 transition-colors cursor-pointer flex items-center justify-center",
                                        valence !== null && valence > 0.5 && energy !== null && energy > 0.5 && "bg-primary-300 ring-2 ring-primary-700")}
                                    onClick={() => { setValence(0.8); setEnergy(0.8) }}
                                >
                                    <Smile className="h-6 w-6 text-primary-600 opacity-70" />
                                </div>
                                <div
                                    className={cn("rounded-bl-lg bg-primary-50 hover:bg-primary-100 transition-colors cursor-pointer flex items-center justify-center",
                                        valence !== null && valence <= 0.5 && energy !== null && energy <= 0.5 && "bg-primary-100 ring-2 ring-primary-700")}
                                    onClick={() => { setValence(0.2); setEnergy(0.2) }}
                                >
                                    <BatteryLow className="h-6 w-6 text-primary-400 opacity-70" />
                                </div>
                                <div
                                    className={cn("rounded-br-lg bg-primary-100 hover:bg-primary-200 transition-colors cursor-pointer flex items-center justify-center",
                                        valence !== null && valence > 0.5 && energy !== null && energy <= 0.5 && "bg-primary-200 ring-2 ring-primary-700")}
                                    onClick={() => { setValence(0.8); setEnergy(0.2) }}
                                >
                                    <BatteryMedium className="h-6 w-6 text-primary-500 opacity-70" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Context Tags */}
                    <div className="space-y-2">
                        <Label>What&apos;s affecting you?</Label>
                        <div className="flex flex-wrap gap-2">
                            {CONTEXT_TAGS.map(tag => (
                                <Badge
                                    key={tag}
                                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                                    className="cursor-pointer hover:bg-primary-700"
                                    onClick={() => toggleTag(tag)}
                                >
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Note */}
                    <div className="space-y-2">
                        <Label htmlFor="note">Journal Note (Optional)</Label>
                        <Textarea
                            id="note"
                            placeholder="Anything else on your mind?"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="h-20 resize-none"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleCheckIn} disabled={valence === null || energy === null}>
                        Save Check-in
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
