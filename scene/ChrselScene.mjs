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
        this.chr_arr = []
        for (let i = 65; i <= 78; ++i)
            this.need_loading.push(["prguse", i]) // 角色窗体所需控件图片
        for (let i = 4; i <= 17; ++i)
            this.need_loading.push(["chrsel", i])
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
        this.asa_chrsel_selected = []//[3][2] // 不同职业/性别的启用状态的轮播图片
        this.asa_chrsel_toggle_selected = []//[3][2][2] // 不同职业/性别的启用/禁用状态的轮播图片
        this.asa_showing1 = null
        this.asa_showing2 = null
        this._toggle_ing = false // 当前是否处于切换角色启用状态过程
        this.sp_select_showing = null
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

            this.asa_chrsel_selected.push([])
            this.asa_chrsel_selected.push([])
            this.asa_chrsel_selected.push([])
            for (let i = 0; i < 3; ++i) { // 男性角色
                const textures = []
                for(let k = 40 + i * 40; k <= 55 + i * 40; ++k) {
                    textures.push({texture: new PIXI.Texture(globalThis.BaseTextureCache[`chrsel/${k}`])
                        , time: 120 })
                }
                this.asa_chrsel_selected[i][0] = new PIXI.AnimatedSprite(textures)
            }
            for (let i = 0; i < 3; ++i) { // 女性角色
                const textures = []
                for(let k = 160 + i * 40; k <= 175 + i * 40; ++k) {
                    textures.push({texture: new PIXI.Texture(globalThis.BaseTextureCache[`chrsel/${k}`])
                        , time: 120 })
                }
                this.asa_chrsel_selected[i][1] = new PIXI.AnimatedSprite(textures)
            }
            this.asa_chrsel_toggle_selected.push([]) // 战士
            this.asa_chrsel_toggle_selected[0].push([]) // 男战
            this.asa_chrsel_toggle_selected[0].push([]) // 女战
            this.asa_chrsel_toggle_selected.push([])
            this.asa_chrsel_toggle_selected[1].push([])
            this.asa_chrsel_toggle_selected[1].push([])
            this.asa_chrsel_toggle_selected.push([])
            this.asa_chrsel_toggle_selected[2].push([])
            this.asa_chrsel_toggle_selected[2].push([])
            for (let i = 0; i < 3; ++i) { // 男性角色
                const textures = []
                for(let k = 60 + i * 40; k <= 72 + i * 40; ++k) {
                    textures.push({texture: new PIXI.Texture(globalThis.BaseTextureCache[`chrsel/${k}`])
                        , time: 120 })
                }
                this.asa_chrsel_toggle_selected[i][0][0] = new PIXI.AnimatedSprite(textures)
                this.asa_chrsel_toggle_selected[i][0][1] = new PIXI.AnimatedSprite(Array.from(textures).reverse())
            }
            for (let i = 0; i < 3; ++i) {
                const textures = []
                for(let k = 180 + i * 40; k <= 192 + i * 40; ++k) {
                    textures.push({texture: new PIXI.Texture(globalThis.BaseTextureCache[`chrsel/${k}`])
                        , time: 120 })
                }
                this.asa_chrsel_toggle_selected[i][1][0] = new PIXI.AnimatedSprite(textures)
                this.asa_chrsel_toggle_selected[i][1][1] = new PIXI.AnimatedSprite(Array.from(textures).reverse())
            }

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

            // 角色1信息
            const dom_chrsel_name1 = document.getElementById("chrsel_name1")
            dom_chrsel_name1.style.left = `${this.sp_login_bg.x + 117}px`
            dom_chrsel_name1.style.top = `${this.sp_login_bg.y + 492}px`
            const dom_chrsel_level1 = document.getElementById("chrsel_level1")
            dom_chrsel_level1.style.left = `${this.sp_login_bg.x + 117}px`
            dom_chrsel_level1.style.top = `${this.sp_login_bg.y + 521}px`
            const dom_chrsel_jogb1 = document.getElementById("chrsel_jogb1")
            dom_chrsel_jogb1.style.left = `${this.sp_login_bg.x + 117}px`
            dom_chrsel_jogb1.style.top = `${this.sp_login_bg.y + 551}px`
            // 角色2信息
            const dom_chrsel_name2 = document.getElementById("chrsel_name2")
            dom_chrsel_name2.style.left = `${this.sp_login_bg.x + 671}px`
            dom_chrsel_name2.style.top = `${this.sp_login_bg.y + 492}px`
            const dom_chrsel_level2 = document.getElementById("chrsel_level2")
            dom_chrsel_level2.style.left = `${this.sp_login_bg.x + 671}px`
            dom_chrsel_level2.style.top = `${this.sp_login_bg.y + 521}px`
            const dom_chrsel_jogb2 = document.getElementById("chrsel_jogb2")
            dom_chrsel_jogb2.style.left = `${this.sp_login_bg.x + 671}px`
            dom_chrsel_jogb2.style.top = `${this.sp_login_bg.y + 551}px`
        }
        if (this.first_update) {
            this.pixi_parent.addChild(this.sp_login_bg)
            document.getElementById("chrsel_window").style.visibility = "visible"
            this.first_update = false
            this._on_chrs_change()
        }
    }

    // 进入当前场景
    enter_scene() {
        this.chr_arr = []
        this.first_update = true
    }

    _stop_chr_showing() {
        if (!!this.asa_showing1) {
            if (typeof this.asa_showing1.stop === 'function') {
                this.asa_showing1.stop()
            }
            this.pixi_parent.removeChild(this.asa_showing1)
            this.asa_showing1 = null
        }
        if (!!this.asa_showing2) {
            if (typeof this.asa_showing2.stop === 'function') {
                this.asa_showing2.stop()
            }
            this.pixi_parent.removeChild(this.asa_showing2)
            this.asa_showing2 = null
        }
        if (!!this.sp_select_showing) {
            this.sp_select_showing.stop()
            this.pixi_parent.removeChild(this.sp_select_showing)
        }
    }

    // 离开当前场景
    leave_scene() {
        document.getElementById("chrsel_window").style.visibility = "hidden"
        this.pixi_parent.removeChild(this.sp_login_bg)
        this._stop_chr_showing()
    }

    // 角色列表、启用状态发生改变时触发
    _on_chrs_change() {
        document.getElementById("chrsel_name1").innerText = ''
        document.getElementById("chrsel_level1").innerText = ''
        document.getElementById("chrsel_jogb1").innerText = ''
        document.getElementById("chrsel_name2").innerText = ''
        document.getElementById("chrsel_level2").innerText = ''
        document.getElementById("chrsel_jogb2").innerText = ''
        this._stop_chr_showing()
        if (this.need_loading.length < 1) {
            if (this.chr_arr.length > 0) {
                document.getElementById("chrsel_name1").innerText = this.chr_arr[0].name
                document.getElementById("chrsel_level1").innerText = this.chr_arr[0].level
                document.getElementById("chrsel_jogb1").innerText = SDK.GetJobName(this.chr_arr[0].job)
            }
            if (this.chr_arr.length > 1) {
                document.getElementById("chrsel_name2").innerText = this.chr_arr[1].name
                document.getElementById("chrsel_level2").innerText = this.chr_arr[1].level
                document.getElementById("chrsel_jogb2").innerText = SDK.GetJobName(this.chr_arr[1].job)
            }
            // 播放角色图片
            if (this.chr_arr.length > 0) {
                if (this.chr_arr[0].select) {
                    this.asa_showing1 = this.asa_chrsel_selected[this.chr_arr[0].job][this.chr_arr[0].sex]
                    this.asa_showing1.play()
                } else {
                    let img = 40
                    img += this.chr_arr[0].job * 40
                    img += this.chr_arr[0].sex * 120
                    img += 20
                    this.asa_showing1 = new PIXI.Sprite(new PIXI.Texture(globalThis.BaseTextureCache[`chrsel/${img}`]))
                }
                this.asa_showing1.x = 90 + (300 - this.asa_showing1.width) / 2
                this.asa_showing1.y = 58 + 360 - this.asa_showing1.height
                this.pixi_parent.addChild(this.asa_showing1)
            }
            if (this.chr_arr.length > 1) {
                if (this.chr_arr[1].select) {
                    this.asa_showing2 = this.asa_chrsel_selected[this.chr_arr[1].job][this.chr_arr[1].sex]
                    this.asa_showing2.play()
                } else {
                    let img = 40
                    img += this.chr_arr[1].job * 40
                    img += this.chr_arr[1].sex * 120
                    img += 20
                    this.asa_showing2 = new PIXI.Sprite(new PIXI.Texture(globalThis.BaseTextureCache[`chrsel/${img}`]))
                }
                this.asa_showing2.x = 430 + (300 - this.asa_showing2.width) / 2
                this.asa_showing2.y = 58 + 360 - this.asa_showing2.height - 10
                this.pixi_parent.addChild(this.asa_showing2)
            }
        }
    }

    _toggle_chr_selected(nc) {
        do {
            if (this.need_loading.length > 0) break
            if (this.chr_arr.length < 2) break
            if (nc == 1 && this.chr_arr[0].select) break
            if (nc == 2 && this.chr_arr[1].select) break

            this._toggle_ing = true
            this._stop_chr_showing()
            {
                const textures = []
                for(let k = 4; k <= 17; ++k) {
                    textures.push({texture: new PIXI.Texture(globalThis.BaseTextureCache[`chrsel/${k}`])
                        , time: 110 })
                }
                this.sp_select_showing = new PIXI.AnimatedSprite(textures)
                this.sp_select_showing.blendMode = PIXI.BLEND_MODES.ADD
            }
            if (nc == 1) {
                // 第一个角色解冻
                this.asa_showing1 = this.asa_chrsel_toggle_selected[this.chr_arr[0].job][this.chr_arr[0].sex][0]
                // 第二个角色冻上
                this.asa_showing2 = this.asa_chrsel_toggle_selected[this.chr_arr[1].job][this.chr_arr[1].sex][1]
                this.chr_arr[0].select = true
                this.chr_arr[1].select = false
                this.sp_select_showing.x = 90
                this.sp_select_showing.y = 58
            } else {
                this.asa_showing1 = this.asa_chrsel_toggle_selected[this.chr_arr[0].job][this.chr_arr[0].sex][1]
                this.asa_showing2 = this.asa_chrsel_toggle_selected[this.chr_arr[1].job][this.chr_arr[1].sex][0]
                this.chr_arr[0].select = false
                this.chr_arr[1].select = true
                this.sp_select_showing.x = 430
                this.sp_select_showing.y = 60
            }
            this.asa_showing1.currentFrame = 0
            this.asa_showing1.loop = false
            this.asa_showing1.play()
            this.asa_showing1.onComplete = () => {
                this.asa_showing2.stop()
                this.sp_select_showing.stop()
                this._on_chrs_change()
                this._toggle_ing = false
            }
            this.asa_showing2.currentFrame = 0
            this.asa_showing2.loop = false
            this.asa_showing2.play()
            this.sp_select_showing.currentFrame = 0
            this.sp_select_showing.loop = false
            this.sp_select_showing.play()
            this.asa_showing1.x = 90 + (300 - this.asa_showing1.width) / 2
            this.asa_showing1.y = 58 + 360 - this.asa_showing1.height
            this.pixi_parent.addChild(this.asa_showing1)
            this.asa_showing2.x = 430 + (300 - this.asa_showing2.width) / 2
            this.asa_showing2.y = 58 + 360 - this.asa_showing2.height - 10
            this.pixi_parent.addChild(this.asa_showing2)
            this.pixi_parent.addChild(this.sp_select_showing)
        } while (false)
    }
    select1_click() {
        if (this._toggle_ing) return
        this._toggle_chr_selected(1)
    }

    select2_click() {
        if (this._toggle_ing) return
        this._toggle_chr_selected(2)
    }

    start_click() {
        if (this._toggle_ing) return

    }

    new_click() {
        if (this._toggle_ing) return
        if (this.chr_arr.length > 1) {
            this.manager.dlg_message("你可以为每个单独的帐户创建两个角色。", [SDK.DlgButtons.mbOk])
            return
        }

    }

    del_click() {
        if (this._toggle_ing) return
        if (this.chr_arr.length < 1) return
        const chr_name = this.chr_arr[0].select ? this.chr_arr[0].name : this.chr_arr[1].name
        this.manager.dlg_message('"' + chr_name + '"删除的角色是不能被恢复的。\\一段时间内，你将不能使用相同的角色名。\\你真的想要删除角色吗？'
            , [SDK.DlgButtons.mbYes, SDK.DlgButtons.mbNo], (mb) => {
            if (mb == SDK.DlgButtons.mbYes) {
                this.manager.send_del_chr(chr_name)
            }
        })
    }

    exit_click() {
        this.manager.change_scene(0)
    }

    on_query_chr_response(head, body) {
        this.chr_arr = []
        if (!!body) {
            const str = this.manager.gb2312_decoder.decode(this.manager.edcode.decode_string(body))
            const tokens = str.split('/')
            this.chr_arr.push({
                name: tokens[0]
                , job: parseInt(tokens[1])
                , level: parseInt(tokens[3])
                , sex: parseInt(tokens[4])
                , select: true
            })
            if (this.chr_arr[0].name[0] == '*') {
                this.chr_arr[0].name = this.chr_arr[0].name.substring(1)
            }
            if (tokens.length > 6) {
                this.chr_arr.push({
                    name: tokens[5]
                    , job: parseInt(tokens[6])
                    , level: parseInt(tokens[8])
                    , sex: parseInt(tokens[9])
                    , select: false
                })
                if (this.chr_arr[1].name[0] == '*') {
                    this.chr_arr[1].name = this.chr_arr[1].name.substring(1)
                    this.chr_arr[0].select = false
                    this.chr_arr[1].select = true
                }
            }
        }
        this._on_chrs_change()
    }
}

export { ChrselScene }