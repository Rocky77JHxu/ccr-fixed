# Claude Code Router 多实例使用指南

## 📋 概述

Claude Code Router 支持在同一服务器上运行多个实例，每个实例使用不同的配置文件。这使得您可以：

- 为不同难度的任务使用不同的模型
- 同时处理多个项目，每个项目使用不同的配置
- 在多租户环境下隔离不同用户的配置

## ⚠️ 端口配置说明

### 方案一：明确指定不同端口（推荐）

为每个配置文件**明确指定不同的 `PORT`**，这样可以确保实例间完全隔离：

```json
{
    "PORT": 3456,  // 实例1
    ...
}
```

```json
{
    "PORT": 3457,  // 实例2
    ...
}
```

### 方案二：不指定端口（自动分配）

如果不指定 `PORT`，系统会：
1. 自动从 3456 开始查找可用端口
2. 将实际使用的端口保存到 `.claude-code-router-{config_name}.port` 文件
3. 客户端自动读取该文件连接到正确的端口

**注意**：不指定端口时，需要确保配置文件名不同，以保证端口文件的隔离。

## 🚀 快速开始

### 1. 创建配置文件

为每个实例创建独立的配置文件，并**确保每个配置文件使用不同的端口**：

**config-claude.json**（使用 Claude 模型）：
```json
{
    "PORT": 3456,
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

**config-gpt4.json**（使用 GPT-4 模型）：
```json
{
    "PORT": 3457,
    "APIKEY": "your-api-key",
    "LOG": true,
    "Providers": [
        {
            "name": "openai",
            "api_base_url": "https://api.openai.com/v1",
            "api_key": "sk-xxx",
            "models": ["gpt-4"]
        }
    ],
    "Router": {
        "default": "openai,gpt-4"
    }
}
```

**config-gemini.json**（使用 Gemini 模型）：
```json
{
    "PORT": 3458,
    "APIKEY": "your-api-key",
    "LOG": true,
    "Providers": [
        {
            "name": "google",
            "api_base_url": "https://api.google.com/v1",
            "api_key": "xxx",
            "models": ["gemini-2.5-pro-thinking"]
        }
    ],
    "Router": {
        "default": "google,gemini-2.5-pro-thinking"
    }
}
```

### 2. 使用不同配置启动实例

```bash
# 实例1：使用 Claude 配置（简单任务）
ccr --config config-claude.json code "Fix this bug"

# 实例2：使用 GPT-4 配置（复杂任务）
ccr --config config-gpt4.json code "Design system architecture"

# 实例3：使用 Gemini 配置（长上下文任务）
ccr --config config-gemini.json code "Analyze this large codebase"
```

## 📖 命令详解

### 启动服务

```bash
# 使用自定义配置启动服务
ccr --config <配置文件路径> start

# 示例
ccr --config ./config-claude.json start
```

### 停止服务

```bash
# 停止使用特定配置的服务
ccr --config <配置文件路径> stop

# 示例
ccr --config ./config-claude.json stop
```

### 查看状态

```bash
# 查看特定实例的状态
ccr --config <配置文件路径> status

# 示例
ccr --config ./config-claude.json status
```

### 执行代码任务

```bash
# 直接执行（自动启动服务）
ccr --config <配置文件路径> code "your prompt"

# 示例
ccr --config ./config-gpt4.json code "Implement a binary search"
```

### 重启服务

```bash
# 重启特定实例
ccr --config <配置文件路径> restart

# 示例
ccr --config ./config-claude.json restart
```

## 🔧 实例隔离机制

每个配置文件会自动创建独立的管理文件：

```
项目目录/
├── config-claude.json                              # 配置文件
├── .claude-code-router-config-claude.pid          # PID文件
├── .claude-code-router-config-claude.port         # 端口文件（保存实际使用的端口）
├── reference-count-config-claude.txt              # 引用计数文件
├── config-gpt4.json
├── .claude-code-router-config-gpt4.pid
├── .claude-code-router-config-gpt4.port
└── reference-count-config-gpt4.txt
```

这确保了：
- ✅ **进程隔离**：每个实例有独立的进程管理（PID文件）
- ✅ **端口通信**：服务端将实际端口写入端口文件，客户端读取后连接
- ✅ **引用计数**：每个实例独立跟踪客户端连接数
- ✅ **配置隔离**：每个实例使用独立的配置，互不干扰

### 端口文件工作原理

1. **服务端启动**：
   - 读取配置中的 `PORT`（如果有）
   - 如果没有指定，自动查找可用端口
   - 将实际使用的端口写入 `.claude-code-router-{config_name}.port`

2. **客户端连接**：
   - 优先读取端口文件获取实际端口
   - 如果端口文件不存在，使用配置中的端口
   - 如果都没有，使用默认端口 3456

## 💡 最佳实践

### 1. 端口规划

建议使用连续的端口号：
```
- 默认配置：3456
- 实例1：3457
- 实例2：3458
- 实例3：3459
```

### 2. 配置文件命名

使用描述性的文件名：
```
config-claude-sonnet.json       # Claude Sonnet 模型
config-gpt4-turbo.json         # GPT-4 Turbo 模型
config-gemini-pro.json         # Gemini Pro 模型
config-local-llama.json        # 本地 LLaMA 模型
```

### 3. 配置文件组织

建议将配置文件放在专门的目录中：
```
~/.claude-code-router/
├── configs/
│   ├── simple-tasks.json    # 简单任务配置（端口 3456）
│   ├── complex-tasks.json   # 复杂任务配置（端口 3457）
│   └── long-context.json    # 长上下文配置（端口 3458）
└── config.json              # 默认配置
```

### 4. Shell 脚本集成

创建便捷脚本：

**simple-task.sh**：
```bash
#!/bin/bash
ccr --config ~/.claude-code-router/configs/simple-tasks.json code "$@"
```

**complex-task.sh**：
```bash
#!/bin/bash
ccr --config ~/.claude-code-router/configs/complex-tasks.json code "$@"
```

使用：
```bash
./simple-task.sh "Fix this bug"
./complex-task.sh "Design a microservices architecture"
```

## 🎯 使用场景示例

### 场景1：按任务难度选择模型

```bash
# 简单Bug修复 - 使用快速便宜的模型
ccr --config config-claude-haiku.json code "Fix null pointer exception"

