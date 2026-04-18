// ============================================================
// BASE TYPES
// ============================================================

export type UUID = string;
export type ISODateString = string; // "2025-01-15"
export type ISODateTimeString = string; // "2025-01-15T08:00:00Z"

// ============================================================
// DOMAIN 1: IDENTITY & ACCESS
// ============================================================

export type Role = "physiotherapist" | "patient" | "admin";

export type AccessType = "primary" | "coverage" | "collaborator";

export type ClinicRole = "director" | "collaborator";

export type InvitationCodeStatus = "pending" | "used" | "expired";

export interface User {
  id: UUID;
  firebaseUid: string;
  role: Role;
  name: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  createdAt: ISODateTimeString;
}

export interface Physiotherapist {
  id: UUID;
  userId: UUID;
  specialty: string[] | null;
  licenseNumber: string | null;
  // relations
  user?: User;
  clinics?: ClinicPhysiotherapist[];
  patients?: PatientPhysiotherapist[];
}

export interface Patient {
  id: UUID;
  userId: UUID;
  dateOfBirth: ISODateString | null;
  phone: string | null;
  medicalHistory: string | null;
  // relations
  user?: User;
  physiotherapists?: PatientPhysiotherapist[];
  conditions?: Condition[];
}

export interface Clinic {
  id: UUID;
  name: string;
  address: string | null;
  phone: string | null;
  // relations
  physiotherapists?: ClinicPhysiotherapist[];
}

export interface ClinicPhysiotherapist {
  id: UUID;
  clinicId: UUID;
  physiotherapistId: UUID;
  clinicRole: ClinicRole;
  active: boolean;
  // relations
  clinic?: Clinic;
  physiotherapist?: Physiotherapist;
}

export interface PatientPhysiotherapist {
  id: UUID;
  patientId: UUID;
  physiotherapistId: UUID;
  accessType: AccessType;
  assignedById: UUID | null;
  since: ISODateTimeString;
  until: ISODateTimeString | null;
  active: boolean;
  // relations
  patient?: Patient;
  physiotherapist?: Physiotherapist;
  assignedBy?: Physiotherapist | null;
}

export interface InvitationCode {
  id: UUID;
  patientId: UUID;
  createdById: UUID;
  code: string;
  status: InvitationCodeStatus;
  expiresAt: ISODateTimeString;
  usedAt: ISODateTimeString | null;
  usedByFirebaseUid: string | null;
  // relations
  patient?: Patient;
  createdBy?: Physiotherapist;
}

// ============================================================
// DOMAIN 2: CLINICAL HISTORY
// ============================================================

export type ConditionStatus = "active" | "resolved" | "on_hold";

export type SessionStatus = "scheduled" | "completed" | "cancelled";

export interface Condition {
  id: UUID;
  patientId: UUID;
  name: string;
  description: string | null;
  status: ConditionStatus;
  startDate: ISODateString;
  endDate: ISODateString | null;
  // relations
  patient?: Patient;
  sessions?: Session[];
  metrics?: Metric[];
  photographs?: ProgressPhoto[];
}

export interface Session {
  id: UUID;
  conditionId: UUID;
  physiotherapistId: UUID;
  date: ISODateString;
  durationMin: number | null;
  notes: string | null;
  status: SessionStatus;
  // relations
  condition?: Condition;
  physiotherapist?: Physiotherapist;
  procedures?: SessionProcedure[];
  measurements?: Measurement[];
  tasks?: PatientTask[];
  messages?: PhysioMessage[];
}

export interface Procedure {
  id: UUID;
  createdById: UUID;
  name: string;
  description: string | null;
  category: string | null;
  isPublic: boolean;
  videoUrl: string | null;
  // relations
  createdBy?: Physiotherapist;
  sessions?: SessionProcedure[];
  tasks?: PatientTask[];
}

export interface SessionProcedure {
  id: UUID;
  sessionId: UUID;
  procedureId: UUID;
  sets: number | null;
  reps: number | null;
  durationSec: number | null;
  instructions: string | null;
  // relations
  session?: Session;
  procedure?: Procedure;
}

// ============================================================
// DOMAIN 3: PROGRESS & MEASUREMENT
// ============================================================

export type PhotoViewType =
  | "frontal"
  | "lateral"
  | "dorsal"
  | "dorsal-izq"
  | "dorsal-der"
  | string;

export interface Metric {
  id: UUID;
  conditionId: UUID;
  name: string;
  unit: string;
  initialValue: number | null;
  targetValue: number | null;
  // relations
  condition?: Condition;
  measurements?: Measurement[];
}

export interface Measurement {
  id: UUID;
  metricId: UUID;
  sessionId: UUID;
  value: number;
  notes: string | null;
  recordedAt: ISODateTimeString;
  // relations
  metric?: Metric;
  session?: Session;
}

