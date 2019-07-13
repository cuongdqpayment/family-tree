import { Component, } from '@angular/core';
import { LoadingController, ModalController, NavController, Events } from 'ionic-angular';
import { ApiContactService } from '../../services/apiContactService';
import { ApiAuthService } from '../../services/apiAuthService';
import { ApiStorageService } from '../../services/apiStorageService';
import { ApiChatService } from '../../services/apiChatService';
import { HomeChatPage } from '../home-chat/home-chat';
import { FriendsPage } from '../friends/friends';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { DynamicPostPage } from '../dynamic-post/dynamic-post';

@Component({
  selector: 'page-dynamic-home',
  templateUrl: 'dynamic-home.html',
})
export class DynamicHomePage {

  serverNews: string = "http://localhost:9238/site-manager/news";

  dynamicTree: any = {
    title: "Trang chủ mẫu",
    items: []
  };

  maxOnePage = 6;
  curPageIndex = 0;
  lastPageIndex = 0;
  maxPage = 10; //toi da cua trang de khong bi lag

  contacts = {}  // this.apiContact.getUniqueContacts()

  userInfo: any; // this.apiAuth.getUserInfo()
  token: any;     // this.apiStorage.getToken() hoac ApiStorageService.token

  isLoaded: boolean = true;

  mySocket:any;
  unreadMssages: any;
  privateMessages: any;
  roomsMessages: any;

  chatRooms: any;
  chatFriends: any;
  chatNewFriends: any;
  
  constructor(private navCtrl: NavController
            , private apiContact: ApiContactService
            , private apiChat: ApiChatService
            , private apiAuth: ApiAuthService
            , private apiStorage: ApiStorageService
            , private loadingCtrl: LoadingController
            , private inAppBrowser: InAppBrowser
            , private modalCtrl: ModalController
            , private events: Events
          ) { }

  ngOnInit() {

    setTimeout(() => {
      console.log("123: ", this.dynamicTree.items[5])
    }, 2000);

    this.refreshNews();

    this.events.subscribe('event-main-login-checked'
      , (data => {

        this.token = data.token;
        this.userInfo = data.user;

        this.contacts = this.apiContact.getUniqueContacts();

        //console.log('Contact for new',this.contacts);
        //them danh ba cua nguoi login vao
        if (this.userInfo&&this.userInfo.data) {
          if (!this.contacts[this.userInfo.username]) {
            Object.defineProperty(this.contacts, this.userInfo.username, {
              value: {
                fullname: this.userInfo.data.fullname,
                nickname: this.userInfo.data.nickname,
                image: this.userInfo.data.image ? this.userInfo.data.image : undefined,
                avatar: this.userInfo.data.avatar ? this.userInfo.data.avatar : this.userInfo.data.image,
                relationship: ['private']
              },
              writable: true, enumerable: true, configurable: true
            });
          } else {
            if (this.userInfo.data.image){
              this.contacts[this.userInfo.username].image = this.userInfo.data.image;
              this.contacts[this.userInfo.username].avatar = this.userInfo.data.avatar ? this.userInfo.data.avatar : this.userInfo.data.image;
            } 
          }
        }
        //doi 3 giay sau neu login tu dong bang token
        //thi moi lay thong tin cua user
        setTimeout(() => {
          this.getHomeNews(true);
        }, 3000);
      })
    )


    this.events.subscribe('event-chat-init-room'
      , (data => {
        this.mySocket = data.my_socket;
        this.unreadMssages = data.unread_messages;
        this.privateMessages = data.private_messages;
        this.roomsMessages = data.rooms_messages;
        this.chatRooms = data.rooms;
        this.chatFriends = data.friends;
        this.chatNewFriends = data.new_friends;

      })
    )

  }


