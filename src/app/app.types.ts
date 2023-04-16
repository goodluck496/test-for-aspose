import {Graphics} from 'pixi.js';
import {DocAnnotate} from './elements/doc-annotate';


export type ImagePage = {
	id: number;
	annotations: DocAnnotate[];
	url: string;
}

export enum ContextMenuActionTypes {
	AddAnnotate,
	AddImageToContainer,
	Delete
}

export type ContextMenuItem = {
	actionType: ContextMenuActionTypes;
	title: string;
	graphicItem: Graphics;
	payload?: { id: number } | any;
}
