import { Component, Input, OnChanges } from '@angular/core';
import { Observable } from 'rxjs';
import { Snippet } from '../../../core/model/snippet';
import { UserData } from '../../../core/model/user-data';
import { MySnippetsStore } from '../../../core/user/my-snippets.store';
import { PersonalSnippetsService } from '../../../core/personal-snippets.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { UserDataHistoryStore } from '../../../core/user/userdata.history.store';
import { UserDataStore } from '../../../core/user/userdata.store';

@Component({
  selector: 'app-user-snippets',
  templateUrl: './user-snippets.component.html',
  styleUrls: ['./user-snippets.component.scss']
})
export class UserSnippetsComponent implements OnChanges {

  userSnippets$: Observable<Snippet[]>;
  orderBy = 'LAST_CREATED'; // TODO move to enum orderBy values

  @Input()
  userData$: Observable<UserData>;

  @Input()
  userId: string;

  constructor(private mySnippetsStore: MySnippetsStore,
              private personalSnippetsService: PersonalSnippetsService,
              private userDataHistoryStore: UserDataHistoryStore,
              private userDataStore: UserDataStore,
              private importSnippetsDialog: MatDialog,
              private backupSnippetsDialog: MatDialog) {
  }

  ngOnChanges() {
    if (this.userId) { // TODO - maybe consider doing different to pass the userId to child component
      this.userSnippets$ = this.mySnippetsStore.getLastCreated$(this.userId, this.orderBy);
    }
  }

  getLastCreatedSnippets() {
    this.orderBy = 'LAST_CREATED';
    this.userSnippets$ = this.mySnippetsStore.getLastCreated$(this.userId, this.orderBy);
  }

  getMostLikedSnippets() {
    this.orderBy = 'MOST_LIKES';
    this.userSnippets$ = this.mySnippetsStore.getMostLiked$(this.userId, this.orderBy);
  }

  getMostUsedSnippets() {
    this.orderBy = 'MOST_USED';
    this.userSnippets$ = this.mySnippetsStore.getMostUsed$(this.userId, this.orderBy);
  }



}
