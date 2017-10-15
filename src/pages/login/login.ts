import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { InAppBrowser, InAppBrowserEvent } from '@ionic-native/in-app-browser';
import { EnvConfigurationProvider } from "gl-ionic2-env-configuration";
// import * as JsOAuth from '../../lib/jsoauth/jsoauth';
import { HomePage } from "../home/home";
import { HTTP } from '@ionic-native/http';

/**
 * Generated class for the LoginPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@IonicPage()
@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})
export class LoginPage {

  config: any;

  oauth: any;

  pin: String;

  accessToken: any;

  response: any;

  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              public storage: Storage,
              private envConfiguration: EnvConfigurationProvider<any>,
              private iab: InAppBrowser,
              public http: HTTP) {
      // Get config value
      this.config = this.envConfiguration.getConfig();
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad LoginPage');
  }

  logout():void{
    this.storage.clear().then(() => {
      this.navCtrl.push(HomePage);
    });
  }

  authenticate(): void {
        let storage = this.storage;
        let nav = this.navCtrl;

        const redirectUri = this.config.redirectUri;
        const clientId = this.config.clientId;
        const clientSecret = this.config.clientSecret;
        let browser = this.iab.create('https://public-api.wordpress.com/oauth2/authorize?client_id=' + clientId + '&redirect_uri=' + redirectUri + '&response_type=code&blog=https://kaizumaki.wordpress.com', '_blank');
        browser.on('loadstop').subscribe((event: InAppBrowserEvent) => {
            if(event.url.indexOf('?code=') > -1) {
              const responseParameters = event.url.split('?')[1].split('&');
              const parsedResponse = {};
              for (let i = 0; i < responseParameters.length; i++) {
                parsedResponse[responseParameters[i].split('=')[0]] = responseParameters[i].split('=')[1];
              }
              console.log(parsedResponse);
              const code = parsedResponse['code'];
              this.http.post('https://public-api.wordpress.com/oauth2/token', {
                'client_id': clientId,
                'client_secret': clientSecret,
                'redirect_uri': redirectUri,
                'grant_type': 'authorization_code',
                'code': code
              }, {})
              .then((response) => {
                  this.response = response;
                  let responseData = this.response.data.replace(/\\"/g, '"');
                  let jsonData = JSON.parse(responseData);
                  this.accessToken = jsonData.access_token;
                  storage.clear().then(() => {
                    storage.set('token', this.accessToken);
                  });
              }).then(() => {
                this.http.get('https://public-api.wordpress.com/rest/v1/me', {},{Authorization : 'Bearer ' + this.accessToken}).then((response) => {
                    this.response = response;
                    let responseData = this.response.data.replace(/\\"/g, '"');
                    let jsonData = JSON.parse(responseData);
                    console.log(jsonData);
                    let siteId = jsonData.primary_blog;
                    let name = jsonData.display_name;
                    storage.set('name', name);
                    storage.set('site_id', siteId).then(()=>{
                      browser.close();
                      nav.push(HomePage);
                      nav.parent.select(0);
                    });
                  });
              }).catch((error) => {
                console.log('Error:', error);
              });
            }
        });
  }

  retrieve(): void {
    // this.oauth.setVerifier(this.pin);

    // let storage = this.storage;
    // let nav = this.navCtrl;
    // let oauth = this.oauth;
    // this.oauth.fetchAccessToken(() => {
    //   // Save access token
    //   storage.set('access_token', oauth.getAccessTokenKey()) // Promise が帰ってきている
    //     .then(() => {
    //     return storage.set('access_token_secret', oauth.getAccessTokenSecret());
    //   }).then(() => {
    //     console.log('Get!', storage);
    //     oauth.get('https://wpionic.tokyo/wp-json/wp/v2/posts', (data) => {
    //       let user = JSON.parse(data.text);
    //       console.log('User: ', user, data);
    //       storage.set('id', user.id).then(()=>{
    //         nav.push(HomePage);
    //       });
    //     });
    //   });
    // }, () => {
    //   throw new Error('Failed to fetch access token.');
    // });

  }
}
