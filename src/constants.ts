import path from "node:path";
import os from "node:os";

export const HOME_DIR = path.join(os.homedir(), ".claude-code-router");

// 默认配置文件路径，可被动态覆盖
export let CONFIG_FILE = path.join(HOME_DIR, "config.json");

// 设置自定义配置文件路径的函数
export const setConfigFile = (customPath: string) => {
  CONFIG_FILE = path.resolve(customPath);
};

export const PLUGINS_DIR = path.join(HOME_DIR, "plugins");

// PID文件和引用计数文件路径，支持基于配置文件的实例隔离
export let PID_FILE = path.join(HOME_DIR, '.claude-code-router.pid');
export let REFERENCE_COUNT_FILE = path.join(HOME_DIR, "reference-count.txt");

// 更新实例特定文件路径的函数
export const setInstanceFiles = (configPath: string) => {
  const configDir = path.dirname(configPath);
  const configName = path.basename(configPath, '.json');
  
  PID_FILE = path.join(configDir, `.claude-code-router-${configName}.pid`);
  REFERENCE_COUNT_FILE = path.join(configDir, `reference-count-${configName}.txt`);
};

// Claude projects directory
export const CLAUDE_PROJECTS_DIR = path.join(os.homedir(), ".claude", "projects");


export const DEFAULT_CONFIG = {
  LOG: false,
  OPENAI_API_KEY: "",
  OPENAI_BASE_URL: "",
  OPENAI_MODEL: "",
};
