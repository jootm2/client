import { Images } from "../image/Images.mjs"
import * as PIXI from "../pixi.mjs"
import * as SDK from "../SDK.mjs"
import { SceneManager } from "./SceneManager.mjs"

class ChrselScene {
    constructor(options, manager) {
        this.pixi_parent = options.stage // 生成的贴图元素需要停靠的父级树节点
        this.manager = manager // 场景管理对象
        this.view_width = options.width // 视区宽度
        this.view_height = options.height // 视区高度
        this.need_loading = new Array // 需要加载的图片
        for (let i = 65; i <= 78; ++i)
            this.need_loading.push(["prguse", i]) // 角色窗体所需控件图片
        {
            // 角色窗体所需三职业图片
            // 40-55 男战 60-72 男战解冻（反向则冻住）
            // 80-95 100-112 男法
            // ...
            // 160-175 女战
            // ...
            let idx_start = 40
            for (let i = 0; i < 6; ++i) {
                for (let j = 0; j < 16; ++j) {
                    this.need_loading.push(["chrsel", idx_start + j])
                }
                for (let j = 20; j < 33; ++j) {
                    this.need_loading.push(["chrsel", idx_start + j])
                }
                idx_start += 40
            }
        }
        this.sp_chrsel_bg = null // 背景图片精灵对象
        this.sp_chrsel_select1 = null
        this.sp_chrsel_select2 = null
        this.sp_chrsel_start = null
        this.sp_chrsel_new = null
        this.sp_chrsel_del = null
        this.sp_chrsel_contact = null
        this.sp_chrsel_exit = null
        this.first_update = false // 是否初次从其他场景切换过来
        document.getElementById("chrsel_svr_title").innerText = options.server_title
    }

