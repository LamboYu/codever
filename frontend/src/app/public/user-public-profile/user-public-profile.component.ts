import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { UserPublicService } from './user-public.service';
import { environment } from '../../../environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { Snippet } from '../../core/model/snippet';
import { UserData } from '../../core/model/user-data';
import { PublicSnippetsService } from '../snippets/public-snippets.service';
import { KeycloakService } from 'keycloak-angular';
import { UserInfoStore } from '../../core/user/user-info.store';
import { UserDataStore } from '../../core/user/userdata.store';
import { UserPublicData } from '../../core/model/user-public-data';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { LoginRequiredDialogComponent } from '../../shared/dialog/login-required-dialog/login-required-dialog.component';
import { Meta } from '@angular/platform-browser';
import { UserDataWatchedTagsStore } from '../../core/user/userdata.watched-tags.store';
import { TagFollowingBaseComponent } from '../../shared/tag-following-base-component/tag-following-base.component';
import { LoginDialogHelperService } from '../../core/login-dialog-helper.service';

@Component({
  selector: 'app-user-public-profile',
  templateUrl: './user-public-profile.component.html',
  styleUrls: ['./user-public-profile.component.scss']
})
export class UserPublicProfileComponent extends TagFollowingBaseComponent implements OnInit {

  userPublicData$: Observable<UserPublicData>;
  recentPosts$: Observable<Snippet[]>;
  userData$: Observable<UserData>;
  userId: string;
  userIsLoggedIn = false;

  constructor(private userPublicService: UserPublicService,
              private keycloakService: KeycloakService,
              private publicSnippetsService: PublicSnippetsService,
              private userInfoStore: UserInfoStore,
              private userDataStore: UserDataStore,
              public userDataWatchedTagsStore: UserDataWatchedTagsStore,
              private loginDialogHelperService: LoginDialogHelperService,
              public loginDialog: MatDialog,
              private route: ActivatedRoute,
              private router: Router,
              private meta: Meta) {
    super(loginDialog, userDataWatchedTagsStore);
  }

  ngOnInit() {
    this.keycloakService.isLoggedIn().then(isLoggedIn => {
        if (isLoggedIn) {
          this.userIsLoggedIn = true;
          this.userInfoStore.getUserInfo$().subscribe(userInfo => {
            this.userData$ = this.userDataStore.getUserData$();
          });
        }
      }
    );
    this.userId = this.route.snapshot.params['userId'];
    this.userPublicData$ = this.userPublicService.getUserPublicData$(this.userId, environment.TOP_PUBLIC_USER_TAGS_LIMIT);
    this.userPublicData$.subscribe((publicData) => {
      this.meta.updateTag({name: 'og:title', content: publicData.publicProfile.displayName})
      this.meta.updateTag({name: 'og:image', content: publicData.publicProfile.imageUrl})
      this.meta.updateTag({name: 'og:description', content: publicData.publicProfile.summary})
    })
    const searchText = `user:${this.userId}`;
    this.recentPosts$ = this.publicSnippetsService.searchPublicSnippets(searchText, environment.RECENT_PUBLIC_USER_SNIPPETS_LIMIT, 1, 'newest', null);
  }

  goToEditUserProfile() {
    this.router.navigateByUrl('/settings');
  }

  followUser(followedUserId: string) {
    if (!this.userIsLoggedIn) {
      const dialogConfig =
        this.loginDialogHelperService.loginDialogConfig('You need to be logged in to follow users');
      this.loginDialog.open(LoginRequiredDialogComponent, dialogConfig);
    } else {
      this.userDataStore.followUser$(followedUserId).subscribe(() => {
        this.userPublicData$ = this.userPublicService.getUserPublicData$(this.userId, environment.TOP_PUBLIC_USER_TAGS_LIMIT);
      });
    }
  }

  unfollowUser(followedUserId: string) {
    this.userDataStore.unfollowUser$(followedUserId).subscribe(() => {
      this.userPublicData$ = this.userPublicService.getUserPublicData$(this.userId, environment.TOP_PUBLIC_USER_TAGS_LIMIT);
    });
  }
}
