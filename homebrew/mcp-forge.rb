cask "mcp-forge" do
  version "1.0.0"
  sha256 "REPLACE_WITH_SHA256_HASH_OF_DMG"

  url "https://github.com/vignaraj/mcp-forge/releases/download/v#{version}/MCP-Forge-mac-arm64.dmg"
  name "MCP Forge"
  desc "Local MCP Profile Manager for macOS"
  homepage "https://github.com/vignaraj/mcp-forge"

  depends_on macos: ">= :ventura"
  depends_on arch: :arm64

  app "MCP Forge.app"

  zap trash: [
    "~/Library/Application Support/MCP Forge",
    "~/Library/Preferences/com.vignaraj.mcpforge.plist",
  ]
end
