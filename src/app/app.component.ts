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

	textures$ = new BehaviorSubject<Texture[]>([]);
	sprites$ = new BehaviorSubject<Sprite[]>([]);


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

	}

	addImages(): void {

	}

}
