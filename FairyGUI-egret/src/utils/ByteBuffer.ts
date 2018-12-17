module fairygui {

    export class ByteBuffer extends egret.ByteArray {
        public stringTable: Array<string>|null = null;
        public version: number = 0;

        public constructor(buffer?: ArrayBuffer | Uint8Array, bufferExtSize?: number) {
            super(buffer, bufferExtSize);
        }

        public skip(count: number): void {
            this.position += count;
        }

        public readBool(): boolean {
            return this.readByte() == 1;
        }

        public readS(): string|null {
            let index: number = this.readUnsignedShort();
            if (index == 65534) //null
                return null;
            else if (index == 65533)
                return ""
            else
                return this.stringTable ? this.stringTable[index] : null;
        }

        public writeS(value: string): void {
            let index: number = this.readUnsignedShort();
            if (index != 65534 && index != 65533 && this.stringTable != null)
                this.stringTable[index] = value;
        }

        public readColor(hasAlpha: boolean = false): number {
            let r: number = this.readUnsignedByte();
            let g: number = this.readUnsignedByte();
            let b: number = this.readUnsignedByte();
            let a: number = this.readUnsignedByte();

            return (hasAlpha ? (a << 24) : 0) + (r << 16) + (g << 8) + b;
        }

        public readChar(): string {
            let i: number = this.readUnsignedShort();
            return String.fromCharCode(i);
        }

        public readBuffer(): ByteBuffer {
            let count: number = this.readUnsignedInt();
            let ba: ByteBuffer = new ByteBuffer(new Uint8Array(this.buffer, this.position, count));
            ba.stringTable = this.stringTable;
            ba.version = this.version;
            return ba;
        }

        public seek(indexTablePos: number, blockIndex: number): boolean {
            let tmp: number = this.position;
            this.position = indexTablePos;
            let segCount: number = this.readByte();
            if (blockIndex < segCount) {
                let useShort: boolean = this.readByte() == 1;
                let newPos: number;
                if (useShort) {
                    this.position += 2 * blockIndex;
                    newPos = this.readUnsignedShort();
                }
                else {
                    this.position += 4 * blockIndex;
                    newPos = this.readUnsignedInt();
                }

                if (newPos > 0) {
                    this.position = indexTablePos + newPos;
                    return true;
                }
                else {
                    this.position = tmp;
                    return false;
                }
            }
            else {
                this.position = tmp;
                return false;
            }
        }
    }
}