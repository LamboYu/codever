import { BehaviorSubject, Observable } from 'rxjs';

import { Injectable } from '@angular/core';

import { KeycloakService } from 'keycloak-angular';
import { UserData } from '../model/user-data';
import { UserDataService } from '../user-data.service';
import { Snippet } from '../model/snippet';
import { UserInfoStore } from './user-info.store';
import { NotifyStoresService } from './notify-stores.service';
import { UserDataStore } from './userdata.store';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
/*
 * Not in use anymore - in case community decides to reactivate favorites will be needed, till then temporary deprecated
 */
export class UserDataFavoritesStore {

  private _favorites: BehaviorSubject<Snippet[]> = new BehaviorSubject(null);
  private favoriteSnippetsHaveBeenLoaded = false;

  private userId: string;
  private userData: UserData;

  loadedPage: number;

  constructor(private userService: UserDataService,
              private userDataStore: UserDataStore,
              private keycloakService: KeycloakService,
              private userInfoStore: UserInfoStore,
              private notifyStoresService: NotifyStoresService
  ) {
    this.loadedPage = 1;
    this.keycloakService.isLoggedIn().then(isLoggedIn => {
      if (isLoggedIn) {
        this.userInfoStore. getUserInfo$().subscribe(userInfo => {
          this.userId = userInfo.sub;
          this.userDataStore.getUserData$().subscribe(userData => {
            this.userData = userData;
          });
        });
      }
    });
    this.notifyStoresService.snippetDeleted$.subscribe((snippet) => {
      this.publishedFavoritesAfterDeletion(snippet);
    });
  }

  getFavoriteSnippets$(page: number): Observable<Snippet[]> {
    if (this.loadedPage !== page || !this.favoriteSnippetsHaveBeenLoaded) {
      this.userService.getFavoriteSnippets(this.userId, page, environment.PAGINATION_PAGE_SIZE).subscribe(data => {
        if (!this.favoriteSnippetsHaveBeenLoaded) {
          this.favoriteSnippetsHaveBeenLoaded = true;
        }
        this.loadedPage = page;
        this._favorites.next(data);
      });
    }
    return this._favorites.asObservable();
  }

  addToFavoriteSnippets(snippet: Snippet) {
    this.userData.favorites.unshift(snippet._id);
    this.userDataStore.updateUserData$(this.userData).subscribe(() => {
      if (this.favoriteSnippetsHaveBeenLoaded) {
        const favoritesSnippets: Snippet[] = this._favorites.getValue();
        favoritesSnippets.unshift(snippet);

        this._favorites.next(favoritesSnippets); // insert at the top (index 0)
      }
    });
  }

  removeFromFavoriteSnippets(snippet: Snippet) {
    this.userData.favorites = this.userData.favorites.filter(x => x !== snippet._id);
    this.userDataStore.updateUserData$(this.userData).subscribe(() => {
      this.publishedFavoritesAfterDeletion(snippet);
    });
  }

  private publishedFavoritesAfterDeletion(snippet: Snippet) {
    if (this.favoriteSnippetsHaveBeenLoaded) {
      const favoritesSnippets: Snippet[] = this._favorites.getValue();
      const index = favoritesSnippets.findIndex((favoriteSnippet) => snippet._id === favoriteSnippet._id);
      if (index !== -1) {
        favoritesSnippets.splice(index, 1);
        this._favorites.next(favoritesSnippets);
      }
    }
  }

}

