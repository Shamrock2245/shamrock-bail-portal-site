/**
 * Shamrock Bail Bonds - Blog Page
 * 
 * Blog listing page with category filtering and search.
 * Supports SEO-optimized blog posts for authority building.
 * 
 * URL: /blog
 * 
 * Page Elements (Wix Editor IDs):
 * - #blogGrid: Blog post grid/repeater
 * - #categoryFilter: Category dropdown
 * - #searchInput: Blog search
 * - #featuredPost: Featured/latest post highlight
 * - #pagination: Page navigation
 */

import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import wixData from 'wix-data';

let currentPage = 1;
const postsPerPage = 9;
let currentCategory = 'all';
let searchQuery = '';

$w.onReady(function () {
    initializePage();
    setupEventListeners();
    loadBlogPosts();
});

/**
 * Initialize page
 */
function initializePage() {
    // Set up category filter
    loadCategories();
    
    // Check for URL parameters
    const urlParams = wixLocation.query;
    if (urlParams.category) {
        currentCategory = urlParams.category;
        $w('#categoryFilter').value = currentCategory;
    }
    if (urlParams.search) {
        searchQuery = urlParams.search;
        $w('#searchInput').value = searchQuery;
    }
    if (urlParams.page) {
        currentPage = parseInt(urlParams.page) || 1;
    }
    
    // Track page view
    trackEvent('PageView', { page: 'Blog' });
    
    // Set SEO
    setPageSEO();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Category filter
    $w('#categoryFilter').onChange((event) => {
        currentCategory = event.target.value;
        currentPage = 1;
        loadBlogPosts();
        updateUrl();
        trackEvent('Blog_Filter', { category: currentCategory });
    });
    
    // Search
    $w('#searchInput').onInput((event) => {
        searchQuery = event.target.value;
    });
    
    $w('#searchBtn').onClick(() => {
        currentPage = 1;
        loadBlogPosts();
        updateUrl();
        trackEvent('Blog_Search', { query: searchQuery });
    });
    
    $w('#searchInput').onKeyPress((event) => {
        if (event.key === 'Enter') {
            currentPage = 1;
            loadBlogPosts();
            updateUrl();
            trackEvent('Blog_Search', { query: searchQuery });
        }
    });
    
    // Clear search
    $w('#clearSearchBtn').onClick(() => {
        searchQuery = '';
        $w('#searchInput').value = '';
        loadBlogPosts();
        updateUrl();
    });
    
    // Pagination
    $w('#prevPageBtn').onClick(() => {
        if (currentPage > 1) {
            currentPage--;
            loadBlogPosts();
            updateUrl();
            scrollToTop();
        }
    });
    
    $w('#nextPageBtn').onClick(() => {
        currentPage++;
        loadBlogPosts();
        updateUrl();
        scrollToTop();
    });
}

/**
 * Load blog categories
 */
async function loadCategories() {
    try {
        const categories = await wixData.query('Blog/Categories')
            .ascending('label')
            .find();
        
        const categoryOptions = [
            { value: 'all', label: 'All Categories' },
            ...categories.items.map(cat => ({
                value: cat.slug || cat._id,
                label: cat.label
            }))
        ];
        
        $w('#categoryFilter').options = categoryOptions;
        $w('#categoryFilter').value = currentCategory;
    } catch (error) {
        console.error('Error loading categories:', error);
        // Use default categories
        $w('#categoryFilter').options = [
            { value: 'all', label: 'All Categories' },
            { value: 'bail-bonds-101', label: 'Bail Bonds 101' },
            { value: 'florida-law', label: 'Florida Law' },
            { value: 'county-guides', label: 'County Guides' },
            { value: 'industry-news', label: 'Industry News' },
            { value: 'tips-advice', label: 'Tips & Advice' }
        ];
    }
}

/**
 * Load blog posts
 */
async function loadBlogPosts() {
    try {
        $w('#loadingIndicator').show();
        $w('#blogGrid').hide();
        
        // Build query
        let query = wixData.query('Blog/Posts')
            .eq('status', 'published')
            .descending('publishedDate');
        
        // Apply category filter
        if (currentCategory && currentCategory !== 'all') {
            query = query.hasSome('categories', [currentCategory]);
        }
        
        // Apply search filter
        if (searchQuery) {
            query = query.contains('title', searchQuery);
        }
        
        // Get total count for pagination
        const countResult = await query.count();
        const totalPages = Math.ceil(countResult / postsPerPage);
        
        // Apply pagination
        const skip = (currentPage - 1) * postsPerPage;
        query = query.skip(skip).limit(postsPerPage);
        
        // Execute query
        const results = await query.find();
        
        // Display posts
        displayPosts(results.items);
        
        // Update pagination
        updatePagination(totalPages);
        
        // Update results count
        $w('#resultsCount').text = `${countResult} ${countResult === 1 ? 'post' : 'posts'} found`;
        
    } catch (error) {
        console.error('Error loading blog posts:', error);
        $w('#errorMessage').text = 'Error loading posts. Please try again.';
        $w('#errorMessage').show();
    } finally {
        $w('#loadingIndicator').hide();
        $w('#blogGrid').show();
    }
}

/**
 * Display blog posts in grid
 */
