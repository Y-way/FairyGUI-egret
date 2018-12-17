
module fairygui {

    export class Frame {
        public rect: egret.Rectangle;
        public addDelay: number = 0;
        public texture: egret.Texture|null;

        public constructor() {
            this.rect = new egret.Rectangle();
        }
    }
}