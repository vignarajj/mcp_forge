import { McpProfile, ValidationResult, ValidationIssue } from '../types';

export function validateMcpConfig(profile: McpProfile): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (profile.tools.length === 0) {
    issues.push({
      severity: 'error',
      field: 'tools',
      message: 'No MCP servers defined. Add at least one server.',
    });
    return { valid: false, issues };
  }

  const seenNames = new Set<string>();
  for (let i = 0; i < profile.tools.length; i++) {
    const tool = profile.tools[i];
    const prefix = `servers[${i}]`;

    if (!tool.name.trim()) {
      issues.push({
        severity: 'error',
        field: `${prefix}.name`,
        message: `Server #${i + 1}: Name is required.`,
      });
    } else if (seenNames.has(tool.name.trim())) {
      issues.push({
        severity: 'error',
        field: `${prefix}.name`,
        message: `Server #${i + 1}: Duplicate name "${tool.name}".`,
      });
    } else {
      seenNames.add(tool.name.trim());
    }

    if (/\s/.test(tool.name.trim())) {
      issues.push({
        severity: 'warning',
        field: `${prefix}.name`,
        message: `Server #${i + 1}: Name "${tool.name}" contains spaces. Most tools expect hyphenated names.`,
      });
    }

    if (!tool.command.trim()) {
      issues.push({
        severity: 'error',
        field: `${prefix}.command`,
        message: `Server #${i + 1}: Command is required.`,
      });
    }

    if (tool.command.trim() === 'npx') {
      const hasYFlag = tool.args.some(a => a === '-y' || a === '--yes');
      if (!hasYFlag) {
        issues.push({
          severity: 'warning',
          field: `${prefix}.args`,
          message: `Server #${i + 1}: Using npx without -y flag. The process may hang waiting for install confirmation.`,
        });
      }
    }

    for (const [key, value] of Object.entries(tool.env)) {
      if (!key.trim()) {
        issues.push({
          severity: 'error',
          field: `${prefix}.env`,
          message: `Server #${i + 1}: Environment variable has an empty key.`,
        });
      }
      if (!value.trim()) {
        issues.push({
          severity: 'warning',
          field: `${prefix}.env.${key}`,
          message: `Server #${i + 1}: Environment variable "${key}" has an empty value.`,
        });
      }
    }
  }

  const hasErrors = issues.some(i => i.severity === 'error');
  return { valid: !hasErrors, issues };
}
