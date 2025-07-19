/**
 * URL Resolver Utility
 * 
 * Resolves Google grounding redirect URLs to actual source URLs
 */

import chalk from 'chalk';

export class URLResolver {
  
  /**
   * Resolve a Google grounding redirect URL to the actual source URL
   */
  static async resolveGroundingURL(redirectURL) {
    try {
      console.log(chalk.gray(`   🔗 Resolving: ${redirectURL.substring(0, 60)}...`));
      
      const response = await fetch(redirectURL, {
        method: 'HEAD',
        redirect: 'manual' // Don't follow redirects automatically
      });
      
      if (response.status === 302 || response.status === 301) {
        const actualURL = response.headers.get('location');
        console.log(chalk.green(`   ✅ Resolved to: ${actualURL}`));
        return actualURL;
      } else {
        console.log(chalk.yellow(`   ⚠️  No redirect found (${response.status})`));
        return redirectURL;
      }
      
    } catch (error) {
      console.error(chalk.red(`   ❌ URL resolution error: ${error.message}`));
      return redirectURL; // Return original if resolution fails
    }
  }
  
  /**
   * Resolve all grounding URLs in the response
   */
  static async resolveAllGroundingURLs(groundingChunks) {
    if (!groundingChunks || groundingChunks.length === 0) {
      return [];
    }
    
    console.log(chalk.blue('\n🔗 Resolving Source URLs:'));
    
    const resolvedSources = [];
    
    for (const chunk of groundingChunks) {
      if (chunk.web && chunk.web.uri) {
        const actualURL = await this.resolveGroundingURL(chunk.web.uri);
        resolvedSources.push({
          title: chunk.web.title,
          redirectURL: chunk.web.uri,
          actualURL: actualURL,
          domain: this.extractDomain(actualURL)
        });
      }
    }
    
    return resolvedSources;
  }
  
  /**
   * Extract domain from URL
   */
  static extractDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return 'Unknown domain';
    }
  }
  
  /**
   * Get a summary of resolved sources
   */
  static getSourceSummary(resolvedSources) {
    if (resolvedSources.length === 0) {
      return 'No sources available';
    }
    
    const domains = [...new Set(resolvedSources.map(s => s.domain))];
    return `${resolvedSources.length} sources from ${domains.join(', ')}`;
  }
}