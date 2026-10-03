import { useRouterState } from "@tanstack/react-router";

import { isAdminPath } from "@/lib/errors";

const TABLE_TEXT = {
  pt: {
    pagination: "Paginação",
    morePages: "Mais páginas",
    rowsPerPage: "Linhas por página",
    firstPage: "Primeira página",
    previousPage: "Página anterior",
    previous: "Anterior",
    nextPage: "Próxima página",
    next: "Próxima",
    lastPage: "Última página",
    pageOf: (page: number, total: number) => `Página ${page} de ${total}`,
    search: "Buscar...",
    noResults: "Nenhum resultado encontrado.",
    clearFilters: "Limpar filtros",
    toggleColumns: "Alternar colunas",
    view: "Exibir",
  },
  en: {
    pagination: "Pagination",
    morePages: "More pages",
    rowsPerPage: "Rows per page",
    firstPage: "First page",
    previousPage: "Previous page",
    previous: "Previous",
    nextPage: "Next page",
    next: "Next",
    lastPage: "Last page",
    pageOf: (page: number, total: number) => `Page ${page} of ${total}`,
    search: "Search...",
    noResults: "No results found.",
    clearFilters: "Clear filters",
    toggleColumns: "Toggle columns",
    view: "View",
  },
};

/** Shared table controls follow the page's language: English in the dashboard, Portuguese elsewhere. */
export function useTableText() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return TABLE_TEXT[isAdminPath(pathname) ? "en" : "pt"];
}
