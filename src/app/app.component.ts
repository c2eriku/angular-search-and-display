import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  Observable,
  switchMap,
} from 'rxjs';
import {
  SEARCH_CONFIG,
  SearchService,
} from './services/search.service';
import { CurrentSearch, SearchResult } from './models/search.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatPaginatorModule,
    ReactiveFormsModule,
  ],
  // BONUS: Use DI to update the config of SearchService to update page size
  providers: [
    SearchService,
    {
      provide: SEARCH_CONFIG,
      useValue: {
        defaultPageSize: 25,
      },
    },
  ],
})
export class AppComponent {
  // TODO: Create a SearchService and use DI to inject it
  // Check app/services/search.service.ts for the implementation
  public $search = inject(SearchService);
  readonly searchText = new FormControl<string>('', {
    validators: [Validators.required],
    nonNullable: true,
  });

  constructor() {
    this.$search.currentSearch$.subscribe((value) =>
      this.searchText.patchValue(value?.searchText ?? '', { emitEvent: false })
    );
  }

  // TODO: Implement this observable to call the searchBooks() function
  // Hint: Use RxJS operators to solve these issues
  searchResults$: Observable<SearchResult> = this.$search.currentSearch$.pipe(
    debounceTime(300),
    distinctUntilChanged(
      (prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)
    ),
    filter(
      (search): search is CurrentSearch =>
        !!search && search.searchText.trim() !== ''
    ),
    // tap((search) => console.log('啟動search', search)),
    switchMap((currentSearch) => this.$search.searchBooks(currentSearch))
    // tap((results) => console.log('search結果:', results)),
    // shareReplay(1)
  );

  onSearchClick() {
    if (this.searchText.invalid) return alert('Search text cannot be empty.');
    this.$search.submit({
      searchText: this.searchText.value ?? '',
      pageSize: this.$search.currentSearch$.value?.pageSize ?? 10,
      page: 1,
    });
  }

  onPageChange(event: PageEvent) {
    const newSearch: CurrentSearch = {
      searchText: this.$search.searchText ?? '',
      pageSize: event.pageSize,
      page: event.pageIndex + 1,
    };

    this.$search.submit(newSearch);
  }
}
