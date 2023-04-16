import {AfterViewInit, Component, ElementRef, HostListener, Inject, OnInit, ViewChild} from '@angular/core';
import * as PIXI from 'pixi.js';
import {FederatedWheelEvent, Texture} from 'pixi.js';
import {PIXI_APP, PIXI_VIEWPORT} from './app.module';
import {Viewport} from 'pixi-viewport';
import {BehaviorSubject, forkJoin, fromEvent, switchMap, take} from 'rxjs';
import {ApiService} from './api.service';
import {ImagePage} from './app.types';
import {ViewportService} from './viewport.service';
import {DocPage} from './elements/doc-page';


@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
	providers: []
})
export class AppComponent implements OnInit, AfterViewInit {

	@ViewChild('pixiViewRef') pixiViewRef?: ElementRef<HTMLElement>;

	textures$ = new BehaviorSubject<Texture[]>([]);
	pages$ = new BehaviorSubject<DocPage[]>([]);

	scaleStep = .2;
	currentScale = 1;

	reachBorderX = false;
	reachBorderY = false;


	constructor(
		@Inject(PIXI_APP) private pixiApp: PIXI.Application,
		@Inject(PIXI_VIEWPORT) private viewport: Viewport,
		private apiService: ApiService,
		private viewportService: ViewportService,
	) {
	}

	@HostListener('wheel', ['$event'])
	onWheel(event: WheelEvent) {
		if (!event.ctrlKey) {
			return;
		}
		event.preventDefault();
	}

	async ngOnInit() {
		this.apiService.loadPages().pipe(take(1), switchMap((pages: ImagePage[]) =>
			forkJoin(pages.map(page => PIXI.Texture.fromURL(page.url)))
		)).subscribe(data => {
			this.initSubs();
			this.renderPages();

			this.textures$.next(data);
		});
	}

	@HostListener('window:keydown', ['$event'])
	onKeydown(e: KeyboardEvent) {
		if (e.ctrlKey && e.code === 'NumpadAdd') {
			e.preventDefault();
			this.onZoom('in');
		}

		if (e.ctrlKey && e.code === 'NumpadSubtract') {
			e.preventDefault();
			this.onZoom('out');
		}

		if (e.ctrlKey && ['digit0', 'numpad0'].includes(e.code.toLowerCase())) {
			this.currentScale = 1;
			this.onZoom('reset');
		}
	}

	initSubs(): void {
		this.viewport.addEventListener('wheel', (event: FederatedWheelEvent) => {

			if (event.ctrlKey) {
				let zoomPlus = event.deltaY < 0;
				this.onZoom(zoomPlus ? 'in' : 'out');
				return;
			}

			if (event.shiftKey) {
				this.onWheelX(event);
				return;
			}

			this.onWheelY(event);
		});

		fromEvent(window, 'resize').subscribe(() => {
			this.pages$.getValue().forEach(page => {
				page.element.position.set(window.innerWidth / 2 - page.element.texture.width / 2, page.element.position.y);
			});
		});

	}

	async renderPages() {
		const calcPositionY = (textures: PIXI.Texture[], i: number) => {
			const margintBottom = 20;
			return textures.slice(0, i).reduce((acc, curr) => {
				acc += curr.height + margintBottom;
				return acc;
			}, 0);
		};

		this.textures$.subscribe(textures => {
			const pages: DocPage[] = [];
			this.pages$.getValue().forEach(el => el.destroy());
			this.pages$.next([]);

			textures.forEach((texture, i) => {

				const page = new DocPage(texture, this.viewport, this.viewportService);
				const positionY = i === 0 ? 0 : calcPositionY(textures, i);
				const positionX = window.innerWidth / 2 - texture.width / 2;
				page.element.position.set(positionX, positionY);
				pages.push(page);
			});
			this.pages$.next(pages);
		});
	}

	ngAfterViewInit() {
		this.initPixi();
	}

	initPixi(): void {
		const canvasContainer = this.pixiApp.view;
		// @ts-ignore
		this.pixiViewRef?.nativeElement.appendChild(canvasContainer);

		this.pixiApp.start();
		this.pixiApp.stage.interactive = true;
	}

	onZoom(type: 'in' | 'out' | 'reset'): void {
		if (type === 'reset') {
			this.currentScale = 1;
			this.viewport.setZoom(this.currentScale, true);
			return;
		}
		this.currentScale = type === 'in' ? this.currentScale + this.scaleStep : this.currentScale - this.scaleStep;
		this.viewport.setZoom(this.currentScale, true);
	}

	onWheelX(event: FederatedWheelEvent): void {
		const stepX = 50;
		const shiftPlus = event.deltaY < 0;
		if (shiftPlus) {
			if ((this.viewport.width / Math.abs(this.viewport.x)) > 1) {
				this.reachBorderX = false;
				this.viewport.x += stepX;
			} else {
				this.reachBorderX = true;
			}

		} else {

			if ((this.viewport.width / Math.abs(this.viewport.x)) > 1) {
				this.reachBorderX = false;
				this.viewport.x -= stepX;
			} else {
				this.reachBorderX = true;
			}
		}
	}

	onWheelY(event: FederatedWheelEvent): void {
		const stepY = 100;
		if (event.deltaY > 0) {
			if (!(Math.abs(this.viewport.y - stepY) > this.viewport.height - this.textures$.getValue()[0].height / 1.5)) {
				this.reachBorderY = false;
				this.viewport.y -= stepY;
			} else {
				this.reachBorderY = true;
			}
		} else {
			if (!(this.viewport.y + stepY > stepY)) {
				this.reachBorderY = false;
				this.viewport.y += stepY;
			} else {
				this.reachBorderY = true;
			}
		}
	}

}
