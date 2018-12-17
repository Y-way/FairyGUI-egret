
module fairygui {

    export class Relations {
        private _owner: GObject;
        private _items: Array<RelationItem>;

        public handling: GObject|null;
        public sizeDirty: boolean;

        public constructor(owner: GObject) {
            this._owner = owner;
            this._items = new Array<RelationItem>();
        }

        public add(target: GObject, relationType: number, usePercent: boolean = false): void {
            let length: number = this._items.length;
            for (let i: number = 0; i < length; i++) {
                let item: RelationItem = this._items[i];
                if (item.target == target) {
                    item.add(relationType, usePercent);
                    return;
                }
            }
            let newItem: RelationItem = new RelationItem(this._owner);
            newItem.target = target;
            newItem.add(relationType, usePercent);
            this._items.push(newItem);
        }

        public remove(target: GObject, relationType: number = 0): void {
            let cnt: number = this._items.length;
            let i: number = 0;
            while (i < cnt) {
                let item: RelationItem = this._items[i];
                if (item.target == target) {
                    item.remove(relationType);
                    if (item.isEmpty) {
                        item.dispose();
                        this._items.splice(i, 1);
                        cnt--;
                    }
                    else
                        i++;
                }
                else
                    i++;
            }
        }

        public contains(target: GObject): boolean {
            let length: number = this._items.length;
            for (let i: number = 0; i < length; i++) {
                let item: RelationItem = this._items[i];
                if (item.target == target)
                    return true;
            }
            return false;
        }

        public clearFor(target: GObject): void {
            let cnt: number = this._items.length;
            let i: number = 0;
            while (i < cnt) {
                let item: RelationItem = this._items[i];
                if (item.target == target) {
                    item.dispose();
                    this._items.splice(i, 1);
                    cnt--;
                }
                else
                    i++;
            }
        }

        public clearAll(): void {
            let length: number = this._items.length;
            for (let i: number = 0; i < length; i++) {
                let item: RelationItem = this._items[i];
                item.dispose();
            }
            this._items.length = 0;
        }

        public copyFrom(source: Relations): void {
            this.clearAll();

            let arr: Array<RelationItem> = source._items;
            let length: number = arr.length;
            for (let i: number = 0; i < length; i++) {
                let ri: RelationItem = arr[i];
                let item: RelationItem = new RelationItem(this._owner);
                item.copyFrom(ri);
                this._items.push(item);
            }
        }

        public dispose(): void {
            this.clearAll();
        }

        public onOwnerSizeChanged(dWidth: number, dHeight: number, applyPivot: boolean): void {
            if (this._items.length == 0)
                return;

            let length: number = this._items.length;
            for (let i: number = 0; i < length; i++) {
                let item: RelationItem = this._items[i];
                item.applyOnSelfResized(dWidth, dHeight, applyPivot);
            }
        }

        public ensureRelationsSizeCorrect(): void {
            if (this._items.length == 0)
                return;

            this.sizeDirty = false;
            let length: number = this._items.length;
            for (let i: number = 0; i < length; i++) {
                let item: RelationItem = this._items[i];
                (item.target as GObject).ensureSizeCorrect();
            }
        }

        public get empty(): boolean {
            return this._items.length == 0;
        }

        public setup(buffer: ByteBuffer, parentToChild: boolean): void {
            let cnt: number = buffer.readByte();
            let target: GObject|null;
            for (let i: number = 0; i < cnt; i++) {
                let targetIndex: number = buffer.readShort();
                if (targetIndex == -1)
                    target = this._owner.parent;
                else if (parentToChild)
                    target = (<GComponent>this._owner).getChildAt(targetIndex);
                else
                    target = (this._owner.parent as GComponent).getChildAt(targetIndex);

                let newItem: RelationItem = new RelationItem(this._owner);
                newItem.target = target;
                this._items.push(newItem);

                let cnt2: number = buffer.readByte();
                for (let j: number = 0; j < cnt2; j++) {
                    let rt: number = buffer.readByte();
                    let usePercent: boolean = buffer.readBool();
                    newItem.internalAdd(rt, usePercent);
                }
            }
        }
    }
}