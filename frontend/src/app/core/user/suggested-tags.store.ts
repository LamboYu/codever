import { forkJoin, ReplaySubject } from 'rxjs';
import { Injectable } from '@angular/core';
import { PersonalSnippetsService } from '../personal-snippets.service';
import { PublicSnippetsService } from '../../public/snippets/public-snippets.service';
import { snippet_common_tags } from '../../shared/constants/snippet-common-tags';

@Injectable()
export class SuggestedTagsStore {

  private _suggestedTags: ReplaySubject<string[]> = new ReplaySubject(1);
  private _suggestedTagsForSnippet: ReplaySubject<string[]> = new ReplaySubject(1);
  private suggestedTagsLoaded = false;
  private suggestedTagsForSnippetLoaded = false;

  constructor(private publicSnippetsService: PublicSnippetsService,
              private personalSnippetsService: PersonalSnippetsService) {
  }

  getSuggestedSnippetTags$(userId: String) {
    if (!this.suggestedTagsForSnippetLoaded) {
      const userTags$ = this.personalSnippetsService.getUserTagsForSnippets(userId);
      const mostUsedPublicTags$ = this.publicSnippetsService.getMostUsedPublicTagsForSnippets(500);

      forkJoin([userTags$, mostUsedPublicTags$]).subscribe(results => {
        const userTags = results[0];
        const userTagsSimple = userTags.map(userTag => userTag.name);
        const mostUsedPublicTags = results[1];
        const mostUserPublicTagsSimple = mostUsedPublicTags.map(publicTag => publicTag.name);

        const suggestedTags = [...new Set([...snippet_common_tags, ...userTagsSimple, ...mostUserPublicTagsSimple])];
        this.suggestedTagsForSnippetLoaded = true;
        this._suggestedTagsForSnippet.next(suggestedTags.sort());
      });
    }

    return this._suggestedTagsForSnippet.asObservable();
  }
}
