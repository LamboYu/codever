import { BehaviorSubject, Observable } from 'rxjs';

import { Injectable } from '@angular/core';
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
export class UserDataReadLaterStore {

  private _readLater: BehaviorSubject<Snippet[]> = new BehaviorSubject(null);
  private readLaterHaveBeenLoaded = false;

  loadedPage: number;

  constructor(private userService: UserDataService,
              private userDataStore: UserDataStore,
              private userInfoStore: UserInfoStore,
              private notifyStoresService: NotifyStoresService
  ) {
    this.loadedPage = 1;
    this.notifyStoresService.snippetDeleted$.subscribe((snippet) => {
      this.publishReadLaterAfterDeletion(snippet);
    });
  }

  getReadLater$(userId: string, page: number): Observable<Snippet[]> {
    if (this.loadedPage !== page || !this.readLaterHaveBeenLoaded) {
      this.userService.getReadLater(userId, page, environment.PAGINATION_PAGE_SIZE).subscribe(data => {
        if (!this.readLaterHaveBeenLoaded) {
          this.readLaterHaveBeenLoaded = true;
        }
        this.loadedPage = page;
        this._readLater.next(data);
      });
    }
    return this._readLater.asObservable();
  }

  addToReadLater(snippet: Snippet) {
    this.userDataStore.addToUserReadLater$(snippet).subscribe(() => {
      this.publishReadLaterAfterCreation(snippet);
    });
  }

  removeFromReadLater(snippet: Snippet) {
    this.userDataStore.removeFromUserDataReadLater$(snippet).subscribe(() => {
      this.publishReadLaterAfterDeletion(snippet);
    });
  }

  private publishReadLaterAfterDeletion(snippet: Snippet) {
    if (this.readLaterHaveBeenLoaded) {
      const readLater: Snippet[] = this._readLater.getValue();
      const index = readLater.findIndex((item) => snippet._id === item._id);
      if (index !== -1) {
        readLater.splice(index, 1);
        this._readLater.next(readLater);
      }
    }
  }

  public publishReadLaterAfterCreation(snippet: Snippet) {
    if (this.readLaterHaveBeenLoaded) {
      const readLater: Snippet[] = this._readLater.getValue();
      readLater.push(snippet);
      this._readLater.next(readLater); // insert at the top (index 0)
    }
  }

}

