import { createServer } from "net";

/**
 * 检查指定端口是否可用
 * @param port 要检查的端口号
 * @returns Promise<boolean> 如果端口可用返回 true，否则返回 false
 */
export async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    
    server.once("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE" || err.code === "EACCES") {
        resolve(false);
      } else {
        resolve(false);
      }
    });
    
    server.once("listening", () => {
      server.close();
      resolve(true);
    });
    
    server.listen(port, "127.0.0.1");
  });
}

/**
 * 查找可用端口
 * @param startPort 起始端口号
 * @param maxAttempts 最大尝试次数（默认 50）
 * @returns Promise<number> 返回第一个可用的端口号，如果都不可用则返回 -1
 */
export async function findAvailablePort(
  startPort: number,
  maxAttempts: number = 50
): Promise<number> {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  return -1;
}

/**
 * 获取可用端口，如果指定端口不可用则自动查找
 * @param preferredPort 首选端口号
 * @param autoSwitch 是否自动切换端口（默认 true）
 * @returns Promise<{port: number, switched: boolean}> 返回最终使用的端口号和是否切换了端口
 */
export async function getAvailablePort(
  preferredPort: number,
  autoSwitch: boolean = true
): Promise<{ port: number; switched: boolean; message?: string }> {
  const isAvailable = await isPortAvailable(preferredPort);
  
  if (isAvailable) {
    return { port: preferredPort, switched: false };
  }
  
  if (!autoSwitch) {
    return {
      port: -1,
      switched: false,
      message: `Port ${preferredPort} is already in use. Please specify a different port in config.json or enable auto port switching.`,
    };
  }
  
  // 尝试从下一个端口开始查找
  const availablePort = await findAvailablePort(preferredPort + 1);
  
  if (availablePort === -1) {
    return {
      port: -1,
      switched: false,
      message: `Port ${preferredPort} is in use and no available ports found in range ${preferredPort + 1}-${preferredPort + 50}.`,
    };
  }
  
  return {
    port: availablePort,
    switched: true,
    message: `Port ${preferredPort} is in use, automatically switched to port ${availablePort}.`,
  };
}
