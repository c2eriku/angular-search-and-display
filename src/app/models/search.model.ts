export interface CurrentSearch {
  searchText: string;
  pageSize: number;
  page: number;
}


export interface SearchResult {
  num_found: number;
  docs: {
    title: string;
    author_name: string[];
    cover_edition_key: string;
  }[];
}