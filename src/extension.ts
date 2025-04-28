/// <reference types="vscode" />

import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('extension.findAllComponentReferences', async (uri: vscode.Uri) => {
      // 1) derive component name from file
      const compName = path.basename(uri.fsPath, path.extname(uri.fsPath));

      // 2) collect all files that mention it
      const results = new Set<string>();
      await (vscode.workspace as any).findTextInFiles(
        { pattern: `import\\s+.*\\b${compName}\\b`, isRegExp: true },
        { include: '**/*.{js,jsx,ts,tsx,vue,svelte}' },
        (match: any) => {
          results.add(vscode.workspace.asRelativePath(match.uri));
        }
      );

      // 3) show pick‐list
      const items = Array.from(results).sort();
      // include a “Select All” entry at the top
      const selectAllItem = '$(check) Select All';
      const picksRaw = await vscode.window.showQuickPick(
        [selectAllItem, ...items],
        {
          canPickMany: true,
          placeHolder: 'Select files to copy their relative paths'
        }
      );
      if (!picksRaw || picksRaw.length === 0) {
        return;
      }
      const picks = picksRaw.includes(selectAllItem) ? items : picksRaw;

      // 4) copy to clipboard
      const text = picks.join('\n');
      await vscode.env.clipboard.writeText(text);
      vscode.window.showInformationMessage(`Copied ${picks.length} paths to clipboard.`);
    })
  );
}
