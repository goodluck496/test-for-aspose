import * as PIXI from 'pixi.js';
import {FederatedMouseEvent, FederatedPointerEvent, Graphics, Sprite} from 'pixi.js';
import {Viewport} from 'pixi-viewport';
import {ContextMenuActionTypes, ContextMenuItem} from '../app.types';
import {ViewportService} from '../viewport.service';
import {Subject, takeUntil} from 'rxjs';
import {DocPage} from './doc-page';


export class DocAnnotate {
	width = 250;
	height = 50;
	public uniqId: number = new Date().getTime();
	element?: Graphics;
	dragStarted = false;
	contextMenuItems: ContextMenuItem[] = [
		{
			actionType: ContextMenuActionTypes.Delete,
			title: 'Удалить',
			graphicItem: new Graphics(),
			payload: {id: this.uniqId}
		},
	];
	private _destroy = new Subject<void>();

	constructor(public parent: DocPage, private viewport: Viewport, private viewportService: ViewportService) {
	}

	initSubs(): void {
		if (!this.element) {
			return;
		}
		this.element.interactive = true;

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
		if (!this.element) {
			return;
		}

		this.element.on('mousedown', e => onDragStart(e));
		this.element.on('mousemove', e => onDragMove(e));
		this.element.on('mouseup', e => onDragEnd());
		this.element.on('mouseupoutside', e => onDragEnd());

		let offset = {x: 0, y: 0};

		const onDragStart = (event: FederatedMouseEvent) => {
			if (!this.element) return;
			this.dragStarted = true;
			// Записываем текущее смещение спрайта
			offset = {x: event.data.global.x - this.element.x, y: event.data.global.y - this.element.y};
		};

		const onDragMove = (event: FederatedMouseEvent) => {
			if (!this.element) return;
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
			console.log('element.y', this.element.y, this.parent.element.y, this.parent.element.height, this.parent.element.position.y);
		};

		const onDragEnd = () => {
			this.dragStarted = false;
			// Сбрасываем текущее смещение спрайта
			offset = {x: 0, y: 0};
		};
	}

	render(el: Sprite, event: FederatedPointerEvent): void {
		this.element = new PIXI.Graphics();
		this.element.beginFill(0xffffff)
			.drawRect(0, 0, this.width, this.height)
			.endFill().lineStyle(1, 0x000000)
			.drawRect(0, 0, this.element.width, this.element.height);
		this.element.x = el.width - this.width / 3;
		// todo если добавлять аннотацию в место клика, то можно использовать следующий код
		// this.element.x = event.x - el.x - this.viewport.x;
		this.element.y = event.y - el.y - this.viewport.y;

		el.addChild(this.element);
		this.initSubs();
		this.drugSubs();
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