    update() {
        if (this.need_loading.length > 0) {
            for (const [key, value] of this.need_loading) {
                const tex = globalThis.BaseTextureCache[`${key}/${value}`]
                if (!tex) {
                    Images.load(key, value)
                    return
                }
            }
            this.need_loading = new Array

            this.sp_login_bg = new PIXI.Sprite(new PIXI.Texture(globalThis.BaseTextureCache['prguse/65']))
            this.sp_login_bg.x = (this.view_width - this.sp_login_bg.width) / 2
            this.sp_login_bg.y = (this.view_height - this.sp_login_bg.height) / 2

            document.getElementById("chrsel_svr_title").style.left = `${this.sp_login_bg.x + 400}px`

            // 选择1按钮
            const bt_chrsel_select1 = globalThis.BaseTextureCache['prguse/66']
            const dom_chrsel_select1 = document.getElementById("chrsel_select1")
            dom_chrsel_select1.style.left = `${this.sp_login_bg.x + 133}px`
            dom_chrsel_select1.style.top = `${this.sp_login_bg.y + 453}px`
            dom_chrsel_select1.style.width = `${bt_chrsel_select1.width}px`
            dom_chrsel_select1.style.height = `${bt_chrsel_select1.height}px`
            dom_chrsel_select1.onmousedown = (event) => {
                if (!!!this.sp_chrsel_select1) {
                    this.sp_chrsel_select1 = new PIXI.Sprite(new PIXI.Texture(bt_chrsel_select1))
                    this.sp_chrsel_select1.x = this.sp_login_bg.x + 133
                    this.sp_chrsel_select1.y = this.sp_login_bg.y + 453
                }
                this.pixi_parent.addChild(this.sp_chrsel_select1)
            }
            dom_chrsel_select1.onmouseleave = (event) => {
                this.pixi_parent.removeChild(this.sp_chrsel_select1)
            }
            dom_chrsel_select1.onmouseup = (event) => {
                this.pixi_parent.removeChild(this.sp_chrsel_select1)
                this.select1_click()
            }
            // 选择2按钮
            const bt_chrsel_select2 = globalThis.BaseTextureCache['prguse/67']
            const dom_chrsel_select2 = document.getElementById("chrsel_select2")
            dom_chrsel_select2.style.left = `${this.sp_login_bg.x + 685}px`
            dom_chrsel_select2.style.top = `${this.sp_login_bg.y + 454}px`
            dom_chrsel_select2.style.width = `${bt_chrsel_select2.width}px`
            dom_chrsel_select2.style.height = `${bt_chrsel_select2.height}px`
            dom_chrsel_select2.onmousedown = (event) => {
                if (!!!this.sp_chrsel_select2) {
                    this.sp_chrsel_select2 = new PIXI.Sprite(new PIXI.Texture(bt_chrsel_select2))
                    this.sp_chrsel_select2.x = this.sp_login_bg.x + 685
                    this.sp_chrsel_select2.y = this.sp_login_bg.y + 454
                }
                this.pixi_parent.addChild(this.sp_chrsel_select2)
            }
            dom_chrsel_select2.onmouseleave = (event) => {
                this.pixi_parent.removeChild(this.sp_chrsel_select2)
            }
            dom_chrsel_select2.onmouseup = (event) => {
                this.pixi_parent.removeChild(this.sp_chrsel_select2)
                this.select2_click()
            }
            // 开始按钮
            const bt_chrsel_start = globalThis.BaseTextureCache['prguse/68']
            const dom_chrsel_start = document.getElementById("chrsel_start")
            dom_chrsel_start.style.left = `${this.sp_login_bg.x + 385}px`
            dom_chrsel_start.style.top = `${this.sp_login_bg.y + 456}px`
            dom_chrsel_start.style.width = `${bt_chrsel_start.width}px`
            dom_chrsel_start.style.height = `${bt_chrsel_start.height}px`
            dom_chrsel_start.onmousedown = (event) => {
                if (!!!this.sp_chrsel_start) {
                    this.sp_chrsel_start = new PIXI.Sprite(new PIXI.Texture(bt_chrsel_start))
                    this.sp_chrsel_start.x = this.sp_login_bg.x + 385
                    this.sp_chrsel_start.y = this.sp_login_bg.y + 456
                }
                this.pixi_parent.addChild(this.sp_chrsel_start)
            }
            dom_chrsel_start.onmouseleave = (event) => {
                this.pixi_parent.removeChild(this.sp_chrsel_start)
            }
            dom_chrsel_start.onmouseup = (event) => {
                this.pixi_parent.removeChild(this.sp_chrsel_start)
                this.start_click()
            }
            // 创建按钮
            const bt_chrsel_new = globalThis.BaseTextureCache['prguse/69']
            const dom_chrsel_new = document.getElementById("chrsel_new")
            dom_chrsel_new.style.left = `${this.sp_login_bg.x + 348}px`
            dom_chrsel_new.style.top = `${this.sp_login_bg.y + 486}px`
            dom_chrsel_new.style.width = `${bt_chrsel_new.width}px`
            dom_chrsel_new.style.height = `${bt_chrsel_new.height}px`
            dom_chrsel_new.onmousedown = (event) => {
                if (!!!this.sp_chrsel_new) {
                    this.sp_chrsel_new = new PIXI.Sprite(new PIXI.Texture(bt_chrsel_new))
                    this.sp_chrsel_new.x = this.sp_login_bg.x + 348
                    this.sp_chrsel_new.y = this.sp_login_bg.y + 486
                }
                this.pixi_parent.addChild(this.sp_chrsel_new)
            }
            dom_chrsel_new.onmouseleave = (event) => {
                this.pixi_parent.removeChild(this.sp_chrsel_new)
            }
            dom_chrsel_new.onmouseup = (event) => {
                this.pixi_parent.removeChild(this.sp_chrsel_new)
                this.new_click()
            }
            // 删除按钮
            const bt_chrsel_del = globalThis.BaseTextureCache['prguse/70']
            const dom_chrsel_del = document.getElementById("chrsel_del")
            dom_chrsel_del.style.left = `${this.sp_login_bg.x + 347}px`
            dom_chrsel_del.style.top = `${this.sp_login_bg.y + 506}px`
            dom_chrsel_del.style.width = `${bt_chrsel_del.width}px`
            dom_chrsel_del.style.height = `${bt_chrsel_del.height}px`
            dom_chrsel_del.onmousedown = (event) => {
                if (!!!this.sp_chrsel_del) {
                    this.sp_chrsel_del = new PIXI.Sprite(new PIXI.Texture(bt_chrsel_del))
                    this.sp_chrsel_del.x = this.sp_login_bg.x + 347
                    this.sp_chrsel_del.y = this.sp_login_bg.y + 506
                }
                this.pixi_parent.addChild(this.sp_chrsel_del)
            }
            dom_chrsel_del.onmouseleave = (event) => {
                this.pixi_parent.removeChild(this.sp_chrsel_del)
            }
            dom_chrsel_del.onmouseup = (event) => {
                this.pixi_parent.removeChild(this.sp_chrsel_del)
                this.del_click()
            }
            // 制作群按钮
            const bt_chrsel_contact = globalThis.BaseTextureCache['prguse/71']
            const dom_chrsel_contact = document.getElementById("chrsel_contact")
            dom_chrsel_contact.style.left = `${this.sp_login_bg.x + 362}px`
            dom_chrsel_contact.style.top = `${this.sp_login_bg.y + 527}px`
            dom_chrsel_contact.style.width = `${bt_chrsel_contact.width}px`
            dom_chrsel_contact.style.height = `${bt_chrsel_contact.height}px`
            dom_chrsel_contact.onmousedown = (event) => {
                if (!!!this.sp_chrsel_contact) {
                    this.sp_chrsel_contact = new PIXI.Sprite(new PIXI.Texture(bt_chrsel_contact))
                    this.sp_chrsel_contact.x = this.sp_login_bg.x + 362
                    this.sp_chrsel_contact.y = this.sp_login_bg.y + 527
                }
                this.pixi_parent.addChild(this.sp_chrsel_contact)
            }
            dom_chrsel_contact.onmouseleave = (event) => {
                this.pixi_parent.removeChild(this.sp_chrsel_contact)
            }
            dom_chrsel_contact.onmouseup = (event) => {
                this.pixi_parent.removeChild(this.sp_chrsel_contact)
            }
            // 退出按钮
            const bt_chrsel_exit = globalThis.BaseTextureCache['prguse/72']
            const dom_chrsel_exit = document.getElementById("chrsel_exit")
            dom_chrsel_exit.style.left = `${this.sp_login_bg.x + 379}px`
            dom_chrsel_exit.style.top = `${this.sp_login_bg.y + 547}px`
            dom_chrsel_exit.style.width = `${bt_chrsel_exit.width}px`
            dom_chrsel_exit.style.height = `${bt_chrsel_exit.height}px`
            dom_chrsel_exit.onmousedown = (event) => {
                if (!!!this.sp_chrsel_exit) {
                    this.sp_chrsel_exit = new PIXI.Sprite(new PIXI.Texture(bt_chrsel_exit))
                    this.sp_chrsel_exit.x = this.sp_login_bg.x + 379
                    this.sp_chrsel_exit.y = this.sp_login_bg.y + 547
                }
                this.pixi_parent.addChild(this.sp_chrsel_exit)
            }
            dom_chrsel_exit.onmouseleave = (event) => {
                this.pixi_parent.removeChild(this.sp_chrsel_exit)
            }
            dom_chrsel_exit.onmouseup = (event) => {
                this.pixi_parent.removeChild(this.sp_chrsel_exit)
                this.exit_click()
            }
        }
        if (this.first_update) {
            this.pixi_parent.addChild(this.sp_login_bg)
            document.getElementById("chrsel_window").style.visibility = "visible"
            this.first_update = false
        }
    }

    // 进入当前场景
    enter_scene() {
        this.first_update = true
    }

    // 离开当前场景
    leave_scene() {
        document.getElementById("chrsel_window").style.visibility = "hidden"
        this.pixi_parent.removeChild(this.sp_login_bg)
    }

    select1_click() {

    }

    select2_click() {

    }

    start_click() {

    }

    new_click() {

    }

    del_click() {

    }

    exit_click() {
        this.manager.change_scene(0)
    }

    on_query_chr_response(head, body) {

    }
}

export { ChrselScene }