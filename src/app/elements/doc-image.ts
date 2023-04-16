import {FederatedMouseEvent, FederatedPointerEvent, Graphics, Sprite, Texture} from 'pixi.js';
import {ContextMenuActionTypes, ContextMenuItem} from '../app.types';
import {Subject, takeUntil} from 'rxjs';
import {Viewport} from 'pixi-viewport';
import {ViewportService} from '../viewport.service';
import {DocPage} from './doc-page';

export class DocImage {
	uniqId = new Date().getTime() + Math.random() * 1000;
	element: Sprite;
	contextMenuItems: ContextMenuItem[] = [
		{
			actionType: ContextMenuActionTypes.Delete,
			title: 'Удалить',
			graphicItem: new Graphics(),
			payload: {id: this.uniqId}
		},
	];

	dragStarted = false;
	private _destroy = new Subject<void>();

	constructor(public parent: DocPage, texture: Texture, private viewport: Viewport, private viewportService: ViewportService) {
		this.element = new Sprite(texture);
		this.initSubs();
	}

	render(container: Sprite, event: FederatedPointerEvent): void {
		container.addChild(this.element);
		this.element.width = 300;
		this.element.height = 200;
		this.element.x = this.element.x / 2;
		this.element.y = event.y - container.y - this.viewport.y;
	}

	initSubs(): void {
		this.element.interactive = true;

		this.drugSubs();

		this.element?.addEventListener('rightclick', (event) => {
			this.viewportService.showContextMenu(event, this, [...this.contextMenuItems]);
		});

		this.viewportService.clickContextMenu
			.pipe(takeUntil(this._destroy))
			.subscribe(v => {
				if (v.actionType === ContextMenuActionTypes.Delete && v.payload.id === this.uniqId) {
					this.destroy();
				}
			});

	}

	drugSubs(): void {
		this.element.on('mousedown', e => onDragStart(e));
		this.element.on('mousemove', e => onDragMove(e));
		this.element.on('mouseup', e => onDragEnd());
		this.element.on('mouseupoutside', e => onDragEnd());

		let offset = {x: 0, y: 0};

		const onDragStart = (event: FederatedMouseEvent) => {
			this.dragStarted = true;
			// Записываем текущее смещение спрайта
			offset = {x: event.data.global.x - this.element.x, y: event.data.global.y - this.element.y};
		};

		const onDragMove = (event: FederatedMouseEvent) => {
			if (!this.dragStarted) {
				return;
			}

			if (this.element.y >= this.parent.element.height - this.element.height) {
				this.element.y = this.element.y - 5;
				return;
			}

			if (this.element.y <= 0) {
				this.element.y = this.element.y + 5;
				return;
			}

			// Устанавливаем новую позицию спрайта, учитывая текущее смещение и положение курсора мыши
			this.element.x = event.data.global.x - offset.x;
			this.element.y = event.data.global.y - offset.y;
		};

		const onDragEnd = () => {
			this.dragStarted = false;
			// Сбрасываем текущее смещение спрайта
			offset = {x: 0, y: 0};
		};
	}

	destroy(): void {
		if (!this.element || this.element.destroyed) {
			return;
		}
		this._destroy.next();
		this._destroy.complete();
		this.element.destroy();
	}
}
