// frontend/js/podFetcher.js

/**
 * Fetch podcast data from the JSON file.
 * @returns {Promise<Array>} A promise that resolves to an array of podcast objects.
 */
export async function fetchPodcastData() {
  try {
    const response = await fetch('../backend/data/podcasts.json');

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error('Invalid podcast data format: Expected an array.');
    }

    return data;
  } catch (error) {
    console.error('Error fetching podcast data:', error);
    return []; // Return an empty array so UI can handle gracefully
  }
}
