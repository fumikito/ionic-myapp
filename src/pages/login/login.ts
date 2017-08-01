import {Component} from '@angular/core';
import {IonicPage, NavController, NavParams} from 'ionic-angular';
import {Storage} from '@ionic/storage';
import {InAppBrowser, InAppBrowserEvent} from '@ionic-native/in-app-browser';
import {EnvConfigurationProvider} from "gl-ionic2-env-configuration";
import * as JsOAuth from '../../lib/jsoauth/jsoauth';
import {HomePage} from "../home/home";

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

  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              public storage: Storage,
              private envConfiguration: EnvConfigurationProvider<any>,
              private iab: InAppBrowser) {
    // Get config value
    this.config = envConfiguration.getConfig();
    // Get oauth
    this.oauth = new JsOAuth.OAuth({
      consumerKey: this.config.clientKey,
      consumerSecret: this.config.clientSecret,
      requestTokenUrl: this.config.requestTokenUrl,
      authorizationUrl: this.config.authorizationUrl,
      accessTokenUrl: this.config.accessTokenUrl,
      callbackUrl: 'oob'
    });
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad LoginPage');
  }

  authenticate(): void {
    this.oauth.fetchRequestToken(
      (url) => {
        let browser = this.iab.create(url, 'auth');
        browser.on('loadstop').subscribe((event: InAppBrowserEvent) => {
          console.log(event);
          browser.executeScript('alert(\'Loaded!\')').then((result) => {
            console.log(result);
          });
        });
      },
      (data) => {
        console.log('Error:', data)
      }
    );
  }

  retrieve(): void {
    this.oauth.setVerifier(this.pin);

    let storage = this.storage;
    let nav = this.navCtrl;
    let oauth = this.oauth;
    this.oauth.fetchAccessToken(() => {
      // Save access token
      storage.set('access_token', oauth.getAccessTokenKey()) // Promise が帰ってきている
        .then(() => {
        return storage.set('access_token_secret', oauth.getAccessTokenSecret());
      }).then(() => {
        console.log('Get!', storage);
        oauth.get('https://wpionic.tokyo/wp-json/wp/v2/users/me', (data) => {
          let user = JSON.parse(data.text);
          console.log('User: ', user, data);
          storage.set('id', user.id).then(()=>{
            nav.push(HomePage);
          });
        });
      });
    }, () => {
      throw new Error('Failed to fetch access token.');
    });

  }
}
