"use client";

import { useEffect } from "react";

type WebMcpTool = {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
  execute: (input: { query: string }) => Promise<{ url: string; instruction: string }>;
};

type ModelContext = {
  registerTool: (tool: WebMcpTool, options?: { signal?: AbortSignal }) => Promise<void> | void;
};

export function WebMcpRegistration() {
  useEffect(() => {
    const modelContext = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!modelContext?.registerTool) return;

    const controller = new AbortController();
    const tool: WebMcpTool = {
      name: "twimzi_search_business_directory",
      description:
        "Build a Twimzi public business-directory search link for a user-provided business name, product, service, or category. This tool does not access private data or submit forms.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Business name, product, service, or category to search on Twimzi.",
          },
        },
        required: ["query"],
      },
      async execute({ query }) {
        const normalizedQuery = query.trim().slice(0, 160);
        if (!normalizedQuery) {
          return {
            url: "https://www.twimzi.com/businesses",
            instruction: "Provide a non-empty search term.",
          };
        }
        return {
          url: `https://www.twimzi.com/businesses?q=${encodeURIComponent(normalizedQuery)}`,
          instruction:
            "Open this public Twimzi search URL to view matching business listings. Results may change; verify details on the linked listing.",
        };
      },
    };

    try {
      void Promise.resolve(modelContext.registerTool(tool, { signal: controller.signal })).catch(() => {
        // WebMCP is an optional browser capability; normal site browsing remains unaffected.
      });
    } catch {
      // Unsupported or disabled WebMCP must not affect the page.
    }

    return () => controller.abort();
  }, []);

  return null;
}
