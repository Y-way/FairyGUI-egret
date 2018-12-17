module fairygui {

    export class ChangePageAction extends ControllerAction {

        public objectId: string;
        public controllerName: string;
        public targetPage: string;

        public constructor() {
            super();
        }

        protected enter(controller: Controller): void {
            if (!this.controllerName)
                return;

            let gcom: GComponent|null = null;
            if (this.objectId) {
                let obj: GObject|null = (controller.parent as GComponent).getChildById(this.objectId);
                if (obj instanceof GComponent)
                    gcom = <GComponent><any>obj;
                else
                    return;
            }
            else
                gcom = controller.parent;
            if (gcom) {
                let cc: Controller|null = gcom.getController(this.controllerName);
                if (cc && cc != controller && !cc.changing)
                    cc.selectedPageId = this.targetPage;
            }
        }

        public setup(buffer: ByteBuffer): void {
            super.setup(buffer);

            this.objectId = <string>buffer.readS();
            this.controllerName = <string>buffer.readS();
            this.targetPage = <string>buffer.readS();
        }
    }
}