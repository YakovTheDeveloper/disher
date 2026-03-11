import { createResponseObject, IResponseData } from "./response.js";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

interface OpenRouterMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

interface OpenRouterRequest {
    model: string;
    messages: OpenRouterMessage[];
    max_tokens?: number;
    temperature?: number;
}

interface OpenRouterResponse {
    id: string;
    choices: Array<{
        message: {
            content: string;
        };
    }>;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

export async function callOpenRouter(
    prompt: string,
    systemMessage?: string
): Promise<IResponseData<string | null>> {
    if (!OPENROUTER_API_KEY) {
        return createResponseObject<null>(
            500,
            "OpenRouter API key not configured",
            null
        );
    }

    const messages: OpenRouterMessage[] = [];

    if (systemMessage) {
        messages.push({ role: "system", content: systemMessage });
    }

    messages.push({
        role: "user",
        content: prompt,
    });

    const requestBody: OpenRouterRequest = {
        model: "deepseek/deepseek-v3.2",
        messages,
        max_tokens: 2048,
        temperature: 0.7,
    };

    try {
        const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${OPENROUTER_API_KEY}`,
                "HTTP-Referer": "http://localhost:5173",
                "X-Title": "Disher Analytics",
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return createResponseObject<null>(
                response.status,
                `OpenRouter API error: ${errorText}`,
                null
            );
        }

        const data: OpenRouterResponse = await response.json();

        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            return createResponseObject<null>(500, "No content in response", null);
        }

        return createResponseObject(200, "Analysis completed", content);
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : "Unknown error occurred";
        return createResponseObject<null>(500, `Request failed: ${errorMessage}`, null);
    }
}
