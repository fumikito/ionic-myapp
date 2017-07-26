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
        // browser.on('loadstop').subscribe((event: InAppBrowserEvent) => {
        //   console.log(event);
        //   browser.executeScript('alert(\'Loaded!\')').then((result) => {
        //     console.log(result);
        //   });
        // });
      },
      (data) => {
        console.log('Error:', data)
      }
    );
  }

  retrieve(): void {
    this.oauth.setVerifier(this.pin);

    this.oauth.fetchAccessToken(() => {
      // Save access token
      this.storage.set('access_token', this.oauth.getAccessTokenKey()).then(() => {
        return this.storage.set('access_token_secret', this.oauth.getAccessTokenSecret());
      }).then(() => {
        console.log('Get!', this.storage);
        this.oauth.get('https://wpionic.tokyo/wp-json/wp/v2/users/me', (data) => {
          let user = JSON.parse(data.text);
          console.log('User: ', user, data);
          this.storage.set('user', user.id).then(()=>{
            this.navCtrl.push(HomePage);
          });
        });
      });
    }, () => {
      throw new Error('Failed to fetch access token.');
    });

  }
}
