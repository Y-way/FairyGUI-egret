
module fairygui {

    export class GLabel extends GComponent {
        protected _titleObject: GObject|null;
        protected _iconObject: GObject|null;

        public constructor() {
            super();
        }

        public get icon(): string|null {
            if (this._iconObject != null)
                return this._iconObject.icon;
            return null;
        }

        public set icon(value: string|null) {
            if (this._iconObject != null)
                this._iconObject.icon = value;
            this.updateGear(7);
        }

        public get title(): string|null {
            if (this._titleObject)
                return this._titleObject.text;
            else
                return null;
        }

        public set title(value: string|null) {
            if (this._titleObject)
                this._titleObject.text = value;
            this.updateGear(6);
        }

        public get text(): string|null {
            return this.title;
        }

        public set text(value: string|null) {
            this.title = value;
        }

        public get titleColor(): number {
            let tf: GTextField|null = this.getTextField();
            if (tf != null)
                return tf.color;
            else
                return 0;
        }

        public set titleColor(value: number) {
            let tf: GTextField|null = this.getTextField();
            if (tf != null)
                tf.color = value;
            this.updateGear(4);
        }

        public get color(): number {
            return this.titleColor;
        }

        public set color(value: number) {
            this.titleColor = value;
        }

        public get titleFontSize(): number {
            let tf: GTextField|null = this.getTextField();
            if (tf != null)
                return tf.fontSize;
            else
                return 0;
        }

        public set titleFontSize(value: number) {
            let tf: GTextField|null = this.getTextField();
            if (tf != null)
                tf.fontSize = value;
        }

        public set editable(val: boolean) {
            if (this._titleObject && this._titleObject.asTextInput)
                this._titleObject.asTextInput.editable = val;
        }

        public get editable(): boolean {
            if (this._titleObject && (this._titleObject instanceof GTextInput))
                return this._titleObject.asTextInput ? this._titleObject.asTextInput.editable : false;
            else
                return false;
        }

        public getTextField(): GTextField|null {
            if (this._titleObject instanceof GTextField)
                return (<GTextField>this._titleObject);
            else if (this._titleObject instanceof GLabel)
                return (<GLabel>this._titleObject).getTextField();
            else if (this._titleObject instanceof GButton)
                return (<GButton>this._titleObject).getTextField();
            else
                return null;
        }

        protected constructExtension(buffer: ByteBuffer): void {
            this._titleObject = this.getChild("title");
            this._iconObject = this.getChild("icon");
        }

        public setup_afterAdd(buffer: ByteBuffer, beginPos: number): void {
            super.setup_afterAdd(buffer, beginPos);

            if (!buffer.seek(beginPos, 6))
                return;

            if (buffer.readByte() != this.packageItem.objectType)
                return;

            let str: string|null;
            str = buffer.readS();
            if (str != null)
                this.title = str;
            str = buffer.readS();
            if (str != null)
                this.icon = str;
            if (buffer.readBool())
                this.titleColor = buffer.readColor();
            let iv: number = buffer.readInt();
            if (iv != 0)
                this.titleFontSize = iv;

            if (buffer.readBool()) {
                let input: GTextInput = this.getTextField() as GTextInput;
                if (input != null) {
                    str = buffer.readS();
                    if (str != null)
                        input.promptText = str;

                    str = buffer.readS();
                    if (str != null)
                        input.restrict = str;

                    iv = buffer.readInt();
                    if (iv != 0)
                        input.maxLength = iv;
                    iv = buffer.readInt();
                    if (iv != 0) {
                        //keyboardType
                    }
                    if (buffer.readBool())
                        input.password = true;
                }
                else
                    buffer.skip(13);
            }
        }
    }
}