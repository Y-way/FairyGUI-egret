module fairygui {
    export class TranslationHelper {
        public static strings: Object|null = null;

        public static loadFromXML(source: string): void {
            TranslationHelper.strings = {};
            let xml: any = egret.XML.parse(source);
            let nodes: any = xml.children;
            let length1: number = nodes.length;
            for (let i1: number = 0; i1 < length1; i1++) {
                let cxml: any = nodes[i1];
                if (cxml.name == "string") {
                    let key: string = cxml.attributes.name;
                    let text: string = cxml.children.length > 0 ? cxml.children[0].text : "";
                    let i: number = key.indexOf("-");
                    if (i == -1)
                        continue;

                    let key2: string = key.substr(0, i);
                    let key3: string = key.substr(i + 1);
                    let col: any = TranslationHelper.strings[key2];
                    if (!col) {
                        col = {};
                        TranslationHelper.strings[key2] = col;
                    }
                    col[key3] = text;
                }
            }
        }

        public static translateComponent(item: PackageItem): void {
            if (TranslationHelper.strings == null)
                return;

            let compStrings: Object = TranslationHelper.strings[item.owner.id + item.id];
            if (compStrings == null)
                return;

            let elementId: string, value: string;
            let buffer: ByteBuffer = item.rawData;
            let nextPos: number;
            let itemCount: number;
            let i: number, j: number, k: number;
            let dataLen: number;
            let curPos: number;
            let valueCnt: number;
            let page: string;

            buffer.seek(0, 2);

            let childCount: number = buffer.readShort();
            for (i = 0; i < childCount; i++) {
                dataLen = buffer.readShort();
                curPos = buffer.position;

                buffer.seek(curPos, 0);

                let type: number = buffer.readByte();
                buffer.skip(4);
                elementId = <string>buffer.readS();

                if (type == ObjectType.Component) {
                    if (buffer.seek(curPos, 6))
                        type = buffer.readByte();
                }

                buffer.seek(curPos, 1);

                if ((value = compStrings[elementId + "-tips"]) != null)
                    buffer.writeS(value);

                buffer.seek(curPos, 2);

                let gearCnt: number = buffer.readShort();
                for (j = 0; j < gearCnt; j++) {
                    nextPos = buffer.readShort();
                    nextPos += buffer.position;

                    if (buffer.readByte() == 6) //gearText
                    {
                        buffer.skip(2);//controller
                        valueCnt = buffer.readShort();
                        for (k = 0; k < valueCnt; k++) {
                            page = <string>buffer.readS();
                            if (page != null) {
                                if ((value = compStrings[elementId + "-texts_" + k]) != null)
                                    buffer.writeS(value);
                                else
                                    buffer.skip(2);
                            }
                        }

                        if (buffer.readBool() && (value = compStrings[elementId + "-texts_def"]) != null)
                            buffer.writeS(value);
                    }

                    buffer.position = nextPos;
                }

                switch (type) {
                    case ObjectType.Text:
                    case ObjectType.RichText:
                    case ObjectType.InputText:
                        {
                            if ((value = compStrings[elementId]) != null) {
                                buffer.seek(curPos, 6);
                                buffer.writeS(value);
                            }
                            if ((value = compStrings[elementId + "-prompt"]) != null) {
                                buffer.seek(curPos, 4);
                                buffer.writeS(value);
                            }
                            break;
                        }

                    case ObjectType.List:
                        {
                            buffer.seek(curPos, 8);
                            buffer.skip(2);
                            itemCount = buffer.readShort();
                            for (j = 0; j < itemCount; j++) {
                                nextPos = buffer.readShort();
                                nextPos += buffer.position;

                                buffer.skip(2); //url
                                if ((value = compStrings[elementId + "-" + j]) != null)
                                    buffer.writeS(value);
                                else
                                    buffer.skip(2);
                                if ((value = compStrings[elementId + "-" + j + "-0"]) != null)
                                    buffer.writeS(value);
                                buffer.position = nextPos;
                            }
                            break;
                        }

                    case ObjectType.Label:
                        {
                            if (buffer.seek(curPos, 6) && buffer.readByte() == type) {
                                if ((value = compStrings[elementId]) != null)
                                    buffer.writeS(value);
                                else
                                    buffer.skip(2);

                                buffer.skip(2);
                                if (buffer.readBool())
                                    buffer.skip(4);
                                buffer.skip(4);
                                if (buffer.readBool() && (value = compStrings[elementId + "-prompt"]) != null)
                                    buffer.writeS(value);
                            }
                            break;
                        }

                    case ObjectType.Button:
                        {
                            if (buffer.seek(curPos, 6) && buffer.readByte() == type) {
                                if ((value = compStrings[elementId]) != null)
                                    buffer.writeS(value);
                                else
                                    buffer.skip(2);
                                if ((value = compStrings[elementId + "-0"]) != null)
                                    buffer.writeS(value);
                            }
                            break;
                        }

                    case ObjectType.ComboBox:
                        {
                            if (buffer.seek(curPos, 6) && buffer.readByte() == type) {
                                itemCount = buffer.readShort();
                                for (j = 0; j < itemCount; j++) {
                                    nextPos = buffer.readShort();
                                    nextPos += buffer.position;

                                    if ((value = compStrings[elementId + "-" + j]) != null)
                                        buffer.writeS(value);

                                    buffer.position = nextPos;
                                }

                                if ((value = compStrings[elementId]) != null)
                                    buffer.writeS(value);
                            }

                            break;
                        }
                }

                buffer.position = curPos + dataLen;
            }
        }
    }
}