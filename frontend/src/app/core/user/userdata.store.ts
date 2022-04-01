import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';

import { Injectable } from '@angular/core';
import { Logger } from '../logger.service';
import { ErrorService } from '../error/error.service';
import { Following, Profile, Search, UserData } from '../model/user-data';
import { UserDataService } from '../user-data.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Snippet } from '../model/snippet';
import { UserInfoService } from './user-info.service';
import { UserInfoStore } from './user-info.store';
import { RateSnippetRequest, RatingActionType } from '../model/rate-snippet.request';
import { NotifyStoresService } from './notify-stores.service';
import { Md5 } from 'ts-md5/dist/md5';
import { UserDataHistoryStore } from './userdata.history.store';
import { PersonalSnippetsService } from '../personal-snippets.service';
import { environment } from '../../../environments/environment';
import { LocalStorageService } from '../cache/local-storage.service';
import { localStorageKeys } from '../model/localstorage.cache-keys';

@Injectable({
  providedIn: 'root'
})
export class UserDataStore {

  private _userData: ReplaySubject<UserData> = new ReplaySubject(1);

  private _stars: BehaviorSubject<Snippet[]> = new BehaviorSubject(null);
  private starredSnippetsHaveBeenLoaded = false;

  private userId: string;
  private userFirstName: string;

  // userData is initialized here to avoid some nasty undefined exceptions before the actual data is loaded
  userData: UserData = {profile: {displayName: 'changeMe'}, searches: [], recentSearches: []};

  constructor(private userService: UserDataService,
              private logger: Logger,
              private errorService: ErrorService,
              private userInfoService: UserInfoService,
              private userInfoStore: UserInfoStore,
              private notifyStoresService: NotifyStoresService,
              private userDataHistoryStore: UserDataHistoryStore,
              private personalSnippetsService: PersonalSnippetsService,
              private localStorageService: LocalStorageService
  ) {
  }

  public loadInitialUserData(userId: string, userFirstName: string, email: string) {
    this.userId = userId;
    this.userFirstName = userFirstName;
    this.userService.getUserData(userId).subscribe(data => {
        this.userData = data;
        this.userData.searches = this.userData.searches.sort((a, b) => {
          const result: number = a.lastAccessedAt == null ? (b.lastAccessedAt == null ? 0 : 1)
            : b.lastAccessedAt == null ? -1 : a.lastAccessedAt < b.lastAccessedAt ? 1 : a.lastAccessedAt > b.lastAccessedAt ? -1 : 0;
          return result;
        });
        if (this.userData.enableLocalStorage) {
          this.localStorageService.save({key: localStorageKeys.userLocalStorageConsent, data: true});
        }
        this._userData.next(this.userData);
      },
      (errorResponse: HttpErrorResponse) => {
        const userDataNotCreated = errorResponse.status === 404 && errorResponse.error.message === `User data NOT_FOUND for userId: ${this.userId}`;
        if (userDataNotCreated) {
          this.createInitialUserData(email, userId);
        }
      }
    );
  }

  private createInitialUserData(email: string, userId: string) {
    const profile: Profile = {
      displayName: this.userFirstName,
      imageUrl: this.getGravatarImageUrl(email),
    }
    const following: Following = {
      users: [],
      tags: []
    }
    const initialUserData: UserData = {
      userId: userId,
      profile: profile,
      searches: [],
      recentSearches: [],
      readLater: [],
      likes: [],
      watchedTags: [],
      ignoredTags: [],
      pinned: [],
      favorites: [],
      history: [],
      followers: [],
      following: following,
      welcomeAck: false
    }

    this.userService.createInitialUserData(initialUserData).subscribe((data) => {
        this.userData = data;
        this._userData.next(data);
      }
    );
  }

  private getGravatarImageUrl(email: string): string {
    const md5 = new Md5();
    md5.appendStr(email);
    const response = `https://gravatar.com/avatar/${md5.end()}?s=340`;

    return response;
  }

  getUserData$(): Observable<UserData> {
    return this._userData.asObservable();
  }

  updateUserData$(userData: UserData): Observable<UserData> {
    const obs: Observable<UserData> = this.userService.updateUserData(userData);

    obs.subscribe(
      data => {
        this._userData.next(data);
      }
    );

    return obs;
  }

  updateHistoryReadLaterAndPinned$(snippet: Snippet, readLater: boolean, pinned: boolean): Observable<UserData> {
    // history
    this.placeOnTopOfUserHistoryIds(snippet._id);

    let readLaterList = [];
    if (readLater) {
      this.userData.readLater.push(snippet._id);
      readLaterList = this.userData.readLater;
    }

    let pinnedList = [];
    if (pinned) {
      this.userData.pinned.unshift(snippet._id);
      pinnedList = this.userData.pinned;
    }

    const obs: Observable<any> = this.userService.updateUserDataHistoryReadLaterPinned(this.userId, this.userData.history, readLaterList, pinnedList);
    obs.subscribe(
      () => {
        this._userData.next(this.userData);
      }
    );

    return obs;
  }