export interface ProgressPhoto {
  id: UUID;
  conditionId: UUID;
  uploadedById: UUID;
  imageUrl: string;
  viewType: PhotoViewType | null; // e.g., "frontal", "lateral", "dorsal" (angle/view of diagnostic photo)
  notes: string | null;
  capturedAt: ISODateTimeString;
  // relations
  condition?: Condition;
}

// ============================================================
// DOMAIN 3B: PHOTO UPLOAD & DIAGNOSTIC IMAGING
// ============================================================

// Physiotherapist can upload progress photos from gallery or capture new ones
// Photos are attached to a Condition/Diagnostic for tracking visible progress
// Supports multiple photos per condition with different viewTypes for comparison

// ============================================================
// DOMAIN 4: PATIENT TASKS
// ============================================================

export interface PatientTask {
  id: UUID;
  patientId: UUID;
  procedureId: UUID;
  sessionId: UUID | null;
  assignedAt: ISODateString;
  dueDate: ISODateString | null;
  completed: boolean;
  patientFeedback: string | null;
  // relations
  patient?: Patient;
  procedure?: Procedure;
  session?: Session | null;
}

// ============================================================
// DOMAIN 5: NOTIFICATIONS
// ============================================================

export type Platform = "ios" | "android";

export type NotificationType =
  | "exercise_reminder"
  | "upcoming_session"
  | "task_assigned"
  | "physio_message";

export type NotificationStatus =
  | "pending"
  | "sent"
  | "read"
  | "skipped"
  | "failed";

export interface Device {
  id: UUID;
  userId: UUID;
  fcmToken: string;
  platform: Platform;
  active: boolean;
  registeredAt: ISODateTimeString;
  lastUsedAt: ISODateTimeString | null;
  // relations
  user?: User;
}

export interface NotificationPreference {
  id: UUID;
  userId: UUID;
  notificationType: NotificationType;
  active: boolean;
  preferredTime: string | null; // "08:00"
  weekDays: string | null; // "1,3,5"  (mon, wed, fri)
  inAppOnly: boolean;
  // relations
  user?: User;
}

export type NotificationExtraData =
  | { type: "exercise_reminder"; taskId: UUID; procedureName: string }
  | {
      type: "upcoming_session";
      sessionId: UUID;
      date: ISODateString;
      physioName: string;
    }
  | {
      type: "task_assigned";
      taskId: UUID;
      procedureName: string;
      dueDate: ISODateString;
    }
  | {
      type: "physio_message";
      messageId: UUID;
      senderName: string;
      preview: string;
    };

export interface Notification {
  id: UUID;
  recipientId: UUID;
  originatedById: UUID | null;
  type: NotificationType;
  title: string;
  body: string;
  extraData: NotificationExtraData | null;
  status: NotificationStatus;
  scheduledAt: ISODateTimeString;
  sentAt: ISODateTimeString | null;
  readAt: ISODateTimeString | null;
  // relations
  recipient?: User;
  originatedBy?: User | null;
}

export interface PhysioMessage {
  id: UUID;
  senderId: UUID;
  patientId: UUID;
  sessionId: UUID | null;
  content: string;
  read: boolean;
  sentAt: ISODateTimeString;
  // relations
  sender?: User;
  patient?: Patient;
  session?: Session | null;
}

// ============================================================
// UTILITY TYPES — DTOs & common views
// ============================================================

export interface PatientSummary {
  id: UUID;
  name: string;
  avatarUrl: string | null;
  activeCondition: string | null;
  lastSession: ISODateString | null;
  tasksCompletedToday: number;
  tasksTotal: number;
}

export interface MetricProgress {
  metric: Metric;
  measurements: {
    date: ISODateString;
    value: number;
    sessionId: UUID;
  }[];
  progressPercentage: number | null;
}

export interface PatientProfile {
  user: User;
  patient: Patient;
  activeConditions: Condition[];
  todayTasks: PatientTask[];
  unreadNotifications: number;
}

export interface SessionDetail extends Session {
  condition: Condition;
  physiotherapist: Physiotherapist;
  procedures: (SessionProcedure & { procedure: Procedure })[];
  measurements: (Measurement & { metric: Metric })[];
}

export interface CreateSessionInput {
  conditionId: UUID;
  physiotherapistId: UUID;
  date: ISODateString;
  durationMin?: number;
  notes?: string;
  procedures: {
    procedureId: UUID;
    sets?: number;
    reps?: number;
    durationSec?: number;
    instructions?: string;
  }[];
  measurements: {
    metricId: UUID;
    value: number;
    notes?: string;
  }[];
}

export interface ActivatePatientAccountInput {
  invitationCode: string;
  firebaseToken: string;
}
