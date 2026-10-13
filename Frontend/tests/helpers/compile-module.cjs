/* Native Node test runner loads the actual TypeScript modules. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function compileModule(filename, imports, globals = {}) {
    const module = { exports: {} };
    const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX },
        fileName: filename,
    }).outputText;
    const context = vm.createContext({
        module, exports: module.exports,
        require: name => {
            if (!(name in imports)) throw new Error(`Unexpected test import: ${name}`);
            return imports[name];
        },
        console: { log() {}, warn() {}, error() {} },
        crypto: require('node:crypto').webcrypto,
        setTimeout, clearTimeout, URL, Request, Response, Headers,
        ...globals,
    });
    new vm.Script(code, { filename: path.basename(filename) }).runInContext(context);
    return module.exports;
}

module.exports = { compileModule };
