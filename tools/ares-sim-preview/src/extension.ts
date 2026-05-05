import * as vscode from 'vscode';
import * as path from 'path';
import * as http from 'http';

// We map simple IDs for previews
// It looks for a folder name inside src/sims
// E.g., c:\\...\\src\\sims\\nn-activation\\index.tsx -> "nn-activation"
function getSimIdFromFile(uri: vscode.Uri): string | null {
  const filepath = uri.fsPath;
  const match = filepath.match(/[\\/]sims[\\/]([A-Za-z0-9_-]+)[\\/]/);
  return match ? match[1] : null;
}

// Ensure the local Vite server is up by doing a quick ping
function checkViteRunning(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5173', (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 404);
    });
    req.on('error', () => {
      resolve(false);
    });
    req.end();
  });
}

function ensureViteRunning() {
  checkViteRunning().then((isRunning) => {
    if (!isRunning) {
      vscode.window.showInformationMessage('Vite is not running. Starting it now...');
      const terminal = vscode.window.terminals.find(t => t.name === 'ARES Vite') || vscode.window.createTerminal('ARES Vite');
      terminal.show(true);
      terminal.sendText('npm run dev');
    }
  });
}

export function activate(context: vscode.ExtensionContext) {
  // Register the CodeLens Provider
  const simLensProvider = new SimCodeLensProvider();
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider({ scheme: 'file', language: 'typescriptreact' }, simLensProvider)
  );

  // Command: Preview Sim
  let previewPanel: vscode.WebviewPanel | undefined = undefined;
  
  context.subscriptions.push(vscode.commands.registerCommand('ares.previewSim', async (document: vscode.TextDocument) => {
    const simId = getSimIdFromFile(document.uri);
    if (!simId) {
      vscode.window.showErrorMessage('Could not determine Sim ID from file path. Make sure the file is inside src/sims/<sim_id>/');
      return;
    }

    ensureViteRunning();

    if (previewPanel) {
      previewPanel.reveal(vscode.ViewColumn.Beside);
    } else {
      previewPanel = vscode.window.createWebviewPanel(
        'aresSimPreview',
        `Preview: ${simId}`,
        vscode.ViewColumn.Beside,
        {
          enableScripts: true,
          retainContextWhenHidden: true
        }
      );

      previewPanel.onDidDispose(() => {
        previewPanel = undefined;
      }, null, context.subscriptions);
    }

    // Update URL to point to our isolated sim-runner route
    previewPanel.webview.html = getWebviewContent(`http://localhost:5173/sim-runner?sim=${simId}`);
  }));

  // Command: Debug Sim
  context.subscriptions.push(vscode.commands.registerCommand('ares.debugSim', async (document: vscode.TextDocument) => {
    const simId = getSimIdFromFile(document.uri);
    if (!simId) return;

    ensureViteRunning();

    const debugConfig = {
      type: 'chrome',
      request: 'launch',
      name: `Debug Sim: ${simId}`,
      url: `http://localhost:5173/sim-runner?sim=${simId}`,
      webRoot: '${workspaceFolder}/src'
    };

    vscode.debug.startDebugging(vscode.workspace.workspaceFolders?.[0], debugConfig);
  }));
}

function getWebviewContent(url: string) {
  return `<!DOCTYPE html>
  <html lang="en" style="width: 100%; height: 100%; margin: 0; padding: 0;">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sim Preview</title>
      <style>
        body { margin: 0; padding: 0; width: 100%; height: 100%; background: #0c0c0c; display: flex; flex-direction: column; }
        iframe { flex: 1; border: none; }
        .header { background: #1a1a1a; color: #fff; padding: 5px 10px; font-family: sans-serif; font-size: 12px; display: flex; justify-content: space-between; }
      </style>
  </head>
  <body>
      <div class="header">
        <span>ARES Simulation Preview</span>
        <span>Vite Hot-Reload Active</span>
      </div>
      <iframe src="${url}" allow="clipboard-read; clipboard-write"></iframe>
  </body>
  </html>`;
}

class SimCodeLensProvider implements vscode.CodeLensProvider {
  private regex = /\/\*\*\s*@sim/g;

  public provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[] {
    const codeLenses: vscode.CodeLens[] = [];
    const text = document.getText();
    let matches;

    while ((matches = this.regex.exec(text)) !== null) {
      const line = document.positionAt(matches.index).line;
      const range = new vscode.Range(line, 0, line, 0);

      // Preview Button
      codeLenses.push(new vscode.CodeLens(range, {
        title: '▶ Preview Sim',
        command: 'ares.previewSim',
        arguments: [document]
      }));

      // Debug Button
      codeLenses.push(new vscode.CodeLens(range, {
        title: '🐛 Debug Sim',
        command: 'ares.debugSim',
        arguments: [document]
      }));
    }

    return codeLenses;
  }
}
