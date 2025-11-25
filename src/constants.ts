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

// PID文件、引用计数文件和端口文件路径，支持基于配置文件的实例隔离
export let PID_FILE = path.join(HOME_DIR, '.claude-code-router.pid');
export let REFERENCE_COUNT_FILE = path.join(HOME_DIR, "reference-count.txt");
export let PORT_FILE = path.join(HOME_DIR, '.claude-code-router.port');

// 实例文件存放目录
const INSTANCES_DIR = path.join(HOME_DIR, "instances");

// 更新实例特定文件路径的函数
export const setInstanceFiles = (configPath: string) => {
  // 使用配置文件的绝对路径作为唯一标识
  const absoluteConfigPath = path.resolve(configPath);
  // 将路径转换为安全的文件名（替换特殊字符）
  const safeConfigName = absoluteConfigPath
    .replace(/[/\\:]/g, '_')
    .replace(/^_+/, '');
  
  // 确保实例目录存在
  const fs = require('fs');
  if (!fs.existsSync(INSTANCES_DIR)) {
    fs.mkdirSync(INSTANCES_DIR, { recursive: true });
  }
  
  PID_FILE = path.join(INSTANCES_DIR, `${safeConfigName}.pid`);
  REFERENCE_COUNT_FILE = path.join(INSTANCES_DIR, `${safeConfigName}.count`);
  PORT_FILE = path.join(INSTANCES_DIR, `${safeConfigName}.port`);
};

// Claude projects directory
export const CLAUDE_PROJECTS_DIR = path.join(os.homedir(), ".claude", "projects");


export const DEFAULT_CONFIG = {
  LOG: false,
  OPENAI_API_KEY: "",
  OPENAI_BASE_URL: "",
  OPENAI_MODEL: "",
};
