// Deprecated — use individual @oaslananka/a2a-warp-adapter-* packages instead.
// This barrel re-exports the new standalone packages for backward compatibility.
export { BaseAdapter } from '@oaslananka/a2a-warp-adapter-base';
export { OpenAIAdapter } from '@oaslananka/a2a-warp-adapter-openai';
export { AnthropicAdapter } from '@oaslananka/a2a-warp-adapter-anthropic';
export { LangChainAdapter } from '@oaslananka/a2a-warp-adapter-langchain';
export { GoogleADKAdapter } from '@oaslananka/a2a-warp-adapter-google-adk';
export { LlamaIndexAdapter } from '@oaslananka/a2a-warp-adapter-llamaindex';
export { CrewAIAdapter } from '@oaslananka/a2a-warp-adapter-crewai';
export {
  createTextArtifact,
  extractRequiredText,
  extractText,
} from '@oaslananka/a2a-warp-adapter-base';
export type { AdapterCompatibility } from '@oaslananka/a2a-warp-adapter-base';
