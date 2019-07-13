import { Component, OnInit, Input, EventEmitter, Output, ViewChild, ElementRef } from '@angular/core';

import * as Croppie from 'croppie';
import { CroppieOptions, ResultOptions, CropData } from 'croppie';

export type Type = 'canvas' | 'base64' | 'html' | 'blob' | 'rawcanvas';

@Component({
	selector: 'cng-croppie',
	templateUrl: "cng-croppie.html"
})
export class CngCroppieCard implements OnInit {
	@ViewChild('imageEdit') imageEdit: ElementRef;
	@Input() croppieOptions: CroppieOptions;
	@Input() points: number[];
	@Input() isRotator: boolean = true;
	//kiểu dữ liệu croppie trả về là blob để post lên máy chủ sẽ có kích cỡ nhỏ hơn base64
	@Input() outputFormatOptions: ResultOptions = { type: 'base64', size: 'viewport' }; 
	/* 
	1. Có các kiểu dữ liệu trả về như sau:
			'base64' returns a the cropped image encoded in base64
			'html' returns html of the image positioned within an div of hidden overflow
			'blob' returns a blob of the cropped image
			'rawcanvas' returns the canvas element allowing you to manipulate prior to getting the resulted image 
	2. Màn hình crop sẽ trả về theo các tùy chọn:
		vùng viewport là default
			 original là lấy theo kích cỡ gốc của image
			 {width, height} cặp kích cỡ tùy chọn để lấy
	Xem tài liệu tại:
	https://foliotek.github.io/Croppie/		
	*/
	@Input() defaultZoom = 0;
	@Output() result: EventEmitter<string | HTMLElement | Blob | HTMLCanvasElement>
		= new EventEmitter<string | HTMLElement | Blob | HTMLCanvasElement>();
	private _croppie: Croppie;
	private imgUrl: string;
	get imageUrl(): string {
		return this.imgUrl;
	}
	@Input() set imageUrl(url: string) {
		if(this.imgUrl === url) { return; }
		this.imgUrl = url;
		if (this._croppie) {
			this.bindToCroppie(this.imageUrl, this.points, this.defaultZoom);
		}
	}


	//goc quay hien tai
	curDegree = 0;

	ngOnInit(): void {
		this._croppie = new Croppie(this.imageEdit.nativeElement, this.croppieOptions);
		this.bindToCroppie(this.imageUrl, this.points, this.defaultZoom);
	}

	private bindToCroppie(url: string, points: number[], zoom: number){
		this._croppie.bind({ url, points, zoom });
	}

	newResult() {
		this._croppie.result(this.outputFormatOptions).then((res) => {
			this.result.emit(res);
		});
	}

	rotate(degrees:any | 90 | 180 | 270 | -90 | -180 | -270) {
		this._croppie.rotate(degrees);
	}

	get(): CropData {
		return this._croppie.get();
	}

	onClickRotate(direction){
		if (direction === 'LEFT'){
			this.curDegree += 90;
		}else{
			this.curDegree -= 90;
		}
		this.rotate(this.curDegree);
	}

}
