de su dung truy van oracle database
can cai dat tren may server mot instantclient (tuy vao he dieu hanh win32, win64, unix,...)
 Oracle Instant Client
huong dan tai:
https://oracle.github.io/node-oracledb/INSTALL.html

# node-server-medias


# cai dat QR-BAR-CODE-GENERATOR - danh cho web
npm i ngx-qrcode2 ngx-barcode

import { NgxQRCodeModule } from 'ngx-qrcode2';
import { NgxBarcodeModule } from 'ngx-barcode';

imports: [
    ...
    NgxBarcodeModule,
    NgxQRCodeModule,
    ...
  ],
Su dung:
#BAR:
<ngx-barcode [bc-value]="barCode" [bc-display-value]="true"></ngx-barcode>
#QR:
<ngx-qrcode [qrc-value]="qrCode"></ngx-qrcode>

# cai dat QR-BAR-CODE-SCANNER - danh cho app - cordova
#BAR & QR
ionic cordova plugin add phonegap-plugin-barcodescanner
npm install @ionic-native/barcode-scanner@^4.5.3
#luu y barcode-scanner thu 4.5.3 moi chay, version moi hon chua chay duoc

ionic cordova plugin add cordova-plugin-camera
npm install @ionic-native/camera

Khai trong provider va trang scan version "^4.5.3" moi chay duoc
import { BarcodeScanner } from '@ionic-native/barcode-scanner';

constructor(private barcodeScanner: BarcodeScanner) { }

this.barcodeScanner.scan().then(barcodeData => {
 console.log('Barcode data', barcodeData);
}).catch(err => {
    console.log('Error', err);
}); 

#QR -- error on ios
ionic cordova plugin add cordova-plugin-qrscanner
npm install @ionic-native/qr-scanner

import { QRScanner, QRScannerStatus } from '@ionic-native/qr-scanner/ngx';
constructor(private qrScanner: QRScanner) { }

// Optionally request the permission early
this.qrScanner.prepare()
  .then((status: QRScannerStatus) => {
     if (status.authorized) {
       // camera permission was granted


       // start scanning
       let scanSub = this.qrScanner.scan().subscribe((text: string) => {
         console.log('Scanned something', text);

         this.qrScanner.hide(); // hide camera preview
         scanSub.unsubscribe(); // stop scanning
       });

     } else if (status.denied) {
       // camera permission was permanently denied
       // you must use QRScanner.openSettings() method to guide the user to the settings page
       // then they can grant the permission from there
     } else {
       // permission was denied, but not permanently. You can ask for permission again at a later time.
     }
  })
  .catch((e: any) => console.log('Error is', e));