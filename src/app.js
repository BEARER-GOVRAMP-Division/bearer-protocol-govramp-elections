import {
  CHOICE_OPTIONS,
  CONTEST_OPTIONS,
  beginLoading,
  castBallot,
  closeBallotModal,
  createInitialState,
  deriveTotals,
  getSelectedJurisdiction,
  loadDemoData,
  loadFailure,
  openBallotModal,
  resetSimulation,
  selectJurisdiction,
  updateBallotDraft
} from "./demoState.js";

const root = document.querySelector("#app");

if (!root) {
  throw new Error("Missing #app mount point.");
}

let state = createInitialState();
let previousModalOpen = false;
let restoreFocusSelector = '[data-action="open-ballot-modal"]';
let activeLoadToken = 0;
let loadTimerId = null;

function clearPendingLoad() {
  activeLoadToken += 1;
  if (loadTimerId !== null) {
    window.clearTimeout(loadTimerId);
    loadTimerId = null;
  }
}

function statusClassFor(jurisdiction) {
  return jurisdiction.status === "Simulation active" ? "status-active" : "status-ready";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderStats(totals) {
  return `
    <div class="grid" aria-label="Simulation totals">
      <article class="stat">
        <span class="muted">Synthetic precincts</span>
        <strong>${state.jurisdictions.length}</strong>
      </article>
      <article class="stat">
        <span class="muted">Synthetic registrations</span>
        <strong>${totals.registeredVoters}</strong>
      </article>
      <article class="stat">
        <span class="muted">Locally simulated ballots</span>
        <strong>${totals.simulatedBallots}</strong>
      </article>
      <article class="stat">
        <span class="muted">Illustrative audits</span>
        <strong>${totals.demoAudits}</strong>
      </article>
    </div>
  `;
}

function renderJurisdictions(selectedJurisdiction) {
  if (!state.jurisdictions.length) {
    return `
      <div class="empty-state">
        No synthetic precincts are loaded. Use <strong>Load demo data</strong> to initialize the prototype.
      </div>
    `;
  }

  return `
    <div class="jurisdiction-list">
      ${state.jurisdictions
        .map(
          (jurisdiction) => `
            <article
              class="jurisdiction-card"
              ${selectedJurisdiction?.id === jurisdiction.id ? 'aria-current="true"' : ""}
            >
              <div class="list-header">
                <div>
                  <h3>${escapeHtml(jurisdiction.name)}</h3>
                  <p class="muted">${escapeHtml(jurisdiction.region)}</p>
                </div>
                <span class="status-pill ${statusClassFor(jurisdiction)}">${escapeHtml(jurisdiction.status)}</span>
              </div>
              <div class="grid">
                <div>
                  <span class="muted">Registered voters</span>
                  <strong>${jurisdiction.registeredVoters}</strong>
                </div>
                <div>
                  <span class="muted">Simulated ballots</span>
                  <strong>${jurisdiction.simulatedBallots}</strong>
                </div>
                <div>
                  <span class="muted">Demo audits</span>
                  <strong>${jurisdiction.demoAudits}</strong>
                </div>
              </div>
              <div class="toolbar">
                <button class="button button-secondary" type="button" data-action="select-jurisdiction" data-id="${jurisdiction.id}">
                  ${selectedJurisdiction?.id === jurisdiction.id ? "Selected" : "Review precinct"}
                </button>
              </div>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function renderActivity() {
  if (!state.activity.length) {
    return `
      <div class="empty-state">
        No simulated ballot actions have been recorded in this browser session.
      </div>
    `;
  }

  return `
    <div class="log-list">
      ${state.activity
        .map(
          (entry) => `
            <article class="log-item">
              <h3>${escapeHtml(entry.timestamp)}</h3>
              <p>${escapeHtml(entry.summary)}</p>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function renderModal() {
  if (!state.isBallotModalOpen) {
    return "";
  }

  return `
    <div class="modal-backdrop" data-action="dismiss-modal">
      <div
        id="ballot-dialog"
        class="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        tabindex="-1"
      >
        <h2 id="modal-title">Record a simulated ballot update</h2>
        <p id="modal-description" class="muted">
          Use only synthetic identifiers. This updates local demo state and does not create a real ballot.
        </p>
        <form id="ballot-form">
          <div class="field">
            <label for="voterAlias">Synthetic voter alias</label>
            <input
              id="voterAlias"
              name="voterAlias"
              autocomplete="off"
              maxlength="24"
              value="${escapeHtml(state.ballotDraft.voterAlias)}"
              required
            />
          </div>
          <div class="field">
            <label for="precinct">Precinct label</label>
            <input
              id="precinct"
              name="precinct"
              autocomplete="off"
              maxlength="32"
              value="${escapeHtml(state.ballotDraft.precinct)}"
              required
            />
          </div>
          <div class="field">
            <label for="contest">Contest</label>
            <select id="contest" name="contest" required>
              ${CONTEST_OPTIONS.map(
                (contest) => `
                  <option value="${contest.value}" ${contest.value === state.ballotDraft.contest ? "selected" : ""}>
                    ${escapeHtml(contest.label)}
                  </option>
                `
              ).join("")}
            </select>
          </div>
          <div class="field">
            <label for="choice">Synthetic selection</label>
            <select id="choice" name="choice" required>
              <option value="">Choose an option</option>
              ${CHOICE_OPTIONS.map(
                (choice) => `
                  <option value="${choice.value}" ${choice.value === state.ballotDraft.choice ? "selected" : ""}>
                    ${escapeHtml(choice.label)}
                  </option>
                `
              ).join("")}
            </select>
          </div>
          <div class="button-row">
            <button class="button button-primary" type="submit">Record simulated update</button>
            <button class="button button-secondary" type="button" data-action="close-modal">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function render() {
  const selectedJurisdiction = getSelectedJurisdiction(state);
  const totals = deriveTotals(state);
  root.innerHTML = `
    ${state.error ? `<div class="banner banner-danger" role="alert">${escapeHtml(state.error)}</div>` : ""}
    ${
      state.lastSimulationRecord
        ? `<div class="banner banner-success" role="status">${escapeHtml(state.statusMessage)}</div>`
        : `<div class="banner banner-warning" role="status">${escapeHtml(state.statusMessage)}</div>`
    }
    <div id="app-content" ${state.isBallotModalOpen ? 'aria-hidden="true" inert' : ""}>
      <section class="stack" aria-label="Simulation controls">
        ${renderStats(totals)}
        <div class="panel">
          <h2>Control panel</h2>
          <p class="muted">
            This demo never leaves your browser session. Reloading or resetting clears all simulated activity.
          </p>
          <div class="toolbar">
            <button class="button button-primary" type="button" data-action="load-demo-data" ${state.status === "loading" ? "disabled" : ""}>
              ${state.status === "loading" ? "Loading…" : "Load demo data"}
            </button>
            <button class="button button-secondary" type="button" data-action="open-ballot-modal" ${!selectedJurisdiction || state.status !== "ready" ? "disabled" : ""}>
              Record simulated ballot
            </button>
            <button class="button button-danger" type="button" data-action="reset-demo">
              Reset session
            </button>
          </div>
        </div>
      </section>
      <div class="two-col" style="margin-top: 1rem;">
        <section class="panel" aria-labelledby="jurisdiction-title">
          <h2 id="jurisdiction-title">Synthetic precinct overview</h2>
          <p class="muted">Select a precinct to inspect the local simulation totals.</p>
          ${renderJurisdictions(selectedJurisdiction)}
        </section>
        <section class="stack">
          <article class="panel" aria-labelledby="selected-title">
            <h2 id="selected-title">Selected precinct</h2>
            ${
              selectedJurisdiction
                ? `
                  <h3>${escapeHtml(selectedJurisdiction.name)}</h3>
                  <p class="muted">${escapeHtml(selectedJurisdiction.region)}</p>
                  <div class="grid">
                    <div><span class="muted">Registered voters</span><strong>${selectedJurisdiction.registeredVoters}</strong></div>
                    <div><span class="muted">Simulated ballots</span><strong>${selectedJurisdiction.simulatedBallots}</strong></div>
                    <div><span class="muted">Demo audits</span><strong>${selectedJurisdiction.demoAudits}</strong></div>
                  </div>
                `
                : `<div class="empty-state">Load data and choose a precinct to continue.</div>`
            }
          </article>
          <article class="panel" aria-labelledby="activity-title">
            <h2 id="activity-title">Activity log</h2>
            <p class="muted">Most recent synthetic actions are kept for transparency inside this local session.</p>
            ${renderActivity()}
          </article>
        </section>
      </div>
    </div>
    ${renderModal()}
  `;

  if (state.isBallotModalOpen && !previousModalOpen) {
    document.querySelector("#voterAlias")?.focus();
    if (document.activeElement?.id !== "voterAlias") {
      document.querySelector("#ballot-dialog")?.focus();
    }
  } else if (!state.isBallotModalOpen && previousModalOpen) {
    document.querySelector(restoreFocusSelector)?.focus();
  }

  previousModalOpen = state.isBallotModalOpen;
}

function setState(updater) {
  state = typeof updater === "function" ? updater(state) : updater;
  render();
}

function loadData() {
  clearPendingLoad();
  const loadToken = activeLoadToken;
  setState((current) => beginLoading(current));
  loadTimerId = window.setTimeout(() => {
    try {
      if (loadToken !== activeLoadToken) {
        return;
      }

      loadTimerId = null;
      setState((current) => (current.status === "loading" ? loadDemoData(current) : current));
    } catch (error) {
      loadTimerId = null;
      setState((current) => loadFailure(current, error instanceof Error ? error.message : "Unable to load the demo."));
    }
  }, 250);
}

function handleClick(event) {
  const actionTarget = event.target.closest("[data-action]");
  if (!actionTarget) {
    return;
  }

  const action = actionTarget.getAttribute("data-action");

  if (action === "dismiss-modal" && event.target === actionTarget) {
    setState((current) => closeBallotModal(current));
    return;
  }

  if (action === "open-ballot-modal") {
    restoreFocusSelector = '[data-action="open-ballot-modal"]';
    setState((current) => openBallotModal(current));
    return;
  }

  if (action === "close-modal") {
    setState((current) => closeBallotModal(current));
    return;
  }

  if (action === "load-demo-data") {
    loadData();
    return;
  }

  if (action === "reset-demo") {
    clearPendingLoad();
    setState(() => resetSimulation());
    return;
  }

  if (action === "select-jurisdiction") {
    const jurisdictionId = actionTarget.getAttribute("data-id") ?? "";
    setState((current) => selectJurisdiction(current, jurisdictionId));
  }
}

function handleInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLSelectElement)) {
    return;
  }

  if (!state.isBallotModalOpen) {
    return;
  }

  setState((current) => updateBallotDraft(current, target.name, target.value));
}

function handleSubmit(event) {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || form.id !== "ballot-form") {
    return;
  }

  event.preventDefault();

  try {
    const nextState = castBallot(state);
    setState(nextState);
  } catch (error) {
    setState((current) => ({
      ...current,
      error: error instanceof Error ? error.message : "Unable to record the simulated ballot."
    }));
  }
}

function handleKeydown(event) {
  if (!state.isBallotModalOpen) {
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    setState((current) => closeBallotModal(current));
    return;
  }

  if (event.key !== "Tab") {
    return;
  }

  const focusable = Array.from(
    document.querySelectorAll(
      '#ballot-dialog a[href], #ballot-dialog button:not([disabled]), #ballot-dialog input:not([disabled]), #ballot-dialog select:not([disabled]), #ballot-dialog textarea:not([disabled]), #ballot-dialog [tabindex]:not([tabindex="-1"])'
    )
  );

  if (!focusable.length) {
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;

  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

document.addEventListener("click", handleClick);
document.addEventListener("input", handleInput);
document.addEventListener("submit", handleSubmit);
document.addEventListener("keydown", handleKeydown);

loadData();
