import { firestore } from "@/src/services/firebase/client";
import type { SessionStatus, UUID } from "@/src/types/domain";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

const SESSIONS_COLLECTION = "sessions";
const CONDITIONS_COLLECTION = "conditions";

export interface PatientSessionListItem {
  id: string;
  patientId: UUID;
  conditionId: UUID;
  conditionName: string;
  physiotherapistId: UUID;
  date: string;
  durationMin: number | null;
  notes: string | null;
  status: SessionStatus;
  procedureIds: UUID[];
  sessionProcedures: {
    procedureId: UUID;
    sets: number | null;
    reps: number | null;
    durationSec: number | null;
    instructions: string | null;
  }[];
  measurements: {
    metricName: string;
    unit: string | null;
    value: number;
    notes: string | null;
  }[];
  createdAt: string;
}

export interface CreateScheduledSessionInput {
  physiotherapistId: UUID;
  patientId: UUID;
  conditionId: UUID;
  date: string;
  durationMin?: number;
  notes?: string;
  procedureIds?: UUID[];
  sessionProcedures?: {
    procedureId: UUID;
    sets?: number;
    reps?: number;
    durationSec?: number;
    instructions?: string;
  }[];
  measurements?: {
    metricName: string;
    unit?: string;
    value: number;
    notes?: string;
  }[];
}

export interface UpdateSessionStatusInput {
  physiotherapistId: UUID;
  sessionId: UUID;
  status: Extract<SessionStatus, "completed" | "cancelled" | "scheduled">;
}

interface SessionRecord {
  id: UUID;
  patientId: UUID;
  conditionId: UUID;
  physiotherapistId: UUID;
  date: string;
  durationMin: number | null;
  notes: string | null;
  status: SessionStatus;
  procedureIds: UUID[];
  sessionProcedures: {
    procedureId: UUID;
    sets: number | null;
    reps: number | null;
    durationSec: number | null;
    instructions: string | null;
  }[];
  measurements: {
    metricName: string;
    unit: string | null;
    value: number;
    notes: string | null;
  }[];
  createdAt: string;
  updatedAt: string;
}

function normalizeOptional(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

async function getConditionName(conditionId: UUID): Promise<string> {
  const ref = doc(firestore, CONDITIONS_COLLECTION, conditionId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return "Sin diagnóstico";
  }

  const row = snap.data() as { name?: string };
  return row.name ?? "Sin diagnóstico";
}

async function assertConditionBelongsToPatient(
  patientId: UUID,
  conditionId: UUID,
) {
  const ref = doc(firestore, CONDITIONS_COLLECTION, conditionId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw new Error("No se encontró el diagnóstico seleccionado.");
  }

  const row = snap.data() as { patientId?: string };

  if (row.patientId !== patientId) {
    throw new Error("El diagnóstico no pertenece al paciente seleccionado.");
  }
}

export async function createScheduledSession(
  input: CreateScheduledSessionInput,
): Promise<PatientSessionListItem> {
  await assertConditionBelongsToPatient(input.patientId, input.conditionId);

  const normalizedSessionProcedures =
    input.sessionProcedures?.map((item) => ({
      procedureId: item.procedureId,
      sets: item.sets ?? null,
      reps: item.reps ?? null,
      durationSec: item.durationSec ?? null,
      instructions: normalizeOptional(item.instructions),
    })) ?? [];

  const normalizedMeasurements =
    input.measurements?.map((item) => ({
      metricName: item.metricName.trim(),
      unit: normalizeOptional(item.unit),
      value: item.value,
      notes: normalizeOptional(item.notes),
    })) ?? [];

  const procedureIds =
    normalizedSessionProcedures.length > 0
      ? normalizedSessionProcedures.map((item) => item.procedureId)
      : (input.procedureIds ?? []);

  const now = new Date().toISOString();
  const ref = doc(collection(firestore, SESSIONS_COLLECTION));

  const payload: SessionRecord = {
    id: ref.id,
    patientId: input.patientId,
    conditionId: input.conditionId,
    physiotherapistId: input.physiotherapistId,
    date: input.date,
    durationMin: input.durationMin ?? null,
    notes: normalizeOptional(input.notes),
    status: "scheduled",
    procedureIds,
    sessionProcedures: normalizedSessionProcedures,
    measurements: normalizedMeasurements,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(ref, payload);

  return {
    ...payload,
    conditionName: await getConditionName(payload.conditionId),
  };
}

export async function listPatientSessions(
  physiotherapistId: UUID,
  patientId: UUID,
): Promise<PatientSessionListItem[]> {
  const q = query(
    collection(firestore, SESSIONS_COLLECTION),
    where("patientId", "==", patientId),
  );

  const snap = await getDocs(q);

  const records = snap.docs
    .map((item) => item.data() as SessionRecord)
    .filter((item) => item.physiotherapistId === physiotherapistId);

  const uniqueConditionIds = Array.from(
    new Set(records.map((x) => x.conditionId)),
  );
  const conditionNamePairs = await Promise.all(
    uniqueConditionIds.map(async (id) => ({
      id,
      name: await getConditionName(id),
    })),
  );
  const conditionMap = new Map(conditionNamePairs.map((x) => [x.id, x.name]));

  return records
    .map((row) => ({
      ...row,
      conditionName: conditionMap.get(row.conditionId) ?? "Sin diagnóstico",
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function updateSessionStatus(
  input: UpdateSessionStatusInput,
): Promise<void> {
  const ref = doc(firestore, SESSIONS_COLLECTION, input.sessionId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw new Error("No se encontró la sesión.");
  }

  const current = snap.data() as SessionRecord;

  if (current.physiotherapistId !== input.physiotherapistId) {
    throw new Error("No tienes permisos para editar esta sesión.");
  }

  await updateDoc(ref, {
    status: input.status,
    updatedAt: new Date().toISOString(),
  });
}
