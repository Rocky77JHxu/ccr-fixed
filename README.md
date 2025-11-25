# Claude Code Router Fixed（自用版）

本仓库修改自[musistudio/claude-code-router](https://github.com/musistudio/claude-code-router)。

主要解决了以下问题：

1. 修复了多租户环境下的端口冲突和计数文件冲突问题；
2. 支持了多Config功能：可指定多个配置文件启动多个实例，每个实例使用不同的配置文件；
3. 修复了原本 CCR 在非交互式运行下的一些问题。

## 多租户问题概述

该问题主要解决在多租户的服务器环境上，如果两个用户同时启动 CCR，则会导致端口冲突和计数文件冲突的问题。

我们做了以下解决：

1. 你可以在 `config.json` 中明确指定端口，这样可以避免端口冲突；
2. 如果你不想指定端口，CCR 会自动从 3456 开始查找可用端口，并将实际使用的端口保存到 `.claude-code-router-{config_name}.port` 文件中。

## 多Config功能概述

Claude Code Router 支持在同一服务器上运行多个实例，每个实例使用不同的配置文件。这使得你可以：

- 为不同难度的任务使用不同的模型
- 同时处理多个项目，每个项目使用不同的配置
- 在多租户环境下隔离不同用户的配置

配置文件的结构与原版 CCR 一致，例如：

```json
{
    "APIKEY": "your-api-key",
    "LOG": true,
    "Providers": [
        {
            "name": "claude",
            "api_base_url": "https://api.anthropic.com/v1/messages",
            "api_key": "sk-xxx",
            "models": ["claude-sonnet-4-5-20250929"]
        }
    ],
    "Router": {
        "default": "claude,claude-sonnet-4-5-20250929"
    }
}
```

假设你有多种不同的 Config 文件，你可以这样启动：

```bash
# 实例1：使用 Claude 配置（简单任务）
ccr --config config-claude.json code

# 实例2：使用 GPT-5 配置（复杂任务）
ccr --config config-gpt5.json code

# 实例3：使用 Gemini 配置（长上下文任务）
ccr --config config-gemini.json code
```

停止服务方式：

```bash
ccr --config config-claude.json stop
ccr --config config-gpt5.json stop
ccr --config config-gemini.json stop
```

### 🔧 实例隔离机制

每个配置文件会自动创建独立的管理文件，**统一存放在 `~/.claude-code-router/instances/` 目录下**，保持工作目录整洁：

```
~/.claude-code-router/instances/
├── config-claude.json.pid      # PID文件
├── config-claude.json.port     # 端口文件
├── config-claude.json.count    # 引用计数文件
├── config-gpt5.json.pid
├── config-gpt5.json.port
└── config-gpt5.json.count
```

这确保了：
- ✅ **进程隔离**：每个实例有独立的进程管理（PID文件）
- ✅ **端口通信**：服务端将实际端口写入端口文件，客户端读取后连接
- ✅ **引用计数**：每个实例独立跟踪客户端连接数
- ✅ **配置隔离**：每个实例使用独立的配置，互不干扰


## 非交互式修复概述

原因：使用 `minimist` 解析参数后，原代码只传递了位置参数 `argv._.slice(1)`（即 `code` 后面的非选项参数），而所有选项参数（如 `--permission-mode`, `--dangerously-skip-permissions`, `-p`）都被解析到了 `argv` 对象的其他字段中，没有传递给 `claude` 命令。

修复方案：

添加了 `buildClaudeArgs` 函数，它会：

1. 提取位置参数：从 argv._ 中获取（跳过 code 命令）
2. 重建选项参数：遍历 argv 对象，排除 _ 和 config
3. 还原参数格式：
   - 布尔标志：--permission-mode → ['--permission-mode']
   - 带值选项：-p "text" → ['-p', 'text']