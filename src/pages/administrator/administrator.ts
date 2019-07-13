import { Component } from '@angular/core';
import { NavController, LoadingController, AlertController, ItemSliding, ModalController, ToastController } from 'ionic-angular';

import { ApiAuthService } from '../../services/apiAuthService';
import { ApiStorageService } from '../../services/apiStorageService';
import { DynamicFormMobilePage } from '../dynamic-form-mobile/dynamic-form-mobile';

@Component({
  selector: 'page-administrator',
  templateUrl: 'administrator.html'
})
export class AdminPage {

  maxCurrentId: number = 0; //su dung de them khach hang moi

  usersOrigin: any = [];

  isSearch: boolean = false;
  searchString: string = "";

  users: any = [];

  isLoaded: boolean = true;
  maxOnePage = 20;
  curPageIndex = 0;
  lastPageIndex = 0;


  organizations: any = [];
  menus: any = [];
  functions: any = [];

  orgOptions = [];
  menuOptions = [];
  functionOptions = [];

  constructor(
    private navCtrl: NavController,
    private apiAuth: ApiAuthService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController
  ) {

  }

  ngOnInit() {
    this.getusers(); //cai nay lay tu load trang dau luon
  }

  async getusers() {
    let loading = this.loadingCtrl.create({
      content: 'Đang lấy danh sách người dùng...'
    });
    loading.present();
    //doc 20 khach hang thoi, roi doc tiep
    //...
    try {
      this.usersOrigin = await this.apiAuth.getDynamicUrl(ApiStorageService.resourceServer + "/get-users", true)
      this.maxCurrentId = Math.max.apply(Math, this.usersOrigin.map((o) => { return o.id }));

      //lấy các danh mục để gán cho các chức năng sau này
      this.organizations = await this.apiAuth.getDynamicUrl(ApiStorageService.resourceServer + "/get-organizations", true);
      this.menus = await this.apiAuth.getDynamicUrl(ApiStorageService.resourceServer + "/get-menus", true);
      this.functions = await this.apiAuth.getDynamicUrl(ApiStorageService.resourceServer + "/get-functions", true);

      //tạo danh mục để gán chức năng chọn sau
      if (Array.isArray(this.organizations)) {
        this.organizations.forEach(el => {
          this.orgOptions.push(
            { name: el.name, value: parseInt(el.id) }
          )
        });
      }
      if (Array.isArray(this.menus)) {
        this.menus.forEach(el => {
          this.menuOptions.push(
            { name: el.name, value: parseInt(el.id) }
          )
        });
      }
      if (Array.isArray(this.functions)) {
        this.functions.forEach(el => {
          this.functionOptions.push(
            { name: el.name, value: parseInt(el.id) }
          )
        });
      }

    } catch (e) {
      this.usersOrigin = [];
      this.alertCtrl.create({
        title: 'Alert',
        subTitle: 'For Administrator',
        message: "Lỗi đọc dữ liệu người dùng",
        buttons: ['OK']
      }).present();
    }

    this.users = this.usersOrigin.slice(0, 20);

    loading.dismiss();
  }


  getUserPage(isRenew?: boolean) {

    if (isRenew) {
      this.curPageIndex--;
    } else {
      this.curPageIndex++;
    }

    let offset = this.curPageIndex * this.maxOnePage;
    let limit = offset + this.maxOnePage;
    //console.log(offset,this.users);
    this.users = this.users.concat(this.usersOrigin.slice(offset, limit));

  }

  goBack() {
    this.navCtrl.popToRoot();
  }

  goSearch() {
    this.isSearch = true;
  }

  onInput(e) {
    this.users = this.usersOrigin.filter(x => (
      (x.username && x.username.indexOf(this.searchString.toLowerCase()) >= 0)
      ||
      (x.fullname && x.fullname.indexOf(this.searchString.toLowerCase()) >= 0)
      ||
      (x.email && x.email.indexOf(this.searchString.toLowerCase()) >= 0)
      ||
      (x.status >= 0 && (("" + x.status) === this.searchString))
    ))
  }

  searchEnter() {
    this.isSearch = false;
    this.searchString = "";
  }

  /**
   * Thêm mới user
   */
  newUser() {

  }

  /**
   * Phân quyền user
   * @param user 
   */
  onClickItem(user) {

    let form = {
      title: "Phân quyền user"
      , home_disable: true
      , buttons: [
        { color: "danger", icon: "close", next: "CLOSE" }
      ]
      , items: [
        { type: "title", key: "id", value: user.id, name: "Username: " + user.username }
        ,
        {
          type: "details",
          details: [
            {
              name: "Họ và tên",
              value: user.fullname
            }
            ,
            {
              name: "Nickname",
              value: user.nickname
            }
            ,
            {
              name: "Điện thoại",
              value: user.phone
            }
            ,
            {
              name: "email",
              value: user.email
            }
          ]
        }
        , { type: "select", key: "organization_id", name: "Đơn vị", value: user.organization_id, options: this.orgOptions, icon: "ios-contacts-outline", validators: [{ required: true }], hint: "Chọn một đơn vị trực thuộc của hệ thống" }
        , { type: "select_multiple", key: "menu", name: "Phân quyền menu", value: user.roles ? user.roles.menu : [1], options: this.menuOptions, icon: "ios-menu-outline", validators: [{ required: true }], hint: "Chọn các menu cho phép người dùng này" }
        , { type: "select_multiple", key: "functions", name: "Phân quyền chức năng", value: user.roles ? user.roles.functions : [1], options: this.functionOptions, icon: "ios-lock-outline", validators: [{ required: true }], hint: "Chọn các chức năng cho phép người dùng này" }
        , {
          type: "button"
          , options: [
            { name: "Reset", next: "RESET" }
            , { name: "Cập nhật", next: "CALLBACK", url: ApiStorageService.resourceServer + "/edit-user", token: true, signed: true }
          ]
        }
      ]
    }

    this.openModal(DynamicFormMobilePage, {
      parent: this,
      form: form,
      callback: this.callbackUser
    })
  }

