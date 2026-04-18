import { firestore } from "@/src/services/firebase/client";
import type {
  AccessType,
  Patient,
  PatientPhysiotherapist,
  Role,
  User,
} from "@/src/types/domain";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  where,
} from "firebase/firestore";

const USERS_COLLECTION = "users";
const PATIENTS_COLLECTION = "patients";
const PATIENT_PHYSIOTHERAPISTS_COLLECTION = "patient_physiotherapists";

export interface PhysioPatientListItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  medicalHistory: string | null;
  since: string;
  accessType: AccessType;
}

export interface CreatePatientInput {
  physiotherapistId: string;
  name: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  medicalHistory?: string;
}

export interface UpdatePatientInput {
  physiotherapistId: string;
  patientId: string;
  name: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  medicalHistory?: string;
}

function normalizeOptional(input?: string): string | null {
  const value = input?.trim();
  return value ? value : null;
}

export async function createPatientForPhysio(input: CreatePatientInput) {
  const now = new Date().toISOString();

  const patientRef = doc(collection(firestore, PATIENTS_COLLECTION));
  const patientId = patientRef.id;

  const userDoc: User = {
    id: patientId,
    firebaseUid: patientId,
    role: "patient" as Role,
    name: input.name.trim(),
    email: normalizeOptional(input.email),
    phone: normalizeOptional(input.phone),
    avatarUrl: null,
    createdAt: now,
  };

  const patientDoc: Patient = {
    id: patientId,
    userId: patientId,
    dateOfBirth: normalizeOptional(input.dateOfBirth),
    phone: normalizeOptional(input.phone),
    medicalHistory: normalizeOptional(input.medicalHistory),
  };

  const relationRef = doc(
    collection(firestore, PATIENT_PHYSIOTHERAPISTS_COLLECTION),
  );
  const relationDoc: PatientPhysiotherapist = {
    id: relationRef.id,
    patientId,
    physiotherapistId: input.physiotherapistId,
    accessType: "primary",
    assignedById: input.physiotherapistId,
    since: now,
    until: null,
    active: true,
  };

  await Promise.all([
    setDoc(doc(firestore, USERS_COLLECTION, patientId), userDoc, {
      merge: true,
    }),
    setDoc(doc(firestore, PATIENTS_COLLECTION, patientId), patientDoc, {
      merge: true,
    }),
    setDoc(relationRef, relationDoc),
  ]);

  return patientId;
}

export async function listPhysioPatients(
  physiotherapistId: string,
): Promise<PhysioPatientListItem[]> {
  const relationsQuery = query(
    collection(firestore, PATIENT_PHYSIOTHERAPISTS_COLLECTION),
    where("physiotherapistId", "==", physiotherapistId),
    where("active", "==", true),
  );

  const relationSnap = await getDocs(relationsQuery);

  const rows = await Promise.all(
    relationSnap.docs.map(async (relation) => {
      const relationData = relation.data() as PatientPhysiotherapist;

      const [userSnap, patientSnap] = await Promise.all([
        getDoc(doc(firestore, USERS_COLLECTION, relationData.patientId)),
        getDoc(doc(firestore, PATIENTS_COLLECTION, relationData.patientId)),
      ]);

      if (!userSnap.exists()) {
        return null;
      }

      const user = userSnap.data() as User;
      const patient = patientSnap.exists()
        ? (patientSnap.data() as Patient)
        : undefined;

      return {
        id: relationData.patientId,
        name: user.name,
        email: user.email,
        phone: user.phone ?? patient?.phone ?? null,
        dateOfBirth: patient?.dateOfBirth ?? null,
        medicalHistory: patient?.medicalHistory ?? null,
        since: relationData.since,
        accessType: relationData.accessType,
      } satisfies PhysioPatientListItem;
    }),
  );

  return rows
    .filter((item): item is PhysioPatientListItem => item !== null)
    .sort((a, b) => (a.since < b.since ? 1 : -1));
}

async function assertPatientBelongsToPhysio(
  physiotherapistId: string,
  patientId: string,
) {
  const relationQuery = query(
    collection(firestore, PATIENT_PHYSIOTHERAPISTS_COLLECTION),
    where("physiotherapistId", "==", physiotherapistId),
    where("patientId", "==", patientId),
    where("active", "==", true),
    limit(1),
  );

  const relationSnap = await getDocs(relationQuery);

  if (relationSnap.empty) {
    throw new Error("No tienes acceso a este paciente.");
  }
}

export async function getPhysioPatientById(
  physiotherapistId: string,
  patientId: string,
): Promise<PhysioPatientListItem> {
  await assertPatientBelongsToPhysio(physiotherapistId, patientId);

  const [userSnap, patientSnap] = await Promise.all([
    getDoc(doc(firestore, USERS_COLLECTION, patientId)),
    getDoc(doc(firestore, PATIENTS_COLLECTION, patientId)),
  ]);

  if (!userSnap.exists()) {
    throw new Error("No se encontró el usuario del paciente.");
  }

  const user = userSnap.data() as User;
  const patient = patientSnap.exists()
    ? (patientSnap.data() as Patient)
    : undefined;

  return {
    id: patientId,
    name: user.name,
    email: user.email,
    phone: user.phone ?? patient?.phone ?? null,
    dateOfBirth: patient?.dateOfBirth ?? null,
    medicalHistory: patient?.medicalHistory ?? null,
    since: user.createdAt,
    accessType: "primary",
  };
}

export async function updatePatientForPhysio(input: UpdatePatientInput) {
  await assertPatientBelongsToPhysio(input.physiotherapistId, input.patientId);

  await Promise.all([
    setDoc(
      doc(firestore, USERS_COLLECTION, input.patientId),
      {
        name: input.name.trim(),
        email: normalizeOptional(input.email),
        phone: normalizeOptional(input.phone),
      },
      { merge: true },
    ),
    setDoc(
      doc(firestore, PATIENTS_COLLECTION, input.patientId),
      {
        phone: normalizeOptional(input.phone),
        dateOfBirth: normalizeOptional(input.dateOfBirth),
        medicalHistory: normalizeOptional(input.medicalHistory),
      },
      { merge: true },
    ),
  ]);
}