function displayPosts(posts) {
    if ($w('#blogRepeater').valid) {
        if (posts.length > 0) {
            // Add _id if not present
            const postsWithId = posts.map((post, index) => ({
                ...post,
                _id: post._id || `post-${index}`
            }));
            
            $w('#blogRepeater').data = postsWithId;
            
            $w('#blogRepeater').onItemReady(($item, itemData) => {
                // Post image
                if (itemData.coverImage) {
                    $item('#postImage').src = itemData.coverImage;
                    $item('#postImage').show();
                } else {
                    $item('#postImage').hide();
                }
                
                // Post title
                $item('#postTitle').text = itemData.title;
                
                // Post excerpt
                const excerpt = itemData.excerpt || stripHtml(itemData.content).substring(0, 150) + '...';
                $item('#postExcerpt').text = excerpt;
                
                // Post date
                const postDate = new Date(itemData.publishedDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                $item('#postDate').text = postDate;
                
                // Category badge
                if (itemData.categories && itemData.categories.length > 0) {
                    $item('#postCategory').text = itemData.categories[0];
                    $item('#postCategory').show();
                } else {
                    $item('#postCategory').hide();
                }
                
                // Read time estimate
                const wordCount = itemData.content ? itemData.content.split(/\s+/).length : 0;
                const readTime = Math.ceil(wordCount / 200);
                $item('#readTime').text = `${readTime} min read`;
                
                // Click handler
                $item('#postCard').onClick(() => {
                    trackEvent('Blog_Post_Click', { 
                        postId: itemData._id,
                        title: itemData.title 
                    });
                    wixLocation.to(`/blog/${itemData.slug || itemData._id}`);
                });
                
                // Link for accessibility
                $item('#postLink').link = `/blog/${itemData.slug || itemData._id}`;
            });
            
            $w('#noPostsMessage').hide();
        } else {
            $w('#blogRepeater').data = [];
            $w('#noPostsMessage').show();
            $w('#noPostsMessage').text = searchQuery 
                ? `No posts found for "${searchQuery}"`
                : 'No posts found in this category.';
        }
    }
    
    // Featured post (first post)
    if (posts.length > 0 && $w('#featuredPost').valid) {
        displayFeaturedPost(posts[0]);
    }
}

/**
 * Display featured post
 */
function displayFeaturedPost(post) {
    if ($w('#featuredImage').valid && post.coverImage) {
        $w('#featuredImage').src = post.coverImage;
    }
    
    $w('#featuredTitle').text = post.title;
    
    const excerpt = post.excerpt || stripHtml(post.content).substring(0, 200) + '...';
    $w('#featuredExcerpt').text = excerpt;
    
    $w('#featuredLink').link = `/blog/${post.slug || post._id}`;
    
    $w('#featuredPost').onClick(() => {
        trackEvent('Featured_Post_Click', { 
            postId: post._id,
            title: post.title 
        });
        wixLocation.to(`/blog/${post.slug || post._id}`);
    });
}

/**
 * Update pagination controls
 */
function updatePagination(totalPages) {
    // Update page indicator
    $w('#pageIndicator').text = `Page ${currentPage} of ${totalPages}`;
    
    // Enable/disable prev button
    if (currentPage <= 1) {
        $w('#prevPageBtn').disable();
    } else {
        $w('#prevPageBtn').enable();
    }
    
    // Enable/disable next button
    if (currentPage >= totalPages) {
        $w('#nextPageBtn').disable();
    } else {
        $w('#nextPageBtn').enable();
    }
    
    // Show/hide pagination
    if (totalPages <= 1) {
        $w('#pagination').hide();
    } else {
        $w('#pagination').show();
    }
}

/**
 * Update URL with current filters
 */
function updateUrl() {
    const params = [];
    
    if (currentCategory && currentCategory !== 'all') {
        params.push(`category=${currentCategory}`);
    }
    if (searchQuery) {
        params.push(`search=${encodeURIComponent(searchQuery)}`);
    }
    if (currentPage > 1) {
        params.push(`page=${currentPage}`);
    }
    
    const queryString = params.length > 0 ? `?${params.join('&')}` : '';
    wixLocation.to(`/blog${queryString}`);
}

/**
 * Scroll to top of page
 */
function scrollToTop() {
    $w('#blogHeader').scrollTo();
}

/**
 * Strip HTML tags from content
 */
function stripHtml(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
}

/**
 * Set page SEO
 */
function setPageSEO() {
    import('wix-seo').then((wixSEO) => {
        let title = 'Bail Bonds Blog | Tips, News & Guides | Shamrock Bail Bonds';
        let description = 'Expert bail bond advice, Florida law updates, and county guides. Learn about the bail process, your rights, and how to help a loved one in jail.';
        
        if (currentCategory && currentCategory !== 'all') {
            title = `${formatCategoryName(currentCategory)} | Shamrock Bail Bonds Blog`;
        }
        
        if (searchQuery) {
            title = `Search: ${searchQuery} | Shamrock Bail Bonds Blog`;
        }
        
        wixSEO.title = title;
        wixSEO.metaTags = [
            { name: "description", content: description },
            { name: "keywords", content: "bail bonds blog, Florida bail bonds, bail bond tips, jail release guide" }
        ];
    });
}

/**
 * Format category name for display
 */
function formatCategoryName(slug) {
    return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Track events
 */
function trackEvent(eventName, eventData) {
    import('wix-window').then((wixWindow) => {
        wixWindow.trackEvent(eventName, eventData);
    });
}

export { loadBlogPosts, displayPosts, loadCategories };
