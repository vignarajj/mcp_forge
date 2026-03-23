export type ToolName =
  | 'Cursor'
  | 'Claude Code'
  | 'Antigravity'
  | 'Qwen CLI'
  | 'Gemini CLI'
  | 'Codex';

export interface McpTool {
  id: string;
  name: string;
  description: string;
  command: string;
  args: string[];
  env: Record<string, string>;
}

export interface McpProfile {
  id: string;
  name: string;
  tool: ToolName;
  rules: string[];
  tools: McpTool[];
  contextFolders: string[];
  ignorePatterns: string[];
  projectSettings: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

export interface ToolConfigInfo {
  globalPath: string;
  projectPath: string | null;
  format: 'json' | 'toml';
  notes: string;
}

export interface McpToolInfo {
  name: string;
  description?: string;
}

export type ValidationSeverity = 'error' | 'warning';

export interface ValidationIssue {
  severity: ValidationSeverity;
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}
