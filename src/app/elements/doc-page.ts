import {Viewport} from 'pixi-viewport';
import {ViewportService} from '../viewport.service';
import {FederatedPointerEvent, Graphics, Sprite, Texture, TextureSource} from 'pixi.js';
import {DocAnnotate} from './doc-annotate';
import {Subject, takeUntil} from 'rxjs';
import {ContextMenuActionTypes, ContextMenuItem} from '../app.types';
import {DocImage} from './doc-image';

export class DocPage {
	uniqId = new Date().getTime() + Math.random() * 1000;
	element: Sprite;
	annotates: DocAnnotate[] = [];
	images: DocImage[] = [];
	contextMenuItems: ContextMenuItem[] = [
		{
			payload: {id: this.uniqId},
			actionType: ContextMenuActionTypes.AddImageToContainer,
			title: 'Загрузить картинку',
			graphicItem: new Graphics()
		},
		{
			payload: {id: this.uniqId},
			actionType: ContextMenuActionTypes.AddAnnotate,
			title: 'Добавить аннотацию',
			graphicItem: new Graphics()
		}
	];
	private _destroy = new Subject<void>();

	constructor(texture: Texture, private viewport: Viewport, private viewportService: ViewportService) {
		this.element = new Sprite(texture);

		this.viewport.addChild(this.element);
		this.initSubs();
	}

	initSubs(): void {
		this.element.interactive = true;

		this.element?.addEventListener('rightclick', (event) => this.viewportService.showContextMenu(event, this, this.contextMenuItems));

		this.viewportService.clickContextMenu.pipe(takeUntil(this._destroy)).subscribe((v: ContextMenuItem) => {
			if (v.actionType === ContextMenuActionTypes.AddAnnotate && v.payload.id === this.uniqId) {
				this.addAnnotate(v.payload.event);
			}

			if (v.actionType === ContextMenuActionTypes.AddImageToContainer && v.payload.id === this.uniqId) {
				this.addImage(v.payload.event);
			}
		});
	}

	addAnnotate(event: FederatedPointerEvent): void {
		if (this.viewport.scaled !== 1) {
			console.log('Пока не получилось правильно вычислять позицию элемента при измененном масштабе, поэтому его не добавляем');
			return;
		}
		const annotate = new DocAnnotate(this, this.viewport, this.viewportService);
		annotate.render(this.element, event);
		this.annotates.push(annotate);
	}

	async addImage(event: FederatedPointerEvent): Promise<void> {
		const imageTexture = await this.getTexture();
		if (!imageTexture) {
			return;
		}

		const docImage = new DocImage(this, imageTexture, this.viewport, this.viewportService);
		docImage.render(this.element, event);
		this.images.push(docImage);
	}

	destroy(): void {
		this._destroy.next();
		this._destroy.complete();
		this.element.destroy();

	}

	private getTexture(): Promise<Texture | void> {
		return new Promise((res, rej) => {
			let input = document.createElement('input');
			input.type = 'file';
			input.style.visibility = 'none';
			input.onchange = _ => {
				if (!input.files) {
					return;
				}
				const files = Array.from(input.files);

				if (!files.length) {
					rej();
					return;
				}

				res(files[0]);
			};
			input.click();
		}).then(file => {
			return new Promise((res, rej) => {
				if (!file) {
					return rej();
				}
				const reader = new FileReader();
				// Добавляем обработчик событий на завершение чтения файла
				reader.addEventListener('load', (event) => {
					if (!event.target) {
						return;
					}
					const texture = Texture.from(event.target.result as TextureSource);
					res(texture);
				});

				reader.readAsDataURL(file as Blob);
			});

		});
	}


}
