/**
 * ver 5.0 Ngày 11/7/2019
 * Sử dụng chức năng croppie để cắt ảnh đại diện và ảnh nền
 * 
 * ver 4.0 21/06/2019
 * Thay đổi options từ csdl được parse trước khi gửi cho client
 * 
 * 
 * Trang chính tổ chức menu và các trang mẫu
 * ver 3.0
 * Ngày 19/06/2019
 * 
 */

//Các thành phần khai báo import
import { Component, ViewChild, HostListener } from '@angular/core';
import { Platform, Nav, MenuController, ModalController, Events, LoadingController, ToastController, AlertController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { DynamicFormMobilePage } from '../pages/dynamic-form-mobile/dynamic-form-mobile';
import { DynamicFormWebPage } from '../pages/dynamic-form-web/dynamic-form-web';
import { DynamicRangePage } from '../pages/dynamic-range/dynamic-range';
import { DynamicListPage } from '../pages/dynamic-list/dynamic-list';
import { DynamicListOrderPage } from '../pages/dynamic-list-order/dynamic-list-order';
import { DynamicTreePage } from '../pages/dynamic-tree/dynamic-tree';
import { DynamicMediasPage } from '../pages/dynamic-medias/dynamic-medias';
import { DynamicCardSocialPage } from '../pages/dynamic-card-social/dynamic-card-social';
import { GoogleMapPage } from '../pages/google-map/google-map';
import { LoginPage } from '../pages/login/login';
import { HandDrawPage } from '../pages/hand-draw/hand-draw';
import { ApiStorageService } from '../services/apiStorageService';
import { ApiAuthService } from '../services/apiAuthService';
import { ApiImageService } from '../services/apiImageService';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { LinkPage } from '../pages/link/link';
import { ApiContactService } from '../services/apiContactService';
import { ApiChatService } from '../services/apiChatService';
import { DynamicChartPage } from '../pages/dynamic-chart/dynamic-chart';
import { DynamicHomePage } from '../pages/dynamic-home/dynamic-home';
import { HomePage } from '../pages/home/home';
import { DynamicPostPage } from '../pages/dynamic-post/dynamic-post';
import { AdminPage } from '../pages/administrator/administrator';
import { CordovaPage } from '../pages/cordova-info/cordova-info';
import { QrBarScannerPage } from '../pages/qr-bar-scanner/qr-bar-scanner';
import { SpeedTestPage } from '../pages/speed-test/speed-test';
import { ContactsPage } from '../pages/contacts/contacts';
import { DynamicPostImagePage } from '../pages/dynamic-post-image/dynamic-post-image';

//từ khóa của thành phần
@Component({
  templateUrl: 'app.html'
})

//Khai báo lớp có tên là MyApp là gốc xử lý ban đầu
export class MyApp {
  //thực thi điều hướng trang đối với trang root này
  @ViewChild(Nav) navCtrl: Nav;

  //Bắt sự kiện gõ phím trên môi trường có bàn phím desktop
  keyCode: any;
  @HostListener('document:keyup', ['$event']) handleKeyboardEvent(event: KeyboardEvent) {
    this.keyCode = event.keyCode;
    //console.log('key',this.keyCode);
    //se cho tat ca cac hotkey go duoc
  }

  //Khai báo trang chủ là trang nào
  rootPage: any = HomePage;

  //Khai báo cây menu được tổ chức cho ứng dụng này 
  //cây này sẽ nhúng vào component treeView để hiển thị menu
  treeMenu: any;
  //Hàm gọi lại từ componet treeView để xử lý thực thi lệnh click trên item
  callbackTreeMenu: any;

  //Thông tin người dùng login vào chương trình
  userInfo: any;
  //thông tin token (khóa phiên làm việc của người dùng sau khi login)
  token: any;

  //Cặp khóa riêng của thiết bị sử dụng để mã hóa dữ liệu riêng hoặc ký thông tin riêng
  keyPair: any;

  //Biến khai báo thêm để xác nhận trạng thái trả về của quyền đọc menu sau khi người dùng login
  statusCallBack: any;

  //Khai báo cấu trúc của các biến nhúng vào để khai báo điều khiển ứng dụng
  //tái sử dụng lại các dịch vụ có sẵn hoặc viết riêng
  constructor(
    private menuCtrl: MenuController, //goi trong callback
    private modalCtrl: ModalController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private apiStorage: ApiStorageService,
    private apiImage: ApiImageService,
    private apiAuth: ApiAuthService,
    private apiContact: ApiContactService,
    private apiChat: ApiChatService,
    private events: Events,
    private inAppBrowser: InAppBrowser, //goi trong callback
    private platform: Platform,
    private alertCtrl: AlertController,
    statusBar: StatusBar,
    splashScreen: SplashScreen
  ) {
    // các hàm khai báo chạy ở đây là chạy đầu tiên
    // tuy nhiên để gọn code ta tách khởi tạo biến ở ngOninit()
    this.platform.ready().then(() => {
      statusBar.styleDefault();
      splashScreen.hide();
    });
  }

  /**
   * Hàm này sẽ chạy sau khi khởi tạo lớp ứng dụng này
   * Sử dụng để khởi tạo các biến ban đầu
   *  */
  ngOnInit() {
    
    //gán hàm khai báo gọi về khi bấm trên item của menu
    this.callbackTreeMenu = this.callbackTree;
    
    //gọi hàm 
    this.ionViewDidLoad_main();

    //Kiểm tra và tạo cặp khóa riêng cho thiết bị này
    //cặp khóa này sẽ lưu trữ để nhận dạng nó là một thiết bị duy nhất
    //trừ trường hợp ứng dụng reset biến lưu trữ
    this.apiAuth.generatorKeyPairDevice()
      .then(key => {
        this.keyPair = key;
        //console.log('key resolve',this.keyPair);
      });

  }

  /**
   * Hàm kiểm tra xác thực phiên ban đầu
   * Và khai báo các sự kiện lắng nghe các trang login, logout 
   */
  ionViewDidLoad_main() {
    //kiểm tra login
    this.checkTokenLogin();
    //lắng nghe sự kiện login thành công
    this.events.subscribe('user-log-in-ok', (() => {
      this.checkTokenLogin();
    }));
    //lắng nghe sự kiện logout thành công
    this.events.subscribe('user-log-out-ok', (() => {
      this.checkTokenLogin();
    }));

  }

  /**
   * login ok get image and background
   * add to contacts
   */
  async userChangeImage() {
    //du lieu da duoc dang ky 
    //console.log('userinfo', this.userInfo);
    if (
      this.userInfo.data
      && this.userInfo.data.image && this.userInfo.data.background
    ) {
      try {
        this.userInfo.data.image = await this.apiImage
          .createBase64Image(this.userInfo.data.image, 120)

        this.userInfo.data.background = await this.apiImage
          .createBase64Image(this.userInfo.data.background, 300)
      } catch (e) { }
    } else {
      this.navCtrl.push(LoginPage);
    }

  }

  /**
   * Kiểm tra login 
   */
  checkTokenLogin() {
    
    //lấy token được lưu trước đó
    this.token = this.apiStorage.getToken();

    //Nếu có token được lưu
    if (this.token) {

      let loading = this.loadingCtrl.create({
        content: 'Đợi xác thực...'
      });
      loading.present();

      //thì thực hiện kiểm tra token có hợp lệ không
      this.apiAuth.authorize
        (this.token)
        .then(async data => {
          
          //nếu hợp lệ thì lưu lại thông tin người dùng
          this.userInfo = this.apiAuth.getUserInfo();
          //Nếu thông tin user đã cung cấp đầy đủ thì
          if (this.userInfo && this.userInfo.data) {

            //tiêm token vào để gửi xác thực phiên sau
            this.apiAuth.injectToken();

            //Thay đổi ảnh đại diện cho user
            this.userChangeImage();

            //login ok ... contacts, friends, ids, pass
            //await this.apiContact.delay(1000); //doi 1 giay de lay het anh
            //ban dau moi khoi tao chua co Friend, ta moi khoi tao khi nao co thi moi di tiep
            let friends = await this.apiContact.prepareFriends(this.userInfo);

            //khởi tạo dịch vụ chatting
            this.apiChat.initChatting(this.token, this.userInfo, friends);

          } else {

            //nếu thông tin người dùng không đầy đủ, thì cần bổ sung thông tin
            this.navCtrl.push(LoginPage);

          }
          
          loading.dismiss();

          //thực hiện kiểm tra và lấy menu
          this.resetTreeMenu();
        })
        .catch(err => {
          
          loading.dismiss();
          //nếu lỗi xác thực (token hết hạn, thì yêu cầu cấp lại bằng cách login)
          if (err.status===403 && err.error) { //trang thai token bi cam
            
            //thông báo hết hạn token
            this.presentAlert(err.error.message);
            
            //Xóa khỏi bộ nhớ token này vì nó không còn hiệu lực
            this.apiAuth.deleteToken();

            //Chuyển qua trang login
            this.navCtrl.push(LoginPage);
          }
          //tạo lại cây menu
          this.resetTreeMenu();
          
        });
    } else {
      //trường hợp không có token 
      //thì tạo menu xem như người dùng vãng lai
      this.userInfo = undefined;
      this.resetTreeMenu();
    }
  }


  /**
   * Hàm chuyển đổi chuổi trang sang trang thực tế đã thiết kế
   * Trong tổ chức menu sẽ khai báo các tham số trang trong cột next
   * Dựa vào từng tham số mà trang đã thiết kế, sẽ chuyển đổi thành trang thiết kế
   * @param strPage 
   */
  getPage(strPage) {
    switch (strPage) {
      case "Home":
        return this.rootPage
      case "GoogleMap":
        return GoogleMapPage
      case "LoginPage":
        return LoginPage
      case "AdminPage":
        return AdminPage;
      default:
        return this.rootPage;
    }

  }

  /**
   * Hàm tạo menu ban đầu cho ứng dụng
   */
  async resetTreeMenu() {

    //Tập menu mẫu cho developer
    //dùng để tham chiếu và học lấy mẫu sử dụng nhanh hơn
    let sampleMenu = [
      {
        name: "3. Các mẫu nhập",
        size: "1.3em",
        subs: [
          {
            name: "3.1 Các nhập liệu",
            size: "1.3em",
            subs: [
              {
                name: "3.1.1 Mẫu nhập liệu dành cho di động và popup",
                click: true,
                next: DynamicFormMobilePage, //mẫu thực thi như mẫu DynamicFormWebPage
                icon: "phone-portrait"
              }
              ,
              {
                name: "3.1.2 Nhập liệu và hiển thị cho desktop & di động",
                click: true,
                next: DynamicFormWebPage, //mẫu thực thi như mẫu DynamicFormMobilePage
                icon: "desktop"
              }
              ,
              {
                name: "3.1.3 Mẫu nhập chọn & kéo",
                click: true,
                next: DynamicRangePage,
                icon: "radio-button-on"
              }
            ]
          }
          ,
          {
            name: "3.2 Các mẫu hiển thị danh sách",
            size: "1.3em",
            subs: [
              {
                name: "3.2.1 Mẫu trang chủ tin tức kiểu nhập tin share, comment...",
                click: true,
                next: DynamicHomePage,
                icon: "home"
              }
              ,
              {
                name: "3.2.2 Mẫu danh sách quẹt nút click",
                click: true,
                next: DynamicListPage,
                icon: "paper"
              }
              ,
              {
                name: "3.2.3 Mẫu Biểu đồ Chart",
                click: true,
                next: DynamicChartPage,
                icon: "paper"
              }
              ,
              {
                name: "3.2.4 Mẫu danh sách bảng, liệt kê & sắp xếp lại",
                click: true,
                next: DynamicListOrderPage,
                icon: "reorder"
              }
              ,
              {
                name: "3.2.5 Mẫu danh sách theo cây FamilyTree",
                click: true,
                next: DynamicTreePage,
                icon: "menu"
              }
            ]
          }
          ,
          {
            name: "3.3 Các mẫu xử lý hình ảnh và file",
            size: "1.3em",
            subs: [
              {
                name: "3.3.1 Mẫu upload ảnh theo facebook",
                click: true,
                next: DynamicMediasPage,
                icon: "images"
              }
              ,
              {
                name: "3.3.2 Mẫu hiển thị ảnh và tương tác mạng xã hội",
                click: true,
                next: DynamicCardSocialPage,
                icon: "logo-facebook"
              }
              ,
              {
                name: "3.3.3 Mẫu vẽ tay lên màn hình trên nền di động",
                click: true,
                next: HandDrawPage,
                icon: "create"
              }
            ]
          }
        ]
      }
      ,
      {
        name: "4. Các phôi pdf In",
        size: "1.3em",
        subs: [
          {
            name: "4.1 Mẫu ma trận điểm A4",
            size: "1.3em",
            click: true,
            url: "https://c3.mobifone.vn/qld/db/matrix-a4",
            icon: "ios-apps-outline"
          }
          ,
          {
            name: "4.2 Mẫu ma trận điểm A5",
            size: "1.3em",
            click: true,
            url: "https://c3.mobifone.vn/qld/db/matrix-a5",
            icon: "md-apps"
          }
          ,
          {
            name: "4.3 Mở kiểu Popup iframe",
            size: "1.3em",
            click: true,
            type: 'popup_iframe',
            url: "https://dantri.com.vn/",
            icon: "at"
          }
          ,
          {
            name: "4.4 Mở kiểu InApp",
            size: "1.3em",
            click: true,
            url: "https://dantri.com.vn/",
            type: 'in_app_browser', // mở kiểu inapp
            icon: "globe"
          }
        ]
      }
      ,
      {
        name: "5. Các mẫu cordova",
        size: "1.3em",
        subs: [
          {
            name: "5.1 Mẫu thông tin đầu cuối",
            size: "1.3em",
            click: true,
            next: CordovaPage,
            icon: "heart"
          }
          ,
          {
            name: "5.2 Quét QR & BAR code",
            size: "1.3em",
            click: true,
            next: QrBarScannerPage,
            icon: "qr-scanner"
          }
          ,
          {
            name: "5.3 Speedtest",
            size: "1.3em",
            click: true,
            next: SpeedTestPage,
            icon: "speedometer"
          }
          ,
          {
            name: "5.4. Contacts",
            size: "1.3em",
            click: true,
            next: ContactsPage,
            icon: "contacts"
          }
          ,
          {
            name: "5.5. Bản đồ dẫn đường",
            size: "1.3em",
            click: true,
            next: GoogleMapPage,
            icon: "globe"
          }
        ]
      }
    ]

    //Khai báo menu gốc khi không cần login vẫn hiển thị trước
    this.treeMenu = [
      {
        name: "1. Trang chủ",
        size: "1.3em",
        click: true,
        next: this.rootPage,
        icon: "home"
      }
      ,
      {
        name: "2. Quản lý công việc - yêu cầu",
        size: "1.3em",
        click: true,
        url: "https://c3.mobifone.vn/qlhs/login",
        icon: "alarm"
      }
      ,
      {
        name: "3. Hỗ trợ điểm bán lẻ",
        size: "1.3em",
        click: true,
        url: "https://c3.mobifone.vn/dbl/login",
        icon: "people"
      }
      ,
      {
        name: "4. Chọn số Công ty 3",
        size: "1.3em",
        click: true,
        //type: "popup_iframe" , //mở kiểu nhúng trang
        url: "https://chonsoc3.mobifone.vn/",
        icon: "keypad"
      }
      ,
      {
        name: "5. Nối mạng Công ty 3 SSL4",
        size: "1.3em",
        click: true,
        url: "https://ssl4.c3.mobifone.vn/dana-na/auth/url_default/welcome.cgi",
        icon: "flash"
      }
    ]

    if (this.userInfo) {
      //Nếu user đã login thành công thì
      //đọc menu từ máy chủ để tổ chức cây menu phù hợp cho ứng dụng của mình
      try {
        let data = await this.apiAuth.getDynamicUrl(ApiStorageService.resourceServer + "/get-menu", true);
        if (Array.isArray(data)) { //đây là mãng kết quả lấy được danh sách menu được phân quyền theo user
          
          //trường hợp cây được tổ chức theo hình cây nhiều cấp
          //ta phải tạo cây menu trước khi đưa vào Cây menu chính
          let treeOrigin = [];

          data.forEach((el, idx) => {

            treeOrigin.push({
              id: el.id,  //id của menu để tổ chức cây
              parent_id: el.parent_id, //tham chiếu id cấp cha để tổ chức cây
              name: el.name, //tên hiển thị trên menu
              size: el.size,  //kích cỡ chữ của menu
              click: el.click, //cho phép bấm vào menu là thực thi
              options: el.options, //cac bien tuy chon den chuyen tiep xu ly
              next: el.next?this.getPage(el.next):undefined,
              url: el.url, //thực hiện mở liên kết kiểu frame hay inapp hoặc popup??
              type: el.type,   //thiết lập kiểu mở liên kết theo url
              icon: el.icon //biểu tượng hiển thị trước menu (tên trong ionicIncons)
            });

          })

          //trường hợp muốn tạo cây menu khi có parent
          //thì ta tổ chức cây trước

          //sau đó gán cho cây menu
          this.treeMenu = this.apiAuth.createTreeMenu(treeOrigin,"id","parent_id");


        } else if (data) { //trả về là đối tượng có dữ liệu status
          //Ví dụ: user 903500888 chưa khai báo phân quyền vào hệ thống
          //thì thông báo cho user yêu cầu truy cập hệ thống.
          //Một màn hình xác nhận chính danh yêu cầu truy cập hệ thống này
          //Lời chào, ảnh đại diện, ảnh nền, email nội bộ (nếu hệ thống xác thực email)

          //tại máy chủ ghi lại lời chào, ảnh đại diện, ảnh nền vào tin tức trong nhóm hệ thống
          //phần email nội bộ (nếu có sẽ được gán với bảng ghi có email trong bảng user - và tự động
          if (data.message) {

            this.statusCallBack = data.status; //gán trạng thái để thực hiện chức năng

            this.presentToast(data.message) //chờ người dùng đóng bản tin thông báo từ máy chủ

          }

        }
      } catch (e) {
        console.log(e);
      }

      if (this.userInfo.data && this.userInfo.data.role === 99 //developer
      ) {
        //them cac menu mau vao
        this.treeMenu = this.treeMenu.concat(sampleMenu);
      }


      //lấy luôn quyền truy cập hệ thống được phân quyền gán cho userInfo
      //cuong.dq 17/06/2019
      try {
        let yourRoles = await this.apiAuth.getDynamicUrl(ApiStorageService.resourceServer + "/get-your-roles", true);
        this.userInfo.roles = yourRoles ? yourRoles : undefined;
        //  console.log('userInfo',this.userInfo);
        //  console.log('getUserInfo',this.apiAuth.getUserInfo());
      } catch (e) { }
    }

    //bao hieu da login xong
    this.events.publish('event-main-login-checked', {
      token: this.token,
      user: this.userInfo
    });

  }


  /**
   * Hàm gọi lại khi thực thi bấm click trên mỗi item của menu
   * thuộc tính click = true thì hàm này mới được sinh ra
   */
  callbackTree = function (item, idx, parent, isMore: boolean) {
    
    if (item.visible) {
      parent.forEach((el, i) => {
        if (idx !== i) this.expandCollapseAll(el, false)
      })
    }

    if (isMore) {
      if (item.next) {

        //console.log('options',item.options);
        
        this.navCtrl.push(item.next, { parent: this, options: item.options });
        this.menuCtrl.close();

      } else if (item.url) {

        if (item.type==='popup_iframe'){
          //mở theo kiểu popup với iframe nhúng html vào trang
          if (this.platform.is('ios')) {
            //Đối với ios việc mở trong link sẽ không có tác dụng nên phải mở
            //kiểu inappbrowser
            this.inAppBrowser.create(item.url, '_blank');
          } else {
            //Mở kiểu popup cửa số gắn link url trên trang nội dung
            //kiểu trang web html được nhúng vào trang link để hiển thị
            this.openModal(LinkPage
              , {
                parent: this,
                link: item.url
              });
          }
        } else if (item.type==='in_app_browser' && item.url) {
          //Mở kiểu inAppBrower với tùy chọn thuộc tính riêng
          // ví dụ: không cho thanh công cụ, ....
          var target = "_blank"; //mo trong inappbrowser
          var options = "hidden=no,toolbar=yes,location=yes,presentationstyle=fullscreen,clearcache=yes,clearsessioncache=yes";
          this.inAppBrowser.create(item.url, target, options);
  
        } else {
          //neu ios, browser, android??
          if (this.platform.is('ios') || this.platform.is('android')) {
            this.inAppBrowser.create(item.url);
          } else {
            window.open(item.url, '_system');
          }
        }
      }
    }

  }.bind(this)


  /**
   * Hàm gọi khi bấm vào thông tin người sử dụng
   * thực thi việc hiện thông tin cá nhân ra (admin_user trong oracle)
   */
  onClickUser() {
    this.navCtrl.push(LoginPage);
    this.menuCtrl.close();
  }


  /**
   * ver 3.0 post ảnh riêng
   * Hàm này được gọi khi người dùng bấm vào hình ảnh đại diện của mình
   * hoặc bấm vào khu vực hình nền của mình trên ô trạng thái login
   * Mục đích sử dụng để thay ảnh đại diện hoặc thay ảnh nền
   * @param func 
   */
  onClickUserImage(func) {
    //Nếu thay đổi ảnh đại diện thì gọi đoạn này
    if (func === "avatar") {
      //console.log("Chưa có ảnh đại diện");
      this.openModal(DynamicPostImagePage, {
        parent: this,
        callback: this.callBackProcessAvatar,
        form: {
          status: 0,   //hình thức không chia sẻ
          title: "CHỌN ẢNH ĐẠI DIỆN", //tiêu để của trang post
          options: { func: "avatar" }, //Các tham số gửi lên máy chủ ảnh đại diện
          crop_area: {
                      width: 200,
                      height: 200,
                      type: 'circle' 
                    }, //vùng cắt ảnh
          is_face:1, //nhận diện khuông mặt để crop đúng ảnh mặt người thôi
          image:undefined, //ảnh hiển thị khi load lên
          croppied: undefined, //ảnh được crop để truyền lên máy chủ
          action: { name:"Gửi ảnh", next: "CALLBACK", url: ApiStorageService.mediaServer + "/upload-image"}
        }
      })
    }
    //Nếu thay đổi ảnh nền thì gọi đoạn này
    if (func === "background") {
      //nếu chưa có ảnh nền thì yêu cầu mở form nhập ảnh nền
      //console.log("Chưa có ảnh nền");
      this.openModal(DynamicPostImagePage, {
        parent: this,
        callback: this.callBackProcessAvatar,
        form: {
          status: 0,   //hình thức chia sẻ công khai
          title: "CHỌN ẢNH NỀN", //tiêu để của trang post
          options: { func: "background" }, //Các tham số gửi lên máy chủ ảnh đại diện
          crop_area:{
                        width: 300,
                        height: 200,
                        type: 'square'
                    }, //vùng cắt ảnh
          is_face:0, //nhận diện khuông mặt để crop đúng ảnh mặt người thôi
          image:undefined, //ảnh hiển thị khi load lên
          croppied: undefined, //ảnh được crop để truyền lên máy chủ
          action: { name: "Gửi ảnh", next: "CALLBACK", url: ApiStorageService.mediaServer + "/upload-image" }
        }
      })
    }
  }

  /**
   * Hàm thực thi gọi lại lưu ảnh đại diện và ảnh nền
   * khi gọi chức năng thay ảnh
   */
  callBackProcessAvatar = function (res) {
    return new Promise((resolve, reject) => {
      //console.log('Ket qua:', res);
      if (res.error) {
        this.presentAlert("Có lỗi khi truyền dữ liệu");
        resolve();
      } else {

        if (res.data) {
          if (res.data.func && res.data.url) {
            //có dữ liệu để ghi vào máy chủ api link này
            let json_data = {};
            let image = ApiStorageService.mediaServer + "/get-file/" + encodeURI(res.data.url);
            Object.defineProperty(json_data, res.data.func === "background" ? "background" : "image", { value: image, writable: true, enumerable: true, configurable: true });
            this.apiAuth.postDynamicForm(ApiStorageService.authServer + "/ext-auth/save-user-info", json_data, true)
              .then(data => {
                //console.log('du lieu ghi xong',data);
                this.userInfo.data[res.data.func === "background" ? "background" : "image"] = image;
                resolve({ next: "CLOSE" });
                //console.log('sau khi dong cua so roi');
                /* if (res.data.func === "avatar" && !this.userInfo.data.background) {
                  this.onClickUserImage("background");
                }
                if (res.data.func === "background" && !this.userInfo.data.image) {
                  this.onClickUserImage("avatar");
                } */
              })
              .catch(err => {
                //console.log('du lieu ghi loi',err);
                this.presentAlert("Có lỗi khi lưu trên máy chủ xác thực");
                resolve();
              })
          } else {
            //Có lỗi từ máy chủ trả về chữ message
            this.presentAlert("Máy chủ đa phương tiện báo <br>" + res.data.message);
            resolve();
          }
        } else {
          //giữ lại form không cho đóng
          this.presentAlert("Có lỗi khi lưu trên máy chủ phương tiện");
          resolve();
        }
      }
    })
  }.bind(this);

  /**
   * Hàm này được gọi khi người dùng bấm vào tên sử dụng 
   * trên cửa sổ thông tin login (gồm ảnh đại diện, ảnh nền và tên cá nhân)
   * Nó sẽ tự động gọi đến trang login / tương tự như nút login/logout
   * 
   */
  onClickLogin() {
    this.navCtrl.push(LoginPage);
    this.menuCtrl.close();
  }

  /**
   * Hàm mở/đóng toàn bộ cây menu
   * Hàm này chỉ sử dụng khi có nút trên header
   * Mục đích để mở toàn bộ cây hoặc đóng toàn bộ cây
   * thay vì phải đi mở từng menu
   * @param btn 
   */
  onClickHeader(btn) {
    if (btn.next === "EXPAND") this.treeMenu.forEach(el => this.expandCollapseAll(el, true))
    if (btn.next === "COLLAPSE") this.treeMenu.forEach(el => this.expandCollapseAll(el, false))
  }

  /**
   * Hàm đóng/mở menu khi bấm vào nút mở/đóng menu
   * @param el 
   * @param isExpand 
   */
  expandCollapseAll(el, isExpand: boolean) {
    if (el.subs) {
      el.visible = isExpand;
      el.subs.forEach(el1 => {
        this.expandCollapseAll(el1, isExpand)
      })
    }
  }

  /**
   * Hàm thực thi tạo cửa sổ popup đối với desktop
   * Đối với cỡ màn hình mobile thì nó sẽ hiển thị như thành phần navCtrl.push
   * @param form 
   * @param data 
   */
  openModal(form, data?: any) {
    let modal = this.modalCtrl.create(form, data);
    modal.present();
  }


  /**
   * Hiển thị thanh thông báo
   *  
   * Bản tin thông báo màu đỏ (màu được định nghĩa ở tham số trong file app.scss .toast-container)
   * 
   * nếu không thiết lập thời gian thì sẽ xuất hiện nút "Xác nhận"
   * cho phép nhảy đến chức năng gọi lại để điều hướng trang khác
   * 
   * Trường hợp không muốn hàm gọi lại thì thiết lập duration bằng giây hiển thị
   * sau thời gian hiển thị nó sẽ tự tắt thông báo
   * @param message 
   * @param duration 
   */
  presentToast(message, duration?: 0 | 3000 | 5000) {
    let toast = this.toastCtrl.create({
      message: message,
      duration: duration ? duration : undefined, //default for click ok
      showCloseButton: duration ? false : true, //hien thi nut close nhu xem roi
      closeButtonText: duration ? "" : "Xác nhận",
      //cssClass: duration?"toast-container-white":"toast-container-red",
      position: 'middle' // "top", "middle", "bottom".
    });

    toast.onDidDismiss(() => {
      //console.log('Dismissed toast'); //click ok
      this.callbackDismissed();
    });

    toast.present();
  }

  /**
   * Hàm gọi lại khi đóng thông báo của hàm presentToast
   * với tùy chọn là hiển thị nút OK (xác nhận)
   */
  callbackDismissed = function () {
    /*  status = 
     * -2 chưa đăng ký sử dụng
     * -1 lỗi hệ thống
     * 0 user bị khóa
     * 1 user đang hoạt động --> req.userRoles.menu --> next
     * 2 user đang chờ xét duyệt trong 24h */
    switch (this.statusCallBack) {
      case -2: //Chưa đăng ký sử dụng
        //console.log("Chưa đăng ký sử dụng");
        // Có thể tự gửi lời active không yêu cầu nhập tin

        this.openModal(DynamicPostPage, {
          parent: this,
          callback: this.callBackProcess, //gọi lại xử lý kết quả post tin tức
          form: {
            status: 1,   //hình thức chia sẻ công khai
            title: "Lời chào của bạn", //tiêu để của trang post
            hint: "Hãy nhập lời chào, vai trò của bạn vào hệ thống này là gì? Nhập địa chỉ email và điện thoại liên hệ", 
            //Gợi ý để post tin
            content: "", //cho phép nhập nội dung để post
            action: { name: "Đăng tin", next: "CALLBACK", url: ApiStorageService.newsServer + "/post-welcome" }
          }
        })
        break;
      case -1: //lỗi hệ thống

        break;
      case 0: //user bị khóa

        break;
      case 2: //đang chờ xét duyệt, liên hệ quản trị hệ thống

        break;
      default:
        console.log('status', this.statusCallBack);
    }
  }

  /**
   * Hàm gọi lại khi người dùng đã post thông tin lên server
   * Kết quả tùy thuộc vào server trả về mà xử lý ở hàm này
   * 
   */
  callBackProcess = function (res) {
    return new Promise((resolve, reject) => {
      if (res.error) {
        resolve();
      } else {
        //console.log('Ket qua:', res);
        if (res && res.data && res.data.message) {
          this.statusCallBack = res.data.status; //gán trạng thái để thực hiện chức năng
          this.presentToast(res.data.message) //chờ người dùng đóng bản tin thông báo từ máy chủ
        } else if (res && res.data && Array.isArray(res.data)) { //đây là mãng kết quả lấy được danh sách menu được phân quyền theo user
          //kết quả trả về là mãng menu thì gán menu cho nó luôn

          let treeOrigin= [];
          
          res.data.forEach((el, idx) => {

            treeOrigin.push({
              id: el.id,  //id của menu để tổ chức cây
              parent_id: el.parent_id, //tham chiếu id cấp cha để tổ chức cây
              name: el.name, //tên hiển thị trên menu
              size: el.size,  //kích cỡ chữ của menu
              click: el.click, //cho phép bấm vào menu là thực thi
              options: el.options, //cac bien tuy chon den chuyen tiep xu ly
              next: el.next?this.getPage(el.next):undefined,
              url: el.url, //thực hiện mở liên kết kiểu frame hay inapp hoặc popup??
              type: el.type,   //thiết lập kiểu mở liên kết theo url
              icon: el.icon //biểu tượng hiển thị trước menu (tên trong ionicIncons)
            });


            //trường hợp muốn tạo cây menu khi có parent
            //thì ta tổ chức cây trước

            //sau đó gán cho cây menu
            this.treeMenu = treeOrigin;
            
          })
        }
        resolve({ next: "CLOSE" });
      }
    })
  }.bind(this);

  //Hàm thông báo, cảnh báo người dùng
  presentAlert(msg) {
    this.alertCtrl.create({
      title: 'Cảnh báo!',
      subTitle: msg,
      buttons: ['Đóng lại']
    }).present();
  }

}

