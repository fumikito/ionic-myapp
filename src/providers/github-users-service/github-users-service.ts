import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {User} from "./User";

/*
  Generated class for the GithubUsersServiceProvider provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable()
export class GithubUsersServiceProvider {

  constructor(public http: HttpClient) {
    console.log('Hello GithubUsersServiceProvider Provider');
  }

  getUsers(){
    return this.http.get<User[]>('https://hametuha.com/wp-json/wp/v2/posts/');
  }
}
