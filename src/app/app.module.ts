/**
 * ver 5.0 croppie 11/7/2019
 */

import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { Geolocation } from '@ionic-native/geolocation';
import { StorageServiceModule } from 'angular-webstorage-service';
import { SQLite } from '@ionic-native/sqlite';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';

import { MyApp } from './app.component';
import { HomeSpeedtestPage } from '../pages/home-speedtest/home-speedtest';
import { HomeMenuPage } from '../pages/home-menu/home-menu';
import { TimeAgoPipe} from 'time-ago-pipe';

import { NgxQRCodeModule } from 'ngx-qrcode2';
import { NgxBarcodeModule } from 'ngx-barcode';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';


import {Device} from '@ionic-native/device';
import {Sim} from '@ionic-native/sim';
import {Network} from '@ionic-native/network';

import { Contacts } from '@ionic-native/contacts';

import { ApiSpeedTestService } from '../services/apiSpeedTestService';
import { ApiAuthService } from '../services/apiAuthService';
import { ApiImageService } from '../services/apiImageService';
import { ApiGraphService } from '../services/apiMeterGraphService';
import { ApiStorageService } from '../services/apiStorageService';
import { ApiLocationService } from '../services/apiLocationService'
import { LoginPage } from '../pages/login/login';
import { TabsPage } from '../pages/tabs/tabs';
import { DynamicFormWebPage } from '../pages/dynamic-form-web/dynamic-form-web';
import { DynamicListPage } from '../pages/dynamic-list/dynamic-list';
import { DynamicFormMobilePage } from '../pages/dynamic-form-mobile/dynamic-form-mobile';
import { DynamicCardSocialPage } from '../pages/dynamic-card-social/dynamic-card-social';
import { DynamicMediasPage } from '../pages/dynamic-medias/dynamic-medias';
import { DynamicListOrderPage } from '../pages/dynamic-list-order/dynamic-list-order';
import { HandDrawPage } from '../pages/hand-draw/hand-draw';
import { ApiHttpPublicService } from '../services/apiHttpPublicServices';
import { RequestInterceptor } from '../interceptors/requestInterceptor';
import { ResponseInterceptor } from '../interceptors/responseInterceptor';
import { SpeedTestPage } from '../pages/speed-test/speed-test';
import { ApiSqliteService } from '../services/apiSqliteService';
import { GoogleMapPage } from '../pages/google-map/google-map';
import { ApiMapService } from '../services/apiMapService';
import { DynamicRangePage } from '../pages/dynamic-range/dynamic-range';
import { TreeView } from '../components/tree-view/tree-view';
import { DynamicTreePage } from '../pages/dynamic-tree/dynamic-tree';
import { ApiMediaService } from '../services/apiMediaService';
import { OwnerImagesPage } from '../pages/owner-images/owner-images';
import { HomeChatPage } from '../pages/home-chat/home-chat';
import { Autosize } from '../components/autosize';
import { LinkPage } from '../pages/link/link';
import { SafePipe } from '../pipes/safe-pipe';
import { QrBarScannerPage } from '../pages/qr-bar-scanner/qr-bar-scanner';
import { QrBarCodePage } from '../pages/qr-bar-code/qr-bar-code';
import { ContactsPage } from '../pages/contacts/contacts';
import { CordovaPage } from '../pages/cordova-info/cordova-info';
import { ApiContactService } from '../services/apiContactService';
import { ApiChatService } from '../services/apiChatService';
import { FriendsPage } from '../pages/friends/friends';
import { ReversePipe } from '../pipes/reverse-pipe';
import { ChattingPrivatePage } from '../pages/chatting-private/chatting-private';
import { ChattingRoomPage } from '../pages/chatting-room/chatting-room';
import { HomePage } from '../pages/home/home';
import { ImageFileSrcPipe } from '../pipes/pipe-src';
import { IconFileTypePipe } from '../pipes/icon-type';
import { LinkifyPipe } from '../pipes/linkify';
import { UrlClickPipe } from '../pipes/url-click';
import { NewlinePipe } from '../pipes/new-line';
import { PopoverCard } from '../components/popover-card/popover-card';
import { InputCard } from '../components/input-card/input-card';
import { SocialCard } from '../components/social-card/social-card';
import { UserCard } from '../components/user-card/user-card';
import { ContentCard } from '../components/content-card/content-card';
import { ImageDetail } from '../components/image-detail/image-detail';
import { ImageCard } from '../components/image-card/image-card';
import { TreeForm } from '../components/tree-form/tree-form';
import { DynamicHomePage } from '../pages/dynamic-home/dynamic-home';
import { DynamicPostPage } from '../pages/dynamic-post/dynamic-post';
import { DynamicViewPage } from '../pages/dynamic-view/dynamic-view';
import { DynamicChartPage } from '../pages/dynamic-chart/dynamic-chart';
import { AdminPage } from '../pages/administrator/administrator';
import { ApiAutoCompleteService } from '../services/apiAutoCompleteService';
import { AutoCompleteModule } from 'ionic2-auto-complete';
import { ChartsModule } from 'ng2-charts-x';
import { ResultsPage } from '../pages/results/results';
import { DynamicPostImagePage } from '../pages/dynamic-post-image/dynamic-post-image';
import { CngCroppieCard } from '../components/cng-croppie/cng-croppie';


