import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Snippet } from '../../../core/model/snippet';
import { PublicSnippetsService } from '../public-snippets.service';
import { environment } from '../../../../environments/environment';

@Injectable()
export class PublicSnippetsStore {

  private _publicSnippets: BehaviorSubject<Snippet[]>;
  loadedPage: number;
  storeHasBeenFilled = false;

  constructor(private publicSnippetsService: PublicSnippetsService) {
    this.loadedPage = 1;
  }

  /**
   * The initial data is loaded either when the home page is requested (directly or via search parameters)
   */
  private loadDataFromBackend(page: number) {
    this.publicSnippetsService.getRecentPublicSnippets(page, environment.PAGINATION_PAGE_SIZE)
      .subscribe(
        Snippets => {
          this._publicSnippets.next(Snippets);
          this.loadedPage = page;
        },
        err => console.log('Error retrieving Snippets')
      );
  }

  getRecentPublicSnippets$(page: number): Observable<Snippet[]> {
    if (this.loadedPage !== page || !this.storeHasBeenFilled) {
      if (!this._publicSnippets) {
        this.storeHasBeenFilled = true;
        this._publicSnippets = new BehaviorSubject([]);
      }
      this.loadDataFromBackend(page);
    }
    return this._publicSnippets.asObservable();
  }

  addSnippetToPublicStore(Snippet: Snippet): void {
    if (this._publicSnippets) {
      const publicSnippets = this._publicSnippets.getValue();
      publicSnippets.unshift(Snippet);

      this._publicSnippets.next(publicSnippets);
    }
  }


  removeSnippetFromPublicStore(deleted: Snippet): void {
    if (this._publicSnippets) {
      const Snippets: Snippet[] = this._publicSnippets.getValue();
      const index = Snippets.findIndex((Snippet) => Snippet._id === deleted._id);
      Snippets.splice(index, 1);

      this._publicSnippets.next(Snippets);
    }
  }

  updateSnippetInPublicStore(updated: Snippet): void {
    if (this._publicSnippets) {
      const Snippets = this._publicSnippets.getValue();
      const index = Snippets.findIndex((Snippet: Snippet) => Snippet._id === updated._id);
      Snippets.splice(index, 1, updated);

      this._publicSnippets.next(Snippets);
    }
  }

}

