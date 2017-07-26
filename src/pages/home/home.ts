import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { ToastController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { LoginPage } from "../login/login";
import {EnvConfigurationProvider} from "gl-ionic2-env-configuration";
import * as JsOAuth from '../../lib/jsoauth/jsoauth';


@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  text: string = '';

  oauth: any;

  config: any;

  author: Number = 0;

  constructor(
    public navCtrl: NavController,
    public toastCtrl: ToastController,
    public storage: Storage,
    private envConfiguration: EnvConfigurationProvider<any>,
  ) {
    this.config = envConfiguration.getConfig();
    this.storage.get('id').then((id)=>{
    console.log('Constructor', id);
      if (id) {
        this.author = id;
      } else {
        this.navCtrl.push(LoginPage);
      }
    });
  }

  record() {
    this.text = '録音が完了しました';
  }

  submit() {

    // Get oauth
    let config:any = {
      consumerKey: this.config.clientKey,
      consumerSecret: this.config.clientSecret
    };

    let storage = this.storage;
    let author = this.author;
    let text = this.text;
    let notify = this.notify;

    storage.get('access_token').then(function(value){
      config.accessTokenKey = value;
      return storage.get('access_token_secret')
    }).then(function(value){
      config.accessTokenSecret = value;
      let oauth = new JsOAuth.OAuth(config);
      oauth.post(
        "https://wpionic.tokyo/wp-json/wp/v2/posts",
        {
          title: '音声投稿されたコンテンツ',
          author: author,
          content: text
        },
        ( data ) => {
          window.alert('投稿しました');
        },
        ( data ) => {
          notify('エラーでした');
        }
      );
    });


  }

  notify(string) {
    let toast = this.toastCtrl.create({
      message: string,
      duration: 3000
    });
    toast.present();
  }

}
