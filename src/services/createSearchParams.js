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

//const params = new URLSearchParams();
//params.append("grant_type", "authorization_code");
//params.append("client_id", "8907271086207187");
//params.append("client_secret", "n818QhN704atDs2TP4Qn4wRioNsIaMjf");
//params.append("code", code);
// params.append("redirect_uri", "https://github.com/martinezrafael");
