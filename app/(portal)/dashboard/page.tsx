"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
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
import Link from "next/link";
import {
  Activity,
  Clock,
  FileText,
  FlaskConical,
  Heart,
  ShieldCheck,
  Users,
} from "lucide-react";

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

const EmptyState = ({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) => (
  <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-3">
    <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground">
      {icon}
    </div>
    <div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </div>
    {action}
  </div>
);

const SectionCard = ({
  title,
  count,
  rightSlot,
  children,
}: {
  title: string;
  count?: number;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section className="bg-surface border border-border rounded-2xl overflow-hidden">
    <div className="px-6 py-4 border-b border-border flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          {title}
        </h2>
        {typeof count === "number" && count > 0 && (
          <span className="text-[10px] font-black bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>
      {rightSlot}
    </div>
    <div className="divide-y divide-border">{children}</div>
  </section>
);

const CountBadge = ({ value }: { value: number }) =>
  value > 0 ? (
    <span className="text-[10px] font-black bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full">
      {value}
    </span>
  ) : null;

const LoadingState = () => (
  <div className="space-y-3">
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-4 w-2/3" />
  </div>
);

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
      .filter((p: any) => p.name?.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 20);
  }, [myPatients, searchQuery]);

  return (
    <div className="space-y-6">
      {/* TODAY'S QUEUE */}
      <SectionCard title="Today's Queue" count={todayQueue.length}>
        {todayQueue.length === 0 ? (
          <EmptyState
            icon={<Clock className="w-5 h-5" />}
            title="Queue is clear"
            description="No appointments scheduled today"
          />
        ) : (
          todayQueue.map((apt: any) => (
            <div
              key={apt._id}
              className={`flex items-center justify-between py-4 px-6 ${getUrgencyClass(apt.severity)}`}
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
      </SectionCard>

      {/* PENDING ACTIONS */}
      <SectionCard title="Pending Actions">
        <div className="px-6 py-5 space-y-6">
          {/* Lab Review */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">
                Lab Results
              </p>
              <CountBadge value={pendingLab.length} />
            </div>
            {pendingLab.length === 0 ? (
              <EmptyState
                icon={<FlaskConical className="w-5 h-5" />}
                title="All reviewed"
                description="No lab results awaiting review"
              />
            ) : (
              pendingLab.map((res: any) => (
                <div
                  key={res._id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="text-sm">
                    <span className="font-medium">{res.patientName}</span>
                    <span className="mx-2 text-muted-foreground">•</span>
                    <span className="text-muted-foreground">{res.testName}</span>
                  </div>
                  <LabReviewAction result={res} />
                </div>
              ))
            )}
          </div>
          {/* Prescription Signing */}
          <div className="space-y-1 pt-4">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">
                Prescriptions
              </p>
              <CountBadge value={pendingScripts.length} />
            </div>
            {pendingScripts.length === 0 ? (
              <EmptyState
                icon={<FileText className="w-5 h-5" />}
                title="Nothing to sign"
                description="No prescriptions pending your signature"
              />
            ) : (
              pendingScripts.map((script: any) => (
                <div
                  key={script._id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
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
              ))
            )}
          </div>
        </div>
      </SectionCard>

      {/* MY PATIENTS */}
      <SectionCard
        title="My Patients"
        count={myPatients.length}
        rightSlot={
          <Input
            placeholder="Search patients..."
            className="h-8 w-48 text-xs bg-transparent border-border"
            value={searchQuery}
            onChange={(e) => setSearchSearchQuery(e.target.value)}
          />
        }
      >
        {filteredPatients.length === 0 ? (
          <EmptyState
            icon={<Users className="w-5 h-5" />}
            title="No patients yet"
            description="Patients assigned to you will appear here"
          />
        ) : (
          filteredPatients.map((p: any) => (
            <div
              key={p._id}
              className="flex items-center justify-between py-3 px-6"
            >
              <div>
                <p className="text-sm font-medium">
                  {p.name}
                  {p.age ? `, ${p.age}y` : ""}
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
          ))
        )}
      </SectionCard>
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
      await updateStatus({ appointmentId: appointment._id, status: status as any });
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
            onClick={() => setOpen(true)}
          >
            Notes
          </Button>
        }
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
    <div className="space-y-6">
      {/* TRIAGE QUEUE */}
      <SectionCard title="Triage Queue" count={triageQueue.length}>
        {triageQueue.length === 0 ? (
          <EmptyState
            icon={<Activity className="w-5 h-5" />}
            title="Queue is empty"
            description="No patients awaiting triage"
          />
        ) : (
          triageQueue.map((p: any) => (
            <div
              key={p._id}
              className={`flex items-center justify-between py-4 px-6 ${getUrgencyClass(p.severity)}`}
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
          ))
        )}
      </SectionCard>

      {/* VITALS DUE */}
      <SectionCard title="Vitals Due" count={vitalsOverdue.length}>
        {vitalsOverdue.length === 0 ? (
          <EmptyState
            icon={<Heart className="w-5 h-5" />}
            title="All vitals recorded"
            description="No overdue vitals check-ins"
          />
        ) : (
          vitalsOverdue.map((p: any) => (
            <div
              key={p._id}
              className="flex items-center justify-between py-3 px-6"
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
      </SectionCard>

      {/* ADMITTED PATIENTS */}
      <SectionCard title="All Admitted Patients" count={admittedPatients.length}>
        {admittedPatients.length === 0 ? (
          <EmptyState
            icon={<Users className="w-5 h-5" />}
            title="No patients admitted"
            description="Admitted patients in your area will appear here"
          />
        ) : (
          admittedPatients.slice(0, 20).map((p: any) => (
            <div
              key={p._id}
              className="flex items-center justify-between py-3 px-6"
            >
              <div className="text-sm">
                <p className="font-medium">
                  {p.user?.name || p.name}, {p.age}y
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
          ))
        )}
      </SectionCard>
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
        symptoms: [],
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
              try {
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
              } catch (e) {
                console.error(e);
              } finally {
                setSaving(false);
                setOpen(false);
              }
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
    useQuery(api.appointments.getAllForPatient) ?? [];
  const myDoctors = useQuery(api.doctors.list) ?? [];
  const lastTriage =
    useQuery(
      api.triage.getRecentForPatient,
      user?._id ? { patientId: user._id } : "skip",
    ) ?? null;

  return (
    <div className="space-y-6">
      {/* NEXT APPOINTMENT */}
      <SectionCard
        title="Next Appointment"
        count={upcoming.length}
        rightSlot={<PatientBookAction />}
      >
        {upcoming[0] ? (
          <div className="flex items-center justify-between py-5 px-6">
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
          <EmptyState
            icon={<Clock className="w-5 h-5" />}
            title="No upcoming appointments"
            description="Book a session with one of your doctors below"
            action={
              <PatientBookAction
                trigger={
                  <Button variant="outline" size="sm" className="mt-1">
                    Book an Appointment
                  </Button>
                }
              />
            }
          />
        )}
      </SectionCard>

      {/* MY DOCTORS */}
      <SectionCard title="My Doctors" count={myDoctors.length}>
        {myDoctors.length === 0 ? (
          <EmptyState
            icon={<Users className="w-5 h-5" />}
            title="No doctors yet"
            description="Your care team will appear here"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-0">
            {myDoctors.slice(0, 4).map((d: any) => (
              <div
                key={d._id}
                className="flex items-center justify-between p-5 border-b border-border md:border-b md:last:border-b-0 md:[&:nth-last-child(2)]:border-b-0"
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
        )}
      </SectionCard>

      {/* RECENT ACTIVITY */}
      <SectionCard
        title="Recent Activity"
        count={recentActivity.length}
        rightSlot={
          <Link
            href="/appointments"
            className="text-xs font-semibold text-brand-primary hover:underline"
          >
            View full history &rarr;
          </Link>
        }
      >
        {recentActivity.length === 0 ? (
          <EmptyState
            icon={<Activity className="w-5 h-5" />}
            title="No activity yet"
            description="Your appointments and visits will show up here"
          />
        ) : (
          recentActivity.slice(0, 15).map((act: any) => (
            <div
              key={act._id}
              className="flex items-center justify-between py-3 px-6"
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
          ))
        )}
      </SectionCard>

      {/* AI TRIAGE */}
      <SectionCard title="AI Triage">
        {lastTriage ? (
          <div className="p-6">
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
          <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-sm font-medium text-muted-foreground text-center md:text-left">
              Not feeling well? Get an instant symptom assessment using our AI
              engine.
            </p>
            <Button asChild>
              <Link href="/triage">Start AI Triage</Link>
            </Button>
          </div>
        )}
      </SectionCard>
    </div>
  );
};

const PatientBookAction = ({
  doctor,
  trigger,
}: {
  doctor?: any;
  trigger?: React.ReactElement;
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
              try {
                await book({
                  doctorId: selectedDoc,
                  scheduledAt: Date.now() + 86400000,
                  type: "REMOTE",
                });
              } catch (e) {
                console.error(e);
              } finally {
                setSaving(false);
                setOpen(false);
              }
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
    try {
      await cancel({ id: appointmentId as any });
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
  const todayApts = useQuery(api.appointments.getTodayForDoctor) ?? [];
  const facilities = useQuery(api.hospitals.getAllForRHO) ?? [];
  const criticalCount = todayApts.filter((c: any) => c.severity === "CRITICAL").length;

  return (
    <div className="space-y-6">
      {/* AREA OVERVIEW */}
      <SectionCard title="Area Overview">
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: "Active Patients", value: 142 },
            { label: "Critical Cases", value: criticalCount },
            { label: "Facilities Reporting", value: facilities.length },
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
        <div className="px-6 pb-6 flex flex-wrap gap-3">
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
      </SectionCard>

      {/* CRITICAL CASES */}
      <SectionCard title="Critical Cases" count={criticalCount}>
        {criticalCount === 0 ? (
          <EmptyState
            icon={<Heart className="w-5 h-5" />}
            title="No critical cases"
            description="No critical cases at this time"
          />
        ) : (
          todayApts
            .filter((c: any) => c.severity === "CRITICAL")
            .map((c: any) => (
              <div
                key={c._id}
                className="flex items-center justify-between py-4 px-6 border-l-4 border-red-500"
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
      </SectionCard>

      {/* FACILITY STATUS */}
      <SectionCard title="Facility Status" count={facilities.length}>
        {facilities.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck className="w-5 h-5" />}
            title="No facilities reporting"
            description="Partner facilities will appear here"
          />
        ) : (
          facilities.map((f: any) => (
            <div
              key={f._id}
              className="flex items-center justify-between py-3 px-6"
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
          ))
        )}
      </SectionCard>
    </div>
  );
};

// --- ADMIN LAYOUT ---

const AdminDashboard = ({ user }: { user: any }) => {
  const auditLogs = useQuery(api.auditLogs.getRecent) ?? [];
  const [filter, setFilter] = useState("All");

  return (
    <div className="space-y-6">
      <SectionCard
        title="System Activity"
        count={auditLogs.length}
        rightSlot={
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
        }
      >
        {auditLogs.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck className="w-5 h-5" />}
            title="No activity yet"
            description="System events will appear here"
          />
        ) : (
          auditLogs.slice(0, 50).map((log: any) => (
            <div
              key={log._id}
              className="flex items-center justify-between py-3 px-6"
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
          ))
        )}
        <div className="px-6 py-3 text-right border-t border-border">
          <Link
            href="/admin/audit-logs"
            className="text-xs font-semibold text-brand-primary hover:underline"
          >
            View all audit logs &rarr;
          </Link>
        </div>
      </SectionCard>

      <SectionCard
        title="User Summary"
        rightSlot={
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[10px] font-black uppercase tracking-widest"
          >
            + New User
          </Button>
        }
      >
        {["PATIENT", "DOCTOR", "NURSE", "RURAL_HO", "ADMIN"].map((role) => (
          <div
            key={role}
            className="flex items-center justify-between p-4 border-b border-border last:border-0"
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
      </SectionCard>

      <SectionCard title="Admin Areas">
        <div className="p-6 flex flex-wrap gap-6">
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
      </SectionCard>
    </div>
  );
};

// --- MAIN PAGE ---

export default function DashboardPage() {
  const profile = useQuery(api.users.getMe);
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
    }
  }, [isLoaded, isSignedIn, router]);

  if (profile === undefined) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-16">
        <LoadingState />
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-sm text-muted-foreground">
          Account sync error. Please try logging in again.
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      {profile.role === "DOCTOR" && <DoctorDashboard user={profile} />}
      {profile.role === "NURSE" && <NurseDashboard user={profile} />}
      {profile.role === "PATIENT" && <PatientDashboard user={profile} />}
      {profile.role === "RURAL_HO" && <RuralHODashboard user={profile} />}
      {profile.role === "ADMIN" && <AdminDashboard user={profile} />}
    </main>
  );
}
