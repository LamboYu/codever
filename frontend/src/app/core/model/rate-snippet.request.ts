import {Snippet} from './snippet';

export interface RateSnippetRequest {
  ratingUserId: string;
  action: RatingActionType;
  snippet: Snippet
}

export enum RatingActionType {
  LIKE = 'LIKE',
  UNLIKE = 'UNLIKE'
}
