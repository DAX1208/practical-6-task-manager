const { OpenAI } = require("openai");

/**
 * Generates a contextual, actionable 1-sentence description when
 * the external AI API key is not configured or during offline demonstration.
 */
function generateHeuristicDescription(title) {
    const t = title.toLowerCase();
    if (t.includes("database") || t.includes("sql") || t.includes("mongo")) {
        return `Design schemas, prepare required database queries, and test data operations for ${title.trim()}.`;
    }
    if (t.includes("docker") || t.includes("container") || t.includes("compose")) {
        return `Configure container definitions, verify multi-service networking, and test container builds for ${title.trim()}.`;
    }
    if (t.includes("ci") || t.includes("pipeline") || t.includes("github") || t.includes("action")) {
        return `Implement automated build workflows, configure regression testing, and verify pipeline pass/fail status for ${title.trim()}.`;
    }
    if (t.includes("api") || t.includes("backend") || t.includes("express") || t.includes("server")) {
        return `Implement robust REST endpoints with validation, secure error handling, and test API responses for ${title.trim()}.`;
    }
    if (t.includes("frontend") || t.includes("ui") || t.includes("react") || t.includes("component")) {
        return `Build responsive UI components, handle user interactions, and test component rendering for ${title.trim()}.`;
    }
    if (t.includes("test") || t.includes("jest") || t.includes("unit")) {
        return `Write comprehensive automated test suites, verify edge cases, and validate assertions for ${title.trim()}.`;
    }
    if (t.includes("study") || t.includes("exam") || t.includes("read") || t.includes("prepare")) {
        return `Review key syllabus concepts, prepare summary notes, and practice sample problems for ${title.trim()}.`;
    }
    return `Plan project scope, implement core requirements, and thoroughly test all deliverables for ${title.trim()}.`;
}

/**
 * Service to handle AI-powered task description generation using OpenAI.
 * Uses cost-effective, high-speed gpt-4o-mini model.
 */
class AIService {
    constructor() {
        this.client = null;
    }

    getClient() {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey || apiKey.trim() === "" || apiKey === "your_api_key_here") {
            return null;
        }

        if (!this.client || this.currentKey !== apiKey) {
            this.currentKey = apiKey;
            this.client = new OpenAI({
                apiKey: apiKey.trim(),
                timeout: 10000 // 10-second timeout
            });
        }

        return this.client;
    }

    /**
     * Generates a concise, actionable task description based solely on the task title.
     * Follows Responsible AI principles: only title is passed; no private metadata or tokens.
     * 
     * @param {string} title 
     * @returns {Promise<{ description: string, fallback: boolean, reason?: string }>}
     */
    async generateTaskDescription(title) {
        const client = this.getClient();

        // 1. Missing or unconfigured API key -> provide smart heuristic fallback
        if (!client) {
            const fallbackDesc = generateHeuristicDescription(title);
            return {
                description: fallbackDesc,
                fallback: true,
                reason: "OpenAI API key is not configured in backend/.env. Generated contextual description via local assistant."
            };
        }

        try {
            // Sanitized prompt with instruction for concise, actionable output
            const completion = await client.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "You are a concise productivity assistant. Write a short, relevant, actionable task description (1-2 sentences) based only on the given task title. Do not include markdown headers, quotes, or conversational preamble."
                    },
                    {
                        role: "user",
                        content: `Task Title: "${title.trim()}"`
                    }
                ],
                max_tokens: 100,
                temperature: 0.7
            });

            const rawDescription = completion?.choices?.[0]?.message?.content?.trim() || "";

            if (!rawDescription) {
                return {
                    description: generateHeuristicDescription(title),
                    fallback: true,
                    reason: "AI returned an empty response. Generated contextual description via local assistant."
                };
            }

            return {
                description: rawDescription,
                fallback: false
            };

        } catch (error) {
            // Safe, controlled error handling without exposing stack traces or API keys
            console.error("AI Generation error:", error.status || error.name || "Unknown error");

            let friendlyReason = "AI service is currently unavailable. Generated contextual description via local assistant.";

            if (error.status === 401 || error.code === "invalid_api_key") {
                friendlyReason = "Invalid AI API key credentials in .env. Generated contextual description via local assistant.";
            } else if (error.status === 429 || error.code === "insufficient_quota") {
                friendlyReason = "AI provider rate limit or quota exceeded. Generated contextual description via local assistant.";
            } else if (error.code === "ETIMEDOUT" || error.name === "APIConnectionTimeoutError") {
                friendlyReason = "AI request timed out. Generated contextual description via local assistant.";
            } else if (error.status >= 500) {
                friendlyReason = "AI provider server error. Generated contextual description via local assistant.";
            }

            return {
                description: generateHeuristicDescription(title),
                fallback: true,
                reason: friendlyReason
            };
        }
    }
}

module.exports = new AIService();
