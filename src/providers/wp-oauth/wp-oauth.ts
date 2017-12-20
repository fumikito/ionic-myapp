import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import {Storage} from '@ionic/storage';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise'
import {WpCredential} from './wp-credential';
import {WpCredentialError} from "./wp-errors";
import {sha256} from "js-sha256";
import {stringify} from "query-string";
import {WpUser} from "./wp-user";

/**
 * An OAuth provider class
 */
@Injectable()
export class WpOauthProvider {

  private credential: WpCredential;

  constructor(public http: HttpClient, private storage: Storage) {

  }

  /**
   * Get path object.
   *
   * @param {string} url
   * @returns {string}
   */
  public getPath(url: string): string{
    return this.credential.endpoint + 'wp-json/' + url;
  }

  /**
   * Authorize request.
   */
  public authorize(name: string, password: string){
    let hash = name + password + this.credential.clientSecret;
    return this.http.post( this.getPath('bypath/v1/login'), {
      user_login: name,
      user_pass: password,
      client_key: this.credential.clientKey,
      token: sha256(hash)
    } );
  }

  /**
   * Get me.
   *
   * @param {String} token
   * @returns {Observable<Response>}
   */
  public me(token:string){
    let url = this.getPath( 'wp/v2/users/me' );

    return this.http.get<WpUser>(url, {
      headers: this.tokenHeader(token)
    });
  }

  private tokenHeader(token: string): HttpHeaders{
    let headers = new HttpHeaders();
    return headers.set('Authorization', 'Bypath ' + token);
  }

  public get(url, params:object = {}){
    url = this.getPath(url);
    if(Object.keys(params).length){
      url += '?' + stringify(params);
    }
    return this.storage.get('token').then((token)=>{
      return this.http.get(url, {
        headers: this.tokenHeader(token)
      }).toPromise();
    });
  }

  public post(url, data: object = {}): any{
    url = this.getPath(url);
    this.storage.get('token').then((token)=>{
      return this.http.post(url, data, {
        headers: this.tokenHeader(token)
      } ).toPromise();
    })
  }

  public setCredential(creds: WpCredential): void{
    this.credential = this.testCredential(creds);
  }

  public getCredential(): WpCredential{
    return this.credential;
  }

  /**
   * Test credential
   *
   * @param {WpCredential} cred
   * @returns {WpCredential}
   */
  private testCredential(cred: WpCredential): WpCredential{
    if ( ! cred.clientKey.length || ! cred.clientSecret.length   ) {
      throw new WpCredentialError( 'Client Key and Client Secret are not properly set.' );
    }
    if(!/^https?:\/\//.test(cred.endpoint)){
      throw new WpCredentialError( 'Endpoint URL is not properly set: ' + cred.endpoint );
    }
    return cred;
  }

}
