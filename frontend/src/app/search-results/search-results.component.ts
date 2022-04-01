import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { PersonalSnippetsService } from '../core/personal-snippets.service';
import { Observable } from 'rxjs';
import { Snippet } from '../core/model/snippet';
import { SearchNotificationService } from '../core/search-notification.service';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakServiceWrapper } from '../core/keycloak-service-wrapper.service';
import { UserInfoStore } from '../core/user/user-info.store';
import { UserDataStore } from '../core/user/userdata.store';
import { UserData } from '../core/model/user-data';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { PaginationNotificationService } from '../core/pagination-notification.service';
import { SearchDomain } from '../core/model/search-domain.enum';
import { MatDialog } from '@angular/material/dialog';
import { LoginDialogHelperService } from '../core/login-dialog-helper.service';
import { LoginRequiredDialogComponent } from '../shared/dialog/login-required-dialog/login-required-dialog.component';
import { PublicSnippetsService } from '../public/snippets/public-snippets.service';

@Component({
  selector: 'app-search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.scss']
})
export class SearchResultsComponent implements OnInit, OnDestroy {

  searchText: string; // holds the value in the search box
  searchDomain: string;

  currentPage: number;
  callerPaginationSearchResults = 'search-results';

  userId: string;
  userIsLoggedIn = false;

  searchResults$: Observable<Snippet[]>;
  private userData$: Observable<UserData>;

  selectedTabIndex = 3; // default search in public bookmarks
  private searchInclude: string;

  searchTriggeredSubscription: any;

  searchInOtherCategoriesTip = 'You can also try looking in other categories 👆👆';

  constructor(private route: ActivatedRoute,
              private router: Router,
              private publicSnippetsService: PublicSnippetsService,
              private personalSnippetsService: PersonalSnippetsService,
              private keycloakService: KeycloakService,
              private keycloakServiceWrapper: KeycloakServiceWrapper,
              private userInfoStore: UserInfoStore,
              private userDataStore: UserDataStore,
              private searchNotificationService: SearchNotificationService,
              private paginationNotificationService: PaginationNotificationService,
              private loginDialogHelperService: LoginDialogHelperService,
              public loginDialog: MatDialog) {
  }

  ngOnInit() {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.searchText = this.route.snapshot.queryParamMap.get('q');
    this.searchDomain = this.route.snapshot.queryParamMap.get('sd') || SearchDomain.PUBLIC_SNIPPETS;
    this.searchInclude = this.route.snapshot.queryParamMap.get('include') || 'all';
    this.searchNotificationService.updateSearchBar({
      searchText: this.searchText,
      searchDomain: this.searchDomain
    });

    this.initPageNavigation();

    this.initSelectedTabIndex(this.searchDomain);

    this.keycloakService.isLoggedIn().then(isLoggedIn => {
      if (isLoggedIn) {
        this.userIsLoggedIn = true;
        this.userInfoStore.getUserInfo$().subscribe(userInfo => {
          this.userData$ = this.userDataStore.getUserData$();
          this.userId = userInfo.sub;

          this.searchResults(this.searchText, this.searchDomain, this.searchInclude);
        });
      } else {
        switch (this.searchDomain) {
          case SearchDomain.PUBLIC_SNIPPETS: {
            this.searchResults(this.searchText, SearchDomain.PUBLIC_SNIPPETS, 'all');
            break;
          }
        }
        this.searchPublicSnippets_when_SearchText_but_No_SearchDomain();
      }
    });

    this.searchTriggeredSubscription = this.searchNotificationService.searchTriggeredSource$.subscribe(searchData => {
      switch (this.searchDomain) {
        case SearchDomain.MY_SNIPPETS: {
          this.selectedTabIndex = 0;
          break;
        }
        case SearchDomain.PUBLIC_SNIPPETS: {
          this.selectedTabIndex = 1;
          break;
        }
        default : {
          this.selectedTabIndex = 1;
        }
      }

      this.searchResults(searchData.searchText, searchData.searchDomain, 'all');
    });
  }

  private initPageNavigation() {
    const page = this.route.snapshot.queryParamMap.get('page');
    if (page) {
      this.currentPage = parseInt(page, 0);
    } else {
      this.currentPage = 1;
    }
    this.paginationNotificationService.pageNavigationClicked$.subscribe(paginationAction => {
      if (paginationAction.caller === this.callerPaginationSearchResults) {
        this.currentPage = paginationAction.page;
        this.searchResults(this.searchText, this.searchDomain, 'all');
      }
    });
  }

  private initSelectedTabIndex(searchDomain: string) {
    switch (searchDomain) {
      case SearchDomain.MY_SNIPPETS : {
        this.selectedTabIndex = 0;
        break;
      }
      case SearchDomain.PUBLIC_SNIPPETS : {
        this.selectedTabIndex = 1;
        break
      }
    }
  }

  private searchPublicSnippets_when_SearchText_but_No_SearchDomain() {
    if (this.searchText) {
      this.searchResults(this.searchText, SearchDomain.PUBLIC_SNIPPETS, 'all');
    }
  }

  private searchResults(searchText: string, searchDomain: string, searchInclude: string) {
    this.searchDomain = searchDomain;
    this.searchText = searchText;
    switch (searchDomain) {
      case SearchDomain.MY_SNIPPETS : {
        this.searchResults$ = this.personalSnippetsService.getFilteredPersonalSnippets(
          searchText,
          environment.PAGINATION_PAGE_SIZE,
          this.currentPage,
          this.userId,
          searchInclude);
        break;
      }
      case SearchDomain.PUBLIC_SNIPPETS : {
        this.searchResults$ = this.publicSnippetsService.searchPublicSnippets(
          searchText,
          environment.PAGINATION_PAGE_SIZE,
          this.currentPage,
          'relevant',
          searchInclude
        );
        break;
      }
    }
    this.searchResults$.subscribe(results => {
      if (results && results.length > 0) {
        this.saveRecentSearch(searchText, searchDomain);
      }
    });
  }

  private saveRecentSearch(searchText: string, searchDomain) {
    if (this.userIsLoggedIn) {
      this.userDataStore.saveRecentSearch(searchText, searchDomain);
    }
  }

  private tryMySnippets(searchInclude: string) {
    if (this.userIsLoggedIn) {
      this.selectedTabIndex = 0;
      this.searchInclude = searchInclude;
      this.router.navigate(['.'],
        {
          relativeTo: this.route,
          queryParams: {
            q: this.searchText,
            sd: SearchDomain.MY_SNIPPETS,
            include: searchInclude
          },
        }
      );
    } else {
      const dialogConfig = this.loginDialogHelperService.loginDialogConfig('You need to be logged in to search through personal snippets');
      this.loginDialog.open(LoginRequiredDialogComponent, dialogConfig);
    }

  }

  private tryPublicSnippets(searchInclude: string) {
    this.selectedTabIndex = 1;
    this.currentPage = 1;
    this.searchInclude = searchInclude;
    this.router.navigate(['.'],
      {
        relativeTo: this.route,
        queryParams: {
          q: this.searchText,
          sd: SearchDomain.PUBLIC_SNIPPETS,
          page: '1',
          include: searchInclude
        },
      }
    );
  }

  tabSelectionChanged(event: MatTabChangeEvent) {
    this.selectedTabIndex = event.index;
    switch (this.selectedTabIndex) {
      case 0 : {
          this.tryMySnippets('all');
        break;
      }
      case 1 : {
          this.tryPublicSnippets('all');
        break;
      }
    }
  }

  ngOnDestroy(): void {
    this.searchTriggeredSubscription.unsubscribe();
  }

}
