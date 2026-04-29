export const APP_ROUTES = {
  physioSessionsNew: "/(app)/(physio)/(tabs)/sessions/new",
  physioProceduresEditor: "/(app)/(physio)/(tabs)/procedures/editor",
  physioPatientsNew: "/(app)/(physio)/(tabs)/patients/new",
  physioPatientsConditionsNew:
    "/(app)/(physio)/(tabs)/patients/[id]/diagnostic/new",
} as const;

export const APP_ROUTE_PATHNAMES = {
  physioSessionDetail: "/(app)/(physio)/(tabs)/sessions/[id]",
  physioPatientDetail: "/(app)/(physio)/(tabs)/patients/[id]",
  physioPatientDiagnosticDetail:
    "/(app)/(physio)/(tabs)/patients/[id]/diagnostic/[conditionId]",
} as const;
