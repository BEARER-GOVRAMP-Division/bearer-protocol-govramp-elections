export const DEMO_JURISDICTIONS = Object.freeze([
  {
    id: "or-portland-demo",
    name: "Portland Demo Precinct",
    region: "Oregon",
    registeredVoters: 1240,
    simulatedBallots: 318,
    demoAudits: 3,
    status: "Ready for review"
  },
  {
    id: "co-denver-demo",
    name: "Denver Demo Precinct",
    region: "Colorado",
    registeredVoters: 980,
    simulatedBallots: 271,
    demoAudits: 2,
    status: "Simulation active"
  },
  {
    id: "va-richmond-demo",
    name: "Richmond Demo Precinct",
    region: "Virginia",
    registeredVoters: 1110,
    simulatedBallots: 194,
    demoAudits: 4,
    status: "Ready for review"
  }
]);

export const CONTEST_OPTIONS = Object.freeze([
  { value: "mayor-demo", label: "Demo Mayoral Contest" },
  { value: "council-demo", label: "Demo Council Contest" },
  { value: "referendum-demo", label: "Demo Referendum" }
]);

export const CHOICE_OPTIONS = Object.freeze([
  { value: "option-a", label: "Option A" },
  { value: "option-b", label: "Option B" },
  { value: "option-c", label: "Option C" }
]);

const DEFAULT_DRAFT = Object.freeze({
  voterAlias: "",
  precinct: "",
  contest: CONTEST_OPTIONS[0].value,
  choice: ""
});
const ALLOWED_DRAFT_FIELDS = new Set(Object.keys(DEFAULT_DRAFT));

function cloneJurisdiction(jurisdiction) {
  return { ...jurisdiction };
}

function createDefaultDraft() {
  return { ...DEFAULT_DRAFT };
}

export function createInitialState() {
  return {
    status: "idle",
    error: "",
    statusMessage: "Activate the demo to view synthetic precinct data.",
    jurisdictions: [],
    selectedJurisdictionId: "",
    activity: [],
    isBallotModalOpen: false,
    ballotDraft: createDefaultDraft(),
    lastSimulationRecord: null
  };
}

export function beginLoading(state) {
  return {
    ...state,
    status: "loading",
    error: "",
    statusMessage: "Loading deterministic demonstration data…"
  };
}

export function loadDemoData(state, jurisdictions = DEMO_JURISDICTIONS) {
  const normalized = jurisdictions.map(cloneJurisdiction);
  return {
    ...state,
    status: "ready",
    error: "",
    jurisdictions: normalized,
    selectedJurisdictionId: normalized[0]?.id ?? "",
    statusMessage: normalized.length
      ? "Synthetic precinct data loaded. Actions remain local to this browser session."
      : "No demonstration precincts are available.",
    activity: [],
    isBallotModalOpen: false,
    ballotDraft: createDefaultDraft(),
    lastSimulationRecord: null
  };
}

export function loadFailure(state, message) {
  return {
    ...state,
    status: "error",
    error: message || "Unable to load the demonstration data.",
    statusMessage: "The demo could not initialize.",
    jurisdictions: [],
    selectedJurisdictionId: "",
    activity: [],
    isBallotModalOpen: false,
    ballotDraft: createDefaultDraft(),
    lastSimulationRecord: null
  };
}

export function selectJurisdiction(state, jurisdictionId) {
  const exists = state.jurisdictions.some((jurisdiction) => jurisdiction.id === jurisdictionId);
  return {
    ...state,
    selectedJurisdictionId: exists ? jurisdictionId : state.selectedJurisdictionId
  };
}

export function openBallotModal(state) {
  return {
    ...state,
    error: "",
    isBallotModalOpen: true
  };
}

export function closeBallotModal(state) {
  return {
    ...state,
    isBallotModalOpen: false,
    ballotDraft: createDefaultDraft()
  };
}

export function updateBallotDraft(state, field, value) {
  if (!ALLOWED_DRAFT_FIELDS.has(field)) {
    throw new Error(`Unknown ballot field: ${field}`);
  }

  return {
    ...state,
    ballotDraft: {
      ...state.ballotDraft,
      [field]: value
    }
  };
}

function buildSimulationRecord(state) {
  return {
    id: `activity-${state.activity.length + 1}`,
    jurisdictionId: state.selectedJurisdictionId,
    timestamp: "Synthetic session update",
    summary: `Locally simulated ballot recorded for ${state.ballotDraft.precinct || "unspecified precinct"} using synthetic alias ${state.ballotDraft.voterAlias}.`
  };
}

export function castBallot(state) {
  const { voterAlias, precinct, contest, choice } = state.ballotDraft;
  if (!state.selectedJurisdictionId) {
    throw new Error("Select a precinct before recording a simulated ballot.");
  }

  if (!voterAlias.trim() || !precinct.trim() || !contest || !choice) {
    throw new Error("Complete every field before recording a simulated ballot.");
  }

  const nextJurisdictions = state.jurisdictions.map((jurisdiction) =>
    jurisdiction.id === state.selectedJurisdictionId
      ? {
          ...jurisdiction,
          simulatedBallots: jurisdiction.simulatedBallots + 1,
          status: "Simulation active"
        }
      : jurisdiction
  );

  const lastSimulationRecord = buildSimulationRecord(state);

  return {
    ...state,
    jurisdictions: nextJurisdictions,
    activity: [lastSimulationRecord, ...state.activity].slice(0, 8),
    isBallotModalOpen: false,
    ballotDraft: createDefaultDraft(),
    error: "",
    lastSimulationRecord,
    statusMessage:
      "Simulated ballot update recorded locally. No real ballot was created, submitted, or counted."
  };
}

export function resetSimulation() {
  return createInitialState();
}

export function getSelectedJurisdiction(state) {
  return state.jurisdictions.find((jurisdiction) => jurisdiction.id === state.selectedJurisdictionId) ?? null;
}

export function deriveTotals(state) {
  return state.jurisdictions.reduce(
    (totals, jurisdiction) => {
      totals.registeredVoters += jurisdiction.registeredVoters;
      totals.simulatedBallots += jurisdiction.simulatedBallots;
      totals.demoAudits += jurisdiction.demoAudits;
      return totals;
    },
    { registeredVoters: 0, simulatedBallots: 0, demoAudits: 0 }
  );
}