  async refreshNews() {
    //lay publicUser truoc tien roi moi tiep tuc cac buoc khac
    let publicUsers = await this.apiContact.getPublicUsers(true);
    //neu co roi thi moi di checking login

    //thong tin tu public user
    this.token = this.apiStorage.getToken();
    this.userInfo = this.apiAuth.getUserInfo();
    this.contacts = this.apiContact.getUniqueContacts();

    this.getHomeNews(true);

    //this.dynamicTree.items.push(items);
    //doc tu bo nho len lay danh sach da load truoc day ghi ra 
    //this.dynamicTree = this.apiStorage.getHome();
    let chattingData = this.apiChat.getRoomsFriends();

    this.mySocket = chattingData.my_socket;
    this.unreadMssages = chattingData.unread_messages;
    this.privateMessages = chattingData.private_messages;
    this.roomsMessages = chattingData.rooms_messages;

    this.chatRooms = chattingData.rooms;
    this.chatFriends = chattingData.friends;
    
    this.chatNewFriends = chattingData.new_friends;


  }

  /** lay tin tuc moi nhat */
  getHomeNews(isRenew?: boolean) {
    if (isRenew) {
      this.lastPageIndex = this.curPageIndex > 0 ? this.curPageIndex : this.lastPageIndex;
      this.curPageIndex = 0;
    }else{
      this.lastPageIndex = this.curPageIndex > this.lastPageIndex ? this.curPageIndex : this.lastPageIndex;
    }
    this.getJsonPostNews(this.userInfo ? true : false)
      .then(items => {
        if (isRenew) {
          let isHaveNew = false;
          items.reverse().forEach((el, idx) => {
            let index = this.dynamicTree.items
              .findIndex(x => x.group_id === el.group_id);
            //console.log(idx, el, index);
            if (index >= 0) {
              //this.dynamicTree.items.splice(index, 1, el);
            } else {
              this.dynamicTree.items.unshift(el);
              isHaveNew = true;
            }
          })
          if (isHaveNew && this.lastPageIndex > 0) this.lastPageIndex--;
        } else {
          this.curPageIndex = this.curPageIndex < this.lastPageIndex ? this.lastPageIndex : this.curPageIndex;
          items.forEach((el, idx) => {
            let index = this.dynamicTree.items
              .findIndex(x => x.group_id === el.group_id);
            //console.log(idx,el, index);  
            if (index >= 0) {
              //this.dynamicTree.items.splice(index, 1, el);
            } else {
              this.dynamicTree.items.push(el);
            }
          })
        }
        //Array.prototype.push.apply(this.dynamicTree.items,items);
      })
      .catch(err => { })
      ;
  }

  /**
   * thuc hien post json gom:
   * token,
   * contacts list user 
   * result: 
   * server se kiem tra token 
   * neu co token se doc tin cua user + tin cua contacts moi nhat
   * neu khong co token hoac khong hop le
   * sever tra ket qua la tin public cua contact truyen len
   * 
   */
  getJsonPostNews(isToken?: boolean) {

    let offset = this.curPageIndex * this.maxOnePage;
    let limit = this.maxOnePage;

    let follows = [];
    for (let key in this.contacts) {
      follows.push(key);
    }

    let json_data = {
      limit: limit,
      offset: offset,
      follows: follows
    }
    //console.log('json_data',json_data);

    return this.apiAuth.getDynamicUrl('assets/data/url-info.json')
      .then(data => {
        let items = [];
        let i = 0;
        data.forEach(el => {
          el.group_id = ++i + '-' + Date.now()
          items.push(el);
        });

        if (items.length > 0) this.curPageIndex++;
        //da doc duoc trang 1
        return items;

      })
      .catch(err => { return [] })
  }


  onClickMore(event){
    console.log('more',event);
  }


  onClickPostNews(user){
    this.openModal(DynamicPostPage,{
      parent: this,
      callback: this.callBackProcess,
      form:{
        status:1,   //hình thức chia sẻ công khai
        content:"", //cho phép nhập nội dung để post
        medias: [], //cho phép chọn ảnh hoặc video để post
        files: [],  //Cho phép chọn file để gửi
        action:{name:"Đăng tin", next: "CALLBACK", url: this.serverNews + "/post-news"}
      }
    })
  }

