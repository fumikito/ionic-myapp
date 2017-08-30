import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { ToastController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { LoginPage } from "../login/login";
import { SpeechRecognition } from "@ionic-native/speech-recognition";
import {EnvConfigurationProvider} from "gl-ionic2-env-configuration";
import * as JsOAuth from '../../lib/jsoauth/jsoauth';
import {WpOauthProvider} from "../../providers/wp-oauth/wp-oauth";

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  text: string = '';

  oauth: any;

  config: any;

  author: Number = 0;

  isRecording: Boolean = false;

  errorText: string = '';

  constructor(
    public navCtrl: NavController,
    public toastCtrl: ToastController,
    public storage: Storage,
    private envConfiguration: EnvConfigurationProvider<any>,
    private speechRecognition: SpeechRecognition
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

  fetchToken(){
    let accessToken = '';
    let accessTokenSecret = '';
    this.storage.get('access_token').then(function(value) {
      accessToken = value;
      return this.storage.get('access_token_secret');
    }).then((val)=>{
      accessTokenSecret = val;
      let wp = new WpOauthProvider();
      wp.setCredential({
        clientKey: this.config.clientSecret,
        clientSecret: this.config.clientSecret,
        accessToken: '',
        accessTokenSecret: '',
        requestTokenUrl: this.config.requestTokenUrl,
        authorizationUrl: this.config.authorizationUrl,
        accessTokenUrl: this.config.accessTokenUrl,
        callbackUrl: 'oob',
        verifier: ''
      });
      wp.authorize();
    });
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
