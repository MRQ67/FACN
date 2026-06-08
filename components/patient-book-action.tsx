"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function PatientBookAction({
  doctor,
  trigger,
}: {
  doctor?: any;
  trigger?: React.ReactElement;
}) {
  const book = useMutation(api.appointments.create);
  const doctors = useQuery(api.doctors.list) ?? [];
  const [selectedDoc, setSelectedDoc] = useState(doctor?._id || "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          trigger || (
            <Button size="sm" variant="outline" className="h-7 text-[10px] font-black uppercase tracking-widest">
              Book New
            </Button>
          )
        }
      />
      <SheetContent className="sm:max-w-md">
        <SheetHeader className="mb-6">
          <SheetTitle>Book Appointment</SheetTitle>
        </SheetHeader>
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">
              Select Doctor
            </p>
            <select
              className="w-full p-2 border rounded-md text-sm bg-surface text-heading font-bold"
              value={selectedDoc}
              onChange={(e) => setSelectedDoc(e.target.value)}
            >
              <option value="">Select a specialist...</option>
              {doctors.map((d: any) => (
                <option key={d._id} value={d._id}>
                  Dr. {d.name} ({d.role})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">
                Date
              </p>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">
                Time
              </p>
              <select
                className="w-full p-2 border rounded-md text-sm bg-surface text-heading font-bold"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              >
                {[
                  "08:00",
                  "08:30",
                  "09:00",
                  "09:30",
                  "10:00",
                  "14:00",
                  "15:00",
                ].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">
              Reason for Visit
            </p>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Briefly describe your concern..."
            />
          </div>
          <Button
            className="w-full mt-4 bg-brand-primary text-white font-black uppercase tracking-widest py-6 rounded-2xl"
            disabled={saving || !selectedDoc || !date}
            onClick={async () => {
              setSaving(true);
              try {
                // Combine date and time into a single timestamp
                const [year, month, day] = date.split("-").map(Number);
                const [hours, minutes] = time.split(":").map(Number);
                const scheduledAt = new Date(
                  year,
                  month - 1,
                  day,
                  hours,
                  minutes
                ).getTime();

                await book({
                  doctorId: selectedDoc as any,
                  scheduledAt,
                  type: "REMOTE",
                });
                setOpen(false);
              } catch (e) {
                console.error(e);
                alert("Failed to book appointment. Please try again.");
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Processing..." : "Confirm Booking"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
