import { BehaviorSubject, Observable } from 'rxjs';

import { Injectable } from '@angular/core';
import { UserDataService } from '../user-data.service';
import { Snippet } from '../model/snippet';
import { UserInfoStore } from './user-info.store';
import { NotifyStoresService } from './notify-stores.service';
import { environment } from '../../../environments/environment';
import { LocalStorageSaveOptions, LocalStorageService } from '../cache/local-storage.service';
import { localStorageKeys } from '../model/localstorage.cache-keys';

@Injectable({
  providedIn: 'root'
})
export class UserDataHistoryStore {

  private _history: BehaviorSubject<Snippet[]> = new BehaviorSubject(null);
  private historyHasBeenLoaded = false;

  loadedPage: number;

  constructor(private userService: UserDataService,
              private userInfoStore: UserInfoStore,
              private notifyStoresService: NotifyStoresService,
              private  localStorageService: LocalStorageService
  ) {
    this.loadedPage = 1;
    this.notifyStoresService.snippetDeleted$.subscribe((snippet) => {
      this.deleteFromHistoryStore(snippet);
    });
  }


  getHistory$(userId: string, page: number): Observable<Snippet[]> {
    if (this.loadedPage !== page || !this.historyHasBeenLoaded) {
      if (!this.historyHasBeenLoaded) {
        this.historyHasBeenLoaded = true;
      }
      this.userService.getHistory$(userId, page, environment.PAGINATION_PAGE_SIZE).subscribe(data => {
        this.historyHasBeenLoaded = true;
        this.loadedPage = page;
        this._history.next(data);
      });
    }

    return this._history.asObservable();
  }

  getAllHistory$(userId: string): Observable<Snippet[]> {
    return this.userService.getAllHistory$(userId);
  }

  public updateHistoryStoreBulk(snippets: Snippet[]) {
    for (const snippet of snippets) {
      this.updateHistoryStore(snippet);
    }
  }

  public updateHistoryStore(snippet: Snippet) {
    if (this.historyHasBeenLoaded) {
      let lastVisitedSnippets: Snippet[] = this._history.getValue();
      lastVisitedSnippets = lastVisitedSnippets.filter(item => item._id !== snippet._id);
      lastVisitedSnippets.unshift(snippet);

      this._history.next(lastVisitedSnippets);
    }
    this.updateEntryLocalStorage(snippet);
  }

  private updateEntryLocalStorage(snippet: Snippet) {
    let snippets = this.localStorageService.load(localStorageKeys.userHistorySnippets);
    if (snippets) {
      snippets = snippets.filter(item => item._id !== snippet._id);
      snippets.unshift(snippet);

      const options: LocalStorageSaveOptions = {
        key: localStorageKeys.userHistorySnippets,
        data: snippets.slice(0, 100), // in "backend" are max 50 stored
        expirationHours: 24
      };
      this.localStorageService.save(options);
    }

  }

  public deleteFromHistoryStore(snippet: Snippet) {
    if (this.historyHasBeenLoaded) {
      const lastVisitedSnippets: Snippet[] = this._history.getValue();
      const indexHistory = lastVisitedSnippets.findIndex((lastVisitedSnippet) => snippet._id === lastVisitedSnippet._id);
      if (indexHistory !== -1) {
        lastVisitedSnippets.splice(indexHistory, 1);
        this._history.next(lastVisitedSnippets);
      }
    }

    this.deleteEntryFromLocalStorage(snippet);
  }

  private deleteEntryFromLocalStorage(snippet: Snippet) {
    const snippets = this.localStorageService.load(localStorageKeys.userHistorySnippets);
    if (snippets) {
      const indexHistory = snippets.findIndex((lastVisitedSnippet) => snippet._id === lastVisitedSnippet._id);
      if (indexHistory !== -1) {
        snippets.splice(indexHistory, 1);
        const options: LocalStorageSaveOptions = {
          key: localStorageKeys.userHistorySnippets,
          data: snippets,
          expirationHours: 24
        };
        this.localStorageService.save(options);
      }
    }

  }
}

