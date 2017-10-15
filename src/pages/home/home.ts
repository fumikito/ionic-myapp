import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { ToastController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { LoginPage } from "../login/login";
import { SpeechRecognition } from "@ionic-native/speech-recognition";
// import {EnvConfigurationProvider} from "gl-ionic2-env-configuration";
// import * as JsOAuth from '../../lib/jsoauth/jsoauth';
import { HTTP } from '@ionic-native/http';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  text: string = '';

  oauth: any;

  // config: any;

  author: any;

  isRecording: Boolean = false;

  isShowSubmit: Boolean = false;

  errorText: string = '';

  site_id: any;

  token: any;

  constructor(
    public navCtrl: NavController,
    public toastCtrl: ToastController,
    public storage: Storage,
    // private envConfiguration: EnvConfigurationProvider<any>,
    private speechRecognition: SpeechRecognition,
    public http: HTTP
  ) {
    // this.config = envConfiguration.getConfig();
    this.storage.get('name').then((name)=>{
      console.log('Constructor', name);
      if (name) {
        this.author = name;
      } else {
        this.navCtrl.push(LoginPage);
      }
    });
  }

  ionViewWillEnter() {
    this.isShowSubmit = this.author ? true : false;
  }

  record() {
    this.speechRecognition.isRecognitionAvailable()
      .then((available: boolean) => {
        if (available) {
          this.errorText = '';
          this.isRecording = true;
          return this.speechRecognition.hasPermission()
            .then((hasPermission: boolean) => {
              if (hasPermission) {
                this.startRecording();
              } else {
                this.speechRecognition.requestPermission()
                  .then(
                    () => {
                      this.startRecording();
                    },
                    () => {
                      this.errorText = '録音機能の利用が許可されませんでした。';
                      this.isRecording = false;
                    }
                  );
              }
            });
        } else {
          this.errorText = '録音機能が利用できません……手入力してください。';
          this.isRecording = false;
        }
      }, () => {
        this.errorText = '録音機能にアクセスできませんでした。';
        this.isRecording = false;
      });
  }

  clearText() {
    this.text = '';
  }

  stopRecording() {
    this.speechRecognition.stopListening().then(() => this.isRecording = false );
  }

  startRecording() {
      this.speechRecognition.startListening({
          language: "ja-JP",
      })
          .subscribe(
              (matches: Array<string>) => {
                  this.text = [ this.text, matches[0] ].join("\n");
              },
              (onerror) => {
                  this.errorText = '録音に失敗しました。やり直してください。';
              }
          );
  }

  submit() {

    // Get oauth
    // let config:any = {
    //   consumerKey: this.config.clientKey,
    //   consumerSecret: this.config.clientSecret
    // };

    let storage = this.storage;
    let author = this.author;
    let text = this.text;
    // let notify = this.notify;

    storage.get('site_id').then((value) => {
      this.site_id = value;
      storage.get('token').then((value) => {
        this.token = value;
        console.log('site_id', this.site_id);
        console.log('token', this.token);
        this.http.post('https://public-api.wordpress.com/rest/v1.2/sites/' + this.site_id + '/posts/new', {
          'title': '音声投稿されたコンテンツ',
          'author': author,
          'content': text,
          'status': 'draft'
        }, {Authorization : 'Bearer ' + this.token}).then((response) => {
          console.log('response', response);
          window.alert('投稿しました');
        }).catch((error) => {
          console.log('Error', error);
          // notify('エラーでした');
        });
      });
    });


    // storage.get('access_token').then(function(value){
    //   config.accessTokenKey = value;
    //   return storage.get('access_token_secret')
    // }).then(function(value){
    //   config.accessTokenSecret = value;
    //   let oauth = new JsOAuth.OAuth(config);
    //   oauth.post(
    //     "https://wpionic.tokyo/wp-json/wp/v2/posts",
    //     {
    //       title: '音声投稿されたコンテンツ',
    //       author: author,
    //       content: text
    //     },
    //     ( data ) => {
    //       window.alert('投稿しました');
    //     },
    //     ( data ) => {
    //       notify('エラーでした');
    //     }
    //   );
    // });


  }

  notify(string) {
    let toast = this.toastCtrl.create({
      message: string,
      duration: 3000
    });
    toast.present();
  }

}
