/**
 * ver 3.1 
 * Thay đổi view popup thông tin
 * Gán content và image đúng với content_cache
 * Ngày 26/06/2019
 * 
 * ver 3.0
 * Thay đổi cách hiển thị thông tin đã dịch
 * Chú ý thay đổi content-card 
 * 
 * Trang chủ ver 2.0
 * menu delete 20/06/2019
 */
import { Component } from '@angular/core';
import { NavController, LoadingController, ModalController, Events } from 'ionic-angular';
import { ApiContactService } from '../../services/apiContactService';
import { ApiChatService } from '../../services/apiChatService';
import { ApiAuthService } from '../../services/apiAuthService';
import { ApiStorageService } from '../../services/apiStorageService';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { DynamicPostPage } from '../dynamic-post/dynamic-post';
import { HomeChatPage } from '../home-chat/home-chat';
import { FriendsPage } from '../friends/friends';
import { DynamicViewPage } from '../dynamic-view/dynamic-view';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  //Gán địa chỉ máy chủ lấy tin tức (news/social)
  serverNews: string = ApiStorageService.newsServer;

  //biến lấy thông tin hiển thị trang chủ
  dynamicTree: any = {
    title: "HOME", //tiêu để trang chủ được thay đổi trong bản home
    items: []  //các tin tức được người dùng post lên
  };

  //Bộ điều hướng trang, 
  maxOnePage = 6;
  curPageIndex = 0;
  lastPageIndex = 0;
  maxPage = 10; //toi da cua trang de khong bi lag

  //danh bạ người dùng public và bạn bè để hiển thị avatar và tên
  //nếu không có danh bạ này thì thông tin người dùng sẽ chỉ là username
  contacts = {}  // this.apiContact.getUniqueContacts()

  //Thông tin người dùng đã login vào
  userInfo: any; // this.apiAuth.getUserInfo()
  token: any;     // this.apiStorage.getToken() hoac ApiStorageService.token

  //Bộ điều khiển kéo lên, kéo xuống
  isLoaded: boolean = true;

  //Thông tin dùng để chating
  mySocket: any;
  unreadMessages: any;
  privateMessages: any;
  roomsMessages: any;

  //các nhóm chat
  chatRooms: any;
  chatFriends: any;
  chatNewFriends: any;

  //Khai báo biến sử dụng trong class
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

  //Khởi tạo ban đầu các biến
  ngOnInit() {

    //Đọc tin tức từ máy chủ
    this.refreshNews();

    //Lắng nghe sự kiện đã kiểm tra login xong
    this.events.subscribe('event-main-login-checked'
      , (data => {

        this.token = data.token;
        this.userInfo = data.user;

        this.contacts = this.apiContact.getUniqueContacts();

        //console.log('Contact for new',this.contacts);
        //them danh ba cua nguoi login vao
        if (this.userInfo && this.userInfo.data) {
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
            if (this.userInfo.data.image) {
              this.contacts[this.userInfo.username].image = this.userInfo.data.image;
              this.contacts[this.userInfo.username].avatar = this.userInfo.data.avatar ? this.userInfo.data.avatar : this.userInfo.data.image;
            }
          }
        }
        //doi 3 giay sau neu login tu dong bang token
        //thi moi lay thong tin cua user
        /* setTimeout(() => {
          this.getHomeNews(true);
        }, 3000); */

      })
    )


    //Lắng nghe sự kiện đã khởi tạo các phiên chatting xong
    this.events.subscribe('event-chat-init-room'
      , (data => {
        this.mySocket = data.my_socket;
        this.unreadMessages = data.unread_messages;
        this.privateMessages = data.private_messages;
        this.roomsMessages = data.rooms_messages;
        this.chatRooms = data.rooms;
        this.chatFriends = data.friends;
        this.chatNewFriends = data.new_friends;

      })
    )

  }


  /**
   * Thủ tục truy vấn máy chủ tin tức News
   * Gồm lấy title và lấy tin tức
   * để đọc các tin tức được người dùng post lên
   */
  async refreshNews() {

    //lấy title của trang chủ đầu tiên - trang này là public nên lấy về
    try {
      let home = await this.apiAuth.getDynamicUrl(ApiStorageService.newsServer + "/get-home");
      if (home && home.name) {
        this.dynamicTree.title = home.name;
        //tin tức ghim đầu tiên cho trang tin này
        //this.dynamicTree.item = [];
      }
    } catch (e) { }


    //Lấy danh sách user public trên máy chủ API 
    //và đưa về danh bạ public để truy vấn tin tức những user public này
    await this.apiContact.getPublicUsers(true);

    //neu co roi thi moi di checking login

    //thong tin tu public user
    this.token = this.apiStorage.getToken();
    this.userInfo = this.apiAuth.getUserInfo();
    this.contacts = this.apiContact.getUniqueContacts();

    //lấy tin tức ban đầu
    this.getHomeNews(true);

    //this.dynamicTree.items.push(items);
    //doc tu bo nho len lay danh sach da load truoc day ghi ra 
    //this.dynamicTree = this.apiStorage.getHome();

    //Đọc thông tin bạn bè, danh bạ để khởi tạo các thông tin để chat
    let chattingData = this.apiChat.getRoomsFriends();

    this.mySocket = chattingData.my_socket;
    this.unreadMessages = chattingData.unread_messages;
    this.privateMessages = chattingData.private_messages;
    this.roomsMessages = chattingData.rooms_messages;

    this.chatRooms = chattingData.rooms;
    this.chatFriends = chattingData.friends;
    this.chatNewFriends = chattingData.new_friends;

  }

  /**
   * Lấy tin tức kiểu phân trang)
   * @param isRenew 
   */ 
  getHomeNews(isRenew?: boolean) {

    //kiểm tra lấy trang mới hay trang tiếp theo
    if (isRenew) {
      //nếu lấy trang mới thì đọc từ trang 0
      this.lastPageIndex = this.curPageIndex > 0 ? this.curPageIndex : this.lastPageIndex;
      this.curPageIndex = 0;
    } else {
      //nếu lấy trang tiếp theo thì đọc từ trang tiếp theo
      this.lastPageIndex = this.curPageIndex > this.lastPageIndex ? this.curPageIndex : this.lastPageIndex;
    }

    //đọc tin từ máy chủ tin tức
    this.getJsonPostNews(this.userInfo ? true : false)
      .then(items => {
        if (isRenew) {
          let isHaveNew = false;
          items.reverse().forEach((el, idx) => {
            let index = this.dynamicTree.items
              .findIndex(x => x.id === el.id);
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
              .findIndex(x => x.id === el.id);
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

  /**
   * Thực hiện đọc tin tức qua phương thức post để truyền biến dễ hơn
   * 
   * @param isToken 
   */
  getJsonPostNews(isToken?: boolean) {
    
    //khởi tạo thông tin trang cần đọc
    let offset = this.curPageIndex * this.maxOnePage;
    let limit = this.maxOnePage;

    //khởi tạo danh sách các user cần lấy tin 
    //(như danh sách theo dõi của user đang login)
    let follows = [];
    for (let key in this.contacts) {
      follows.push(key);
    }

    //Khởi tạo biến json_data để truyền lên máy chủ đọc tin tức
    let json_data = {
      limit: limit, //giới hạn tin lấy về
      offset: offset, //lấy từ bảng ghi thứ j=0..n
      follows: follows //danh sách user cần theo dõi tin (nếu user đó có post tin)
    }

    //console.log('json_data',json_data);
    //đọc tin tức từ máy chủ bằng phương thức post
    //trên máy chủ phải khai báo route và handler để lấy tin theo điều kiện sau
    return this.apiAuth.postDynamicForm(this.serverNews + '/list-news', json_data, true)
      .then(items => {
        //tin tức từ máy chủ trả về là một mảng dữ liệu
        items.forEach(elItem => {
          //nếu tin tức có thông tin chi tiết (lưu ảnh hoặc file truyền lên)
          if (elItem.details) {
            elItem.medias = [];
            elItem.files = [];
            //duyệt danh sách tin chi tiết để biến đổi
            elItem.details.forEach(el => {
              //nếu kiểu tin tức là ảnh (quy ước 1= ảnh, khác là file)
              if (el.type === 1) {
                //nếu là ảnh thì ghi các thông tin cơ bản của ảnh trong mảng medias
                elItem.medias.push({
                  type: el.type,
                  src: this.serverNews + "/get-file/" + el.url,
                  url: this.serverNews + "/get-file/" + el.url,
                  alt: el.content,
                  file_type: el.file_type,
                  file_name: el.file_name,
                  file_date: el.file_date
                })
              } else {
                //nếu thông tin chi tiết là kiểu file
                //thì chuyển đổi src để hiển thị người dùng là biểu tượng kiểu file
                let src = "assets/imgs/file.png";
                if (el.file_type !== undefined && el.file_type !== null) {
                  if (el.file_type.toLowerCase().indexOf("pdf") >= 0) src = "assets/imgs/pdf.png";
                  if (el.file_type.toLowerCase().indexOf("word") >= 0) src = "assets/imgs/word.png";
                  if (el.file_type.toLowerCase().indexOf("sheet") >= 0 || el.file_type.toLowerCase().indexOf("excel") >= 0) src = "assets/imgs/excel.png";
                  if (el.file_type.toLowerCase().indexOf("image") >= 0 || el.file_type.toLowerCase().indexOf("video") >= 0) src = this.serverNews + "/get-file/" + el.url;
                }
                //sau đó đưa vào mảng thông tin file
                //mục đích để hiển thị kiểu liệt kê file
                //và biểu tượng kiểu file (như word, pdf, excel...)
                //người dùng có thể nhận biết đó là kiểu file gì
                elItem.files.push({
                  type: el.type,
                  src: src,
                  url: this.serverNews + "/get-file/" + el.url,
                  alt: el.content,
                  file_type: el.file_type,
                  file_name: el.file_name,
                  file_date: el.file_date
                })
              }
            })
          }
        })

        //nếu đọc tin mà có tin trả về, tức là trang tiếp theo sẽ còn trên máy chủ
        //do vậy tăng biến lên để lần sau đọc trang tiếp theo
        if (items.length > 0) this.curPageIndex++;
        //console.log(items);
        //trả kết quả cho thanh ghi tin tức
        return items;

      })
      //nếu đọc tin bị lỗi thì tin trả về là mãng rỗng
      .catch(err => { return [] })
  }


  /**
   * Khi bấm menu của more tin tức
   * các sự kiện xóa, edit, báo cáo, block, thay đổi trạng thái
   * sẽ thực hiện lưu lại csdl
   * @param event 
   * @param id 
   */
  onClickMore(event, id) {
    //console.log('more of', id, event);
    if (event) {
      if (event.command === "delete") {
        let json_data={
          id: id,
          status: -1
        }
        this.apiAuth.postDynamicForm(ApiStorageService.newsServer+"/delete-news",json_data,true)
        .then(data=>{
          console.log('xoa tin thanh cong',data)
        })
        .catch(err=>{
          console.log('xoa tin bi loi',err)
        })
      }
      if (event.command === "report") {

      }
      if (event.command === "block") {

      }
      if (event.command === "edit-content") {
        console.log('tin tuc', this.dynamicTree.items.find(x=>x.id===id));

      }
      if (event.command === "edit-status") {

      }

    }
  }

  /**
  * Khi bấm hành động like, comment, share
  * Sự kiện sinh ra là event.action.next tương ứng
  * @param event 
  * @param id 
  */
  onClickAction(event, id) {
    //console.log(id, event);
    if (event && event.action) {
      if (event.action.next === "LIKE") {

      }
      if (event.action.next === "COMMENT") {

      }
      if (event.action.next === "SHARE") {

      }
    }
  }

/**
* Thủ tục xử lý gọi lại khi post tin tức
*/
callBackProcess = function (res) {
//console.log('Ket qua:', res);
return new Promise((resolve, reject) => {
  if (res.error) {
    resolve();
  } else {
    resolve({ next: "CLOSE" });
  }
})
}.bind(this);

  /**
   * Khi bấm vào nút post tin
   * cửa sổ post tin sẽ popup lên
   * @param user 
   */
  onClickPostNews(user) {
    this.openModal(DynamicPostPage, {
      parent: this,
      callback: this.callBackProcess,
      form: {
        status: 1,   //hình thức chia sẻ công khai
        content: "", //cho phép nhập nội dung để post
        medias: [], //cho phép chọn ảnh hoặc video để post
        files: [],  //Cho phép chọn file để gửi
        action: { name: "Đăng tin", next: "CALLBACK", url: this.serverNews + "/post-news" }
      }
    })
  }

  /**
   * Khi người dùng bấm vào chức năng chatting
   * theo socket của chính user login (tức là cùng user login nhiều máy)
   */
  onClickChatUser() {
    //ktra user cua minh login tu dau:
    // cai nay yc co mat khau tu dat 
    // ktra xac thuc voi may chu ok thi list ra ktra
    //console.log('my socket', this.mySocket);
  }

 /**
  * Khi người dùng bấm vào chức năng chatting theo nhóm (người khác)
  * cửa sổ trang chủ chatting sẽ hiện ra
  */
  onClickChatRoom() {
    this.navCtrl.push(HomeChatPage, {
      parent: this,             //biet goi parent
      my_socket: this.mySocket, //thong tin owner
      token: this.token,       //thong tin owner
      user: this.userInfo,     //thong tin owner

      unread_messages: this.unreadMessages, //thong tin chua doc
      rooms: this.chatRooms,    //thong tin dang online chat
      private_messages: this.privateMessages,    //thong tin dang online chat
      rooms_messages: this.roomsMessages,    //thong tin dang online chat

      contacts: this.contacts, //thong tin cua user co anh dai dien unique
      friends: this.chatFriends //thong tin ban be chat (<contacts array)
      //neu rooms co > 2 user thi goi la room neu khong goi la ca nhan 
      //
    });
  }

  /**
   * Khi người dùng bấm vào nút kết bạn 
   * Cửa sổ danh sách bạn public và bạn có thể tìm kiếm để kết bạn
   * danh sách bạn bè được kết bạn sẽ cho phép theo dõi để đọc tin tức của nhau
   * Nếu không nằm trong danh sách bạn bè, thì tin tức sẽ không cho thấy nhau
   */
  onClickChatFriend() {
    this.openModal(FriendsPage, {
      user: this.userInfo,
      parent: this,
      contacts: this.contacts,
      friends: this.chatFriends,
      new_friends: this.chatNewFriends
    })
  }

  /**
   * Điều hướng kéo trang xuống và đẩy trang lên
   * sẽ cho phép đọc tin tức tiếp theo hoặc đọc tin mới
   * @param infiniteScroll 
   * @param direction 
   */
  doInfinite(infiniteScroll, direction) {
    if (direction === 'UP') {
      //console.log('UP', this.curPageIndex, this.lastPageIndex);
      //if (!this.isLoaded) {
      this.getHomeNews(true);
      //}
      setTimeout(() => {
        //this.isLoaded = true;
        infiniteScroll.complete();
      }, 1000);
    } else {
      //console.log('DOWN', this.curPageIndex, this.lastPageIndex);
      this.getHomeNews(false);
      //this.isLoaded = false; //khi keo xuong duoi thi o tren moi cho phep
      setTimeout(() => {
        infiniteScroll.complete();
      }, 1000);
    }

  }

  /**
   * Khi bấm vào các hình mà người dùng post lên
   * Cửa sổ sẽ hiện ra để hiển thị thông tin chi tiết bản tin
   * của người dùng đã post lên
   * @param event 
   */
  onClickMedia(news) {
    //console.log('news', news);
    //Đọc các hỉnh ở it.medias 
    //popup cua so doc day du tin tuc nay
    this.navCtrl.push(DynamicViewPage,
      {
        form: news,
        parent: this,
        contacts: this.contacts,
        user_info: this.userInfo
      })
  }

  /**
   * Khi người dùng bấm vào các ảnh của các link được dịch
   * Thì cửa sổ popup sẽ hiển thị chi tiết nội dung của bản tin đó (cache)
   * 
   * @param event 
   */
  onClickImageLink(urlInfo, item) {

    //console.log(urlInfo.index,item.content_cache[urlInfo.index].content);

    this.navCtrl.push(DynamicViewPage,
      {
        form: {
          id: item.id, //mã quản lý của tin tức này

          username: item.username, //user nhập tin tức này
          status: item.status,   //hình thức chia sẻ của tin tức này
          time: item.time, //thời gian của tin tức này

          content: item.content + "\n\n" + (urlInfo && item && urlInfo.index>=0 && item.content_cache && item.content_cache[urlInfo.index]?item.content_cache[urlInfo.index].content:""),
          medias: urlInfo.url_info.original, //danh mục ảnh gốc mà người dùng bấm vào

          results: item.results,
          actions: item.actions,
        },

        parent: this,
        contacts: this.contacts,
        user_info: this.userInfo
      })
  }

  /**
   * Khi người dùng bấm vào thanh điều hướng url của tin tức đã dịch
   * cửa sổ mới điều hướng đến đường dẫn gốc bằng công cụ cửa sổ trình duyệt mới
   * hoặc sẽ mở ra một cửa sổ inappbrower trên điện thoại di động
   * @param event 
   */
  onClickOpenLink(event) {
    //console.log('content',event.link);
    //popup inappBrowser link
    if (event.link && event.link.url) {
      var target = "_blank"; //mo trong inappbrowser
      var options = "hidden=no,toolbar=yes,location=yes,presentationstyle=fullscreen,clearcache=yes,clearsessioncache=yes";
      this.inAppBrowser.create(event.link.url, target, options);
    }
  }


  /**
   * Khi người dùng bấm vào file được liệt kê
   * trình mở file theo ứng dụng sẽ download 
   * @param obj 
   */
  onClickViewFile(obj) {
    //console.log('mo file',obj);
    this.inAppBrowser.create(obj.url);
  }

  /**
   * Khi bấm vào hình đại diện hoặc tên người sử dụng
   * sẽ hiển thị trang tin của người dùng đó (đọc tin của người dùng)
   * @param btn 
   * @param item 
   */
  onClickAvatars(btn, item) {
    console.log('action', btn, item);
  }

  /**
  * Thủ tục chung gọi cửa sổ popup
  * được nhúng vào tất cả các trang
  * @param form 
  * @param data 
  */
  openModal(form, data?: any) {
    let modal = this.modalCtrl.create(form, data);
    modal.present();
  }

}
