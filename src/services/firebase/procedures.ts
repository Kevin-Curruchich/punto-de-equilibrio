import { firestore } from "@/src/services/firebase/client";
import type { Procedure, UUID } from "@/src/types/domain";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";

const PROCEDURES_COLLECTION = "procedures";
const SYSTEM_CREATED_BY = "system";

export interface ProcedureListItem {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  isPublic: boolean;
  createdById: string;
}

export interface CreateProcedureInput {
  physiotherapistId: UUID;
  name: string;
  description?: string;
  category?: string;
  isPublic?: boolean;
  videoUrl?: string;
}

export interface UpdateProcedureInput {
  physiotherapistId: UUID;
  procedureId: UUID;
  name: string;
  description?: string;
  category?: string;
  isPublic?: boolean;
  videoUrl?: string;
}

const PUBLIC_PROCEDURE_CATALOG: Pick<
  Procedure,
  "name" | "description" | "category"
>[] = [
  {
    name: "Terapia manual",
    description:
      "Movilización y manipulación de tejidos blandos y articulaciones.",
    category: "Manual",
  },
  {
    name: "TENS",
    description: "Electroestimulación transcutánea para control del dolor.",
    category: "Electroterapia",
  },
  {
    name: "Calor terapéutico",
    description: "Aplicación de calor superficial para disminuir rigidez.",
    category: "Termoterapia",
  },
  {
    name: "Crioterapia",
    description: "Aplicación de frío para control inflamatorio y dolor.",
    category: "Termoterapia",
  },
  {
    name: "Ultrasonido terapéutico",
    description: "Uso de ultrasonido para analgesia y reparación tisular.",
    category: "Electroterapia",
  },
  {
    name: "Liberación miofascial",
    description: "Técnicas de liberación de fascia y puntos de tensión.",
    category: "Manual",
  },
  {
    name: "Movilización articular",
    description: "Movilizaciones pasivas para mejorar rango articular.",
    category: "Manual",
  },
  {
    name: "Ejercicio terapéutico",
    description: "Ejercicios dirigidos para fuerza, control y movilidad.",
    category: "Ejercicio",
  },
  {
    name: "Entrenamiento propioceptivo",
    description: "Trabajo de equilibrio y control neuromuscular.",
    category: "Ejercicio",
  },
  {
    name: "Punción seca",
    description: "Técnica invasiva para puntos gatillo miofasciales.",
    category: "Invasivo",
  },
  {
    name: "Vendaje neuromuscular",
    description: "Aplicación de kinesiotape para soporte y control del dolor.",
    category: "Vendaje",
  },
  {
    name: "Drenaje linfático manual",
    description: "Técnica para mejorar el retorno linfático y reducir edema.",
    category: "Manual",
  },
];

function normalizeOptional(input?: string): string | null {
  const value = input?.trim();
  return value ? value : null;
}

function normalizeForSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function toSlug(value: string) {
  return normalizeForSearch(value)
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function mapProcedure(item: Procedure): ProcedureListItem {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    category: item.category,
    isPublic: item.isPublic,
    createdById: item.createdById,
  };
}

/**
 * Carga un catálogo base de procedimientos públicos idempotente.
 */
export async function seedPublicProcedureCatalog() {
  await Promise.all(
    PUBLIC_PROCEDURE_CATALOG.map(async (procedure) => {
      const slug = toSlug(procedure.name);
      const procedureId = `public-${slug}`;
      const ref = doc(firestore, PROCEDURES_COLLECTION, procedureId);

      const payload: Procedure = {
        id: procedureId,
        createdById: SYSTEM_CREATED_BY,
        name: procedure.name,
        description: procedure.description,
        category: procedure.category,
        isPublic: true,
        videoUrl: null,
      };

      await setDoc(ref, payload, { merge: true });
    }),
  );

  return { created: PUBLIC_PROCEDURE_CATALOG.length };
}

/**
 * Lista procedimientos disponibles para el fisioterapeuta: públicos + propios.
 */
