/**
 * This file fetches articles from the UP Blog API at build time.
 * 
 * SETUP REQUIRED: Micaiah needs to create a UP Blog entry for 'sites-on-call'
 * in the database with the appropriate configuration.
 */

const fetch = require('node-fetch');

const BLOG_ID = 'sites-on-call';
// TODO: Update this URL when Micaiah confirms the correct API endpoint
const API_BASE = 'https://blog.untitledpublishers.com/api';

module.exports = async function() {
  // For now, return empty array until the UP Blog is set up
  // This prevents build failures while we wait for backend configuration
  
  try {
    const response = await fetch(`${API_BASE}/blogs/${BLOG_ID}/posts?status=published`, {
      timeout: 5000 // 5 second timeout
    });
    
    if (!response.ok) {
      console.log(`[articles.js] UP Blog not configured yet (${response.status}) - returning empty array`);
      return [];
    }
    
    const data = await response.json();
    
    const articles = (data.posts || []).map(post => ({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || post.meta_description || '',
      content: post.content,
      publishedAt: post.published_at || post.created_at,
      image: post.featured_image || post.og_image || null,
      author: post.author_name || 'Sites On Call',
      tags: post.tags || [],
      url: `/articles/${post.slug}/`
    }));
    
    articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    
    console.log(`[articles.js] Fetched ${articles.length} articles from UP Blog`);
    return articles;
    
  } catch (error) {
    // Silently return empty array - UP Blog isn't set up yet
    console.log(`[articles.js] UP Blog not available - returning empty array`);
    return [];
  }
};