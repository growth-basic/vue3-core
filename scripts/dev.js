const { build } = require("esbuild");
const path = require("path");

const args = require("minimist")(process.argv.slice(2)); // 解析用户执行命令的参数

const target = args._[0] || "reactivity"; // 打包的模块
const format = args.f || "global";

const pkg = require(path.resolve(
  __dirname,
  `../packages/${target}/package.json`
));

const outputFormat = format.startsWith("global")
  ? "iife"
  : format === "cjs"
  ? "cjs"
  : "esm";
// reactivity.esm.js
// reactivity.global.js
// reactivity.cjs.js
const outfile = path.resolve(
  __dirname,
  `../packages/${target}/dist/${target}.${format}.js`
);

build({
  entryPoints: [path.resolve(__dirname, `../packages/${target}/src/index.ts`)],
  outfile,
  bundle: true,
  sourcemap: true,
  format: outputFormat,
  globalName: pkg.buildOptions.name,

  platform: format === "cjs" ? "node" : "browser",
  watch: {
    // 监控文件的变化
    onRebuild(error) {
      if (!error) console.log("build ~~~");
    },
  },
}).then(() => {
  console.log("watching~~~");
});
console.log(args);
