import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Snippet } from '../model/snippet';

@Injectable()
export class NotifyStoresService {

  // Observable string sources
  private snippetDeleteSource = new Subject<Snippet>();

  // Observable string streams
  snippetDeleted$ = this.snippetDeleteSource.asObservable();

  deleteSnippet(snippet: Snippet) {
    this.snippetDeleteSource.next(snippet);
  }

}
