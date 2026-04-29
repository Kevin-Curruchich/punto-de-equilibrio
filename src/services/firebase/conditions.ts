import { firestore } from "@/src/services/firebase/client";
import type { Condition, ConditionStatus, UUID } from "@/src/types/domain";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  where,
} from "firebase/firestore";

const CONDITIONS_COLLECTION = "conditions";
const SESSIONS_COLLECTION = "sessions";
const PHOTOS_COLLECTION = "progress_photos";

export interface CreateConditionInput {
  patientId: UUID;
  name: string;
  description?: string;
  status?: ConditionStatus;
  startDate: string;
  endDate?: string | null;
}

export interface UpdateConditionInput {
  conditionId: UUID;
  name?: string;
  description?: string;
  status?: ConditionStatus;
  startDate?: string;
  endDate?: string | null;
}

function normalizeOptional(input?: string): string | null {
  const value = input?.trim();
  return value ? value : null;
}

/**
 * Obtiene una condición específica por ID
 */
export async function getConditionById(
  conditionId: UUID,
): Promise<Condition | null> {
  const ref = doc(firestore, CONDITIONS_COLLECTION, conditionId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return null;
  }

  return snap.data() as Condition;
}

/**
 * Obtiene todas las condiciones de un paciente
 */
export async function getPatientConditions(
  patientId: UUID,
): Promise<Condition[]> {
  const q = query(
    collection(firestore, CONDITIONS_COLLECTION),
    where("patientId", "==", patientId),
  );
  const snap = await getDocs(q);

  return snap.docs.map((doc) => doc.data() as Condition);
}

/**
 * Crea una nueva condición/diagnóstico
 */
export async function createCondition(
  input: CreateConditionInput,
): Promise<Condition> {
  const conditionRef = doc(collection(firestore, CONDITIONS_COLLECTION));
  const conditionId = conditionRef.id;

  const conditionDoc: Condition = {
    id: conditionId,
    patientId: input.patientId,
    name: input.name.trim(),
    description: normalizeOptional(input.description),
    status: input.status ?? "active",
    startDate: input.startDate,
    endDate: input.endDate ?? null,
  };

  await setDoc(conditionRef, conditionDoc);

  return conditionDoc;
}

/**
 * Actualiza una condición existente
 */
export async function updateCondition(
  input: UpdateConditionInput,
): Promise<Condition> {
  const ref = doc(firestore, CONDITIONS_COLLECTION, input.conditionId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw new Error(`Condición con ID ${input.conditionId} no encontrada.`);
  }

  const current = snap.data() as Condition;

  const updated: Condition = {
    ...current,
    name: input.name ?? current.name,
    description:
      input.description !== undefined
        ? normalizeOptional(input.description)
        : current.description,
    status: input.status ?? current.status,
    startDate: input.startDate ?? current.startDate,
    endDate: input.endDate !== undefined ? input.endDate : current.endDate,
  };

  await setDoc(ref, updated);

  return updated;
}

/**
 * Elimina una condición solo si no tiene información relacionada.
 * Regla actual: no debe tener sesiones ni fotos relacionadas.
 */
export async function deleteConditionIfEmpty(input: {
  conditionId: UUID;
  patientId?: UUID;
}): Promise<void> {
  const conditionRef = doc(firestore, CONDITIONS_COLLECTION, input.conditionId);
  const conditionSnap = await getDoc(conditionRef);

  if (!conditionSnap.exists()) {
    throw new Error("El diagnóstico no existe o ya fue eliminado.");
  }

  const condition = conditionSnap.data() as Condition;

  if (input.patientId && condition.patientId !== input.patientId) {
    throw new Error("El diagnóstico no pertenece al paciente seleccionado.");
  }

  const [sessionsSnap, photosSnap] = await Promise.all([
    getDocs(
      query(
        collection(firestore, SESSIONS_COLLECTION),
        where("conditionId", "==", input.conditionId),
        limit(1),
      ),
    ),
    getDocs(
      query(
        collection(firestore, PHOTOS_COLLECTION),
        where("conditionId", "==", input.conditionId),
        limit(1),
      ),
    ),
  ]);

  if (!sessionsSnap.empty) {
    throw new Error(
      "No se puede eliminar el diagnóstico porque tiene sesiones relacionadas.",
    );
  }

  if (!photosSnap.empty) {
    throw new Error(
      "No se puede eliminar el diagnóstico porque tiene fotos relacionadas.",
    );
  }

  await deleteDoc(conditionRef);
}

export interface ConditionMeasurementRecord {
  sessionId: UUID;
  sessionDate: string;
  metricName: string;
  unit: string | null;
  value: number;
  notes: string | null;
}

/**
 * Obtiene todos los registros de medición para una condición,
 * agrupados por métrica y ordenados por fecha.
 */
export async function getConditionMeasurements(
  conditionId: UUID,
): Promise<ConditionMeasurementRecord[]> {
  const q = query(
    collection(firestore, SESSIONS_COLLECTION),
    where("conditionId", "==", conditionId),
  );
  const snap = await getDocs(q);

  const measurements: ConditionMeasurementRecord[] = [];

  snap.docs.forEach((doc) => {
    const session = doc.data() as {
      id: UUID;
      date: string;
      measurements?: Array<{
        metricName: string;
        unit: string | null;
        value: number;
        notes: string | null;
      }>;
    };

    if (session.measurements && session.measurements.length > 0) {
      session.measurements.forEach((measurement) => {
        measurements.push({
          sessionId: session.id,
          sessionDate: session.date,
          metricName: measurement.metricName,
          unit: measurement.unit,
          value: measurement.value,
          notes: measurement.notes,
        });
      });
    }
  });

  // Sort by date ascending (oldest first)
  measurements.sort((a, b) => a.sessionDate.localeCompare(b.sessionDate));

  return measurements;
}
