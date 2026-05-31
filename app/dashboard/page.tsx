"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Menu, Search, X, Check, Clock, AlertCircle } from "lucide-react";

// --- HELPERS ---

const formatTime = (ts: number) => {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (ts: number) => {
  return new Date(ts).toLocaleDateString();
};

const getRelativeTime = (ts: number) => {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const getUrgencyClass = (severity?: string) => {
  switch (severity) {
    case "CRITICAL":
      return "border-l-4 border-red-500 bg-red-50 dark:bg-transparent pl-3";
    case "MODERATE":
      return "border-l-4 border-amber-400 bg-amber-50 dark:bg-transparent pl-3";
    case "LOW":
    case "ROUTINE":
      return "border-l-4 border-transparent pl-3";
    case "UNASSESSED":
      return "border-l-4 border-dashed border-amber-400 pl-3";
    default:
      return "border-l-4 border-transparent pl-3";
  }
};

// --- COMMON COMPONENTS ---

const LoadingState = () => (
  <div className="space-y-3">
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-4 w-2/3" />
  </div>
);

const NavLinks = ({
  role,
  mobile = false,
}: {
  role: string;
  mobile?: boolean;
}) => {
  const links = useMemo(() => {
    const items = [
      { label: "Patients", href: "/patients" },
      { label: "Appointments", href: "/appointments" },
      { label: "Prescriptions", href: "/prescriptions" },
      { label: "Lab Results", href: "/lab" },
    ];
    if (role === "ADMIN") {
      items.push(
        { label: "Users", href: "/admin/users" },
        { label: "Hospitals", href: "/admin/hospitals" },
        { label: "Audit Logs", href: "/admin/audit-logs" },
      );
    }
    if (role === "NURSE" || role === "DOCTOR") {
      items.unshift({ label: "Triage", href: "/triage" });
    }
    return items;
  }, [role]);

  return (
    <nav
      className={
        mobile
          ? "flex flex-col gap-4 mt-8"
          : "hidden md:flex items-center gap-6"
      }
    >
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
};

// --- DOCTOR LAYOUT ---

const DoctorDashboard = ({ user }: { user: any }) => {
  const todayQueue = useQuery(api.appointments.getTodayForDoctor) ?? [];
  const pendingLab = useQuery(api.labResults.getPendingReviewForDoctor) ?? [];
  const pendingScripts =
    useQuery(api.prescriptions.getPendingSignatureForDoctor) ?? [];
  const myPatients = useQuery(api.patients.getAllForDoctor) ?? [];

  const [searchQuery, setSearchSearchQuery] = useState("");
  const filteredPatients = useMemo(() => {
    return myPatients
      .filter((p) => p.name?.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 20);
  }, [myPatients, searchQuery]);

  return (
    <div className="space-y-12">
      {/* TODAY'S QUEUE */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
          Today's Queue
        </h2>
        <div className="divide-y divide-border border-t border-border">
          {todayQueue.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No appointments scheduled for today
            </p>
          ) : (
            todayQueue.map((apt: any) => (
              <div
                key={apt._id}
                className={`flex items-center justify-between py-4 ${getUrgencyClass(apt.severity)}`}
              >
                <Link
                  href={`/patients/${apt.patientId}`}
                  className="flex-1 min-w-0 pr-4"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {apt.patientName}, {apt.patientAge}y
                    </span>
                    {apt.severity && (
                      <Badge
                        variant={
                          apt.severity === "CRITICAL"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-[10px] h-4"
                      >
                        {apt.severity}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {apt.complaint}
                  </p>
                </Link>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-medium text-muted-foreground">
                    {formatTime(apt.scheduledAt)}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {apt.status}
                  </Badge>
                  <div className="flex gap-2">
                    <DoctorStartAction appointment={apt} />
                    <DoctorNotesAction appointment={apt} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* PENDING ACTIONS */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
          Pending Actions
        </h2>
        <div className="space-y-4">
          {/* Lab Review */}
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">
              Lab Results
            </p>
            {pendingLab.map((res: any) => (
              <div
                key={res._id}
                className="flex items-center justify-between py-2 border-b border-border last:border-0 pl-3"
              >
                <div className="text-sm">
                  <span className="font-medium">{res.patientName}</span>
                  <span className="mx-2 text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{res.testName}</span>
                </div>
                <LabReviewAction result={res} />
              </div>
            ))}
          </div>
          {/* Prescription Signing */}
          <div className="space-y-1 pt-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">
              Prescriptions
            </p>
            {pendingScripts.map((script: any) => (
              <div
                key={script._id}
                className="flex items-center justify-between py-2 border-b border-border last:border-0 pl-3"
              >
                <div className="text-sm">
                  <span className="font-medium">{script.patientName}</span>
                  <span className="mx-2 text-muted-foreground">•</span>
                  <span className="text-muted-foreground">
                    {script.medication}
                  </span>
                </div>
                <PrescriptionSignAction script={script} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MY PATIENTS */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
            My Patients
          </h2>
          <Input
            placeholder="Search patients..."
            className="h-8 w-48 text-xs bg-transparent border-border"
            value={searchQuery}
            onChange={(e) => setSearchSearchQuery(e.target.value)}
          />
        </div>
        <div className="divide-y divide-border border-t border-border">
          {filteredPatients.map((p: any) => (
            <div
              key={p._id}
              className="flex items-center justify-between py-3 pl-3"
            >
              <div>
                <p className="text-sm font-medium">
                  {p.name}, {p.age}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {p.activeConditions}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">
                  Last visit: {formatDate(p.lastVisit)}
                </p>
                <Link
                  href={`/patients/${p._id}`}
                  className="text-xs font-semibold text-brand-primary hover:underline"
                >
                  View Record
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

// --- ACTION COMPONENTS (DOCTOR) ---

const DoctorStartAction = ({ appointment }: { appointment: any }) => {
  const updateStatus = useMutation(api.appointments.updateStatus);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const handleStatus = async (status: string) => {
    setSaving(true);
    try {
      await updateStatus({ id: appointment._id, status: status as any });
      setOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-3 text-[10px] font-black uppercase tracking-widest"
          >
            Start
          </Button>
        }
      />
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader className="mb-6">
          <SheetTitle>Session: {appointment.patientName}</SheetTitle>
        </SheetHeader>
        <div className="space-y-6">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">
              Chief Complaint
            </p>
            <p className="text-sm border-l-2 border-brand-primary pl-4 py-1 bg-muted/30">
              {appointment.complaint}
            </p>
          </div>
          {appointment.triage && (
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">
                AI Assessment
              </p>
              <div className="p-4 bg-muted/50 rounded-lg">
                <Badge className="mb-2">{appointment.triage.severity}</Badge>
                <p className="text-sm italic text-muted-foreground">
                  {appointment.triage.recommendation}
                </p>
              </div>
            </div>
          )}
          <div className="pt-4 flex flex-col gap-3">
            <Button
              disabled={saving}
              onClick={() => handleStatus("IN_PROGRESS")}
            >
              {saving ? "Updating..." : "Mark as In Progress"}
            </Button>
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => handleStatus("COMPLETED")}
            >
              Mark as Done
            </Button>
            <Separator className="my-2" />
            <Button variant="ghost" asChild>
              <Link href={`/patients/${appointment.patientId}`}>
                View Full Clinical Record
              </Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const DoctorNotesAction = ({ appointment }: { appointment: any }) => {
  const saveNotes = useMutation(api.consultations.saveNotes);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Stub call - appointment._id used as placeholder for consultation ID
      await saveNotes({ id: appointment._id as any, notes });
      setOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground"
          >
            Notes
          </Button>
        }
        onClick={() => setOpen(true)}
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Consultation Notes</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="Add clinical observation notes here..."
            className="min-h-[200px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Notes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const LabReviewAction = ({ result }: { result: any }) => {
  const ack = useMutation(api.labResults.acknowledgeResult);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[10px]"
            onClick={() => setOpen(true)}
          >
            Review
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lab Result: {result.testName}</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">
                Patient
              </p>
              <p className="text-sm">{result.patientName}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">
                Date
              </p>
              <p className="text-sm">{formatDate(result._creationTime)}</p>
            </div>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="font-mono text-lg">
              {result.resultValue} {result.unit}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            className="w-full"
            onClick={async () => {
              setSaving(true);
              await ack({ id: result._id });
              setSaving(false);
              setOpen(false);
            }}
            disabled={saving}
          >
            {saving ? "Saving..." : "Acknowledge Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const PrescriptionSignAction = ({ script }: { script: any }) => {
  const sign = useMutation(api.prescriptions.sign);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[10px]"
            onClick={() => setOpen(true)}
          >
            Sign
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign Prescription</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm font-medium mb-1">{script.medication}</p>
          <p className="text-xs text-muted-foreground mb-4">
            For {script.patientName}
          </p>
          <div className="p-4 border rounded bg-zinc-50 dark:bg-zinc-900 italic text-xs">
            "By signing, I authorize the immediate release of this medication as
            specified in the clinical order."
          </div>
        </div>
        <DialogFooter>
          <Button
            className="w-full"
            onClick={async () => {
              setSaving(true);
              await sign({ id: script._id });
              setSaving(false);
              setOpen(false);
            }}
            disabled={saving}
          >
            {saving ? "Signing..." : "Sign & Approve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- NURSE LAYOUT ---

const NurseDashboard = ({ user }: { user: any }) => {
  const triageQueue = useQuery(api.triage.getAllPendingForNurse) ?? [];
  const vitalsOverdue = useQuery(api.vitals.getOverduePatients) ?? [];
  const admittedPatients = useQuery(api.patients.getAllForArea) ?? [];

  return (
    <div className="space-y-12">
      {/* TRIAGE QUEUE */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
          Triage Queue
        </h2>
        <div className="divide-y divide-border border-t border-border">
          {triageQueue.map((p: any) => (
            <div
              key={p._id}
              className={`flex items-center justify-between py-4 ${getUrgencyClass(p.severity)}`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {p.name}, {p.age}y
                  </span>
                  {p.severity === "UNASSESSED" && (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                      NEEDS TRIAGE
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-sm">
                  {p.complaint}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground">
                  {getRelativeTime(p._creationTime)}
                </span>
                <TriageNowAction patient={p} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* VITALS DUE */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
          Vitals Due
        </h2>
        <div className="divide-y divide-border border-t border-border">
          {vitalsOverdue.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground italic">
              All patients have recent vitals on record
            </p>
          ) : (
            vitalsOverdue.map((p: any) => (
              <div
                key={p._id}
                className="flex items-center justify-between py-3 pl-3"
              >
                <div className="text-sm">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Last recorded: {p.lastRecorded}h ago
                  </p>
                </div>
                <RecordVitalsAction patient={p} />
              </div>
            ))
          )}
        </div>
      </section>

      {/* ADMITTED PATIENTS */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
          All Admitted Patients
        </h2>
        <div className="divide-y divide-border border-t border-border">
          {admittedPatients.slice(0, 20).map((p: any) => (
            <div
              key={p._id}
              className="flex items-center justify-between py-3 pl-3"
            >
              <div className="text-sm">
                <p className="font-medium">
                  {p.name}, {p.age}y
                </p>
                <p className="text-xs text-muted-foreground">
                  Adm: {formatDate(p._creationTime)} • Dr.{" "}
                  {p.admittingDoc || "TBD"}
                </p>
              </div>
              <Button size="sm" variant="ghost" asChild>
                <Link href={`/patients/${p._id}`}>View</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const TriageNowAction = ({ patient }: { patient: any }) => {
  const submitTriage = useMutation(api.triage.submit);
  const [complaint, setComplaint] = useState(patient.complaint || "");
  const [severity, setSeverity] = useState("LOW");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await submitTriage({
        patientId: patient._id,
        complaint,
        symptoms: [], // multi-select omitted for brevity
        severity,
        notes,
      });
      setOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button size="sm" variant="outline" className="h-7 text-[10px]">
            Triage Now
          </Button>
        }
      />
      <SheetContent className="sm:max-w-md">
        <SheetHeader className="mb-6">
          <SheetTitle>Triage: {patient.name}</SheetTitle>
        </SheetHeader>
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">
              Chief Complaint
            </p>
            <Textarea
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">
              Severity
            </p>
            <div className="flex gap-2">
              {["LOW", "MODERATE", "CRITICAL"].map((s) => (
                <Button
                  key={s}
                  variant={severity === s ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSeverity(s)}
                  className="flex-1 text-[10px]"
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">
              Clinical Notes
            </p>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <Button
            className="w-full mt-4"
            disabled={saving}
            onClick={handleSubmit}
          >
            {saving ? "Submitting..." : "Submit Triage"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const RecordVitalsAction = ({ patient }: { patient: any }) => {
  const record = useMutation(api.vitals.record);
  const [vitals, setVitals] = useState({
    temp: 36.5,
    sbp: 120,
    dbp: 80,
    hr: 75,
    ox: 98,
    rr: 16,
    wt: 70,
  });
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button size="sm" variant="outline" className="h-7 text-[10px]">
            Record
          </Button>
        }
      />
      <SheetContent className="sm:max-w-md">
        <SheetHeader className="mb-6">
          <SheetTitle>Record Vitals: {patient.name}</SheetTitle>
        </SheetHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">
                Temp (°C)
              </p>
              <Input
                type="number"
                value={vitals.temp}
                onChange={(e) =>
                  setVitals({ ...vitals, temp: +e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">
                HR (BPM)
              </p>
              <Input
                type="number"
                value={vitals.hr}
                onChange={(e) => setVitals({ ...vitals, hr: +e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">
                Sys/Dia
              </p>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={vitals.sbp}
                  onChange={(e) =>
                    setVitals({ ...vitals, sbp: +e.target.value })
                  }
                />
                <span>/</span>
                <Input
                  type="number"
                  value={vitals.dbp}
                  onChange={(e) =>
                    setVitals({ ...vitals, dbp: +e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">
                O2 (%)
              </p>
              <Input
                type="number"
                value={vitals.ox}
                onChange={(e) => setVitals({ ...vitals, ox: +e.target.value })}
              />
            </div>
          </div>
          <Button
            className="w-full mt-4"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              await record({
                patientId: patient._id,
                temperature: vitals.temp,
                bpSystolic: vitals.sbp,
                bpDiastolic: vitals.dbp,
                heartRate: vitals.hr,
                oxSaturation: vitals.ox,
                respRate: vitals.rr,
                weight: vitals.wt,
              });
              setSaving(false);
              setOpen(false);
            }}
          >
            {saving ? "Saving..." : "Save Vitals"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// --- PATIENT LAYOUT ---

const PatientDashboard = ({ user }: { user: any }) => {
  const upcoming = useQuery(api.appointments.getUpcomingForPatient) ?? [];
  const recentActivity =
    useQuery(
      api.appointments.getAllForPatient,
      user?.patient?._id ? { patientId: user.patient._id } : undefined,
    ) ?? [];
  const myDoctors = useQuery(api.doctors.list) ?? [];
  const lastTriage = useQuery(
    api.triage.getRecentForPatient,
    user?.patient?._id ? { patientId: user.patient._id } : undefined,
  );

  return (
    <div className="space-y-12">
      {/* NEXT APPOINTMENT */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
            Next Appointment
          </h2>
          <PatientBookAction />
        </div>
        <div className="border border-border rounded-2xl p-6 bg-zinc-50 dark:bg-zinc-950">
          {upcoming[0] ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-bold text-heading">
                  Dr. {upcoming[0].doctorName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(upcoming[0].scheduledAt)} at{" "}
                  {formatTime(upcoming[0].scheduledAt)}
                </p>
                <Badge variant="outline" className="mt-2 text-[10px]">
                  {upcoming[0].type}
                </Badge>
              </div>
              <PatientCancelAction
                appointmentId={upcoming[0]?._id}
                doctorName={upcoming[0]?.doctorName ?? ""}
              />
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-4">
                You have no upcoming appointments
              </p>
              <PatientBookAction
                trigger={<Button variant="outline">Book an Appointment</Button>}
              />
            </div>
          )}
        </div>
      </section>

      {/* MY DOCTORS */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
          My Doctors
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myDoctors.slice(0, 4).map((d: any) => (
            <div
              key={d._id}
              className="flex items-center justify-between p-4 border border-border rounded-xl"
            >
              <div>
                <p className="text-sm font-medium">Dr. {d.name}</p>
                <p className="text-[10px] text-muted-foreground uppercase">
                  {d.role}
                </p>
              </div>
              <PatientBookAction
                doctor={d}
                trigger={
                  <Button variant="ghost" size="sm" className="text-[10px]">
                    Book Follow-up
                  </Button>
                }
              />
            </div>
          ))}
        </div>
      </section>

      {/* RECENT ACTIVITY */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
          Recent Activity
        </h2>
        <div className="divide-y divide-border border-t border-border">
          {recentActivity.slice(0, 15).map((act: any) => (
            <div
              key={act._id}
              className="flex items-center justify-between py-3 pl-3"
            >
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-[8px] font-black">
                  {act.type || "APPOINTMENT"}
                </Badge>
                <span className="text-sm font-medium">
                  {act.description || `Visit with Dr. ${act.doctorName}`}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDate(act._creationTime)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 text-right">
          <Link
            href="/appointments"
            className="text-xs font-semibold text-brand-primary hover:underline"
          >
            View full history &rarr;
          </Link>
        </div>
      </section>

      {/* AI TRIAGE */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
          AI Triage
        </h2>
        <div className="flex items-center justify-between p-6 border-2 border-dashed border-border rounded-2xl">
          {lastTriage ? (
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge>{lastTriage.severity}</Badge>
                <span className="text-xs text-muted-foreground">
                  Result from {formatDate(lastTriage._creationTime)}
                </span>
              </div>
              <p className="text-sm font-medium text-heading mb-4 italic">
                "{lastTriage.recommendation}"
              </p>
              <Button asChild variant="secondary" size="sm">
                <Link href="/triage">Start New Triage</Link>
              </Button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col md:flex-row items-center justify-between gap-6">
              <p className="text-sm font-medium text-muted-foreground text-center md:text-left">
                Not feeling well? Get an instant symptom assessment using our AI
                engine.
              </p>
              <Button asChild>
                <Link href="/triage">Start AI Triage</Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

const PatientBookAction = ({
  doctor,
  trigger,
}: {
  doctor?: any;
  trigger?: React.ReactNode;
}) => {
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
            <Button size="sm" variant="outline" className="h-7 text-[10px]">
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
              className="w-full p-2 border rounded-md text-sm"
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
                className="w-full p-2 border rounded-md text-sm"
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
            />
          </div>
          <Button
            className="w-full mt-4"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              await book({
                doctorId: selectedDoc,
                scheduledAt: Date.now() + 86400000,
                type: "REMOTE",
              });
              setSaving(false);
              setOpen(false);
            }}
          >
            {saving ? "Processing..." : "Confirm Booking"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const PatientCancelAction = ({
  appointmentId,
  doctorName,
}: {
  appointmentId: string;
  doctorName: string;
}) => {
  const cancel = useMutation(api.appointments.cancel);
  const [open, setOpen] = useState(false);

  const handleCancel = async () => {
    console.log("appointmentId:", appointmentId);
    try {
      const result = await cancel({ id: appointmentId as any });
      console.log("cancel result:", result);
      setOpen(false);
    } catch (err) {
      console.error("cancel error:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            className="text-red-500 hover:text-red-600 h-8 text-xs"
            onClick={() => setOpen(true)}
          >
            Cancel Appointment
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Appointment?</DialogTitle>
        </DialogHeader>
        <p className="text-sm py-4">
          Are you sure you want to cancel your appointment with Dr. {doctorName}
          ?
        </p>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            No, Keep it
          </Button>
          <Button variant="destructive" onClick={handleCancel}>
            Yes, Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- RURAL HO LAYOUT ---

const RuralHODashboard = ({ user }: { user: any }) => {
  const critical = useQuery(api.appointments.getTodayForDoctor) ?? []; // placeholder for critical
  const facilities = useQuery(api.hospitals.getAllForRHO) ?? [];

  return (
    <div className="space-y-12">
      {/* AREA OVERVIEW */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-6">
          Area Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: "Active Patients", value: 142 },
            { label: "Critical Cases", value: 4 },
            { label: "Facilities Reporting", value: 12 },
            { label: "Triage Sessions", value: 38 },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1">
              <span className="text-4xl font-bold">{stat.value}</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 mt-10">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-8 text-xs font-bold"
          >
            <Link href="/patients">View All Patients</Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-8 text-xs font-bold"
          >
            <Link href="/doctors/available">Available Doctors</Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-8 text-xs font-bold"
          >
            <Link href="/doctors/map">Doctors Map</Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-8 text-xs font-bold"
          >
            <Link href="/lab">Lab Results</Link>
          </Button>
        </div>
      </section>

      {/* CRITICAL CASES */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
          Critical Cases
        </h2>
        <div className="divide-y divide-border border-t border-border">
          {critical.filter((c) => c.severity === "CRITICAL").length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No critical cases at this time
            </p>
          ) : (
            critical
              .filter((c) => c.severity === "CRITICAL")
              .map((c: any) => (
                <div
                  key={c._id}
                  className="flex items-center justify-between py-4 border-l-4 border-red-500 pl-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {c.patientName}{" "}
                      <span className="text-xs text-muted-foreground ml-2">
                        @{c.facilityName || "Main Center"}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {c.complaint}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-[10px] text-amber-600 font-bold uppercase">
                      {c.doctorName ? `Dr. ${c.doctorName}` : "Unassigned"}
                    </span>
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/patients/${c.patientId}`}>View</Link>
                    </Button>
                  </div>
                </div>
              ))
          )}
        </div>
      </section>

      {/* FACILITY STATUS */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
          Facility Status
        </h2>
        <div className="divide-y divide-border border-t border-border">
          {facilities.map((f: any) => (
            <div
              key={f._id}
              className="flex items-center justify-between py-3 pl-3"
            >
              <Link
                href={`/patients?facility=${f.name}`}
                className="text-sm font-medium hover:underline"
              >
                {f.name}
              </Link>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground">
                  12 patients today
                </span>
                <Badge
                  variant="outline"
                  className="text-[8px] bg-green-50 text-green-600 border-green-200"
                >
                  REPORTING
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

// --- ADMIN LAYOUT ---

const AdminDashboard = ({ user }: { user: any }) => {
  const auditLogs = useQuery(api.auditLog.getRecent) ?? [];
  const [filter, setFilter] = useState("All");

  return (
    <div className="space-y-12">
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
            System Activity
          </h2>
          <div className="flex gap-4">
            {["All", "DOCTOR", "NURSE", "PATIENT"].map((role) => (
              <button
                key={role}
                className={`text-[10px] font-black uppercase tracking-widest ${filter === role ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setFilter(role)}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-border border-t border-border">
          {auditLogs.slice(0, 50).map((log: any) => (
            <div
              key={log._id}
              className="flex items-center justify-between py-3 pl-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-muted-foreground w-32 truncate">
                  {log.action}
                </span>
                <span className="text-sm">{log.user?.name || "System"}</span>
                <Badge variant="outline" className="text-[8px] h-4">
                  {log.user?.role || "ADMIN"}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {getRelativeTime(log._creationTime)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 text-right">
          <Link
            href="/admin/audit-logs"
            className="text-xs font-semibold text-brand-primary hover:underline"
          >
            View all audit logs &rarr;
          </Link>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
            User Summary
          </h2>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[10px] font-black uppercase tracking-widest"
          >
            + New User
          </Button>
        </div>
        <div className="space-y-2">
          {["PATIENT", "DOCTOR", "NURSE", "RURAL_HO", "ADMIN"].map((role) => (
            <div
              key={role}
              className="flex items-center justify-between p-4 border border-border rounded-xl"
            >
              <span className="text-sm font-medium">{role}</span>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">24 users</span>
                <Link
                  href={`/admin/users?role=${role}`}
                  className="text-xs font-semibold text-brand-primary hover:underline"
                >
                  Manage
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
          Admin Areas
        </h2>
        <div className="flex gap-8">
          {["Hospitals", "Pharmacies", "Users", "Audit Logs"].map((area) => (
            <Link
              key={area}
              href={`/admin/${area.toLowerCase().replace(" ", "-")}`}
              className="text-sm font-medium underline-offset-4 hover:underline"
            >
              {area}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

// --- MAIN PAGE ---

export default function DashboardPage() {
  const profile = useQuery(api.users.getMe);
  const { isLoaded, isSignedIn } = useUser();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  if (!mounted || !isLoaded) return null;
  if (!isSignedIn) {
    router.push("/");
    return null;
  }

  if (profile === undefined) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <LoadingState />
      </div>
    );
  }

  if (!profile)
    return <div>Account sync error. Please try logging in again.</div>;

  return (
    <div className="min-h-screen bg-background selection:bg-brand-primary/10">
      <header className="h-14 border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="max-w-5xl mx-auto h-full flex items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tighter">FCN</span>
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <Badge
              variant="outline"
              className="text-[10px] font-black tracking-widest bg-muted/50 border-border"
            >
              {profile.role}
            </Badge>
            <NavLinks role={profile.role} />
          </div>

          <div className="flex items-center gap-4">
            <Bell className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" />
            <AnimatedThemeToggler />
            <UserButton afterSignOutUrl="/" />

            <div className="md:hidden">
              <Sheet>
                <SheetTrigger
                  render={
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Menu className="h-5 w-5" />
                    </Button>
                  }
                />
                <SheetContent side="right">
                  <NavLinks role={profile.role} mobile />
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        {profile.role === "DOCTOR" && <DoctorDashboard user={profile} />}
        {profile.role === "NURSE" && <NurseDashboard user={profile} />}
        {profile.role === "PATIENT" && <PatientDashboard user={profile} />}
        {profile.role === "RURAL_HO" && <RuralHODashboard user={profile} />}
        {profile.role === "ADMIN" && <AdminDashboard user={profile} />}
      </main>
    </div>
  );
}