  callbackUser = function (res) {

    return new Promise((resolve, reject) => {
      if (res.error) {
        this.presentToast("Bạn không có quyền cập nhập thông tin này. Error:" + res.error.message) //chờ người dùng đóng
      } else {
        //thong bao cap nhap thanh cong
        if (res.data) {
          this.presentToast("Cập nhật thành công!", 3000) //hiển thị 3 giây
          //thay doi du lieu hien thi bang bang ghi moi
          let index = this.users.findIndex(x => x.id === res.data.id);
          if (index >= 0) {
            this.users.splice(index, 1, res.data)
          }
          index = this.usersOrigin.findIndex(x => x.id === res.data.id);
          if (index >= 0) {
            this.usersOrigin.splice(index, 1, res.data)
          } else {
            //truong hop them moi
            this.users.splice(0, 0, res.data);
            this.usersOrigin.splice(0, 0, res.data);
          }

        } else {
          this.presentToast("Lỗi không có dữ liệu trả về") //chờ người dùng đóng
        }

      }
      resolve({ next: "CLOSE" })

    })
  }.bind(this);

  /**
   * Thay đổi cách bấm nút đóng lệnh bằng nút trên item sliding
   * @param slidingItem 
   */
  closeSwipeOptions(slidingItem: ItemSliding) {
    slidingItem.close();
    slidingItem.setElementClass("active-sliding", false);
    slidingItem.setElementClass("active-slide", false);
    slidingItem.setElementClass("active-options-right", false);
  }

  onClickDetails(slidingItem: ItemSliding, user: any, func: string) {
    this.closeSwipeOptions(slidingItem);
    if (func === "EDIT") {
      this.onClickItem(user);
    }

    if (func === "DELETE") {
      let alert = this.alertCtrl.create({
        title: 'Xác nhận thay đổi',
        message: 'Bạn muốn ' + (user.status===1 ? 'KHÓA' : 'kích hoạt') + ' người dùng(user): ' + user.username + ' phải không? ' + (user.status===1 ? 'Lưu ý: User bị khóa sẽ không có quyền truy cập hệ thống này!' : ''),
        buttons: [
          {
            text: 'Bỏ qua',
            role: 'cancel',
            handler: () => { }
          },
          {
            text: 'Xác nhận',
            handler: () => {
              let jsonDelete = { id: user.id, status: user.status == 1 ? 0 : 1 }
              this.apiAuth.postDynamicForm(ApiStorageService.resourceServer + "/edit-user", jsonDelete, true)
                .then(data => {
                  let index = this.users.findIndex(x => x.id === data.id);
                  if (index >= 0) {
                    this.users.splice(index, 1, data)
                  }
                  index = this.usersOrigin.findIndex(x => x.id === data.id);
                  if (index >= 0) {
                    this.usersOrigin.splice(index, 1, data)
                  }
                })
                .catch(err => {
                  console.log('Lỗi cập nhật', err);
                })

            }
          }
        ]
      }).present();
    }
  }


  doInfinite(infiniteScroll, direction) {
    if (direction === 'UP') {
      //console.log('UP', this.curPageIndex, this.lastPageIndex);
      if (!this.isLoaded) {
        this.getUserPage(true);
      }
      setTimeout(() => {
        this.isLoaded = true;
        infiniteScroll.complete();
      }, 1000);
    } else {
      //console.log('DOWN', this.curPageIndex, this.lastPageIndex);
      this.getUserPage(false);
      this.isLoaded = false; //khi keo xuong duoi thi o tren moi cho phep
      setTimeout(() => {
        infiniteScroll.complete();
      }, 1000);
    }
  }

  openModal(form, data?: any) {
    let modal = this.modalCtrl.create(form, data);
    modal.onDidDismiss(data => {
      //console.log('ket qua xu ly popup xong',data);
    })
    modal.present();
  }

  presentToast(message, duration?: 0 | 3000 | 5000) {
    let toast = this.toastCtrl.create({
      message: message,
      duration: duration ? duration : undefined, //default for click ok
      showCloseButton: duration ? false : true, //hien thi nut close nhu xem roi
      //cssClass: duration?"toast-container-white":"toast-container-red",
      position: 'middle' // "top", "middle", "bottom".
    });

    toast.onDidDismiss(() => {
      //console.log('Dismissed toast'); //click ok
    });

    toast.present();
  }

}
