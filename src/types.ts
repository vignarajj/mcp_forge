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
  command?: string;
  args?: string[];
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
