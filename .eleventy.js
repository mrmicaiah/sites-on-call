module.exports = function(eleventyConfig) {
  // Copy static assets directly to output (no processing)
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/CNAME");

  // Date formatting filter - turns ISO dates into readable format
  eleventyConfig.addFilter("readableDate", (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  });

  // Year filter for copyright
  eleventyConfig.addFilter("year", () => {
    return new Date().getFullYear();
  });

  // Excerpt filter - first 160 chars, strips HTML
  eleventyConfig.addFilter("excerpt", (content) => {
    if (!content) return '';
    const text = content.replace(/<[^>]*>/g, '');
    return text.substring(0, 160) + (text.length > 160 ? '...' : '');
  });

  // Posts collection - excludes future-dated posts
  eleventyConfig.addCollection("posts", function(collectionApi) {
    const now = new Date();
    return collectionApi.getFilteredByGlob("src/articles/posts/*.md")
      .filter(post => post.date <= now)
      .sort((a, b) => b.date - a.date);
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
