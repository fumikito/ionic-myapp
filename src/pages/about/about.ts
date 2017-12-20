import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import {EnvConfigurationProvider} from "gl-ionic2-env-configuration";
import {LoginPage} from "../login/login";
import {WpUser} from "../../providers/wp-oauth/wp-user";

@Component({
  selector: 'page-about',
  templateUrl: 'about.html'
})
export class AboutPage {

  name: string = '';

  config: any;

  user: WpUser;

  constructor(
    public navCtrl: NavController,
    public storage: Storage,
    private envConfiguration: EnvConfigurationProvider<any>,
  ) {
    // Get local storage
    this.storage.get('user').then((value)=>{
      console.log(value);
      this.name = value.name;
      this.user = value;
    });

    // Get config value
    this.config = envConfiguration.getConfig();
  }

  logout(){
    this.name = '';
    this.user = null;
    alert('いまからログ会うtします。');
    console.log(this.storage);
    this.storage.get('token').then((val)=>alert(val)).catch(()=>alert('なかった'));

    this.storage.remove('token').then(()=>{
      return this.storage.remove('user');
    }).then(()=>{
      return this.storage.remove('id');
    }).then(()=>{
      this.navCtrl.push(LoginPage);
    }).catch(()=>{
      alert('ログアウトできませんでした。');
    });

  }
}
