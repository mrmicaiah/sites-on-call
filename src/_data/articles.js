/**
 * Reads articles from local markdown files in src/articles/posts/
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

module.exports = function() {
  const articlesDir = path.join(__dirname, '../articles/posts');
  
  console.log('[articles.js] Looking for posts in:', articlesDir);
  
  // Return empty array if directory doesn't exist yet
  if (!fs.existsSync(articlesDir)) {
    console.log('[articles.js] No posts directory found - returning empty array');
    return [];
  }
  
  const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.md'));
  console.log('[articles.js] Found markdown files:', files);
  
  // Use end of today to be more permissive with timezones
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  
  const articles = files.map(filename => {
    const filePath = path.join(articlesDir, filename);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(fileContent);
    
    const slug = filename.replace('.md', '');
    
    // Parse date more carefully
    let publishedAt;
    if (data.date) {
      // If it's a string like "2026-03-22", parse it as local date
      if (typeof data.date === 'string') {
        publishedAt = new Date(data.date + 'T12:00:00');
      } else {
        publishedAt = new Date(data.date);
      }
    } else {
      publishedAt = new Date();
    }
    
    console.log(`[articles.js] Article "${data.title}" has date:`, publishedAt, 'now is:', now);
    
    return {
      title: data.title,
      slug: slug,
      excerpt: data.excerpt || data.meta_description || '',
      content: marked(content),
      publishedAt: publishedAt.toISOString(),
      image: data.image || null,
      author: data.author || 'Sites On Call',
      tags: data.tags || [],
      url: `/articles/${slug}/`
    };
  })
  // Filter out future-dated posts
  .filter(article => {
    const articleDate = new Date(article.publishedAt);
    const isFuture = articleDate > now;
    if (isFuture) {
      console.log(`[articles.js] Filtering out future article: ${article.title}`);
    }
    return !isFuture;
  });
  
  // Sort by date, newest first
  articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  
  console.log(`[articles.js] Returning ${articles.length} articles`);
  return articles;
};