  onClickChatUser() {
    //ktra user cua minh login tu dau:
    // cai nay yc co mat khau tu dat 
    // ktra xac thuc voi may chu ok thi list ra ktra
    console.log('my socket', this.mySocket);
  }

  //vao trang home-chat
  onClickChatRoom() {
    this.navCtrl.push(HomeChatPage, {
      parent: this,             //biet goi parent
      my_socket: this.mySocket, //thong tin owner
      token: this.token,       //thong tin owner
      user: this.userInfo,     //thong tin owner

      unread_messages: this.unreadMssages, //thong tin chua doc
      rooms: this.chatRooms,    //thong tin dang online chat
      private_messages: this.privateMessages,    //thong tin dang online chat
      rooms_messages: this.roomsMessages,    //thong tin dang online chat

      contacts: this.contacts, //thong tin cua user co anh dai dien unique
      friends: this.chatFriends //thong tin ban be chat (<contacts array)
      //neu rooms co > 2 user thi goi la room neu khong goi la ca nhan 
      //
    });
  }

  //thuc hien ket ban
  onClickChatFriend() {
    this.openModal(FriendsPage, {
      user: this.userInfo,
      parent: this,
      contacts: this.contacts,
      friends: this.chatFriends,
      new_friends: this.chatNewFriends
    })
  }

  doInfinite(infiniteScroll, direction) {
    if (direction === 'UP') {
      console.log('UP', this.curPageIndex, this.lastPageIndex);
      if (!this.isLoaded) {
        this.getHomeNews(true);
      }
      setTimeout(() => {
        this.isLoaded = true;
        infiniteScroll.complete();
      }, 1000);
    } else {
      //console.log('DOWN', this.curPageIndex, this.lastPageIndex);
      this.getHomeNews(false);
      this.isLoaded = false; //khi keo xuong duoi thi o tren moi cho phep
      setTimeout(() => {
        infiniteScroll.complete();
      }, 1000);
    }

  }

  onClickMedia(event,id) {
    console.log('media',id,event);
    //Đọc các hỉnh ở it.medias 
  }

  onClickImage(event,id) {
    console.log('image',id,event);
    //đọc các hình ở link callback, popup cửa sổ hình ảnh lên cho phép comment từng hình???

    // this.modalCtrl
    // .create(ssss, {images:event.original})
    // .present();

  }

  onClickOpenLink(event){
    //console.log('content',event.link);
    //popup inappBrowser link
    if (event.link&&event.link.url){
      var target = "_blank"; //mo trong inappbrowser
      var options = "hidden=no,toolbar=yes,location=yes,presentationstyle=fullscreen,clearcache=yes,clearsessioncache=yes";
      this.inAppBrowser.create(event.link.url, target, options);
    }
  }

  /**
   * Khi bấm hành động like, comment, share
   * @param event 
   * @param id 
   */
  onClickAction(event,id){
    console.log(id,event);
  }

  //neu user cua user = voi user dang login
  onClickShortDetails(item) {
    //console.log('short details', this.userInfo.username, item.user);
    if (this.userInfo
      &&item.user===this.userInfo.username){
      console.log('Menu của user, có quyền ẩn tin tức này hoặc chia sẻ với quyền hạn bạn bè, public, ...');
    }else{
      //day la tin tuc cua nguoi khac, minh khong muon hien thi thi report thong tin nay
      //
      console.log('Cần report tin tức này hoặc ẩn tin tức này trên trang của mình...');
    }
    
  }

  onClickAvatars(btn, item) {
    console.log('action', btn, item);
  }

  onClickActions(btn, item) {
    console.log('action', btn, item);
  }

  /**
   * Thu tuc popup form
   * @param form 
   * @param data 
   */
  openModal(form, data?: any) {
    let modal = this.modalCtrl.create(form, data);
    modal.present();
  }

  /**
   * Thu tuc xu ly goi lai
   */
  callBackProcess = function (res) {
    console.log('Ket qua:', res);
    return new Promise((resolve, reject) => {
      if (res.error){
        resolve();
      }else{
        resolve({next:"CLOSE"});
      }
    })
  }.bind(this);

}
