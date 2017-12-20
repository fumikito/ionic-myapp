import {Component} from '@angular/core';
import {IonicPage, NavController, NavParams, ToastController} from 'ionic-angular';
import {Storage} from '@ionic/storage';
import {EnvConfigurationProvider} from "gl-ionic2-env-configuration";
import {WpOauthProvider} from "../../providers/wp-oauth/wp-oauth";
import {HomePage} from "../home/home";

interface AuthResult {
  token: string;
}


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

  user_pass: string;

  user_name: string;

  pin: String;

  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              public toastCtrl: ToastController,
              public storage: Storage,
              private envConfiguration: EnvConfigurationProvider<any>,
              private wp: WpOauthProvider
  ){
    // Get config value
    this.config = envConfiguration.getConfig();
    console.log(this.config);
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad LoginPage');
  }

  authenticate(): void {
    this.wp.authorize( this.user_name, this.user_pass ).subscribe(
      response=>{
        let result = response as AuthResult;
        this.storage.set('token', result.token).then(()=>{
          this.wp.me(result.token).subscribe(
            res=>{
              this.storage.set('id', res.id).then(()=>{
                return this.storage.set('user', res);
              }).then(()=>{
                this.navCtrl.push(HomePage);
              });
            },
            err=>{
              console.log(err);
            }
          )
        });
      },
      err => {
        console.log(err);
        let toast = this.toastCtrl.create({
          message: err.json().message,
          duration: 3000
        });
        toast.present();
      }
    );
  }

}
