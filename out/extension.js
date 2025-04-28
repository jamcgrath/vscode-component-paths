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
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
// Helper to decode Uint8Array to string
const utf8Decoder = new TextDecoder("utf-8");
function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand("extension.findAllComponentReferences", (uri) => __awaiter(this, void 0, void 0, function* () {
        // Ensure we have a file URI to work with
        let targetUri = uri;
        if (!targetUri) {
            // If command was run from command palette, use active editor
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                targetUri = activeEditor.document.uri;
            }
            else {
                vscode.window.showErrorMessage("No active file selected to find references for.");
                return;
            }
        }
        // 1) Derive component name from file
        const compName = path.basename(targetUri.fsPath, path.extname(targetUri.fsPath));
        // Basic check for potentially invalid component names (e.g., 'index')
        if (!compName || compName.toLowerCase() === "index") {
            vscode.window.showWarningMessage(`Component name "${compName}" might be too generic. Proceeding anyway.`);
        }
        const searchRegex = new RegExp(`import\\s+.*\\b${compName}\\b`, "i"); // Added 'i' for case-insensitivity, adjust if needed
        // 2) Collect all files that mention it (using stable APIs)
        const results = new Set();
        const filePattern = "**/*.{js,jsx,ts,tsx,vue,svelte}";
        // Standard excludes + node_modules. findFiles respects .gitignore and files.exclude by default.
        const excludePattern = "**/node_modules/**";
        yield vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Searching for imports of "${compName}"...`,
            cancellable: true, // Allow user to cancel
        }, (progress, token) => __awaiter(this, void 0, void 0, function* () {
            // Find candidate files
            // Pass null as the third argument for exclude, and 10000 as maxResults (or adjust as needed)
            // The fourth argument is the cancellation token
            const potentialFiles = yield vscode.workspace.findFiles(filePattern, excludePattern, 10000, token);
            if (token.isCancellationRequested)
                return;
            progress.report({
                message: `Found ${potentialFiles.length} potential files. Reading content...`,
                increment: 10,
            });
            let filesProcessed = 0;
            const totalFiles = potentialFiles.length;
            // Process files in chunks to avoid overwhelming the system and provide better progress
            const chunkSize = 50; // Process 50 files at a time
            for (let i = 0; i < totalFiles; i += chunkSize) {
                if (token.isCancellationRequested)
                    return;
                const chunk = potentialFiles.slice(i, i + chunkSize);
                const promises = chunk.map((fileUri) => __awaiter(this, void 0, void 0, function* () {
                    if (token.isCancellationRequested)
                        return;
                    try {
                        const fileContentUint8 = yield vscode.workspace.fs.readFile(fileUri);
                        const fileContent = utf8Decoder.decode(fileContentUint8);
                        if (searchRegex.test(fileContent)) {
                            // Use relative path for display and clipboard
                            results.add(vscode.workspace.asRelativePath(fileUri));
                        }
                    }
                    catch (e) {
                        // Log errors for debugging, but don't stop the process
                        console.error(`Error reading or processing file ${fileUri.fsPath}:`, e);
                    }
                }));
                yield Promise.all(promises);
                filesProcessed += chunk.length;
                const percentage = Math.round((filesProcessed / totalFiles) * 80); // Allocate 80% of progress to file processing
                progress.report({
                    message: `Processed ${filesProcessed}/${totalFiles} files...`,
                    increment: (chunk.length / totalFiles) * 80,
                });
            }
            progress.report({ message: "Finalizing...", increment: 10 }); // Remaining 10%
        }));
        if (results.size === 0) {
            vscode.window.showInformationMessage(`No files found importing "${compName}".`);
            return;
        }
        // 3) Show pick‐list
        const items = Array.from(results).sort();
        const selectAllItem = "$(check) Select All";
        const picksRaw = yield vscode.window.showQuickPick([selectAllItem, ...items], {
            canPickMany: true,
            placeHolder: `Found ${items.length} files importing "${compName}". Select files to copy paths:`,
            matchOnDetail: true, // Might help if paths are long
        });
        if (!picksRaw || picksRaw.length === 0) {
            return; // User cancelled
        }
        // Handle "Select All"
        const picks = picksRaw.includes(selectAllItem) ? items : picksRaw;
        // 4) Copy to clipboard
        const text = picks.join("\n");
        yield vscode.env.clipboard.writeText(text);
        vscode.window.showInformationMessage(`Copied ${picks.length} path(s) to clipboard.`);
    })));
}
// This function is called when your extension is deactivated
function deactivate() { }
//# sourceMappingURL=extension.js.map