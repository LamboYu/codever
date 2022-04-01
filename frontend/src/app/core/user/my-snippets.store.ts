import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Snippet } from '../model/snippet';
import { PersonalSnippetsService } from '../personal-snippets.service';

@Injectable()
export class MySnippetsStore {

  private _lastCreated: BehaviorSubject<Snippet[]> = new BehaviorSubject(null);
  private lastCreatedHaveBeenLoaded = false;

  private _mostUsed: BehaviorSubject<Snippet[]> = new BehaviorSubject(null);
  private mostUsedHaveBeenLoaded = false;

  private _mostLiked: BehaviorSubject<Snippet[]> = new BehaviorSubject(null);
  private mostLikedBeenLoaded = false;

  constructor(private personalSnippetsService: PersonalSnippetsService) {
  }

  getLastCreated$(userId, orderBy): Observable<Snippet[]> {
    if (!this.lastCreatedHaveBeenLoaded) {
      this.personalSnippetsService.getPersonalSnippetOrderedBy(userId, orderBy).subscribe(data => {
        this.lastCreatedHaveBeenLoaded = true;
        this._lastCreated.next(data);
      });
    }
    return this._lastCreated.asObservable();
  }

  addToLastCreatedBulk(snippets: Snippet[]): void {
    for (const snippet of snippets) {
      this.addToLastCreated(snippet);
    }
  }

  addToLastCreated(snippet: Snippet): void {
    if (this.lastCreatedHaveBeenLoaded) {
      const lastCreated = this._lastCreated.getValue();
      lastCreated.unshift(snippet);

      this._lastCreated.next(lastCreated.slice(0, 30));
    }
  }

  removeFromLastCreated(deleted: Snippet): void {
    if (this.lastCreatedHaveBeenLoaded) {
      const snippets: Snippet[] = this._lastCreated.getValue();
      const index = snippets.findIndex((snippet) => snippet._id === deleted._id);
      snippets.splice(index, 1);
      this._lastCreated.next(snippets);
    }
  }

  getMostLiked$(userId, orderBy): Observable<Snippet[]> {
    if (!this.mostLikedBeenLoaded) {
      this.personalSnippetsService.getPersonalSnippetOrderedBy(userId, orderBy).subscribe(data => {
        this.mostLikedBeenLoaded = true;
        this._mostLiked.next(data);
      });
    }
    return this._mostLiked.asObservable();
  }

  removeFromMostLiked(deleted: Snippet): void {
    if (this.mostLikedBeenLoaded) {
      const snippets: Snippet[] = this._mostLiked.getValue();
      const index = snippets.findIndex((snippet) => snippet._id === deleted._id);
      snippets.splice(index, 1);
      this._mostLiked.next(snippets);
    }
  }

  getMostUsed$(userId, orderBy): Observable<Snippet[]> {
    if (!this.mostUsedHaveBeenLoaded) {
      this.personalSnippetsService.getPersonalSnippetOrderedBy(userId, orderBy).subscribe(data => {
        this.mostUsedHaveBeenLoaded = true;
        this._mostUsed.next(data);
      });
    }
    return this._mostUsed.asObservable();
  }

  removeFromMostUsed(deleted: Snippet): void {
    if (this.mostUsedHaveBeenLoaded) {
      const snippets: Snippet[] = this._mostUsed.getValue();
      const index = snippets.findIndex((snippet) => snippet._id === deleted._id);
      snippets.splice(index, 1)
      this._mostUsed.next(snippets);
    }
  }

  removeFromStoresAtDeletion(snippet: Snippet) {
    this.removeFromLastCreated(snippet);
    this.removeFromMostLiked(snippet);
    this.removeFromMostUsed(snippet);
  }
}
