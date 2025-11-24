import { spawn, type StdioOptions } from "child_process";
import { readConfigFile } from ".";
import { closeService } from "./close";
import {
  decrementReferenceCount,
  incrementReferenceCount,
} from "./processCheck";
import { quote } from 'shell-quote';
import minimist from "minimist";
import { createEnvVariables } from "./createEnvVariables";
import fs from "node:fs/promises";
import { existsSync, readFileSync } from "fs";
import JSON5 from "json5";
import { PORT_FILE } from "../constants";


// 直接从指定配置文件读取配置（避免全局状态干扰）
const readSpecificConfigFile = async (configPath: string) => {
  try {
    const config = await fs.readFile(configPath, "utf-8");
    const parsedConfig = JSON5.parse(config);
    return parsedConfig; // 简化版本，不使用插值
  } catch (error: any) {
    console.error(`Failed to read config file at ${configPath}: ${error.message}`);
    process.exit(1);
  }
};

// 基于指定配置创建环境变量
const createSpecificEnvVariables = async (config: any) => {
  // 尝试从端口文件读取实际使用的端口
  let port = config.PORT || 3456;
  try {
    if (existsSync(PORT_FILE)) {
      const portStr = readFileSync(PORT_FILE, 'utf-8').trim();
      const portFromFile = parseInt(portStr, 10);
      if (!isNaN(portFromFile) && portFromFile > 0) {
        port = portFromFile;
      }
    }
  } catch (error) {
    // 如果读取失败，使用config中的端口或默认端口
  }
  
  const apiKey = config.APIKEY || "test";

  return {
    ANTHROPIC_AUTH_TOKEN: apiKey,
    ANTHROPIC_API_KEY: "",
    ANTHROPIC_BASE_URL: `http://127.0.0.1:${port}`,
    NO_PROXY: "127.0.0.1",
    DISABLE_TELEMETRY: "true",
    DISABLE_COST_WARNINGS: "true",
    API_TIMEOUT_MS: String(config.API_TIMEOUT_MS ?? 600000),
    CLAUDE_CODE_USE_BEDROCK: undefined,
  };
};

export async function executeCodeCommand(args: string[] = [], configPath?: string) {
  // 根据是否提供configPath选择读取方式
  const config = configPath ? await readSpecificConfigFile(configPath) : await readConfigFile();
  const env = configPath ? await createSpecificEnvVariables(config) : await createEnvVariables();
  const settingsFlag = {
    env
  };
  if (config?.StatusLine?.enabled) {
    settingsFlag.statusLine = {
      type: "command",
      command: "ccr statusline",
      padding: 0,
    }
  }
  args.push('--settings', `${JSON.stringify(settingsFlag)}`);

  // Non-interactive mode for automation environments
  if (config.NON_INTERACTIVE_MODE) {
    env.CI = "true";
    env.FORCE_COLOR = "0";
    env.NODE_NO_READLINE = "1";
    env.TERM = "dumb";
  }

  // Set ANTHROPIC_SMALL_FAST_MODEL if it exists in config
  if (config?.ANTHROPIC_SMALL_FAST_MODEL) {
    env.ANTHROPIC_SMALL_FAST_MODEL = config.ANTHROPIC_SMALL_FAST_MODEL;
  }

  // Increment reference count when command starts
  incrementReferenceCount();

  // Execute claude command
  const claudePath = config?.CLAUDE_PATH || process.env.CLAUDE_PATH || "claude";

  const joinedArgs = args.length > 0 ? quote(args) : "";

  const stdioConfig: StdioOptions = config.NON_INTERACTIVE_MODE
    ? ["pipe", "inherit", "inherit"] // Pipe stdin for non-interactive
    : "inherit"; // Default inherited behavior

  const argsObj = minimist(args)
  const argsArr = []
  for (const [argsObjKey, argsObjValue] of Object.entries(argsObj)) {
    if (argsObjKey !== '_' && argsObj[argsObjKey]) {
      const prefix = argsObjKey.length === 1 ? '-' : '--';
      // For boolean flags, don't append the value
      if (argsObjValue === true) {
        argsArr.push(`${prefix}${argsObjKey}`);
      } else {
        argsArr.push(`${prefix}${argsObjKey} ${JSON.stringify(argsObjValue)}`);
      }
    }
  }
  const claudeProcess = spawn(
    claudePath,
    argsArr,
    {
      env: process.env,
      stdio: stdioConfig,
      shell: true,
    }
  );

  // Close stdin for non-interactive mode
  if (config.NON_INTERACTIVE_MODE) {
    claudeProcess.stdin?.end();
  }

  claudeProcess.on("error", (error) => {
    console.error("Failed to start claude command:", error.message);
    console.log(
      "Make sure Claude Code is installed: npm install -g @anthropic-ai/claude-code"
    );
    decrementReferenceCount();
    process.exit(1);
  });

  claudeProcess.on("close", (code) => {
    decrementReferenceCount();
    closeService();
    process.exit(code || 0);
  });
}
