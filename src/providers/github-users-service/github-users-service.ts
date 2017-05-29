import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import { User } from './User';

/*
  Generated class for the GithubUsersServiceProvider provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable()
export class GithubUsersServiceProvider {

  constructor(public http: Http) {
    console.log('Hello GithubUsersServiceProvider Provider');
  }

  getUsers(): Observable<User[]>{
    return this.http.get('https://hametuha.com/wp-json/wp/v2/posts/')
      .map(res => <Array<User>>res.json());
  }
}
