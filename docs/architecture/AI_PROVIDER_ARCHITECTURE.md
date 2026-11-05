# AI PROVIDER ARCHITECTURE

## 1. Provider Abstraction

All AI intelligence calls flow through the unified `IAIProvider` interface:

- `MockAIProvider`: Zero-latency, deterministic provider used for unit testing, CI/CD, and regression tests.
- `GeminiFreeProvider`: Google Gemini 2.5 Flash Free Tier connector (DISABLED by default).
- `GroqFreeProvider`: Groq Cloud Llama-3 Free Tier connector (DISABLED by default).
- `OllamaLocalProvider`: Local quantized LLM inference connector (DISABLED by default).

---

## 2. Security Default

External providers remain disabled out of the box. No external network request or key generation is performed until explicitly configured and approved by the owner.
