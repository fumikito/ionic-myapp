import { Component } from '@angular/core';
import { Platform, NavController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { InAppBrowser } from '@ionic-native/in-app-browser';

import {EnvConfigurationProvider} from "gl-ionic2-env-configuration";
import * as JsOAuth from '../../lib/jsoauth/jsoauth';

@Component({
  selector: 'page-about',
  templateUrl: 'about.html'
})
export class AboutPage {

  name: string = '';

  config: any;

  oauth: any;

  pin: string;

  user: any;

  constructor(
    public navCtrl: NavController,
    public storage: Storage,
    private envConfiguration: EnvConfigurationProvider<any>,
    private iab: InAppBrowser,
    private platform: Platform
  ) {
    platform.ready().then(() => {
      // Get local storage
      this.storage.get('user_name').then((value) => {
        this.name = value;
      });

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
    });
  }

  authorize():void{
    this.oauth.fetchRequestToken(
      (url) => {
        this.iab.create(url, 'auth');
      },
      (data) => {
        console.log('Error:', data)
      }
    );
  }


  retrieve(): void{
    this.oauth.setVerifier(this.pin);

    this.oauth.fetchAccessToken(() => {
      // Save access token
      this.oauth.get(
        "https://wpionic.tokyo/wp-json/wp/v2/users/me",
        ( data ) => {
          console.log('data: ',data);
          this.user = JSON.parse(data.text);
          console.log(this.user);
        },
        ( data ) => {
          console.log(data);
        }
      );
      // Do something
      this.oauth.post(
        "https://wpionic.tokyo/wp-json/wp/v2/posts",
        {
          'title': 'REST API',
          'author': 1,
          'content': 'はじめてのコンテンツ'
        },
        ( data ) => {
          console.log(JSON.parse(data.text));
        },
        ( data ) => {
          console.log(data);
        }
      );

    }, () => {
      throw new Error('Failed to fetch access token.');
    });
  }
}
