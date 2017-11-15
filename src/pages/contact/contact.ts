import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
// import { GithubUsersServiceProvider } from '../../providers/github-users-service/github-users-service';
import { User } from '../../providers/github-users-service/User';

@Component({
  selector: 'page-contact',
  templateUrl: 'contact.html'
})
export class ContactPage {

  users: User[];

  constructor(
    public navCtrl: NavController,
    // private githubUsersService: GithubUsersServiceProvider
  ) {
    // githubUsersService.getUsers()
    //   .subscribe(users => {
    //       this.users = users;
    //     },
    //     err => console.log(err),
    //     () => {});
  }

}
