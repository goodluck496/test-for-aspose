import {AfterViewInit, Component, ElementRef, HostListener, Inject, OnInit, ViewChild} from '@angular/core';
import * as PIXI from 'pixi.js';
import {Sprite, Texture} from 'pixi.js';
import {PIXI_APP, PIXI_VIEWPORT} from './app.module';
import {Viewport} from 'pixi-viewport';
import {BehaviorSubject, fromEvent} from 'rxjs';


@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
	providers: []
})
export class AppComponent implements OnInit, AfterViewInit {

	@ViewChild('pixiViewRef') pixiViewRef?: ElementRef<HTMLElement>;

	topTextureCoordinates: { x: number; y: number } = {x: 0, y: 0};

	textures$ = new BehaviorSubject<Texture[]>([]);
	sprites$ = new BehaviorSubject<Sprite[]>([]);

	scaleStep = .2;
	currentScale = 1;


	constructor(
		@Inject(PIXI_APP) private pixiApp: PIXI.Application,
		@Inject(PIXI_VIEWPORT) private viewport: Viewport
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
		this.textures$.next(await this.getTextures());
	}

	getTextures(): Promise<PIXI.Texture[]> {
		const names = ['1.png', '2.png', '3.png', '4.png', '5.png'];
		return Promise.all(names.map(el => PIXI.Texture.fromURL(`assets/images/${el}`)));
	}

	async renderTexture() {
		this.textures$.subscribe(textures => {
			const sprites = textures.map((texture, i) => {
				const calcPositionY = () => {
					const margintBottom = 20;
					return textures.slice(0, i).reduce((acc, curr) => {
						acc += curr.height + margintBottom;
						return acc;
					}, 0);
				};

				const positionX = window.innerWidth / 2 - texture.width / 2;

				const createdSprite = new PIXI.Sprite(texture);
				const loadedSpite = this.viewport.addChild(createdSprite);
				const positionY = i === 0 ? 0 : calcPositionY();
				if (i === 0) {
					this.topTextureCoordinates = {x: positionX, y: positionY};
				}
				loadedSpite.position.set(positionX, positionY);
				return loadedSpite;
			});

			this.sprites$.next(sprites);
		});

		fromEvent(window, 'resize').subscribe(() => {
			this.sprites$.getValue().forEach(sprite => {
				sprite.position.set(window.innerWidth / 2 - sprite.texture.width / 2, sprite.position.y);
			});
		});

	}

	ngAfterViewInit() {

		const canvasContainer = this.pixiApp.view;
		// @ts-ignore
		this.pixiViewRef?.nativeElement.appendChild(canvasContainer);

		this.pixiApp.start();

		this.renderTexture();

		this.viewport.addEventListener('wheel', (event) => {

			if (event.ctrlKey) {
				const zoomPlus = event.deltaY < 0;
				this.currentScale = zoomPlus ? this.currentScale + this.scaleStep : this.currentScale - this.scaleStep;
				this.viewport.setZoom(this.currentScale, true);
				return;
			}

			if (event.shiftKey) {
				const stepX = 50;
				const shiftPlus = event.deltaY < 0;
				console.log(Math.abs(this.viewport.x), this.viewport.width, this.textures$.getValue()[0].width);
				if (shiftPlus) {
					if ((this.viewport.width / Math.abs(this.viewport.x)) > 1) {
						this.viewport.x += stepX;
					} else {
						this.viewport.x = 0;
					}

				} else {

					if ((this.viewport.width / Math.abs(this.viewport.x)) > 1) {
						this.viewport.x -= stepX;
					} else {
						this.viewport.x = 0;
					}
				}
				return;
			}

			const stepY = 100;
			if (event.deltaY > 0) {
				if (!(Math.abs(this.viewport.y - stepY) > this.viewport.height - this.textures$.getValue()[0].height / 1.5)) {
					this.viewport.y -= stepY;
				}
			} else {
				if (!(this.viewport.y + stepY > stepY)) {
					this.viewport.y += stepY;
				}
			}
		});

	}

	addImages(): void {

	}

}
