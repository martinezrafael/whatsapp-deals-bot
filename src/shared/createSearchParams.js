/**
 * Converte um objeto simples em uma instância de URLSearchParams.
 * Filtra automaticamente valores nulos ou indefinidos.
 *
 * @function createSearchParams
 * @param {object} data - O objeto contendo os pares de chave e valor para os parâmetros de busca.
 * @returns {URLSearchParams} Uma instância de URLSearchParams pronta para ser usada em URLs ou corpos de requisição.
 */
export const createSearchParams = (data) => {
  const params = new URLSearchParams();

  // Itera sobre cada entrada do objeto e adiciona aos parâmetros
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value);
    }
  });

  return params;
};
