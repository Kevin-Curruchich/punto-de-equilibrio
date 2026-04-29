import { firestore } from "@/src/services/firebase/client";
import type { Metric, UUID } from "@/src/types/domain";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";

const METRICS_COLLECTION = "metrics";

export interface CreateMetricInput {
  conditionId: UUID;
  name: string;
  unit: string;
  initialValue?: number | null;
  targetValue?: number | null;
}

export interface UpdateMetricInput {
  metricId: UUID;
  name?: string;
  unit?: string;
  initialValue?: number | null;
  targetValue?: number | null;
}

function normalizeNumber(input?: number | null): number | null {
  return typeof input === "number" && !isNaN(input) ? input : null;
}

/**
 * Obtiene una métrica específica por ID
 */
export async function getMetricById(metricId: UUID): Promise<Metric | null> {
  const ref = doc(firestore, METRICS_COLLECTION, metricId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return null;
  }

  return snap.data() as Metric;
}

/**
 * Obtiene todas las métricas de una condición
 */
export async function getConditionMetrics(
  conditionId: UUID,
): Promise<Metric[]> {
  const q = query(
    collection(firestore, METRICS_COLLECTION),
    where("conditionId", "==", conditionId),
  );
  const snap = await getDocs(q);

  return snap.docs.map((doc) => doc.data() as Metric);
}

/**
 * Crea una nueva métrica para una condición
 */
export async function createMetric(input: CreateMetricInput): Promise<Metric> {
  const metricRef = doc(collection(firestore, METRICS_COLLECTION));
  const metricId = metricRef.id;

  const metricDoc: Metric = {
    id: metricId,
    conditionId: input.conditionId,
    name: input.name.trim(),
    unit: input.unit.trim(),
    initialValue: normalizeNumber(input.initialValue),
    targetValue: normalizeNumber(input.targetValue),
  };

  await setDoc(metricRef, metricDoc);

  return metricDoc;
}

/**
 * Crea múltiples métricas para una condición
 */
export async function createMetrics(
  inputs: CreateMetricInput[],
): Promise<Metric[]> {
  const metrics: Metric[] = [];

  for (const input of inputs) {
    const metric = await createMetric(input);
    metrics.push(metric);
  }

  return metrics;
}

/**
 * Actualiza una métrica existente
 */
export async function updateMetric(input: UpdateMetricInput): Promise<Metric> {
  const ref = doc(firestore, METRICS_COLLECTION, input.metricId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw new Error(`Métrica con ID ${input.metricId} no encontrada.`);
  }

  const current = snap.data() as Metric;

  const updated: Metric = {
    ...current,
    name: input.name ?? current.name,
    unit: input.unit ?? current.unit,
    initialValue:
      input.initialValue !== undefined
        ? normalizeNumber(input.initialValue)
        : current.initialValue,
    targetValue:
      input.targetValue !== undefined
        ? normalizeNumber(input.targetValue)
        : current.targetValue,
  };

  await setDoc(ref, updated);

  return updated;
}

/**
 * Elimina una métrica
 */
export async function deleteMetric(metricId: UUID): Promise<void> {
  const ref = doc(firestore, METRICS_COLLECTION, metricId);
  await deleteDoc(ref);
}

/**
 * Elimina todas las métricas de una condición (usado cuando se elimina la condición)
 */
export async function deleteConditionMetrics(conditionId: UUID): Promise<void> {
  const metrics = await getConditionMetrics(conditionId);

  for (const metric of metrics) {
    await deleteMetric(metric.id);
  }
}
