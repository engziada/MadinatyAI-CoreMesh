/**
 * Execution complexity that drives hybrid AI routing.
 * - LOW  -> local Ollama (PII checks, spam/content moderation): cost-free.
 * - HIGH -> cloud Gemini (semantic cross-platform matching/embeddings).
 */
export enum AiComplexity {
  COMPLEXITY_LOW = 'COMPLEXITY_LOW',
  COMPLEXITY_HIGH = 'COMPLEXITY_HIGH',
}
