/**
 * Converts a plain object into URLSearchParams.
 * @param {object} data - The object containing key-value pairs.
 * @returns {URLSearchParams}
 */
export const createSearchParams = (data) => {
  const params = new URLSearchParams();

  // Iterate through each entry of the object and append to params
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value);
    }
  });

  return params;
};
