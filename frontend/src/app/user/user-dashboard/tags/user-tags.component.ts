import { Component, Input, OnInit } from '@angular/core';
import { UsedTag, UsedTags } from '../../../core/model/used-tag';
import { UserDataService } from '../../../core/user-data.service';
import { Observable, of } from 'rxjs';
import { FormControl } from '@angular/forms';
import { map, startWith } from 'rxjs/operators';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DeleteBookmarksByTagDialogComponent } from './delete-bookmarks-by-tag-dialog/delete-bookmarks-by-tag-dialog.component';
import { UserData } from '../../../core/model/user-data';
import { UserDataWatchedTagsStore } from '../../../core/user/userdata.watched-tags.store';
import { TagFollowingBaseComponent } from '../../../shared/tag-following-base-component/tag-following-base.component';
import { LocalStorageService } from '../../../core/cache/local-storage.service';
import { localStorageKeys } from '../../../core/model/localstorage.cache-keys';
import iziToast, { IziToastSettings } from 'izitoast';

@Component({
  selector: 'app-user-tags',
  templateUrl: './user-tags.component.html',
  styleUrls: ['./user-tags.component.scss']
})
export class UserTagsComponent extends TagFollowingBaseComponent implements OnInit {

  usedTags$: Observable<UsedTags>;

  selectTagControl = new FormControl();

  options: UsedTag[] = [];
  filteredOptions: Observable<UsedTag[]>;

  @Input()
  userId: string;

  @Input()
  userData$: Observable<UserData>;

  buttonEnabled: boolean;

  constructor(
    private deleteDialog: MatDialog,
    private userDataService: UserDataService,
    public userDataWatchedTagsStore: UserDataWatchedTagsStore,
    public loginDialog: MatDialog,
    private localStorageService: LocalStorageService,
  ) {
    super(loginDialog, userDataWatchedTagsStore);
  }

  ngOnInit() {
    this.usedTags$ = this.userDataService.getUsedTags(this.userId);
    this.usedTags$.subscribe(usedTags => {
      this.options = usedTags.private;

      this.filteredOptions = this.selectTagControl.valueChanges
        .pipe(
          startWith(''),
          map(value => typeof value === 'string' ? value : value.name),
          map(name => name ? this._filter(name) : this.options.slice())
        );
    });

    this.selectTagControl.valueChanges.subscribe(value => {
      this.buttonEnabled = this.options.map(option => {
        return option.name
      }).includes(value.name);
    })
  }

  displayTag(usedTag?: UsedTag): string | undefined {
    return usedTag ? `${usedTag.name}` : undefined;
  }

  private _filter(name: string): UsedTag[] {
    const filterValue = name.toLowerCase();

    return this.options.filter(option => option.name.toLowerCase().indexOf(filterValue) >= 0);
  }

}
