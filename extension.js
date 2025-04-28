"use strict";
/// <reference types="vscode" />
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand('extension.findAllComponentReferences', (uri) => __awaiter(this, void 0, void 0, function* () {
        // 1) derive component name from file
        const compName = path.basename(uri.fsPath, path.extname(uri.fsPath));
        // 2) collect all files that mention it
        const results = new Set();
        yield vscode.workspace.findTextInFiles({ pattern: `\\b${compName}\\b`, isRegExp: true }, { include: '**/*.{js,jsx,ts,tsx,vue}' }, (match) => {
            results.add(vscode.workspace.asRelativePath(match.uri));
        });
        // 3) show pick‐list
        const items = Array.from(results).sort();
        const picks = yield vscode.window.showQuickPick(items, {
            canPickMany: true,
            placeHolder: 'Select files to copy their relative paths'
        });
        if (!picks || picks.length === 0) {
            return;
        }
        // 4) copy to clipboard
        const text = picks.join('\n');
        yield vscode.env.clipboard.writeText(text);
        vscode.window.showInformationMessage(`Copied ${picks.length} paths to clipboard.`);
    })));
}
//# sourceMappingURL=extension.js.map