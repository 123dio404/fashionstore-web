import { Component, Input } from '@angular/core';

export interface ChartPoint {
  label: string;
  value: number;
}

/**
 * Gráfico simple en SVG (barras o línea) para los informes y el dashboard.
 * Sin dependencias externas: solo calcula la escala y dibuja paths/rects.
 */
@Component({
  selector: 'app-ui-chart',
  template: `
    @if (points.length === 0) {
      <p class="chart-empty">Sin datos para graficar.</p>
    } @else {
      <figure class="chart">
        <div class="chart-plot" [style.height.px]="height">
          @if (type === 'bar') {
            @for (point of points; track point.label) {
              <div class="chart-col" [attr.title]="point.label + ': ' + display(point.value)">
                <span class="chart-value">{{ short(point.value) }}</span>
                <div class="chart-bar" [style.height.%]="percent(point.value)"></div>
              </div>
            }
          } @else {
            <svg
              class="chart-line"
              [attr.viewBox]="'0 0 ' + plotWidth + ' ' + height"
              preserveAspectRatio="none"
              role="img"
            >
              <polyline
                [attr.points]="linePoints()"
                fill="none"
                stroke="var(--brand)"
                stroke-width="2"
                stroke-linejoin="round"
                stroke-linecap="round"
              />
            </svg>
          }
        </div>

        <figcaption class="chart-labels">
          @for (point of points; track point.label) {
            <span [attr.title]="point.label">{{ point.label }}</span>
          }
        </figcaption>
      </figure>
    }
  `,
  styles: [
    `
      .chart {
        margin: 0;
      }
      .chart-plot {
        position: relative;
        display: flex;
        align-items: flex-end;
        gap: 4px;
        padding-top: 1.25rem;
        border-bottom: 1px solid var(--border);
      }
      .chart-col {
        position: relative;
        flex: 1;
        display: flex;
        align-items: flex-end;
        height: 100%;
      }
      .chart-bar {
        width: 100%;
        min-height: 2px;
        border-radius: 6px 6px 0 0;
        background: linear-gradient(180deg, var(--brand), var(--brand-soft));
      }
      .chart-value {
        position: absolute;
        top: -1.15rem;
        left: 0;
        right: 0;
        text-align: center;
        font-size: 0.62rem;
        color: var(--muted);
      }
      .chart-line {
        width: 100%;
        height: 100%;
      }
      .chart-labels {
        display: flex;
        gap: 4px;
        margin-top: 0.35rem;
      }
      .chart-labels span {
        flex: 1;
        overflow: hidden;
        font-size: 0.6rem;
        text-align: center;
        white-space: nowrap;
        text-overflow: ellipsis;
        color: var(--muted-2);
      }
      .chart-empty {
        margin: 0;
        font-size: 0.82rem;
        color: var(--muted);
      }
    `
  ]
})
export class UiChartComponent {
  @Input() points: ChartPoint[] = [];
  @Input() type: 'bar' | 'line' = 'bar';
  @Input() height = 160;
  @Input() currency = false;

  readonly plotWidth = 100;

  private get max(): number {
    return Math.max(1, ...this.points.map((point) => point.value));
  }

  percent(value: number): number {
    return Math.round((value / this.max) * 100);
  }

  display(value: number): string {
    return this.currency ? `$ ${value.toFixed(2)}` : String(value);
  }

  short(value: number): string {
    if (!this.currency) return String(Math.round(value));
    if (value >= 1000) return `${Math.round(value / 1000)}k`;
    return value.toFixed(0);
  }

  linePoints(): string {
    const count = Math.max(1, this.points.length - 1);
    return this.points
      .map((point, index) => {
        const x = (index / count) * this.plotWidth;
        const y = this.height - (point.value / this.max) * (this.height - 8) - 4;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');
  }
}
