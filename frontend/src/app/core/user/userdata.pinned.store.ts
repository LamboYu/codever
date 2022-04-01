import { BehaviorSubject, Observable } from 'rxjs';

import { Injectable } from '@angular/core';

import { KeycloakService } from 'keycloak-angular';
import { UserData } from '../model/user-data';
import { UserDataService } from '../user-data.service';
import { Snippet } from '../model/snippet';
import { NotifyStoresService } from './notify-stores.service';
import { UserDataStore } from './userdata.store';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserDataPinnedStore {

  private _pinned: BehaviorSubject<Snippet[]> = new BehaviorSubject(null);
  private pinnedSnippetsHaveBeenLoaded = false;

  loadedPage: number;

  constructor(private userService: UserDataService,
              private userDataStore: UserDataStore,
              private keycloakService: KeycloakService,
              private notifyStoresService: NotifyStoresService
  ) {
    this.loadedPage = 1;
    this.notifyStoresService.snippetDeleted$.subscribe((snippet) => {
      this.publishedPinnedAfterDeletion(snippet);
    });
  }


  getPinnedSnippets$(userId: string, page: number): Observable<Snippet[]> {
    if (this.loadedPage !== page || !this.pinnedSnippetsHaveBeenLoaded) {
      this.userService.getPinnedSnippets(userId, page, environment.PAGINATION_PAGE_SIZE).subscribe(data => {
        if (!this.pinnedSnippetsHaveBeenLoaded) {
          this.pinnedSnippetsHaveBeenLoaded = true;
        }
        this.pinnedSnippetsHaveBeenLoaded = true;
        this.loadedPage = page;
        this._pinned.next(data);
      });
    }
    return this._pinned.asObservable();
  }

  addToPinnedSnippets(snippet: Snippet) {
    this.userDataStore.addToUserDataPinned$(snippet).subscribe(() => {
      if (this.pinnedSnippetsHaveBeenLoaded) {
        const pinnedSnippets: Snippet[] = this._pinned.getValue();
        pinnedSnippets.unshift(snippet);

        this._pinned.next(pinnedSnippets); // insert at the top (index 0)
      }
    });
  }

  removeFromPinnedSnippets(snippet: Snippet) {
    this.userDataStore.removeFromUserDataPinned$(snippet).subscribe(() => {
      this.publishedPinnedAfterDeletion(snippet);
    });
  }

  private publishedPinnedAfterDeletion(snippet: Snippet) {
    if (this.pinnedSnippetsHaveBeenLoaded) {
      const pinnedSnippets: Snippet[] = this._pinned.getValue();
      const index = pinnedSnippets.findIndex((pinnedSnippet) => snippet._id === pinnedSnippet._id);
      if (index !== -1) {
        pinnedSnippets.splice(index, 1);
        this._pinned.next(pinnedSnippets);
      }
    }
  }

  public publishPinnedAfterCreation(snippet: Snippet) {
    if (this.pinnedSnippetsHaveBeenLoaded) {
      const pinned: Snippet[] = this._pinned.getValue();
      pinned.unshift(snippet);
      this._pinned.next(pinned); // insert at the top (index 0)
    }
  }

}

