import { readConfigFile } from ".";

/**
 * Get environment variables for Agent SDK/Claude Code integration
 * This function is shared between `ccr env` and `ccr code` commands
 */
export const createEnvVariables = async () => {
  const config = await readConfigFile();
  const port = config.PORT || 3456;
  const host = config.HOST || "127.0.0.1";
  const apiKey = config.APIKEY || "test";
  const noProxy = host === "127.0.0.1" ? "127.0.0.1" : `127.0.0.1,${host}`;

  return {
    ANTHROPIC_AUTH_TOKEN: apiKey,
    ANTHROPIC_API_KEY: "",
    ANTHROPIC_BASE_URL: `http://${host}:${port}`,
    NO_PROXY: noProxy,
    DISABLE_TELEMETRY: "true",
    DISABLE_COST_WARNINGS: "true",
    API_TIMEOUT_MS: String(config.API_TIMEOUT_MS ?? 600000),
    // Reset CLAUDE_CODE_USE_BEDROCK when running with ccr
    CLAUDE_CODE_USE_BEDROCK: undefined,
  };
}