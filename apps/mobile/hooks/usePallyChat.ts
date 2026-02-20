import { useState, useCallback, useRef } from "react";
import { API_URL } from "./useUser";
import { auth } from "@repo/auth";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
  toolsUsed?: string[];
}

interface UsePallyChatOptions {
  onError?: (error: Error) => void;
}

// Friendly names for tools
const TOOL_LABELS: Record<string, string> = {
  getWalletBalance: "Checking your balance",
  getRecentTransactions: "Looking at your transactions",
  getSpendingSummary: "Analyzing your spending",
  getCategoryBreakdown: "Breaking down categories",
  getGoals: "Checking your goals",
  getSubscriptions: "Looking at subscriptions",
  explainChart: "Analyzing the chart",
  compareSpending: "Comparing periods",
  getTopSpendingDays: "Finding top spending days",
  findLargeTransactions: "Spotting large purchases",
  getStreakStatus: "Checking your streak",
  getActiveQuests: "Looking at quests",
  getBadges: "Checking badges",
  getLeaderboard: "Loading leaderboard",
  getFriendStats: "Comparing with friends",
};

export function getToolLabel(toolName: string): string {
  return TOOL_LABELS[toolName] || "Working on it";
}

export function usePallyChat(options: UsePallyChatOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingStatus, setThinkingStatus] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Create user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      createdAt: new Date(),
    };

    // Add user message immediately
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);
    setThinkingStatus("Thinking...");

    // Create placeholder for assistant response
    const assistantMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        createdAt: new Date(),
      },
    ]);

    try {
      const token = await auth.getToken();
      abortControllerRef.current = new AbortController();

      // Prepare messages for API
      const apiMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: content.trim() },
      ];

      const response = await fetch(`${API_URL}/api/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: apiMessages }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Chat request failed: ${response.status}`);
      }

      // Read the AI SDK Data Stream Protocol via streaming
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let assistantContent = "";
      const toolsUsed: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          if (line.startsWith("0:")) {
            // Text token — JSON-encoded string
            try {
              const text = JSON.parse(line.slice(2));
              assistantContent += text;

              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, content: assistantContent }
                    : m
                )
              );
            } catch {
              // Skip unparseable lines
            }
          } else if (line.startsWith("9:")) {
            // Tool call — update thinking status
            try {
              const toolCall = JSON.parse(line.slice(2));
              const toolName = toolCall?.toolName;
              if (toolName) {
                toolsUsed.push(toolName);
                setThinkingStatus(getToolLabel(toolName));
              }
            } catch {
              // Skip unparseable tool call lines
            }
          }
          // Other prefixes (a: tool result, d: finish, e: step finish) — ignored
        }
      }

      // Final update with toolsUsed
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? {
              ...m,
              content: assistantContent || "I couldn't process that request.",
              toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
            }
            : m
        )
      );
    } catch (err) {
      const error = err as Error;

      if (error.name === "AbortError") {
        setMessages((prev) => prev.filter((m) => m.id !== assistantMessageId));
      } else {
        setError(error);
        options.onError?.(error);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? { ...m, content: "Sorry, something went wrong. Try again? 🙏" }
              : m
          )
        );
      }
    } finally {
      setIsLoading(false);
      setThinkingStatus(null);
      abortControllerRef.current = null;
    }
  }, [messages, isLoading, options]);

  const cancelRequest = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setThinkingStatus(null);
  }, []);

  const retryLastMessage = useCallback(() => {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMessage) {
      setMessages((prev) => prev.slice(0, -1));
      sendMessage(lastUserMessage.content);
    }
  }, [messages, sendMessage]);

  return {
    messages,
    isLoading,
    thinkingStatus,
    error,
    sendMessage,
    cancelRequest,
    clearMessages,
    retryLastMessage,
  };
}
