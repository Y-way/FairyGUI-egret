
module fairygui {

    export class GObjectPool {
        private _pool: any;
        private _count: number = 0;

        public constructor() {
            this._pool = {};
        }

        public clear(): void {
            for (let i1 in this._pool) {
				let arr: Array<GObject> = this._pool[i1];
				let cnt: number = arr.length;
				for (let i: number = 0; i < cnt; i++)
					arr[i].dispose();
			}
			this._pool = {};
			this._count = 0;
        }

        public get count(): number {
            return this._count;
        }

        public getObject(url: string): GObject|null {
            url = <string>UIPackage.normalizeURL(url);
            if (url == null)
                return null;

            let arr: Array<GObject> = this._pool[url];
            if (arr != null && arr.length) {
                this._count--;
                return arr.shift() as GObject;
            }
            return UIPackage.createObjectFromURL(url);
        }

        public returnObject(obj: GObject): void {
            let url: string|null = obj.resourceURL;
            if (!url)
                return;

            let arr: Array<GObject> = this._pool[url];
            if (arr == null) {
                arr = new Array<GObject>();
                this._pool[url] = arr;
            }

            this._count++;
            arr.push(obj);
        }
    }
}