  updateUserDataHistory$(snippet: Snippet): Observable<UserData> {
    // history
    this.placeOnTopOfUserHistoryIds(snippet._id);

    const obs: Observable<any> = this.userService.updateUserDataHistory(this.userId, this.userData.history);
    obs.subscribe(
      () => {
        this.userDataHistoryStore.updateHistoryStore(snippet);
        if (this.userId === snippet.userId) {
          this.personalSnippetsService.increaseOwnerVisitCount(snippet).subscribe();
        }
        this._userData.next(this.userData);
      }
    );

    return obs;
  }

  public updateUserDataHistoryBulk$(snippets: Snippet[]): Observable<UserData> {
    for (let i = snippets.length - 1; i >= 0; i--) {
      this.placeOnTopOfUserHistoryIds(snippets[i]._id);
    }


    const obs: Observable<any> = this.userService.updateUserDataHistory(this.userId, this.userData.history);
    obs.subscribe(
      () => {
        this.userDataHistoryStore.updateHistoryStoreBulk(snippets);

        this._userData.next(this.userData);
      }
    );

    return obs;
  }

  private placeOnTopOfUserHistoryIds(snippetId: string) {
    const index = this.userData.history.indexOf(snippetId);
    if (index !== -1) {
      this.userData.history.splice(index, 1);
    }
    this.userData.history.unshift(snippetId);
  }

  addToUserDataPinned$(snippet: Snippet): Observable<UserData> {
    this.userData.pinned.unshift(snippet._id);
    const obs: Observable<any> = this.userService.updateUserDataPinned(this.userId, this.userData.pinned);
    obs.subscribe(
      () => {
        this._userData.next(this.userData);
      }
    );

    return obs;
  }

  updateFeedToggleOption$(showAllPublicInFeed: boolean): Observable<UserData> {
    this.userData.showAllPublicInFeed = showAllPublicInFeed;
    const obs: Observable<any> = this.userService.updateFeedToggleOption(this.userId, showAllPublicInFeed);
    obs.subscribe(
      () => {
        this._userData.next(this.userData);
      }
    );

    return obs;
  }

  updateLocalStorageOption$(enableLocalStorage: boolean): Observable<UserData> {
    this.userData.enableLocalStorage = enableLocalStorage;
    const obs: Observable<any> = this.userService.updateLocalStorageOption(this.userId, enableLocalStorage);
    obs.subscribe(
      () => {
        this._userData.next(this.userData);
      }
    );

    return obs;
  }

  removeFromUserDataPinned$(snippet: Snippet): Observable<UserData> {
    this.userData.pinned = this.userData.pinned.filter(x => x !== snippet._id);
    const obs: Observable<any> = this.userService.updateUserDataPinned(this.userId, this.userData.pinned);
    obs.subscribe(
      () => {
        this._userData.next(this.userData);
      }
    );

    return obs;
  }

  addToUserReadLater$(snippet: Snippet): Observable<UserData> {
    this.userData.readLater.push(snippet._id);
    const obs: Observable<any> = this.userService.updateUserDataReadLater(this.userId, this.userData.readLater);
    obs.subscribe(
      () => {
        this._userData.next(this.userData);
      }
    );

    return obs;
  }

  removeFromUserDataReadLater$(snippet: Snippet): Observable<UserData> {
    this.userData.readLater = this.userData.readLater.filter(x => x !== snippet._id);
    const obs: Observable<any> = this.userService.updateUserDataReadLater(this.userId, this.userData.readLater);
    obs.subscribe(
      () => {
        this._userData.next(this.userData);
      }
    );

    return obs;
  }

  getLikedSnippets$(): Observable<Snippet[]> {
    if (!this.starredSnippetsHaveBeenLoaded) {
      this.userService.getLikedSnippets(this.userId).subscribe(data => {
        this.starredSnippetsHaveBeenLoaded = true;
        this._stars.next(data);
      });
    }
    return this._stars.asObservable();
  }

  addToLikedSnippets(snippet: Snippet) {
    this.userData.likes.unshift(snippet._id);
    this.updateUserData$(this.userData).subscribe(() => {
      if (this.starredSnippetsHaveBeenLoaded) {
        const starredSnippets: Snippet[] = this._stars.getValue();
        starredSnippets.unshift(snippet);
        this._stars.next(starredSnippets);
      }
    });
  }

  removeFromLikedSnippets(snippet: Snippet) {
    this.userData.likes = this.userData.likes.filter(x => x !== snippet._id);
    this.updateUserData$(this.userData).subscribe(() => {
      this.publishStarredSnippetsAfterDeletion(snippet);
    });

  }

