import { initializeApp } from "firebase/app";
import { doc, getFirestore, setDoc } from "firebase/firestore";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const envPath = path.join(rootDir, ".env");

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, "utf8");
  const result = {};

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const idx = trimmed.indexOf("=");
    if (idx <= 0) {
      continue;
    }

    const key = trimmed.slice(0, idx).trim();
    const value = trimmed
      .slice(idx + 1)
      .trim()
      .replace(/^['\"]|['\"]$/g, "");
    result[key] = value;
  }

  return result;
}

const fileEnv = readEnvFile(envPath);
const env = { ...fileEnv, ...process.env };

const firebaseConfig = {
  apiKey: env.FIREBASE_API_KEY,
  authDomain: env.FIREBASE_AUTH_DOMAIN,
  projectId: env.FIREBASE_PROJECT_ID,
  storageBucket: env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
  appId: env.FIREBASE_APP_ID,
};

const required = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (required.length > 0) {
  console.error("Faltan variables de Firebase:", required.join(", "));
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

const procedures = [
  {
    id: "public-terapia-manual",
    name: "Terapia manual",
    description:
      "Movilización y manipulación de tejidos blandos y articulaciones.",
    category: "Manual",
  },
  {
    id: "public-tens",
    name: "TENS",
    description: "Electroestimulación transcutánea para control del dolor.",
    category: "Electroterapia",
  },
  {
    id: "public-calor-terapeutico",
    name: "Calor terapéutico",
    description: "Aplicación de calor superficial para disminuir rigidez.",
    category: "Termoterapia",
  },
  {
    id: "public-crioterapia",
    name: "Crioterapia",
    description: "Aplicación de frío para control inflamatorio y dolor.",
    category: "Termoterapia",
  },
  {
    id: "public-ultrasonido-terapeutico",
    name: "Ultrasonido terapéutico",
    description: "Uso de ultrasonido para analgesia y reparación tisular.",
    category: "Electroterapia",
  },
  {
    id: "public-liberacion-miofascial",
    name: "Liberación miofascial",
    description: "Técnicas de liberación de fascia y puntos de tensión.",
    category: "Manual",
  },
  {
    id: "public-movilizacion-articular",
    name: "Movilización articular",
    description: "Movilizaciones pasivas para mejorar rango articular.",
    category: "Manual",
  },
  {
    id: "public-ejercicio-terapeutico",
    name: "Ejercicio terapéutico",
    description: "Ejercicios dirigidos para fuerza, control y movilidad.",
    category: "Ejercicio",
  },
  {
    id: "public-entrenamiento-propioceptivo",
    name: "Entrenamiento propioceptivo",
    description: "Trabajo de equilibrio y control neuromuscular.",
    category: "Ejercicio",
  },
  {
    id: "public-puncion-seca",
    name: "Punción seca",
    description: "Técnica invasiva para puntos gatillo miofasciales.",
    category: "Invasivo",
  },
  {
    id: "public-vendaje-neuromuscular",
    name: "Vendaje neuromuscular",
    description: "Aplicación de kinesiotape para soporte y control del dolor.",
    category: "Vendaje",
  },
  {
    id: "public-drenaje-linfatico-manual",
    name: "Drenaje linfático manual",
    description: "Técnica para mejorar el retorno linfático y reducir edema.",
    category: "Manual",
  },
];

async function run() {
  await Promise.all(
    procedures.map((item) =>
      setDoc(
        doc(firestore, "procedures", item.id),
        {
          id: item.id,
          createdById: "system",
          name: item.name,
          description: item.description,
          category: item.category,
          isPublic: true,
          videoUrl: null,
        },
        { merge: true },
      ),
    ),
  );

  console.log(
    `Catalogo cargado: ${procedures.length} procedimientos publicos.`,
  );
}

run().catch((error) => {
  console.error("No se pudo cargar el catalogo:", error);
  process.exit(1);
});