export async function listAvailableProcedures(
  physiotherapistId: UUID,
): Promise<ProcedureListItem[]> {
  const [publicSnap, ownSnap] = await Promise.all([
    getDocs(
      query(
        collection(firestore, PROCEDURES_COLLECTION),
        where("isPublic", "==", true),
      ),
    ),
    getDocs(
      query(
        collection(firestore, PROCEDURES_COLLECTION),
        where("createdById", "==", physiotherapistId),
      ),
    ),
  ]);

  const byId = new Map<string, ProcedureListItem>();

  for (const snap of [...publicSnap.docs, ...ownSnap.docs]) {
    const row = mapProcedure(snap.data() as Procedure);
    byId.set(row.id, row);
  }

  return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Busca procedimientos por nombre en el conjunto disponible (públicos + propios).
 */
export async function searchAvailableProcedures(
  physiotherapistId: UUID,
  searchTerm: string,
): Promise<ProcedureListItem[]> {
  const items = await listAvailableProcedures(physiotherapistId);
  const term = normalizeForSearch(searchTerm);

  if (!term) {
    return items;
  }

  return items.filter((item) => {
    const haystack = [item.name, item.description ?? "", item.category ?? ""]
      .join(" ")
      .toLowerCase();
    return normalizeForSearch(haystack).includes(term);
  });
}

/**
 * Crea un nuevo procedimiento para el fisioterapeuta.
 */
export async function createProcedure(
  input: CreateProcedureInput,
): Promise<ProcedureListItem> {
  const name = input.name.trim();

  if (!name) {
    throw new Error("El nombre del procedimiento es obligatorio.");
  }

  const existing = await listAvailableProcedures(input.physiotherapistId);
  const duplicate = existing.find(
    (item) => normalizeForSearch(item.name) === normalizeForSearch(name),
  );

  if (duplicate) {
    throw new Error("Ya existe un procedimiento con ese nombre.");
  }

  const ref = doc(collection(firestore, PROCEDURES_COLLECTION));

  const payload: Procedure = {
    id: ref.id,
    createdById: input.physiotherapistId,
    name,
    description: normalizeOptional(input.description),
    category: normalizeOptional(input.category),
    isPublic: input.isPublic ?? false,
    videoUrl: normalizeOptional(input.videoUrl),
  };

  await setDoc(ref, payload);

  return mapProcedure(payload);
}

export async function getProcedureById(
  procedureId: UUID,
): Promise<ProcedureListItem | null> {
  const ref = doc(firestore, PROCEDURES_COLLECTION, procedureId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return null;
  }

  return mapProcedure(snap.data() as Procedure);
}

export async function getOwnEditableProcedureById(
  physiotherapistId: UUID,
  procedureId: UUID,
): Promise<ProcedureListItem> {
  const record = await getProcedureById(procedureId);

  if (!record) {
    throw new Error("Procedimiento no encontrado.");
  }

  if (record.createdById !== physiotherapistId) {
    throw new Error("No tienes permisos para editar este procedimiento.");
  }

  if (record.isPublic) {
    throw new Error("Los procedimientos públicos no se editan desde aquí.");
  }

  return record;
}

export async function updateOwnProcedure(
  input: UpdateProcedureInput,
): Promise<ProcedureListItem> {
  const current = await getOwnEditableProcedureById(
    input.physiotherapistId,
    input.procedureId,
  );

  const name = input.name.trim();

  if (!name) {
    throw new Error("El nombre del procedimiento es obligatorio.");
  }

  const existing = await listAvailableProcedures(input.physiotherapistId);
  const duplicate = existing.find(
    (item) =>
      item.id !== input.procedureId &&
      normalizeForSearch(item.name) === normalizeForSearch(name),
  );

  if (duplicate) {
    throw new Error("Ya existe un procedimiento con ese nombre.");
  }

  const payload: Procedure = {
    id: current.id,
    createdById: current.createdById,
    name,
    description: normalizeOptional(input.description),
    category: normalizeOptional(input.category),
    isPublic: input.isPublic ?? current.isPublic,
    videoUrl: normalizeOptional(input.videoUrl),
  };

  await setDoc(doc(firestore, PROCEDURES_COLLECTION, current.id), payload, {
    merge: true,
  });

  return mapProcedure(payload);
}
