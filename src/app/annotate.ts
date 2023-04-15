import * as PIXI from 'pixi.js';
import {FederatedPointerEvent, Graphics, Sprite} from 'pixi.js';
import {Viewport} from 'pixi-viewport';
import {EventEmitter} from '@angular/core';

export type ContextMenuItem = {
	title: string;
	graphicItem: Graphics;
}

export class Annotate {
	showedContextMenu = false;
	element?: Graphics;
	contextMenu?: Graphics;

	contextMenuItems: ContextMenuItem[] = [];

	clickContextMenu = new EventEmitter<ContextMenuItem>();

	constructor(private viewport: Viewport) {
	}

	initContextMenuItems(): void {
		this.contextMenuItems = [
			{title: 'Добавить текст', graphicItem: new Graphics()},
			{title: 'Добавить картинку', graphicItem: new Graphics()},
		];

		this.contextMenuItems.forEach((el, i) => {
			if (!this.contextMenu) return;


			const elemHeight = Math.floor(this.contextMenu.height / this.contextMenuItems.length) - 3;
			el.graphicItem.beginFill(0x33ff11).drawRect(0, i === 0 ? 0 : elemHeight + 3, this.contextMenu.width, elemHeight).endFill();

			const text = new PIXI.Text(el.title, {
				fontFamily: 'Arial',
				fontSize: 14,
				fill: 0x000000
			});
			el.graphicItem.addChild(text);
			el.graphicItem.interactive = true;
			text.position.y = i === 0 ? 0 : el.graphicItem.position.y + elemHeight;
			text.position.y += elemHeight / 2;

			this.contextMenu.addChild(el.graphicItem);

			el.graphicItem.once('click', () => {
				this.clickContextMenu.emit(el);
			});

		});
	}

	render(el: Sprite, event: FederatedPointerEvent): void {
		this.element = new PIXI.Graphics();


		this.element.beginFill(0xffffff)
			.drawRect(0, 0, 250, 50)
			.endFill().lineStyle(1, 0x000000)
			.drawRect(0, 0, this.element.width, this.element.height);
		this.element.x = event.x - el.x - this.viewport.x;
		this.element.y = event.y - el.y - this.viewport.y;

		el.addChild(this.element);

		this.element.interactive = true;
		this.initListeners();

	}

	initListeners(): void {
		this.element?.addEventListener('rightclick', (event) => this.showContextMenu(event));
	}

	showContextMenu(event: FederatedPointerEvent): void {
		if (this.showedContextMenu) {
			this.showedContextMenu = false;
			this.contextMenu?.destroy();
			return;
		}

		this.showedContextMenu = true;
		this.contextMenu = new PIXI.Graphics();

		this.contextMenu.beginFill(0x000000)
			.drawRect(0, 0, 250, 100)
			.endFill()
			.lineStyle(1, 0xffff00)
			.drawRect(0, 0, this.contextMenu.width, this.contextMenu.height);

		this.viewport?.addChild(this.contextMenu);

		this.contextMenu.x = event.x - 10;
		this.contextMenu.y = event.y - 10;

		this.initContextMenuItems();

		this.contextMenu.interactive = true;
		this.contextMenu.addEventListener('mouseleave', (event) => {
			this.contextMenu?.destroy();
			this.showedContextMenu = false;
		});

		this.viewport.once('click', () => {
			this.contextMenu?.destroy();
			this.showedContextMenu = false;
		});
	}

}
