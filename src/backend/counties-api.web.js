/**
 * Shamrock Bail Bonds - Counties Public API
 * Web module for exposing county data to frontend
 */

import { Permissions, webMethod } from 'wix-web-module';
import { getAllCounties, getFeaturedCounties, getCountyBySlug, searchCounties, getCountyStats } from 'backend/counties.jsw';

/**
 * Get all counties (public endpoint)
 * @returns {Promise<Object>} Response with counties array
 */
export const get_allCounties = webMethod(Permissions.Anyone, async function () {
  try {
    const counties = await getAllCounties();
    return {
      success: true,
      counties: counties,
      count: counties.length
    };
  } catch (error) {
    console.error('API Error - getAllCounties:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

/**
 * Get featured counties (public endpoint)
 * @returns {Promise<Object>} Response with featured counties array
 */
export const get_featuredCounties = webMethod(Permissions.Anyone, async function () {
  try {
    const counties = await getFeaturedCounties();
    return {
      success: true,
      counties: counties,
      count: counties.length
    };
  } catch (error) {
    console.error('API Error - getFeaturedCounties:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

/**
 * Get county by slug (public endpoint)
 * @param {string} slug - County slug
 * @returns {Promise<Object>} Response with county object
 */
export const get_countyBySlug = webMethod(Permissions.Anyone, async function (slug) {
  try {
    const county = await getCountyBySlug(slug);
    return {
      success: true,
      county: county
    };
  } catch (error) {
    console.error(`API Error - getCountyBySlug(${slug}):`, error);
    return {
      success: false,
      error: error.message
    };
  }
});

/**
 * Search counties (public endpoint)
 * @param {string} searchTerm - Search term
 * @returns {Promise<Object>} Response with matching counties
 */
export const post_searchCounties = webMethod(Permissions.Anyone, async function (searchTerm) {
  try {
    const counties = await searchCounties(searchTerm);
    return {
      success: true,
      counties: counties,
      count: counties.length,
      searchTerm: searchTerm
    };
  } catch (error) {
    console.error('API Error - searchCounties:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

/**
 * Get county statistics (public endpoint)
 * @returns {Promise<Object>} Response with statistics
 */
export const get_countyStats = webMethod(Permissions.Anyone, async function () {
  try {
    const stats = await getCountyStats();
    return {
      success: true,
      stats: stats
    };
  } catch (error) {
    console.error('API Error - getCountyStats:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

