const fs = require("fs");
const path = require("path");

/**
 * 简单的文件合并构建脚本
 * 专门为用户脚本优化，避免 webpack 运行时代码
 */

class SimpleBuilder {
  constructor() {
    this.packageJson = require("./package.json");
    this.output = "";
  }

  // 读取用户脚本头部模板
  getHeaders() {
    let headers = fs.readFileSync("./userscript-headers.js", "utf8");
    let dateTimeString = new Date().toISOString();

    // 替换模板变量
    Object.entries({
      "${name}": this.packageJson.name,
      "${namespace}": this.packageJson.namespace,
      "${version}": this.packageJson.version,
      "${description}": this.packageJson.description  + " 构建于：[" + dateTimeString + "]",
      "${document}": this.packageJson.document,
      "${author}": this.packageJson.author,
      "${repository}": this.packageJson.repository,
    }).forEach(([key, value]) => {
      headers = headers.replace(
        new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
        value || ""
      );
    });

    // 添加横幅
    if (fs.existsSync("./banner.txt")) {
      let banner = fs.readFileSync("./banner.txt", "utf8");
      Object.entries({
        "${name}": this.packageJson.name,
        "${namespace}": this.packageJson.namespace,
        "${version}": this.packageJson.version,
        "${description}": this.packageJson.description,
        "${document}": this.packageJson.document,
        "${author}": this.packageJson.author,
        "${repository}": this.packageJson.repository,
      }).forEach(([key, value]) => {
        banner = banner.replace(
          new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
          value || ""
        );
      });
      headers +=
        "\n" +
        banner
          .split("\n")
          .map((line) => "//    " + line)
          .join("\n") +
        "\n";
    }

    return headers;
  }

  // 处理模块文件，移除 export/import 语句
  processModule(filePath) {
    let content = fs.readFileSync(filePath, "utf8");

    // 移除 import 语句
    content = content.replace(/import\s+.*?from\s+['"][^'"]*['"];?\s*/g, "");

    // 移除 export 语句，保留类定义
    content = content.replace(
      /export\s+(class|const|let|var|function)\s+([A-Za-z_$][A-Za-z0-9_$]*)/g,
      "$1 $2"
    );

    // 移除多行 export { ... } 语句
    content = content.replace(/export\s*\{[^}]*\}/gs, "// exports removed");

    // 移除 export default
    content = content.replace(/export\s+default\s+/g, "// exported: ");

    // 移除 JSDoc 中的 @export 标签
    content = content.replace(/@export\s+/g, "");

    return content;
  }

  // 自动获取模块列表
  getModuleList() {
    const modulesDir = "./src/modules";

    if (!fs.existsSync(modulesDir)) {
      console.warn("⚠️  modules 目录不存在:", modulesDir);
      return [];
    }

    const files = fs.readdirSync(modulesDir);

    // 过滤出 .js 文件并按文件名排序
    const modules = files
      .filter(file => file.endsWith('.js'))
      .sort();

    console.log("📦 发现模块文件:", modules);
    return modules;
  }

  // 构建主入口文件
  buildMain() {
    let main = fs.readFileSync("./src/video-rotate-zoom-drag.user.js", "utf8");

    // 自动获取所有模块
    const modules = this.getModuleList();

    let moduleCode = "";
    modules.forEach((module) => {
      const modulePath = path.join("./src/modules", module);
      if (fs.existsSync(modulePath)) {
        moduleCode += "\n// === Module: " + module + " ===\n";
        moduleCode += this.processModule(modulePath);
        moduleCode += "\n";
      }
    });

    // 处理主文件，移除 import 语句
    main = main.replace(/import\s+.*?from\s+['"][^'"]*['"];?\s*/g, "");

    return moduleCode + "\n" + main;
  }

  // 执行构建
  build() {
    console.log("🔨 开始构建用户脚本...");

    try {
      // 确保输出目录存在
      if (!fs.existsSync("./dist")) {
        fs.mkdirSync("./dist");
      }

      // 构建完整内容
      const result = this.getHeaders() + "\n" + this.buildMain();

      // 写入文件
      const outputPath = "./dist/video-rotate-zoom-drag.user.js";
      fs.writeFileSync(outputPath, result);

      console.log("✅ 构建完成！");
      console.log(`📍 输出文件: ${outputPath}`);
      console.log(
        `📊 文件大小: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`
      );

      // 显示文件大小对比
      const webpackSize = this.getWebpackSize();
      if (webpackSize) {
        console.log(
          `📈 相比 webpack 版本节省了 ${(
            (webpackSize - fs.statSync(outputPath).size) /
            1024
          ).toFixed(2)} KB`
        );
      }
    } catch (error) {
      console.error("❌ 构建失败:", error.message);
      process.exit(1);
    }
  }

  // 获取 webpack 构建的文件大小（如果存在）
  getWebpackSize() {
    const webpackFile = "./dist/index.js";
    if (fs.existsSync(webpackFile)) {
      return fs.statSync(webpackFile).size;
    }
    return null;
  }
}

// 运行构建
if (require.main === module) {
  const builder = new SimpleBuilder();
  builder.build();
}

module.exports = SimpleBuilder;
