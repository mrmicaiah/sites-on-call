/**
 * This file fetches articles from the UP Blog API at build time.
 * 
 * SETUP REQUIRED: Micaiah needs to create a UP Blog entry for 'sites-on-call'
 * in the database with the appropriate configuration.
 * 
 * The API endpoint should return published posts for this blog.
 */

const fetch = require('node-fetch');

const BLOG_ID = 'sites-on-call';
const API_BASE = 'https://blog.untitledpublishers.com/api';

module.exports = async function() {
  try {
    // Fetch published articles from UP Blog API
    const response = await fetch(`${API_BASE}/blogs/${BLOG_ID}/posts?status=published`);
    
    if (!response.ok) {
      console.warn(`[articles.js] UP Blog API returned ${response.status} - using empty array`);
      return [];
    }
    
    const data = await response.json();
    
    // Transform the API response into the format we need
    const articles = (data.posts || []).map(post => ({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || post.meta_description || '',
      content: post.content,
      publishedAt: post.published_at || post.created_at,
      image: post.featured_image || post.og_image || null,
      author: post.author_name || 'Sites On Call',
      tags: post.tags || [],
      // Generate the URL for this article
      url: `/articles/${post.slug}/`
    }));
    
    // Sort by published date, newest first
    articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    
    console.log(`[articles.js] Fetched ${articles.length} articles from UP Blog`);
    return articles;
    
  } catch (error) {
    console.warn(`[articles.js] Error fetching from UP Blog: ${error.message}`);
    // Return empty array on error - site will build without articles
    return [];
  }
};