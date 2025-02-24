import { Inject, inject, Injectable, InjectionToken } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, catchError, Observable, of, timeout } from 'rxjs';
import { CurrentSearch, SearchResult } from '../models/search.model';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

interface SearchConfig {
  defaultPageSize?: number;
}

export interface ISearchService {
  currentSearch$: BehaviorSubject<CurrentSearch | null>;
  submit(search: CurrentSearch): void;
}

// BONUS: Use DI to update the config of SearchService to update page size
export const SEARCH_CONFIG: InjectionToken<SearchConfig> =
  new InjectionToken<SearchConfig>('SearchConfig');

@Injectable()
export class SearchService implements ISearchService {
  private $http = inject(HttpClient);

  currentSearch$ = new BehaviorSubject<CurrentSearch | null>(null);

  get searchText() {
    return this.currentSearch$.value?.searchText;
  }
  get pageSize() {
    return this.currentSearch$.value?.pageSize;
  }
  get page() {
    return this.currentSearch$.value?.page;
  }

  constructor(
    @Inject(SEARCH_CONFIG) searchConfig: SearchConfig,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this._initFromDefault(searchConfig);
    this._initFromUrl();
  }

  private _initFromDefault(searchConfig: SearchConfig) {
    if (searchConfig.defaultPageSize) {
      this.currentSearch$.next({
        searchText: '',
        pageSize: searchConfig.defaultPageSize,
        page: 1,
      });
    }
  }

  // BONUS: Keep the current search params in the URL that allow users to refresh the page and search again
  private _initFromUrl() {
    this.route.queryParams.subscribe((params) => {
      if (Object.keys(params).length === 0) return;

      const search: CurrentSearch = {
        searchText: params['searchText'] || '',
        pageSize:
          params['pageSize'] ?? this.currentSearch$.value?.pageSize ?? 1,
        page: params['page'] ?? 1,
      };

      this.currentSearch$.next(search);
    });
  }

  submit(search: CurrentSearch) {
    this.currentSearch$.next(search);
    this.router.navigate([], {
      queryParams: search,
    });
  }

  searchBooks(currentSearch: CurrentSearch): Observable<SearchResult> {
    const { searchText, pageSize, page } = currentSearch;

    const searchQuery = searchText.split(' ').join('+').toLowerCase();

    return this.$http
      .get<SearchResult>(
        `https://openlibrary.org/search.json?q=${searchQuery}&page=${page}&limit=${pageSize}`
      )
      .pipe(
        timeout(5000),
        catchError((error: HttpErrorResponse) => {
          console.error('HTTP error: ', error);
          alert(`HTTP error: ${error.message}`);
          return of({
            num_found: 0,
            docs: [],
          });
        })
      );
  }
}
