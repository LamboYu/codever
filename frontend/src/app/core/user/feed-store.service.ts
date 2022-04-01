import { BehaviorSubject, Observable } from 'rxjs';

import { Injectable } from '@angular/core';
import { UserDataService } from '../user-data.service';
import { Snippet } from '../model/snippet';
import { UserInfoStore } from './user-info.store';
import { NotifyStoresService } from './notify-stores.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FeedStore {

  readonly FIRST_PAGE = 1;

  private _feedSnippets: BehaviorSubject<Snippet[]> = new BehaviorSubject(null);
  private feedSnippetsHaveBeenLoaded = false;

  loadedPage: number;

  constructor(private userService: UserDataService,
              private userInfoStore: UserInfoStore,
              private notifyStoresService: NotifyStoresService
  ) {
    this.loadedPage = this.FIRST_PAGE;

    this.notifyStoresService.snippetDeleted$.subscribe((snippet) => {
      this.removeFromFeedSnippets(snippet);
    });
  }

  getFeedSnippets$(userId: string, page: number): Observable<Snippet[]> {
    if (this.loadedPage !== page || !this.feedSnippetsHaveBeenLoaded) {
      if (!this.feedSnippetsHaveBeenLoaded) {
        this.feedSnippetsHaveBeenLoaded = true;
      }
      this.userService.getFeedSnippets(userId, page, environment.PAGINATION_PAGE_SIZE).subscribe(data => {
        this.loadedPage = page;
        this._feedSnippets.next(data);
      });
    }
    return this._feedSnippets.asObservable();
  }

  public removeFromFeedSnippets(snippet: Snippet) {
    if (this.feedSnippetsHaveBeenLoaded) {
      const myFeedSnippets: Snippet[] = this._feedSnippets.getValue();
      const index = myFeedSnippets.findIndex((myFeedSnippet) => snippet._id === myFeedSnippet._id);
      if (index !== -1) {
        myFeedSnippets.splice(index, 1);
        this._feedSnippets.next(myFeedSnippets);
      }
    }
  }

}

