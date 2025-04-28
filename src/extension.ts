/// <reference types="vscode" />

import * as vscode from "vscode";
import * as path from "path";

// Helper to decode Uint8Array to string
const utf8Decoder = new TextDecoder("utf-8");

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "extension.findAllComponentReferences",
      async (uri: vscode.Uri | undefined) => {
        // Ensure we have a file URI to work with
        let targetUri: vscode.Uri | undefined = uri;
        if (!targetUri) {
          // If command was run from command palette, use active editor
          const activeEditor = vscode.window.activeTextEditor;
          if (activeEditor) {
            targetUri = activeEditor.document.uri;
          } else {
            vscode.window.showErrorMessage(
              "No active file selected to find references for."
            );
            return;
          }
        }

        // 1) Derive component name from file
        const compName = path.basename(
          targetUri.fsPath,
          path.extname(targetUri.fsPath)
        );
        // Basic check for potentially invalid component names (e.g., 'index')
        if (!compName || compName.toLowerCase() === "index") {
          vscode.window.showWarningMessage(
            `Component name "${compName}" might be too generic. Proceeding anyway.`
          );
        }
        const searchRegex = new RegExp(`import\\s+.*\\b${compName}\\b`, "i"); // Added 'i' for case-insensitivity, adjust if needed

        // 2) Collect all files that mention it (using stable APIs)
        const results = new Set<string>();
        const filePattern = "**/*.{js,jsx,ts,tsx,vue,svelte}";
        // Standard excludes + node_modules. findFiles respects .gitignore and files.exclude by default.
        const excludePattern = "**/node_modules/**";

        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: `Searching for imports of "${compName}"...`,
            cancellable: true, // Allow user to cancel
          },
          async (progress, token) => {
            // Find candidate files
            // Pass null as the third argument for exclude, and 10000 as maxResults (or adjust as needed)
            // The fourth argument is the cancellation token
            const potentialFiles = await vscode.workspace.findFiles(
              filePattern,
              excludePattern,
              10000,
              token
            );

            if (token.isCancellationRequested) return;

            progress.report({
              message: `Found ${potentialFiles.length} potential files. Reading content...`,
              increment: 10,
            });

            let filesProcessed = 0;
            const totalFiles = potentialFiles.length;

            // Process files in chunks to avoid overwhelming the system and provide better progress
            const chunkSize = 50; // Process 50 files at a time
            for (let i = 0; i < totalFiles; i += chunkSize) {
              if (token.isCancellationRequested) return;

              const chunk = potentialFiles.slice(i, i + chunkSize);
              const promises = chunk.map(async (fileUri) => {
                if (token.isCancellationRequested) return;
                try {
                  const fileContentUint8 = await vscode.workspace.fs.readFile(
                    fileUri
                  );
                  const fileContent = utf8Decoder.decode(fileContentUint8);
                  if (searchRegex.test(fileContent)) {
                    // Use relative path for display and clipboard
                    results.add(vscode.workspace.asRelativePath(fileUri));
                  }
                } catch (e) {
                  // Log errors for debugging, but don't stop the process
                  console.error(
                    `Error reading or processing file ${fileUri.fsPath}:`,
                    e
                  );
                }
              });

              await Promise.all(promises);

              filesProcessed += chunk.length;
              const percentage = Math.round((filesProcessed / totalFiles) * 80); // Allocate 80% of progress to file processing
              progress.report({
                message: `Processed ${filesProcessed}/${totalFiles} files...`,
                increment: (chunk.length / totalFiles) * 80,
              });
            }

            progress.report({ message: "Finalizing...", increment: 10 }); // Remaining 10%
          }
        );

        if (results.size === 0) {
          vscode.window.showInformationMessage(
            `No files found importing "${compName}".`
          );
          return;
        }

        // 3) Show pick‐list
        const items = Array.from(results).sort();
        const selectAllItem = "$(check) Select All";
        const picksRaw = await vscode.window.showQuickPick(
          [selectAllItem, ...items],
          {
            canPickMany: true,
            placeHolder: `Found ${items.length} files importing "${compName}". Select files to copy paths:`,
            matchOnDetail: true, // Might help if paths are long
          }
        );

        if (!picksRaw || picksRaw.length === 0) {
          return; // User cancelled
        }

        // Handle "Select All"
        const picks = picksRaw.includes(selectAllItem) ? items : picksRaw;

        // 4) Copy to clipboard
        const text = picks.join("\n");
        await vscode.env.clipboard.writeText(text);
        vscode.window.showInformationMessage(
          `Copied ${picks.length} path(s) to clipboard.`
        );
      }
    )
  );
}

// This function is called when your extension is deactivated
export function deactivate() {}
