import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { UiAccessDeniedComponent } from '../../shared/ui/access-denied.component';

@Component({
  selector: 'app-forbidden-page',
  imports: [RouterLink, UiAccessDeniedComponent],
  template: `
    <div style="max-width: 34rem; margin: 3rem auto">
      <app-ui-access-denied>
        <a class="btn" routerLink="/catalog">Volver al catálogo</a>
      </app-ui-access-denied>
    </div>
  `
})
export class ForbiddenPage {}
