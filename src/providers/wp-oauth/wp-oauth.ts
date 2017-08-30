import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';
import {WpCredential} from './wp-credential';
import {WpCredentialError} from "./wp-errors";
import {WpOauthCypher} from "./wp-oauth-cypher";

/**
 * An OAuth provider class
 */
@Injectable()
export class WpOauthProvider {

  private credential: WpCredential;

  /**
   *
   */
  public authorize(){
    return WpOauthCypher.makeRequest(this.credential, 'GET', this.credential.requestTokenUrl)
      .toPromise().then((result) => {
        console.log(result);
      }).catch((error)=>{
        console.log(error);
      });
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
    [
      'accessTokenUrl',
      'authorizationUrl',
      'requestTokenUrl'
    ].forEach(function( prop ){
      if(!/^https?:\/\//.test(cred[prop])){
        throw new WpCredentialError( prop + ' is not properly set: ' + cred[prop] );
      }
    });
    if (!cred.callbackUrl) {
      cred.callbackUrl = 'oob';
    }
    return cred;
  }

}
