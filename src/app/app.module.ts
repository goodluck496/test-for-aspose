import {InjectionToken, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppComponent} from './app.component';
import * as PIXI from 'pixi.js';
import {Application} from 'pixi.js';
import {Viewport} from 'pixi-viewport';

export const PIXI_APP = new InjectionToken<Application>('PIXI_APP_TOKEN');

export const PIXI_VIEWPORT = new InjectionToken<Viewport>('PIXI_VIEWPORT_TOKEN');

@NgModule({
	declarations: [
		AppComponent
	],
	imports: [
		BrowserModule
	],
	providers: [
		{
			provide: PIXI_APP, useFactory: () => {
				return new PIXI.Application({
					width: window.innerWidth,
					height: window.innerHeight,
					backgroundColor: 0x1099bb,
					resizeTo: window,
				});
			}
		},
		{
			provide: PIXI_VIEWPORT, useFactory: (pixiApp: PIXI.Application) => {
				const viewport = new Viewport({
					screenWidth: pixiApp.screen.width,
					screenHeight: pixiApp.screen.height,
					events: pixiApp.renderer.events,
				});

				pixiApp.stage.addChild(viewport);
				viewport
					.drag({
						pressDrag: false,
						wheel: false,
						clampWheel: false,
					})
					.pinch()
					.wheel({
						wheelZoom: false,
						interrupt: true,
					})
					.clampZoom({
						minScale: 0.5,
						maxScale: 2
					})
					.decelerate();

				return viewport;

			}, deps: [PIXI_APP]
		}
	],
	bootstrap: [AppComponent]
})
export class AppModule {
}
