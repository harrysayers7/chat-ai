#!/usr/bin/env tsx

/**
 * Setup script for GitHub Instructions Integration
 * This script helps users configure their GitHub token and repository settings
 * Optimized for chat-gpt-brain repository structure
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createChatGPTBrainService, createComprehensiveChatGPTBrainService } from '../src/lib/services/github-instructions';

const ROOT = process.cwd();
const ENV_PATH = join(ROOT, '.env');



async function main() {
  console.log('🧠 GitHub Instructions Integration Setup\n');
  console.log('Optimized for chat-gpt-brain repository structure\n');

  // Check if .env exists
  if (!existsSync(ENV_PATH)) {
    console.log('❌ .env file not found. Please run "pnpm initial:env" first.');
    return;
  }

  // Read current .env
  const envContent = readFileSync(ENV_PATH, 'utf-8');
  
  // Check if GitHub token is already configured
  if (envContent.includes('GITHUB_TOKEN=') && !envContent.includes('GITHUB_TOKEN=your_github_token_here')) {
    console.log('✅ GitHub token already configured in .env');
    
    // Extract current token
    const tokenMatch = envContent.match(/GITHUB_TOKEN=([^\n]+)/);
    if (tokenMatch) {
      const token = tokenMatch[1];
      console.log(`Current token: ${token.substring(0, 8)}...`);
      
      // Test both standard and comprehensive modes
      await testGitHubToken(token);
    }
  } else {
    console.log('❌ GitHub token not configured');
    console.log('\nTo configure GitHub integration:');
    console.log('1. Go to https://github.com/settings/tokens');
    console.log('2. Generate a new personal access token');
    console.log('3. Select scopes: repo (for private repos) or public_repo (for public repos)');
    console.log('4. Copy the token and add it to your .env file:');
    console.log('   GITHUB_TOKEN=ghp_your_token_here');
    console.log('\nThen run this script again to test the configuration.');
  }

  // Show repository configuration
  console.log('\n📁 Repository Configuration:');
  console.log('Default repository: harrysayers/chat-gpt-brain');
  console.log('To use a different repository, modify the service configuration in:');
  console.log('src/lib/services/github-instructions.ts');
  
  // Show available files based on chat-gpt-brain structure
  console.log('\n📋 Available instruction files (in priority order):');
  console.log('Root level:');
  console.log('- instructions.md (Primary instructions)');
  console.log('- MY-INSTRUCTIONS.md (Personal instructions)');
  console.log('- README.md (Project overview)');
  console.log('- policy/guardrails.yaml (Policy and rules)');
  console.log('- prompts/system.mdx (System prompts)');
  
  console.log('\nDocumentation:');
  console.log('- docs/00-README.md (Documentation overview)');
  console.log('- docs/01-foundations.md (Core foundations)');
  console.log('- docs/02-governance.md (Governance rules)');
  console.log('- docs/03-security.md (Security guidelines)');
  console.log('- docs/04-tools.md (Tool usage)');
  console.log('- docs/05-style.md (Style guide)');
  console.log('- docs/06-commands.md (Command reference)');
  console.log('- docs/07-knowledge-architecture.md (Knowledge structure)');
  
  console.log('\n💡 Tip: Create these files in your repository to provide comprehensive AI instructions');
  console.log('💡 Pro Tip: Use comprehensive mode to fetch from multiple sources for complete coverage');
}

async function testGitHubToken(token: string) {
  try {
    console.log('\n🧪 Testing GitHub token...');
    
    // Test standard service
    console.log('\n📚 Testing Standard Instructions Service...');
    const standardService = createChatGPTBrainService(token);
    const standardInstructions = await standardService.fetchInstructions();
    
    if (standardInstructions && standardInstructions.length > 0) {
      console.log('✅ Standard service: Token is valid and can access repository');
      console.log(`📖 Fetched ${standardInstructions.length} characters of instructions`);
      
      // Show preview
      const preview = standardInstructions.substring(0, 200);
      console.log(`\n📝 Preview:\n${preview}...`);
    } else {
      console.log('⚠️  Standard service: Token is valid but no instructions found');
      console.log('Make sure your repository contains instruction files');
    }

    // Test comprehensive service
    console.log('\n🧠 Testing Comprehensive Instructions Service...');
    const comprehensiveService = createComprehensiveChatGPTBrainService(token);
    const comprehensiveInstructions = await comprehensiveService.fetchComprehensiveInstructions();
    
    if (comprehensiveInstructions && comprehensiveInstructions.length > 0) {
      console.log('✅ Comprehensive service: Token is valid and can access repository');
      console.log(`📖 Fetched ${comprehensiveInstructions.length} characters of comprehensive instructions`);
      
      // Show preview
      const preview = comprehensiveInstructions.substring(0, 200);
      console.log(`\n📝 Preview:\n${preview}...`);
      
      // Show difference
      const difference = comprehensiveInstructions.length - standardInstructions.length;
      if (difference > 0) {
        console.log(`\n📊 Comprehensive mode provides ${difference} additional characters of instructions`);
      }
    } else {
      console.log('⚠️  Comprehensive service: Token is valid but no comprehensive instructions found');
    }

    // Test repository metadata
    console.log('\n📊 Testing Repository Metadata...');
    try {
      const repoInfo = await standardService.getRepositoryInfo();
      console.log('✅ Repository metadata accessible:');
      console.log(`   Description: ${repoInfo.description || 'None'}`);
      console.log(`   Topics: ${repoInfo.topics.join(', ') || 'None'}`);
      console.log(`   Language: ${repoInfo.language || 'Unknown'}`);
      console.log(`   Size: ${Math.round(repoInfo.size / 1024)} KB`);
      console.log(`   Updated: ${new Date(repoInfo.updatedAt).toLocaleDateString()}`);
      console.log(`   Available instruction files: ${repoInfo.instructionFiles.length}`);
      
      if (repoInfo.instructionFiles.length > 0) {
        console.log(`   Sample files: ${repoInfo.instructionFiles.slice(0, 5).join(', ')}`);
      }
    } catch (error) {
      console.log('⚠️  Repository metadata not accessible:', error.message);
    }

  } catch (error: any) {
    console.log('❌ Token test failed:', error.message);
    
    if (error.message.includes('Not Found')) {
      console.log('Repository not found. Check the owner/repo name.');
    } else if (error.message.includes('Bad credentials')) {
      console.log('Invalid token. Please check your GITHUB_TOKEN.');
    } else if (error.message.includes('rate limit')) {
      console.log('Rate limit exceeded. Try again later.');
    } else if (error.message.includes('Forbidden')) {
      console.log('Access denied. Check repository permissions and token scopes.');
    }
  }
}

// Run setup
main().catch(console.error);
