import { NgModule } from '@angular/core';
import { HighLightPipe } from './pipe/highlight.pipe';
import { HighLightHtmlPipe } from './pipe/highlight.no-html-tags.pipe';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TagsValidatorDirective } from './directive/tags-validation.directive';
import { RouterModule } from '@angular/router';
import { LoginRequiredDialogComponent } from './dialog/login-required-dialog/login-required-dialog.component';
import { SocialButtonsModule } from '../social-buttons/social-buttons.module';
import { TagFollowingBaseComponent } from './tag-following-base-component/tag-following-base.component';
import { Markdown2HtmlPipe } from './pipe/markdown2html.pipe';
import { NavigationComponent } from './navigation/navigation.component';
import { SearchbarComponent } from './search/searchbar.component';
import { HotKeysDialogComponent } from './dialog/history-dialog/hot-keys-dialog.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { SnippetDetailsComponent } from './snippet-details/snippet-details.component';
import { CopySnippetButtonComponent } from './snippet-details/copy-snippet-button/copy-snippet-button.component';
import { HighlightModule } from 'ngx-highlightjs';
import { SnippetCardBodyComponent } from './snippet-details/snippet-card-body/snippet-card-body.component';
import { AsyncSnippetListComponent } from './async-snippet-list/async-snippet-list.component';
import { AddTagFilterToSearchDialogComponent } from './search/add-tag-filter-dialog/add-tag-filter-to-search-dialog.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { ExtensionsComponent } from './extensions/extensions.component';
import { AsyncSearchResultListComponent } from './async-search-result-list/async-search-result-list.component';
import { PageNavigationBarComponent } from './page-navigation-bar/page-navigation-bar.component';


/**
 * Add a SharedModule to hold the common components, directives, and pipes and share them with the modules that need them.
 * See - https://angular.io/guide/sharing-ngmodules
 */
@NgModule({
  imports: [
    SocialButtonsModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatDialogModule,
    RouterModule,
    HighlightModule,
    MatFormFieldModule,
    MatChipsModule,
    MatIconModule
  ],
  declarations: [
    HighLightPipe,
    HighLightHtmlPipe,
    Markdown2HtmlPipe,
    AsyncSnippetListComponent,
    AsyncSearchResultListComponent,
    TagsValidatorDirective,
    LoginRequiredDialogComponent,
    TagFollowingBaseComponent,
    SearchbarComponent,
    NavigationComponent,
    PageNavigationBarComponent,
    HotKeysDialogComponent,
    SnippetDetailsComponent,
    CopySnippetButtonComponent,
    SnippetCardBodyComponent,
    AddTagFilterToSearchDialogComponent,
    ExtensionsComponent
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HighLightPipe,
    HighLightHtmlPipe,
    Markdown2HtmlPipe,
    AsyncSnippetListComponent,
    AsyncSearchResultListComponent,
    MatProgressSpinnerModule,
    NavigationComponent,
    SearchbarComponent,
    SnippetDetailsComponent,
    CopySnippetButtonComponent,
    ExtensionsComponent
  ],
  entryComponents: [
    LoginRequiredDialogComponent,
    HotKeysDialogComponent,
    AddTagFilterToSearchDialogComponent
  ]
})
export class SharedModule { }
