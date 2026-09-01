import { act, renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router";
import { describe, expect, it, vi } from "vitest";

import type { FactoriesFactoryLine } from "@/api-client";
import type { IntegrationSelections } from "@/pages/home/InstallIntegrationsSection";

import { afterOnboardingPath, finishOnboardingError, useFinishOnboarding } from "./useFinishOnboarding";
import { useOnboardingSetupState } from "./useOnboardingSetupState";

const readyPlan = {
  providerId: "openrouter",
  component: "runnerOpenRouter",
  credentialsSource: "hosted",
  integrationName: "openrouter",
  harness: "AGENT_HARNESS_CLAUDE_CODE",
  model: "openai/gpt-4.1",
  planningModel: "openai/gpt-4.1",
} as const;

const readySelections: IntegrationSelections = { github: { id: "gh-1", name: "github", ready: true } };

/**
 * A workspace ready to finish: a repository, a workspace name, and an agent
 * plan, wired to a router so navigateAfterFinish has somewhere to go.
 * Individual tests override the provisioning steps they care about.
 */
function renderFinish(overrides: Partial<Parameters<typeof useFinishOnboarding>[0]> = {}) {
  const setup = renderHook(() => useOnboardingSetupState("Acme", { simulateDiscovery: false })).result;
  act(() => {
    setup.current.selectRepo("acme/app");
    setup.current.commitRepoStep();
    setup.current.selectIssuesRepo("acme/app");
  });

  return renderHook(
    () => {
      const location = useLocation();
      const finish = useFinishOnboarding({
        organizationId: "org-1",
        factoryId: "factory-1",
        factoryKey: "ACME",
        factory: null,
        setup: setup.current,
        selections: readySelections,
        setSaving: vi.fn(),
        updateFactory: vi.fn().mockResolvedValue({}),
        updateOnboarding: vi.fn().mockResolvedValue({}),
        installFactory: vi.fn().mockResolvedValue({ canvasId: "canvas-1", canvasName: "canvas" }),
        createLine: vi.fn().mockResolvedValue({ id: "line-1" } as FactoriesFactoryLine),
        listIntakes: vi.fn().mockResolvedValue([]),
        createIntake: vi.fn().mockResolvedValue({ id: "intake-1" }),
        listPRFeedbackHandlers: vi.fn().mockResolvedValue([]),
        createPRFeedbackHandler: vi.fn().mockResolvedValue({ id: "handler-1" }),
        resolveDefaultBranch: vi.fn().mockResolvedValue("main"),
        takenNames: [],
        remainingCreditCents: 5000,
        hostedModelsLoading: false,
        plan: readyPlan,
        ...overrides,
      });
      return { finish, pathname: location.pathname };
    },
    { wrapper: MemoryRouter },
  );
}

describe("finishOnboardingError", () => {
  it("allows finish when GitHub, repositories, name, and an agent plan are ready", () => {
    expect(
      finishOnboardingError({
        appRepository: "acme/web",
        backlogRepository: "acme/web",
        workspaceName: "Web",
        githubReady: true,
        remainingCreditCents: 5000,
        hostedModelsLoading: false,
        plan: readyPlan,
      }),
    ).toBeNull();
  });
});

describe("afterOnboardingPath", () => {
  it("opens the board of the provisioned line, where the intake sits in Backlog", () => {
    expect(
      afterOnboardingPath({
        organizationId: "org-1",
        factoryKey: "SP",
        lineId: "line-1",
      }),
    ).toBe("/org-1/workspaces/SP/lines/line-1");
  });
});

describe("useFinishOnboarding", () => {
  it("completes and navigates once when the repository has no open issues", async () => {
    const updateOnboarding = vi.fn().mockResolvedValue({});
    const listIntakes = vi.fn().mockResolvedValue([]);
    // An empty backlog is a valid intake, not a rejected request. The finish
    // action still has to work when the source returns nothing to seed.
    const createIntake = vi.fn().mockResolvedValue({ id: "intake-1" });

    const { result } = renderFinish({ updateOnboarding, listIntakes, createIntake });

    await act(async () => {
      await result.current.finish();
    });

    expect(createIntake).toHaveBeenCalledTimes(1);
    expect(updateOnboarding).toHaveBeenCalledWith(expect.objectContaining({ complete: true }));
    await waitFor(() => expect(result.current.pathname).toBe("/org-1/workspaces/ACME/lines/line-1"));
  });

  it("still completes and navigates in one click when creating the intake fails", async () => {
    const updateOnboarding = vi.fn().mockResolvedValue({});
    const listIntakes = vi.fn().mockResolvedValue([]);
    const createIntake = vi.fn().mockRejectedValue(new Error("no open issues"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { result } = renderFinish({ updateOnboarding, listIntakes, createIntake });

    await act(async () => {
      await result.current.finish();
    });

    expect(createIntake).toHaveBeenCalledTimes(1);
    expect(updateOnboarding).toHaveBeenCalledWith(expect.objectContaining({ complete: true }));
    await waitFor(() => expect(result.current.pathname).toBe("/org-1/workspaces/ACME/lines/line-1"));
    warn.mockRestore();
  });
});
