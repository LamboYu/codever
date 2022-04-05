import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from 'environments/environment';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { UserData } from './model/user-data';
import { Snippet } from './model/snippet';
import { shareReplay } from 'rxjs/operators';
import { RateSnippetRequest } from './model/rate-snippet.request';
import { UsedTags } from './model/used-tag';
import { UserDataProfile } from './model/user-data-profile';
import { HttpClientLocalStorageService, HttpOptions } from './cache/http-client-local-storage.service';
import { localStorageKeys } from './model/localstorage.cache-keys';

@Injectable()
export class UserDataService {

  private usersApiBaseUrl = '';  // URL to web api
  private headers = new HttpHeaders({'Content-Type': 'application/json'});

  constructor(private httpClient: HttpClient,
              private httpClientLocalStorageService: HttpClientLocalStorageService) {
    this.usersApiBaseUrl = environment.API_URL + '/personal/users';
  }

  createInitialUserData(userData: UserData): Observable<UserData> {
    return this.httpClient
      .post(`${this.usersApiBaseUrl}/${userData.userId}`, JSON.stringify(userData), {headers: this.headers})
      .pipe(shareReplay(1));
  }

  updateUserData(userData: UserData): Observable<UserData> {
    return this.httpClient
      .put(`${this.usersApiBaseUrl}/${userData.userId}`, JSON.stringify(userData), {headers: this.headers})
      .pipe(shareReplay(1));
  }

  updateUserDataHistory(userId: string, history: string[]): Observable<UserData> {
    return this.httpClient
      .patch(`${this.usersApiBaseUrl}/${userId}/history`, JSON.stringify(history), {headers: this.headers})
      .pipe(shareReplay(1));
  }

  updateUserDataPinned(userId: string, pinned: string[]): Observable<UserData> {
    return this.httpClient
      .patch(`${this.usersApiBaseUrl}/${userId}/pinned`, {pinnedSnippetIds: pinned}, {headers: this.headers})
      .pipe(shareReplay(1));
  }

  updateUserDataReadLater(userId: string, readLater: string[]): Observable<UserData> {
    return this.httpClient
      .patch(`${this.usersApiBaseUrl}/${userId}/read-later`, {readLaterSnippetIds: readLater}, {headers: this.headers})
      .pipe(shareReplay(1));
  }

  updateFeedToggleOption(userId: string, showAllPublicInFeed: boolean): Observable<UserData> {
    return this.httpClient
      .patch(`${this.usersApiBaseUrl}/${userId}/feed-toggle`, {showAllPublicInFeed: showAllPublicInFeed}, {headers: this.headers})
      .pipe(shareReplay(1));
  }

  updateLocalStorageOption(userId: string, enableLocalStorage: boolean): Observable<UserData> {
    return this.httpClient
      .patch(`${this.usersApiBaseUrl}/${userId}/local-storage`, {enableLocalStorage: enableLocalStorage}, {headers: this.headers})
      .pipe(shareReplay(1));
  }

  updateUserDataHistoryReadLaterPinned(userId: string, history: string[], readLater: string[], pinned: string[]): Observable<UserData> {
    const request = {
      history: history,
      readLater: readLater,
      pinned: pinned
    }
    return this.httpClient
      .patch(`${this.usersApiBaseUrl}/${userId}/history-readlater-pinned`, request, {headers: this.headers})
      .pipe(shareReplay(1));
  }

  getUserData(userId: string): Observable<UserData> {
    return this.httpClient
      .get<UserData>(`${this.usersApiBaseUrl}/${userId}`)
      .pipe(shareReplay(1));
  }

  uploadProfileImage(userId: String, image: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', image);

    return this.httpClient.post(`${this.usersApiBaseUrl}/${userId}/profile-picture`, formData);
  }

  uploadSnippets(userId: String, snippets: File, userDisplayName: string): Observable<any> {
    const formData = new FormData();
    formData.append('snippets', snippets);
    formData.append('userDisplayName', userDisplayName);

    return this.httpClient.post(`${this.usersApiBaseUrl}/${userId}/snippets/upload`, formData);
  }

