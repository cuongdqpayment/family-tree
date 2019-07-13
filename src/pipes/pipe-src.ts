import {Pipe, PipeTransform} from '@angular/core';
/*
 * Dua obj chua tra ve src theo kieu file:
 * src: this.serverNews + "/get-file/" + el.url,
 * alt: el.content,
 * file_type: el.file_type,
*/
@Pipe({ name: 'imageSrc' })
export class ImageFileSrcPipe implements PipeTransform {
    transform(value: any, args: string[]): any {
        if (value===undefined || value === null || typeof value !== 'object' 
        || value.src === undefined 
        || value.src === null 
        || value.file_type ===undefined 
        || value.file_type === null 
        || typeof value.file_type !== 'string' ) return "assets/imgs/file.png";
        if (value.file_type.toLowerCase().indexOf("pdf")>=0) return "assets/imgs/pdf.png";
        if (value.file_type.toLowerCase().indexOf("word")>=0) return "assets/imgs/word.png";
        if (value.file_type.toLowerCase().indexOf("sheet")>=0 || value.file_type.toLowerCase().indexOf("excel")>=0) return "assets/imgs/excel.png";
        if (value.file_type.toLowerCase().indexOf("image")>=0 || value.file_type.toLowerCase().indexOf("video")>=0) return value.src;
        return "assets/imgs/file.png";
    }
}