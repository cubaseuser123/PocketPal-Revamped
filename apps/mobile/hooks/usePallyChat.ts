import { useState, useCallback, useRef } from "react";
import { API_URL } from "./useUser";
import { auth } from "@repo/auth";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

interface UsePallyChatOptions {
  onError?: (error: Error) => void;
}

export function usePallyChat(options: UsePallyChatOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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

      // Prepare messages for API (all messages including new user message)
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

      // Read the stream
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        // Parse SSE data (Vercel AI SDK format)
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          if (line.startsWith("0:")) {
            // Text content chunk
            try {
              const content = JSON.parse(line.slice(2));
              fullContent += content;

              // Update assistant message with accumulated content
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, content: fullContent }
                    : m
                )
              );
            } catch {
              // Not JSON, might be raw text
              fullContent += line.slice(2);
            }
          }
        }
      }

      // Finalize the message
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? { ...m, content: fullContent || "I couldn't process that request." }
            : m
        )
      );
    } catch (err) {
      const error = err as Error;

      if (error.name === "AbortError") {
        // Request was cancelled
        setMessages((prev) => prev.filter((m) => m.id !== assistantMessageId));
      } else {
        setError(error);
        options.onError?.(error);

        // Update with error message
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
      abortControllerRef.current = null;
    }
  }, [messages, isLoading, options]);

  const cancelRequest = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const retryLastMessage = useCallback(() => {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMessage) {
      // Remove the last assistant message and retry
      setMessages((prev) => prev.slice(0, -1));
      sendMessage(lastUserMessage.content);
    }
  }, [messages, sendMessage]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    cancelRequest,
    clearMessages,
    retryLastMessage,
  };
}
