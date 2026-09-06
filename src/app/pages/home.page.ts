import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="page-shell">
      <nav class="topbar" aria-label="Navegación principal">
        <a class="brand" routerLink="/" aria-label="Ir al inicio">FashionStore</a>
        <a class="login-link" routerLink="/auth/login">Iniciar sesión</a>
      </nav>

      <section class="hero" aria-labelledby="hero-title">
        <div class="hero-copy">
          <p class="eyebrow">Nueva colección · 2025</p>
          <h1 id="hero-title">Viste tu historia.</h1>
          <p class="hero-text">Descubre prendas seleccionadas para acompañar tu estilo todos los días.</p>
          <a class="primary-button" routerLink="/auth/login">Entrar a mi cuenta <span aria-hidden="true">→</span></a>
        </div>

        <div class="hero-art" aria-label="Selección de moda FashionStore" role="img">
          <div class="art-shape art-shape-main"></div>
          <div class="art-shape art-shape-small"></div>
          <span class="art-label">FS<br />STUDIO</span>
        </div>
      </section>

      <footer class="footer-note">
        <span>Moda con intención</span>
        <span>Explora · Elige · Disfruta</span>
      </footer>
    </main>
  `,
  styleUrl: '../app.scss'
})
export class HomePage {}