#!/usr/bin/env node

// Test script to check environment variables
console.log("🔍 Environment Variable Check");
console.log("=============================");

console.log(
  "MOKAI_MCP_BRIDGE_URL:",
  process.env.MOKAI_MCP_BRIDGE_URL || "NOT SET",
);
console.log(
  "MOKAI_MCP_BRIDGE_TOKEN:",
  process.env.MOKAI_MCP_BRIDGE_TOKEN
    ? `${process.env.MOKAI_MCP_BRIDGE_TOKEN.substring(0, 20)}...`
    : "NOT SET",
);
console.log(
  "MOKAI_REGISTRY_TOKEN:",
  process.env.MOKAI_REGISTRY_TOKEN
    ? `${process.env.MOKAI_REGISTRY_TOKEN.substring(0, 20)}...`
    : "NOT SET",
);

// Test the token directly
if (process.env.MOKAI_MCP_BRIDGE_TOKEN) {
  console.log("\n🧪 Testing token with MCP Bridge...");
  const token = process.env.MOKAI_MCP_BRIDGE_TOKEN;
  const url = `${process.env.MOKAI_MCP_BRIDGE_URL}/manifest?repo=harrysayers7/mokai-engine&commit=HEAD`;

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("Response status:", response.status);
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Success! Files found:", data.files?.length || 0);
    } else {
      const error = await response.text();
      console.log("❌ Error:", error);
    }
  } catch (error) {
    console.log("❌ Fetch error:", error.message);
  }
}
