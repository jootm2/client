import { Images } from "../image/Images.mjs"
import * as PIXI from "../pixi.mjs"

class LoginScene {
    constructor(params) {
        this.dom_parent = params.dom_container // 生成的页面元素需要依靠的父级树节点
        this.pixi_parent = params.pixi_container // 生成的贴图元素需要停靠的父级树节点
        this.view_width = params.width // 视区宽度
        this.view_height = params.height // 视区高度
        this.state = 0 // 0:登录 1：新用户 2：修改密码
        this.login_id = "" // 账号（登录）
        this.login_psw = "" // 密码（登录）
        this.need_loading = new Set() // 需要加载的图片
        this.need_loading.add(["prguse", 53]) // 登陆界面：修改密码按钮
        this.need_loading.add(["prguse", 60]) // 登录：背景
        this.need_loading.add(["prguse", 61]) // 登录：新用户按钮
        this.need_loading.add(["prguse", 62]) // 登录：确定按钮
        this.need_loading.add(["prguse", 64]) // 登录：关闭按钮
        for (const [key, value] of this.need_loading) {
            Images.load(key, value)
        }
    }

    update() {
        if (this.need_loading.size > 0) {
            for (const [key, value] of this.need_loading) {
                const tex = PIXI.utils.BaseTextureCache[`${key}/${value}`]
                if (!tex) {
                    return
                }
            }
            this.need_loading.clear()

            // 生成贴图元素
            const tex = PIXI.utils.BaseTextureCache['prguse/60']
            const sprite = new PIXI.Sprite(new PIXI.Texture(tex))
            sprite.x = (this.view_width - sprite.width) / 2
            sprite.y = (this.view_height - sprite.height) / 2
            this.pixi_parent.addChild(sprite)
        }
    }
}

export { LoginScene }