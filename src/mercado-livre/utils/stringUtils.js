export const gerarSlug = (texto) => {
  return texto
    .toString()
    .normalize("NFD") // Remove acentos
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/%/g, "") // Remove o símbolo de porcentagem especificamente
    .replace(/[^a-z0-9\s-]/g, "") // Remove qualquer coisa que não seja letra, número ou espaço
    .replace(/\s+/g, "-") // Substitui espaços por hífens
    .replace(/-+/g, "-"); // Remove hífens duplicados
};
