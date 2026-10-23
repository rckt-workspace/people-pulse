import { createServerFn } from "@tanstack/react-start";

export type AiSuggestion = {
  title: string;
  category: string;
  rationale: string;
  evidence: string;
  current_state: string;
  target_state: string;
  suggested_actions: string;
};

export type SuggestionResult = {
  suggestions: AiSuggestion[];
  source: "ai" | "fallback";
};

export const suggestDevelopmentOpportunities = createServerFn({ method: "POST" })
  .inputValidator((data: { employeeId: string }) => data)
  .handler(async ({ data }): Promise<SuggestionResult> => {
    const { buildContext, askPeopleAi, heuristicSuggestions } = await import(
      "./development-ai.server"
    );
    const context = await buildContext(data.employeeId);
    if (!context) return { suggestions: [], source: "fallback" };
    try {
      const suggestions = await askPeopleAi(context);
      if (suggestions.length) return { suggestions: suggestions.slice(0, 3), source: "ai" };
    } catch (error) {
      console.error("People AI fallback", error);
    }
    return { suggestions: heuristicSuggestions(context), source: "fallback" };
  });
