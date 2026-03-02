// frontend/js/podFetcher.js

/**
 * Fetch podcast data from the Flask backend API.
 * @returns {Promise<Array>} A promise that resolves to an array of podcast objects.
 */
export async function fetchPodcastData() {
  try {
    const response = await fetch('/api/podcasts');

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();

    // data is an object with shape { page, per_page, total, podcasts }
    if (!Array.isArray(data.podcasts)) {
      throw new Error('Invalid podcast data format: Expected "podcasts" array.');
    }

    return data.podcasts;
  } catch (error) {
    console.error('Error fetching podcast data:', error);
    return []; // Return an empty array so UI can handle gracefully
  }
}


