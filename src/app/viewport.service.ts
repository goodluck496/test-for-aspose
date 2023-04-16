import {Inject, Injectable} from '@angular/core';
import {PIXI_VIEWPORT} from './app.module';
import {Viewport} from 'pixi-viewport';
import {ContextMenuActionTypes, ContextMenuItem} from './app.types';
import * as PIXI from 'pixi.js';
import {FederatedPointerEvent, Graphics} from 'pixi.js';
import {Subject} from 'rxjs';
import {DocAnnotate} from './elements/doc-annotate';
import {DocPage} from './elements/doc-page';
import {DocImage} from './elements/doc-image';

@Injectable()
export class ViewportService {

	disableGlobalContextMenu = false;
	showedContextMenu = false;
	contextMenu?: Graphics;
	contextMenuItemHeight = 50;

	contextMenuItems: ContextMenuItem[] = [
		{
			actionType: ContextMenuActionTypes.AddImageToContainer,
			title: 'Zoom +',
			graphicItem: new Graphics()
		},
		{
			actionType: ContextMenuActionTypes.AddAnnotate,
			title: 'Zoom -',
			graphicItem: new Graphics()
		}
	];

	clickContextMenu = new Subject<ContextMenuItem>();

	constructor(
		@Inject(PIXI_VIEWPORT) private viewport: Viewport,
	) {
		this.initSubs();
	}

	initSubs(): void {
		this.viewport?.addEventListener('rightclick', (event) => this.showContextMenu(event));
	}

	initContextMenuItems(event: FederatedPointerEvent, items = this.contextMenuItems): void {
		items.forEach((el, i) => {
			if (!this.contextMenu) return;
			el.graphicItem.beginFill(0x33ff11).drawRect(0, i === 0 ? 0 : this.contextMenuItemHeight + 3, this.contextMenu.width, this.contextMenuItemHeight).endFill();

			const text = new PIXI.Text(el.title, {
				fontFamily: 'Arial',
				fontSize: 14,
				fill: 0x000000
			});
			el.graphicItem.addChild(text);
			el.graphicItem.interactive = true;
			text.position.y = i === 0 ? 0 : el.graphicItem.position.y + this.contextMenuItemHeight;
			text.position.y += this.contextMenuItemHeight / 2;

			this.contextMenu.addChild(el.graphicItem);

			el.graphicItem.once('click', () => {
				this.clickContextMenu.next({...el, payload: {...el.payload, event}});
			});
		});
	}

	showContextMenu(event: FederatedPointerEvent, element?: DocAnnotate | DocPage | DocImage, contextMenuItems = this.contextMenuItems): void {
		if (this.disableGlobalContextMenu) {
			return;
		}
		if (this.showedContextMenu) {
			this.destroyContextMenu();
			return;
		}
		if (element) {
			this.disableGlobalContextMenu = true;
		}
		this.showedContextMenu = true;

		this.contextMenu = new PIXI.Graphics();
		this.contextMenu.interactive = true;

		this.contextMenu.beginFill(0x000000)
			.drawRect(0, 0, 250, contextMenuItems.length * this.contextMenuItemHeight)
			.endFill()
			.lineStyle(1, 0xffff00)
			.drawRect(0, 0, this.contextMenu.width, this.contextMenu.height);

		this.viewport?.addChild(this.contextMenu);

		this.contextMenu.x = event.x - 10;
		this.contextMenu.y = event.y - this.viewport.y - 10;

		this.initContextMenuItems(event, contextMenuItems);

		this.viewport.once('click', () => {
			this.destroyContextMenu(contextMenuItems);
		});

		this.viewport.once('rightclick', () => {
			if (this.disableGlobalContextMenu) {
				return;
			}
			this.destroyContextMenu(contextMenuItems);
			this.showContextMenu(event, element, contextMenuItems);
		});
	}

	destroyContextMenu(contextMenuItems = this.contextMenuItems): void {
		if (this.disableGlobalContextMenu) {
			this.disableGlobalContextMenu = false;
		}
		if (!this.showedContextMenu || !this.contextMenu || this.contextMenu?.destroyed) {
			return;
		}

		this.showedContextMenu = false;
		contextMenuItems.forEach(el => el.graphicItem = new Graphics());
		this.contextMenu?.destroy();
		this.contextMenu = undefined;
	}

}
