import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { ToastController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { AboutPage } from "../about/about";


@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  name: string = '';

  password: string = '';

  constructor(
    public navCtrl: NavController,
    public toastCtrl: ToastController,
    public storage: Storage
  ) {}

  submit() {
    this.storage.set('user_name', this.name)
      .then(()=>{
        return this.storage.set('user_pass', this.password);
      })
      .then(()=>{
        this.navCtrl.push(AboutPage);
      });
  }

  presentToast() {
    let toast = this.toastCtrl.create({
      message: 'ボタンが押されたよ',
      duration: 3000
    });
    toast.present();
  }

}
