/**
 * Shamrock Bail Bonds - Counties Backend Module
 * Handles all county data queries and operations
 */

import wixData from 'wix-data';

/**
 * Get all counties
 * @returns {Promise<Array>} Array of all county objects
 */
export async function getAllCounties() {
  try {
    const results = await wixData.query('FloridaCounties')
      .ascending('countyName')
      .find();
    
    return results.items;
  } catch (error) {
    console.error('Error fetching all counties:', error);
    throw error;
  }
}

/**
 * Get featured counties for homepage display
 * @returns {Promise<Array>} Array of featured county objects
 */
export async function getFeaturedCounties() {
  try {
    const results = await wixData.query('FloridaCounties')
      .eq('featured', true)
      .ascending('countyName')
      .find();
    
    return results.items;
  } catch (error) {
    console.error('Error fetching featured counties:', error);
    throw error;
  }
}

/**
 * Get a single county by slug
 * @param {string} slug - County slug (e.g., "lee-county")
 * @returns {Promise<Object>} County object
 */
export async function getCountyBySlug(slug) {
  try {
    const results = await wixData.query('FloridaCounties')
      .eq('countySlug', slug)
      .find();
    
    if (results.items.length === 0) {
      throw new Error(`County not found: ${slug}`);
    }
    
    return results.items[0];
  } catch (error) {
    console.error(`Error fetching county ${slug}:`, error);
    throw error;
  }
}

/**
 * Search counties by name
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>} Array of matching county objects
 */
export async function searchCounties(searchTerm) {
  try {
    const results = await wixData.query('FloridaCounties')
      .contains('countyName', searchTerm)
      .ascending('countyName')
      .find();
    
    return results.items;
  } catch (error) {
    console.error('Error searching counties:', error);
    throw error;
  }
}

/**
 * Get county statistics
 * @returns {Promise<Object>} Statistics object
 */
export async function getCountyStats() {
  try {
    const allCounties = await wixData.query('FloridaCounties').find();
    const featuredCounties = await wixData.query('FloridaCounties')
      .eq('featured', true)
      .find();
    
    return {
      total: allCounties.totalCount,
      featured: featuredCounties.totalCount,
      active: allCounties.items.filter(c => c.active).length
    };
  } catch (error) {
    console.error('Error fetching county stats:', error);
    throw error;
  }
}