# 复杂架构设计 - 使用最强模型
ccr --config config-claude-opus.json code "Design a distributed system"

# 代码审查 - 使用平衡模型
ccr --config config-claude-sonnet.json code "Review this pull request"
```

### 场景2：多项目并行工作

```bash
# 在终端1中处理项目A
cd ~/projects/project-a
ccr --config ~/configs/project-a.json code "Implement authentication"

# 在终端2中处理项目B
cd ~/projects/project-b
ccr --config ~/configs/project-b.json code "Optimize database queries"
```

### 场景3：多租户服务器

每个用户使用自己的配置：
```bash
# 用户1
ccr --config /home/user1/ccr-config.json code "Task 1"

# 用户2（不同端口、不同模型）
ccr --config /home/user2/ccr-config.json code "Task 2"
```

## ⚙️ 配置文件完整示例

```json
{
    "PORT": 3456,
    "APIKEY": "your-unique-api-key",
    "LOG": true,
    "API_TIMEOUT_MS": 600000,
    "NON_INTERACTIVE_MODE": false,
    
    "Providers": [
        {
            "name": "claude",
            "api_base_url": "https://api.anthropic.com/v1/messages",
            "api_key": "sk-xxx",
            "models": [
                "claude-sonnet-4-5-20250929",
                "claude-opus-4-1-20250805"
            ],
            "transformer": {
                "use": ["Anthropic"]
            }
        },
        {
            "name": "openai",
            "api_base_url": "https://api.openai.com/v1/chat/completions",
            "api_key": "sk-yyy",
            "models": ["gpt-4", "gpt-4-turbo"],
            "transformer": {
                "use": ["openrouter"]
            }
        }
    ],
    
    "Router": {
        "default": "claude,claude-sonnet-4-5-20250929",
        "background": "claude,claude-sonnet-4-5-20250929",
        "think": "claude,claude-opus-4-1-20250805",
        "longContext": "openai,gpt-4-turbo",
        "longContextThreshold": 60000,
        "webSearch": "openai,gpt-4-turbo"
    },
    
    "StatusLine": {
        "enabled": true
    }
}
```

## 🐛 故障排除

### 问题1：端口已被占用

**错误**：`Error: listen EADDRINUSE: address already in use :::3456`

**解决**：
1. 检查配置文件中的 `PORT` 是否与其他实例冲突
2. 使用 `lsof -i :3456` 查看端口占用情况
3. 停止冲突的实例或更换端口

### 问题2：多个实例使用相同模型

**问题**：明明配置了不同模型，但请求都发送到同一个模型

**原因**：配置文件中没有指定 `PORT` 或多个配置文件使用了相同的 `PORT`

**解决**：
1. 确保每个配置文件都明确指定了 `PORT`
2. 确保所有配置文件的 `PORT` 值都不相同
3. 重启所有实例

### 问题3：服务无法启动

**检查清单**：
- [ ] 配置文件语法正确（有效的 JSON）
- [ ] `PORT` 已明确指定且未被占用
- [ ] API 密钥有效
- [ ] 网络连接正常

## 📚 相关文档

- [主README](./README.md) - 项目概述和基本使用
- [配置说明](./CONFIG.md) - 详细的配置选项说明
- [API文档](./API.md) - REST API 接口文档

## ❓ 常见问题

**Q: 可以同时运行多少个实例？**  
A: 理论上没有限制，但取决于系统资源和可用端口数量。建议不超过10个实例。

**Q: 是否可以动态切换配置？**  
A: 可以，停止当前实例后使用不同的配置文件重新启动即可。

**Q: 配置文件可以共享相同的 Provider 吗？**  
A: 可以，不同配置文件可以使用相同的 Provider，只要它们的 `PORT` 不同即可。

**Q: 如何查看所有运行中的实例？**  
A: 使用 `ps aux | grep claude-code-router` 或查看各配置文件目录下的 PID 文件。

## 🎉 总结

使用 `--config` 参数，您可以轻松地：
- ✅ 在同一台机器上运行多个 CCR 实例
- ✅ 为不同任务使用不同的模型配置
- ✅ 实现完全的实例隔离和独立管理

**记住核心原则**：**每个配置文件必须指定唯一的 PORT！**