  private publishStarredSnippetsAfterDeletion(snippet: Snippet) {
    if (this.starredSnippetsHaveBeenLoaded) {
      if (this.starredSnippetsHaveBeenLoaded) {
        const starredSnippets: Snippet[] = this._stars.getValue();
        const index = starredSnippets.findIndex((starredSnippet) => snippet._id === starredSnippet._id);
        if (index !== -1) {
          starredSnippets.splice(index, 1);
          this._stars.next(starredSnippets);
        }
      }
    }
  }

  removeFromStoresAtDeletion(snippet: Snippet) {
    this.userData.history = this.userData.history.filter(x => x !== snippet._id);
    this.userData.pinned = this.userData.pinned.filter(x => x !== snippet._id);
    this.userData.favorites = this.userData.favorites.filter(x => x !== snippet._id);
    this.userData.readLater = this.userData.readLater.filter(x => x !== snippet._id);
    this.userData.likes = this.userData.likes.filter(x => x !== snippet._id);
    this.updateUserData$(this.userData).subscribe(() => {
      this.notifyStoresService.deleteSnippet(snippet);
    });

  }

  likeSnippet(snippet: Snippet) {
    snippet.likeCount++;
    const rateSnippetRequest: RateSnippetRequest = {
      ratingUserId: this.userId,
      action: RatingActionType.LIKE,
      snippet: snippet
    }
    this.rateSnippet(rateSnippetRequest);
  }

  unLikeSnippet(snippet: Snippet) {
    snippet.likeCount--;

    const rateSnippetRequest: RateSnippetRequest = {
      ratingUserId: this.userId,
      action: RatingActionType.UNLIKE,
      snippet: snippet
    }

    this.rateSnippet(rateSnippetRequest);
  }

  private rateSnippet(rateSnippetRequest: RateSnippetRequest) {
    this.userService.rateSnippet(rateSnippetRequest).subscribe(() => {
      if (rateSnippetRequest.action === RatingActionType.LIKE) {
        this.addToLikedSnippets(rateSnippetRequest.snippet);
      } else {
        this.removeFromLikedSnippets(rateSnippetRequest.snippet);
      }
    });
  }

  resetUserDataStore() {
    this._userData.next(null);
  }

  followUser$(followedUserId: string): Observable<UserData> {
    const obs: Observable<UserData> = this.userService.followUser(this.userId, followedUserId);

    obs.subscribe((userData) => {
      this._userData.next(userData);
    });

    return obs;
  }

  unfollowUser$(followedUserId: string): Observable<UserData> {
    const obs: Observable<UserData> = this.userService.unfollowUser(this.userId, followedUserId);
    obs.subscribe((userData) => {
      this._userData.next(userData);
    });

    return obs;
  }

  saveRecentSearch(searchText: string, searchDomain: any) {
    if (this.userId !== undefined) {
      const now = new Date();
      const newSearch: Search = {
        text: searchText,
        createdAt: now,
        saved: false,
        lastAccessedAt: now,
        searchDomain: searchDomain,
        count: 1
      }
      const emptyUserData = Object.keys(this.userData).length === 0 && this.userData.constructor === Object;
      if (emptyUserData) {
        this.userData = {
          userId: this.userId,
          recentSearches: [newSearch]
        }
      } else {
        const existingSearchIndex = this.userData.searches.findIndex(
          element => element.searchDomain === searchDomain && element.text.trim().toLowerCase() === searchText.trim().toLowerCase());

        if (existingSearchIndex !== -1) {
          const existingSearch = this.userData.searches.splice(existingSearchIndex, 1)[0];
          existingSearch.lastAccessedAt = now;
          existingSearch.count++;
          this.userData.searches.unshift(existingSearch);
        } else {
          const notSavedSearchesProDomainCount = this.userData.searches.reduce((total, element) => (!element.saved && element.searchDomain === searchDomain ? total + 1 : total), 0);
          if (notSavedSearchesProDomainCount > environment.SAVED_RECENT_SEARCH_PRO_DOMAIN_SIZE) {
            this.removeLastSearchNotSavedAndFromDomain(searchDomain);
          }
          this.userData.searches.unshift(newSearch);
        }
      }
      this.updateUserData$(this.userData);
    }
  }

  private removeLastSearchNotSavedAndFromDomain(searchDomain: any) {
    for (let i = this.userData.searches.length - 1; i > 0; i--) {
      const isNotSavedAndFromSearchDomain = this.userData.searches[i].saved === false
        && this.userData.searches[i].searchDomain === searchDomain;
      if (isNotSavedAndFromSearchDomain) {
        this.userData.searches.splice(i, 1);
        break;
      }
    }
  }


  updateWelcomeAcknowledge$(): Observable<UserData> {
    const obs: Observable<any> = this.userService.updateAcknowledgeWelcome(this.userId);
    obs.subscribe(
      () => {
        this.userData.welcomeAck = true;
        this._userData.next(this.userData);
      }
    );

    return obs;
  }

}
