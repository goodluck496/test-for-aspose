import {AfterViewInit, Component, ElementRef, HostListener, Inject, OnInit, ViewChild} from '@angular/core';
import * as PIXI from 'pixi.js';
import {FederatedPointerEvent, FederatedWheelEvent, Sprite, Texture} from 'pixi.js';
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

	reachBorderX = false;
	reachBorderY = false;

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
		this.initSubs();
	}

	getTextures(): Promise<PIXI.Texture[]> {
		const names = ['1.png', '2.png', '3.png', '4.png', '5.png'];
		return Promise.all(names.map(el => PIXI.Texture.fromURL(`assets/images/${el}`)));
	}

	initSubs(): void {
		this.viewport.addEventListener('wheel', (event: FederatedWheelEvent) => {

			if (event.ctrlKey) {
				this.onZoom(event);
				return;
			}

			if (event.shiftKey) {
				this.onWheelX(event);
				return;
			}

			this.onWheelY(event);
		});

		fromEvent(window, 'resize').subscribe(() => {
			this.sprites$.getValue().forEach(sprite => {
				sprite.position.set(window.innerWidth / 2 - sprite.texture.width / 2, sprite.position.y);
			});
		});
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
				createdSprite.interactive = true;

				createdSprite.addListener('click', (event: FederatedPointerEvent) => {
					if (this.currentScale !== 1) {
						console.log('Пока не получилось правильно вычислять позицию элемента при измененном масштабе, поэтому его не добавляем');
						return;
					}
					if (!event.ctrlKey) {
						return;
					}
					this.addAnnotate(createdSprite, event);
				});
				return loadedSpite;
			});

			this.pixiApp.stage.interactive = true;
			this.sprites$.next(sprites);
		});

	}

	addAnnotate(el: Sprite, event: FederatedPointerEvent): void {
		const element = new PIXI.Graphics();

		element.beginFill(0xffffff);
		element.drawRect(0, 0, 250, 50);
		element.endFill();

		element.lineStyle(1, 0x000000);
		element.drawRect(0, 0, element.width, element.height);
		element.x = event.x - el.x - this.viewport.x;
		element.y = event.y - el.y - this.viewport.y;

		el.addChild(element);
	}

	ngAfterViewInit() {

		const canvasContainer = this.pixiApp.view;
		// @ts-ignore
		this.pixiViewRef?.nativeElement.appendChild(canvasContainer);

		this.pixiApp.start();

		this.renderTexture();
	}

	onZoom(event: FederatedWheelEvent): void {
		const zoomPlus = event.deltaY < 0;
		this.currentScale = zoomPlus ? this.currentScale + this.scaleStep : this.currentScale - this.scaleStep;
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
