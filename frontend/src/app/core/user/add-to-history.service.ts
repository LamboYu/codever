import { Injectable } from '@angular/core';
import { Snippet } from '../model/snippet';
import { UserDataStore } from './userdata.store';

@Injectable({
  providedIn: 'root'
})
export class AddToHistoryService {
  constructor(private userDataStore: UserDataStore) {
  }

  onClickInDescription(userIsLoggedIn: boolean, $event: any, snippet: Snippet) {
    if (userIsLoggedIn && this.isHtmlAnchorElement($event)) {
      $event.target.setAttribute('target', '_blank');
      this.userDataStore.updateUserDataHistory$(snippet);
    }
  }

  onMiddleClickInDescription(userIsLoggedIn: boolean, $event: any, snippet: Snippet) {
    if (userIsLoggedIn && this.isHtmlAnchorElement($event)) {
      this.userDataStore.updateUserDataHistory$(snippet);
    }
  }

  private isHtmlAnchorElement($event: any) {
    return $event.target.matches('a');
  }

  promoteInHistoryIfLoggedIn(userIsLoggedIn: boolean, snippet: Snippet) {
    if (userIsLoggedIn) {
      this.userDataStore.updateUserDataHistory$(snippet);
    }
  }
}
