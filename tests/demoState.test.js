import test from "node:test";
import assert from "node:assert/strict";

import {
  beginLoading,
  castBallot,
  createInitialState,
  deriveTotals,
  loadDemoData,
  resetSimulation,
  selectJurisdiction,
  updateBallotDraft
} from "../src/demoState.js";

test("loadDemoData populates deterministic precincts and selects the first one", () => {
  const state = loadDemoData(beginLoading(createInitialState()));

  assert.equal(state.status, "ready");
  assert.equal(state.jurisdictions.length, 3);
  assert.equal(state.selectedJurisdictionId, state.jurisdictions[0].id);
  assert.match(state.statusMessage, /Synthetic precinct data loaded/i);
});

test("loadDemoData supports an empty-data state", () => {
  const state = loadDemoData(beginLoading(createInitialState()), []);

  assert.equal(state.status, "ready");
  assert.equal(state.jurisdictions.length, 0);
  assert.equal(state.selectedJurisdictionId, "");
  assert.match(state.statusMessage, /No demonstration precincts are available/i);
});

test("castBallot updates only the selected jurisdiction and records local activity", () => {
  let state = loadDemoData(createInitialState());
  state = selectJurisdiction(state, state.jurisdictions[1].id);
  state = updateBallotDraft(state, "voterAlias", "demo-user-01");
  state = updateBallotDraft(state, "precinct", "Ward 3");
  state = updateBallotDraft(state, "choice", "option-b");

  const beforeSelected = state.jurisdictions[1].simulatedBallots;
  const beforeOther = state.jurisdictions[0].simulatedBallots;
  const nextState = castBallot(state);

  assert.equal(nextState.jurisdictions[1].simulatedBallots, beforeSelected + 1);
  assert.equal(nextState.jurisdictions[0].simulatedBallots, beforeOther);
  assert.equal(nextState.activity.length, 1);
  assert.equal(nextState.isBallotModalOpen, false);
  assert.equal(nextState.ballotDraft.voterAlias, "");
  assert.match(nextState.statusMessage, /No real ballot/i);
});

test("castBallot requires all ballot fields", () => {
  const state = loadDemoData(createInitialState());

  assert.throws(() => castBallot(state), /Complete every field/i);
});

test("deriveTotals reflects jurisdiction counts", () => {
  const totals = deriveTotals(loadDemoData(createInitialState()));

  assert.deepEqual(totals, {
    registeredVoters: 3330,
    simulatedBallots: 783,
    demoAudits: 9
  });
});

test("resetSimulation returns the initial empty state", () => {
  const state = resetSimulation();

  assert.equal(state.status, "idle");
  assert.equal(state.jurisdictions.length, 0);
  assert.equal(state.activity.length, 0);
});
