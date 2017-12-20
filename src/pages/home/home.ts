import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { ToastController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { LoginPage } from "../login/login";
import { SpeechRecognition } from "@ionic-native/speech-recognition";
import {EnvConfigurationProvider} from "gl-ionic2-env-configuration";
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
    private speechRecognition: SpeechRecognition,
    private wp: WpOauthProvider,
  ) {
    this.config = envConfiguration.getConfig();
    this.wp.setCredential({
      clientKey: this.config.clientKey.toString(),
      clientSecret: this.config.clientSecret.toString(),
      endpoint: this.config.endpoint.toString()
    });
    console.log(this.storage);
    alert(this.storage.driver);
    this.storage.ready().then(()=>{
      return this.storage.get('id');
    }).then((id)=>{
      alert(id);
      console.log('Constructor', id);
      if (id) {
        this.author = id;
      } else {
        this.navCtrl.push(LoginPage);
      }
    }).catch(()=>{
      alert('ストレージがない');
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
    if(!this.text.length){
      return this.notify('1文字もありません！');
    }
    this.storage.get('id').then(id=>{
      return this.wp.post('wp/v2/posts', {
        status: 'draft',
        title: '録音@' + (new Date()).toLocaleString(),
        content: this.text,
        author: id
      });
    }).then(res=>{
      this.text = '';
      this.notify('保存しました');
    }).catch((err)=>{
      console.log(err);
      this.notify('エラーが発生しました。');
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
