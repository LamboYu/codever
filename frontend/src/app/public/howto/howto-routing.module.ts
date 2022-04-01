import { RouterModule, Routes, UrlSegment } from '@angular/router';
import {NgModule} from '@angular/core';
import { HowToSnippetComponent } from './howto-snippets/how-to-snippet.component';
import { HowtoComponent } from './howto.component';
import { HowtoGetStartedComponent } from './howto-get-started/howto-get-started.component';
import { HowtoHotkeysComponent } from './howto-hotkeys/howto-hotkeys.component';

const howToRoutes: Routes = [
  {
    path: '',
    component: HowtoComponent,
  },
  {
    path: 'get-started',
    component: HowtoGetStartedComponent,
  },
  {
    path: 'snippets',
    component: HowToSnippetComponent
  },
  {
    path: 'snippets',
    redirectTo: 'snippets',
  },
  {
    path: 'hotkeys',
    component: HowtoHotkeysComponent
  },
  {
    path: '**',
    component: HowtoComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(howToRoutes)],
  exports: [RouterModule]
})
export class HowtoRoutingModule {}