  getReadLater(userId: string, page: number, limit: number): Observable<Snippet[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.httpClient
      .get<Snippet[]>(`${this.usersApiBaseUrl}/${userId}/read-later`, {params: params})
      .pipe(shareReplay(1));
  }

  getLikedSnippets(userId: string): Observable<Snippet[]> {
    return this.httpClient
      .get<Snippet[]>(`${this.usersApiBaseUrl}/${userId}/likes`)
      .pipe(shareReplay(1));
  }

  getPinnedSnippets(userId: string, page: number, limit: number): Observable<Snippet[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.httpClient
      .get<Snippet[]>(`${this.usersApiBaseUrl}/${userId}/pinned`, {params: params})
      .pipe(shareReplay(1));
  }

  /**
   * Deprecated - "favorites" has been temporarily deactivated till complete removal or reactivation
   */
  getFavoriteSnippets(userId: string, page: number, limit: number): Observable<Snippet[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.httpClient
      .get<Snippet[]>(`${this.usersApiBaseUrl}/${userId}/favorites`, {params: params})
      .pipe(shareReplay(1));
  }

  getFeedSnippets(userId: string, page: number, limit: number): Observable<Snippet[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.httpClient
      .get<Snippet[]>(`${this.usersApiBaseUrl}/${userId}/feed`, {params: params})
      .pipe(shareReplay(1));
  }

  getHistory$(userId: string, page: number, limit: number): Observable<Snippet[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.httpClient
      .get<Snippet[]>(`${this.usersApiBaseUrl}/${userId}/history`, {params: params})
      .pipe(shareReplay(1));
  }

  getAllHistory$(userId: string): Observable<Snippet[]> {
    const options: HttpOptions = {
      url: `${this.usersApiBaseUrl}/${userId}/history`,
      key: localStorageKeys.userHistorySnippets,
      cacheHours: 24,
      isSensitive: true
    }; // cache it for a day

    return this.httpClientLocalStorageService
      .get<Snippet[]>(options)
      .pipe(shareReplay(1));
  }


  getUsedTags(userId: string): Observable<UsedTags> {
    return this.httpClient
      .get<UsedTags>(`${this.usersApiBaseUrl}/${userId}/used-tags`)
      .pipe(shareReplay(1));
  }


  rateSnippet(rateSnippetRequest: RateSnippetRequest): Observable<any> {
    return this.httpClient
      .patch(`${this.usersApiBaseUrl}/${rateSnippetRequest.ratingUserId}/snippets/likes/${rateSnippetRequest.snippet._id}`,
        JSON.stringify(rateSnippetRequest),
        {headers: this.headers})
      .pipe(shareReplay(1));
  }

  followUser(userId: string, followedUserId: string): Observable<UserData> {
    return this.httpClient
      .patch<UserData>(`${this.usersApiBaseUrl}/${userId}/following/users/${followedUserId}`, {})
      .pipe(shareReplay(1));
  }

  unfollowUser(userId: string, followedUserId: string) {
    return this.httpClient
      .patch<UserData>(`${this.usersApiBaseUrl}/${userId}/unfollowing/users/${followedUserId}`, {})
      .pipe(shareReplay(1));
  }

  getFollowedUsers$(userId: string): Observable<UserDataProfile[]> {
    return this.httpClient
      .get<UserDataProfile[]>(`${this.usersApiBaseUrl}/${userId}/following/users`)
      .pipe(shareReplay(1));
  }

  getFollowers$(userId: string): Observable<UserDataProfile[]> {
    return this.httpClient
      .get<UserDataProfile[]>(`${this.usersApiBaseUrl}/${userId}/followers`)
      .pipe(shareReplay(1));
  }

  updateAcknowledgeWelcome(userId: string): Observable<UserData> {
    return this.httpClient
      .patch(`${this.usersApiBaseUrl}/${userId}/welcome-acknowledge`, {}, {headers: this.headers})
      .pipe(shareReplay(1));
  }

}