@NgModule({
  declarations: [
    //ứng dụng gốc
    MyApp,

    //các thành phần trang động tái sử dụng nhiều nơi
    DynamicPostPage,   //trang mẫu post tin kiểu FormData()
    DynamicPostImagePage,   //trang mẫu post ảnh kiểu FormData()
    DynamicFormWebPage, //trang post json cho web
    DynamicFormMobilePage, //trang post json cho mobile
    DynamicRangePage, //trang mẫu thanh kéo và chọn dãi
    DynamicTreePage, //Trang mẫu hiển thị hình cây
    DynamicListPage,  //trang mẫu hiển thị theo danh sách cho phép quẹt và hành động
    DynamicCardSocialPage, //trang mẫu hiển thị ảnh như mạng xã hội
    DynamicMediasPage,     //trang mẫu post xử lý ảnh
    DynamicListOrderPage, //trang mẫu hiển thị kiểu bảng hoặc kiểu danh sách và sắp xếp lại
    DynamicHomePage,      //trang mẫu làm trang chủ cho phép kéo lên, xuống để lấy tin
    DynamicViewPage,    //trang mẫu hiển thị thông tin
    DynamicChartPage,    //trang mẫu hiển thị các kiểu biểu đồ
    LinkPage, //trang hiển thị liên kết

    //các trang nghiệp vụ test thử
    HomeSpeedtestPage, //trang chủ hiển thị trước khi speedtest
    SpeedTestPage,   //trang cho speedtest
    ResultsPage,      //ghi ket qua speedtest
    GoogleMapPage,    //trang cho bảng đồ googlemap 
    HandDrawPage,     //trang cho vẽ hình trên điện thoại 

    //các thành phần nhúng của cordova dùng chi di động
    CordovaPage,    // mẫu kiểm tra cordova của máy
    QrBarCodePage,   //tạo code trên các môi trường web&mobile
    QrBarScannerPage, //quét mã vạch trên mobile

    //các thành phần component card để nhúng trang
    TreeView,   //nhúng cấu trúc cây
    TreeForm,   //nhúng cấu trúc form
    ImageCard,  //nhúng hiển thị ảnh 5 ảnh
    ImageDetail, //nhúng hiển thị ảnh chi tiết
    ContentCard, //nhúng hiển thị nội dung thông tin (tự động pipe url image để hiển thị)
    UserCard,   //thanh nhúng người dùng cho phép hiển thị menu như mạng xã hội 
    SocialCard,   //thanh nhúng để tương tác mạng xã hội như like, comment, share
    InputCard,    //thanh nhúng để nhập thông tin 
    PopoverCard,   //menu popup để lựa chọn 1 giá trị hành động (như like hoặc chọn 1 hành động trong menu)
    CngCroppieCard, //Card crop ảnh theo yêu cầu người dùng (ảnh đại diện - avatar hoặc ảnh nền)

    //các thành phần pipe hiển thị web
    //không được khai báo ở phần entry cho các pipe
    TimeAgoPipe,
    SafePipe,
    ReversePipe,
    NewlinePipe,
    UrlClickPipe,
    LinkifyPipe,
    IconFileTypePipe,
    ImageFileSrcPipe,
    Autosize,

    //thành login và trang chủ 
    LoginPage, //trang login -- liên quan api server
    HomePage,  //trang chủ tin tức -- liên quan đến social server

    //các trang quản lý danh bạ, chat và bạn bè
    ContactsPage,  //xử lý danh bạ điện thoại từ mobile hoặc đồng bộ từ máy chủ - api server
    FriendsPage,   //quản lý bạn bè api-server
    HomeChatPage,  //quản lý chat như viber, mes
    ChattingPrivatePage, //chat riêng cá nhân từ máy này sang máy khác
    ChattingRoomPage,   //chat trong nhóm

    //các trang mẫu 
    TabsPage, //sử dụng tabs
    HomeMenuPage, //sử dụng home từ medias
    OwnerImagesPage, //trang post hình ảnh đến medias để làm ảnh nền và avatar
    
    /**
     * Sau đây là phần nhúng các trang nghiệp vụ của người dùng
     */

    //trang quản trị người dùng (phân quyền, khóa user)
    AdminPage,

  ],
  imports: [
    BrowserModule, //module dành cho mở trình duyệt
    HttpClientModule, //module dành cho trao đổi api qua mạng
    StorageServiceModule, //module dành cho dịch vụ lưu trữ xuống đĩa
    NgxBarcodeModule,    //module dành cho dịch vụ quét barcode
    NgxQRCodeModule,     //module dành cho dịch vụ tạo barcode
    ChartsModule,        //module dành cho dịch vụ tạo biểu đồ 
    AutoCompleteModule,   //module dành cho dịch vụ tự động tìm kiếm qua API
    IonicModule.forRoot(MyApp)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    //ứng dụng gốc
     MyApp,

     //các thành phần trang động tái sử dụng nhiều nơi
     DynamicPostPage,   //Post tin tức gồm tin tức, hình ảnh, file FormData()
     DynamicPostImagePage,   //trang mẫu post ảnh kiểu FormData()
     DynamicFormWebPage, //trang post json cho web
     DynamicFormMobilePage, //trang post json cho mobile
     DynamicRangePage, //trang mẫu thanh kéo và chọn dãi
     DynamicTreePage, //Trang mẫu hiển thị hình cây
     DynamicListPage,  //trang mẫu hiển thị theo danh sách cho phép quẹt và hành động
     DynamicCardSocialPage, //trang mẫu hiển thị ảnh như mạng xã hội
     DynamicMediasPage,     //trang mẫu post xử lý ảnh
     DynamicListOrderPage, //trang mẫu hiển thị kiểu bảng hoặc kiểu danh sách và sắp xếp lại
     DynamicHomePage,      //trang mẫu làm trang chủ cho phép kéo lên, xuống để lấy tin
     DynamicViewPage,    //trang mẫu hiển thị thông tin
     DynamicChartPage,    //trang mẫu hiển thị các kiểu biểu đồ
     LinkPage, //trang hiển thị liên kết
 
     //các trang nghiệp vụ test thử
     HomeSpeedtestPage, //trang chủ hiển thị trước khi speedtest
     SpeedTestPage,   //trang cho speedtest
     ResultsPage,      //ghi ket qua speedtest
     GoogleMapPage,    //trang cho bảng đồ googlemap 
     HandDrawPage,     //trang cho vẽ hình trên điện thoại 
     CngCroppieCard, //Card crop ảnh theo yêu cầu người dùng (ảnh đại diện - avatar hoặc ảnh nền)
 
     //các thành phần nhúng của cordova dùng chi di động
     CordovaPage,    // mẫu kiểm tra cordova của máy
     QrBarCodePage,   //tạo code trên các môi trường web&mobile
     QrBarScannerPage, //quét mã vạch trên mobile
 
     //các thành phần component card để nhúng trang
     TreeView,   //nhúng cấu trúc cây
     TreeForm,   //nhúng cấu trúc form
     ImageCard,  //nhúng hiển thị ảnh 5 ảnh
     ImageDetail, //nhúng hiển thị ảnh chi tiết
     ContentCard, //nhúng hiển thị nội dung thông tin (tự động pipe url image để hiển thị)
     UserCard,   //thanh nhúng người dùng cho phép hiển thị menu như mạng xã hội 
     SocialCard,   //thanh nhúng để tương tác mạng xã hội như like, comment, share
     InputCard,    //thanh nhúng để nhập thông tin 
     PopoverCard,   //menu popup để lựa chọn 1 giá trị hành động (như like hoặc chọn 1 hành động trong menu)
     
     //thành login và trang chủ 
     LoginPage, //trang login -- liên quan api server
     HomePage,  //trang chủ tin tức -- liên quan đến social server
 
     //các trang quản lý danh bạ, chat và bạn bè
     ContactsPage,  //xử lý danh bạ điện thoại từ mobile hoặc đồng bộ từ máy chủ - api server
     FriendsPage,   //quản lý bạn bè api-server
     HomeChatPage,  //quản lý chat như viber, mes
     ChattingPrivatePage, //chat riêng cá nhân từ máy này sang máy khác
     ChattingRoomPage,   //chat trong nhóm
 
     //các trang mẫu 
     TabsPage, //sử dụng tabs
     HomeMenuPage, //sử dụng home từ medias
     OwnerImagesPage, //trang post hình ảnh đến medias để làm ảnh nền và avatar
     /**
      * Sau đây là phần nhúng các trang nghiệp vụ của người dùng
      */
 
     //trang quản trị người dùng (phân quyền, khóa user)
     AdminPage,
  ],
  providers: [
    StatusBar,
    SplashScreen,
    //dịch vụ vị trí cho các môi trường
    Geolocation,

    //các dịch vụ cordova dành cho mobile
    BarcodeScanner,
    Contacts,
    Device,
    Sim,
    Network,
    SQLite,
    InAppBrowser,

    //các dịch vụ viết riêng dùng chung 
    ApiAuthService,  //dịch vụ mạng, xác thực và mã hóa, blockchain,
    ApiHttpPublicService, //dịch vụ cộng đồng api - lấy các api trên internet phổ biến

    ApiSpeedTestService, //dịch vụ cho speedtest
    ApiGraphService, //dịch vụ cho speedtest

    ApiImageService, //dịch vụ xử lý ảnh
    
    ApiSqliteService, //dịch vụ lưu cơ sở dữ liệu trên mobile
    ApiStorageService, //dịch vụ lưu trữ cho các môi trường

    ApiMediaService,  //dịch vụ cho media server (có thể thu gọn lại không cần thiết)

    ApiLocationService, //dịch vụ quản lý vị trí (lấy tọa độ trên ứng dụng)
    ApiMapService,      //dịch vụ xử lý bản đồ (tính toán tọa độ độ dài, lấy vị trí, địa chỉ theo tọa độ)
    
    ApiContactService,  //dịch vụ xử lý danh bạ trên mobile và đồng bộ server

    ApiChatService, //dịch vụ quản lý chat - liên kết chat server

    //dịch vụ nhúng bảo mật của angular (cho phép gửi token-option)
    RequestInterceptor,  
    ApiAutoCompleteService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: RequestInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ResponseInterceptor,
      multi: true
    },
    //dịch vụ xử lý lỗi của ionic-angular có sẵn
    {provide: ErrorHandler,
       useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
