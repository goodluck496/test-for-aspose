import {Injectable} from '@angular/core';
import {ImagePage} from './app.types';
import {Observable, of} from 'rxjs';

@Injectable()
export class ApiService {

	loadPages(): Observable<ImagePage[]> {
		return of([
			{id: 1, url: 'assets/images/1.png', annotations: []},
			{id: 2, url: 'assets/images/2.png', annotations: []},
			{id: 3, url: 'assets/images/3.png', annotations: []},
			{id: 4, url: 'assets/images/4.png', annotations: []},
			{id: 5, url: 'assets/images/5.png', annotations: []},
		]);
	}
}
