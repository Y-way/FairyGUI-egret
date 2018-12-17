module fairygui {

    export class AsyncOperation {
        /**
         * callback(obj:GObject)
         */
        public callback: Function;
        public callbackObj: any;

        private _itemList: Array<DisplayListItem>;
        private _objectPool: Array<GObject>;
        private _index: number;

        public constructor() {
            this._itemList = new Array<DisplayListItem>();
            this._objectPool = new Array<GObject>();
        }

        public createObject(pkgName: string, resName: string): void {
            let pkg: UIPackage = UIPackage.getByName(pkgName);
            if (pkg) {
                let pi: PackageItem = pkg.getItemByName(resName);
                if (!pi)
                    throw new Error("resource not found: " + resName);

                this.internalCreateObject(pi);
            }
            else
                throw new Error("package not found: " + pkgName);
        }

        public createObjectFromURL(url: string): void {
            let pi: PackageItem|null = UIPackage.getItemByURL(url);
            if (pi)
                this.internalCreateObject(pi);
            else
                throw new Error("resource not found: " + url);
        }

        public cancel(): void {
            GTimers.inst.remove(this.run, this);
            this._itemList.length = 0;
            let cnt: number = this._objectPool.length;
            if (cnt > 0) {
                for (let i: number = 0; i < cnt; i++)
                    this._objectPool[i].dispose();
                this._objectPool.length = 0;
            }
        }

        private internalCreateObject(item: PackageItem): void {
            this._itemList.length = 0;
            this._objectPool.length = 0;

            let di: DisplayListItem = new DisplayListItem(item, 0);
            di.childCount = this.collectComponentChildren(item);
            this._itemList.push(di);

            this._index = 0;
            GTimers.inst.add(1, 0, this.run, this);
        }

        private collectComponentChildren(item: PackageItem): number {
            let buffer: ByteBuffer = item.rawData;
            buffer.seek(0, 2);

            let di: DisplayListItem;
            let pi: PackageItem|null;
            let i: number;
            let dataLen: number;
            let curPos: number;
            let pkg: UIPackage;

            let dcnt: number = buffer.readShort();
            for (i = 0; i < dcnt; i++) {
                dataLen = buffer.readShort();
                curPos = buffer.position;

                buffer.seek(curPos, 0);

                let type: number = buffer.readByte();
                let src: string|null = buffer.readS();
                let pkgId: string|null = buffer.readS();

                buffer.position = curPos;

                if (src != null) {
                    if (pkgId != null)
                        pkg = UIPackage.getById(pkgId);
                    else
                        pkg = item.owner;

                    pi = pkg != null ? pkg.getItemById(src) : null;
                    di = new DisplayListItem(pi, type);

                    if (pi != null && pi.type == PackageItemType.Component)
                        di.childCount = this.collectComponentChildren(pi);
                }
                else {
                    di = new DisplayListItem(null, type);
                    if (type == ObjectType.List) //list
                        di.listItemCount = this.collectListChildren(buffer);
                }

                this._itemList.push(di);
                buffer.position = curPos + dataLen;
            }

            return dcnt;
        }

        private collectListChildren(buffer: ByteBuffer): number {
            buffer.seek(buffer.position, 8);

            let listItemCount: number = 0;
            let i: number;
            let nextPos: number;
            let url: string|null;
            let pi: PackageItem|null;
            let di: DisplayListItem;
            let defaultItem: string|null = buffer.readS();
            let itemCount: number = buffer.readShort();

            for (i = 0; i < itemCount; i++) {
                nextPos = buffer.readShort();
                nextPos += buffer.position;

                url = buffer.readS();
                if (url == null)
                    url = defaultItem;
                if (url) {
                    pi = UIPackage.getItemByURL(url);
                    if (pi != null) {
                        di = new DisplayListItem(pi, pi.objectType);
                        if (pi.type == PackageItemType.Component)
                            di.childCount = this.collectComponentChildren(pi);

                        this._itemList.push(di);
                        listItemCount++;
                    }
                }
                buffer.position = nextPos;
            }

            return listItemCount;
        }

        private run(): void {
            let obj: GObject|null;
            let di: DisplayListItem;
            let poolStart: number;
            let k: number;
            let t: number = egret.getTimer();
            let frameTime: number = fairygui.UIConfig.frameTimeForAsyncUIConstruction;
            let totalItems: number = this._itemList.length;

            while (this._index < totalItems) {
                di = this._itemList[this._index];
                if (di.packageItem != null) {
                    obj = <GObject>UIObjectFactory.newObject(di.packageItem);
                    obj.packageItem = di.packageItem;
                    this._objectPool.push(obj);

                    UIPackage._constructing++;
                    if (di.packageItem.type == PackageItemType.Component) {
                        poolStart = this._objectPool.length - di.childCount - 1;

                        (<GComponent><any>obj).constructFromResource2(this._objectPool, poolStart);

                        this._objectPool.splice(poolStart, di.childCount);
                    }
                    else {
                        obj.constructFromResource();
                    }
                    UIPackage._constructing--;
                }
                else {
                    obj = <GObject>UIObjectFactory.newObject2(di.type);
                    this._objectPool.push(obj);

                    if (di.type == ObjectType.List && di.listItemCount > 0) {
                        poolStart = this._objectPool.length - di.listItemCount - 1;

                        for (k = 0; k < di.listItemCount; k++) //把他们都放到pool里，这样GList在创建时就不需要创建对象了
                            (<GList><any>obj).itemPool.returnObject(this._objectPool[k + poolStart]);

                        this._objectPool.splice(poolStart, di.listItemCount);
                    }
                }

                this._index++;
                if ((this._index % 5 == 0) && egret.getTimer() - t >= frameTime)
                    return;
            }

            GTimers.inst.remove(this.run, this);
            let result: GObject = this._objectPool[0];
            this._itemList.length = 0;
            this._objectPool.length = 0;

            if (this.callback != null)
                this.callback.call(this.callbackObj, result);
        }
    }

    class DisplayListItem {
        public packageItem: PackageItem|null;
        public type: ObjectType;
        public childCount: number;
        public listItemCount: number;

        public constructor(packageItem: PackageItem|null, type: ObjectType) {
            this.packageItem = packageItem;
            this.type = type;
        }
    }
}
