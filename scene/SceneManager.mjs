import { LoginScene } from "./LoginScene.mjs"
import { NewAccountScene } from "./NewAccount.mjs"
import { GB2312Encoder } from "../GB2312Encoder.mjs"
import { EDcode } from "../EDcode.mjs"
import * as SDK from "../SDK.mjs"
import { Images } from "../image/Images.mjs"
import * as PIXI from "../pixi.mjs"
import { ChgpwdScene } from "./ChgpwdScene.mjs"
import { ChrselScene } from "./ChrselScene.mjs"
import { PlayScene } from "./PlayScene.mjs"

class SceneManager {
    constructor(options) {
        // 绘制地图、人物、怪物、NPC、掉落物品、技能特效等
        this.game_app = new PIXI.Application({ background: '#000', width: options.width
            , height: options.height, view: document.getElementById("game_canvas") })
        // 绘制模态对话框（公告、确定取消、输入框）等
        this.dlg_app = new PIXI.Application({ backgroundAlpha: 0, width: options.width
            , height: options.height, view: document.getElementById("frm_dlg_canvas") })
        const scene_optios = {
            stage: this.game_app.stage
            , width: options.width
            , height: options.height
        }
        this.login_scene = new LoginScene(scene_optios, this)
        this.new_account_scene = new NewAccountScene(scene_optios, this)
        this.chg_pwd_scene = new ChgpwdScene(scene_optios, this)
        scene_optios.server_title = options.server_titile
        this.chrsel_scene = new ChrselScene(scene_optios, this)
        this.play_scene = new PlayScene(scene_optios, this)
        this.scene = 0 // 0:登录 1:新用户 2:修改密码 3:选择角色 4:游戏（含健康公告）
        this.server_base_url = options.server_base_url
        this.ws = null
        this.send_idx = 1
        this.edcode = new EDcode(10000)
        this.gb2312_encoder = new GB2312Encoder
        this.gb2312_decoder = new TextDecoder("gbk")
        this.utf8_encoder = new TextEncoder
        this.view_width = options.width // 视区宽度
        this.view_height = options.height // 视区高度
        this.server_name = options.server_name
        this.login_id = null
        this.certification = null
        this.runport = 0
        this.gameport = 0
        this.chr_name = null
        this.recv_buf = '' // 进入游戏网关后可能一次接收多个数据包，要做拆包处理
        // begine 对话框相关
        this.need_loading = new Array // 需要加载的图片
        this.frm_dlg_pixi_parent = this.dlg_app.stage
        this.dom_frm_dlg = document.getElementById("frm_dlg")
        this.dom_frm_dlg_window = document.getElementById("frm_dlg_window")
        this.dom_frm_dlg_label = document.getElementById("frm_dlg_label")
        this.dom_frm_dlg_input = document.getElementById("frm_dlg_input")
        this.dom_frm_dlg_ok = document.getElementById("frm_dlg_ok")
        this.dom_frm_dlg_cancel = document.getElementById("frm_dlg_cancel")
        this.need_loading.push(["prguse", 360]) // 背景
        this.need_loading.push(["prguse", 380]) // 背景（健康公告）
        this.need_loading.push(["prguse", 361]) // mbOk
        this.need_loading.push(["prguse", 362])
        this.need_loading.push(["prguse", 363]) // mbYes
        this.need_loading.push(["prguse", 364])
        this.need_loading.push(["prguse", 365]) // mbCancel
        this.need_loading.push(["prguse", 366])
        this.need_loading.push(["prguse", 367]) // mbNo
        this.need_loading.push(["prguse", 368])
        this.sp_frm_dlg_bg = null
        this.sp_frm_dlg_ok = null
        this.sp_frm_dlg_cancel = null
        this.sp_frm_dlg_cancel_down = null
        // end 对话框相关
    }

    // begin 对话框
    _close_dlg() {
        this.frm_dlg_pixi_parent.removeChildren()
        this.dom_frm_dlg.style.visibility = "hidden"
        this.dom_frm_dlg_label.style.visibility = "hidden"
        this.dom_frm_dlg_input.style.visibility = "hidden"
        this.dom_frm_dlg_ok.style.visibility = "hidden"
        this.dom_frm_dlg_cancel.style.visibility = "hidden"
    }
    dlg_message(text, btns, callback) {
        this._close_dlg()

        this.dom_frm_dlg.style.visibility = "visible"
        // 展示背景图
        this.sp_frm_dlg_bg = new PIXI.Sprite(new PIXI.Texture(globalThis.BaseTextureCache['prguse/360']))
        this.sp_frm_dlg_bg.x = (this.view_width - this.sp_frm_dlg_bg.width) / 2
        this.sp_frm_dlg_bg.y = (this.view_height - this.sp_frm_dlg_bg.height) / 2
        this.dom_frm_dlg_window.style.left = `${this.sp_frm_dlg_bg.x}px`
        this.dom_frm_dlg_window.style.top = `${this.sp_frm_dlg_bg.y}px`
        this.dom_frm_dlg_window.style.width = `${this.sp_frm_dlg_bg.width}px`
        this.dom_frm_dlg_window.style.height = `${this.sp_frm_dlg_bg.height}px`
        this.frm_dlg_pixi_parent.addChild(this.sp_frm_dlg_bg)
        
        // 按钮的坐标
        let mb_left = 324
        let mb_top = 126
        // 提示文本的坐标
        const msgx = 39
        const msgy = 38

        if (text) {
            this.dom_frm_dlg_label.innerHTML = SDK.transtring(text)
            this.dom_frm_dlg_label.style.visibility = "visible"
            this.dom_frm_dlg_label.style.left = `${msgx}px`
            this.dom_frm_dlg_label.style.top = `${msgy}px`
        }

        if (!!btns) {
            if (btns.includes(SDK.DlgButtons.mbCancel) || btns.includes(SDK.DlgButtons.mbNo)) {
                const img_id = btns.includes(SDK.DlgButtons.mbCancel) ? 365 : 367
                this.sp_frm_dlg_cancel = new PIXI.Sprite(new PIXI.Texture(globalThis.BaseTextureCache[`prguse/${img_id}`]))
                const bt_frm_dlg_cancel_down = globalThis.BaseTextureCache[`prguse/${img_id+1}`]
                this.sp_frm_dlg_cancel.x = this.sp_frm_dlg_bg.x + mb_left
                this.sp_frm_dlg_cancel.y = this.sp_frm_dlg_bg.y + mb_top
                this.dom_frm_dlg_cancel.style.left = `${mb_left}px`
                this.dom_frm_dlg_cancel.style.top = `${mb_top}px`
                this.dom_frm_dlg_cancel.style.width = `${bt_frm_dlg_cancel_down.width}px`
                this.dom_frm_dlg_cancel.style.height = `${bt_frm_dlg_cancel_down.height}px`
                this.frm_dlg_pixi_parent.addChild(this.sp_frm_dlg_cancel)
                this.dom_frm_dlg_cancel.style.visibility = "visible"
                this.dom_frm_dlg_cancel.onmousedown = (event) => {
                    if (!!!this.sp_frm_dlg_cancel_down) {
                        this.sp_frm_dlg_cancel_down = new PIXI.Sprite(new PIXI.Texture(bt_frm_dlg_cancel_down))
                        this.sp_frm_dlg_cancel_down.x = this.sp_frm_dlg_cancel.x
                        this.sp_frm_dlg_cancel_down.y = this.sp_frm_dlg_cancel.y
                    }
                    this.frm_dlg_pixi_parent.addChild(this.sp_frm_dlg_cancel_down)
                }
                this.dom_frm_dlg_cancel.onmouseleave = (event) => {
                    this.frm_dlg_pixi_parent.removeChild(this.sp_frm_dlg_cancel_down)
                }
                this.dom_frm_dlg_cancel.onmouseup = (event) => {
                    this.frm_dlg_pixi_parent.removeChild(this.sp_frm_dlg_cancel_down)
                    this.sp_frm_dlg_cancel_down = null
                    this._close_dlg()
                    if (!!callback) {
                        callback(btns.includes(SDK.DlgButtons.mbCancel) ? SDK.DlgButtons.mbCancel : SDK.DlgButtons.mbNo)
                    }
                }
                mb_left -= 110
            }
        } else {
            btns = [SDK.DlgButtons.mbOk]
        }

        if (btns.includes(SDK.DlgButtons.mbOk) || btns.includes(SDK.DlgButtons.mbYes)) {
            const img_id = btns.includes(SDK.DlgButtons.mbOk) ? 361 : 363
            this.sp_frm_dlg_ok = new PIXI.Sprite(new PIXI.Texture(globalThis.BaseTextureCache[`prguse/${img_id}`]))
            const bt_frm_dlg_cancel_down = globalThis.BaseTextureCache[`prguse/${img_id+1}`]
            this.sp_frm_dlg_ok.x = this.sp_frm_dlg_bg.x + mb_left
            this.sp_frm_dlg_ok.y = this.sp_frm_dlg_bg.y + mb_top
            this.dom_frm_dlg_ok.style.left = `${mb_left}px`
            this.dom_frm_dlg_ok.style.top = `${mb_top}px`
            this.dom_frm_dlg_ok.style.width = `${bt_frm_dlg_cancel_down.width}px`
            this.dom_frm_dlg_ok.style.height = `${bt_frm_dlg_cancel_down.height}px`
            this.frm_dlg_pixi_parent.addChild(this.sp_frm_dlg_ok)
            this.dom_frm_dlg_ok.style.visibility = "visible"
            this.dom_frm_dlg_ok.onmousedown = (event) => {
                if (!!!this.sp_frm_dlg_ok_down) {
                    this.sp_frm_dlg_ok_down = new PIXI.Sprite(new PIXI.Texture(bt_frm_dlg_cancel_down))
                    this.sp_frm_dlg_ok_down.x = this.sp_frm_dlg_ok.x
                    this.sp_frm_dlg_ok_down.y = this.sp_frm_dlg_ok.y
                }
                this.frm_dlg_pixi_parent.addChild(this.sp_frm_dlg_ok_down)
            }
            this.dom_frm_dlg_ok.onmouseleave = (event) => {
                this.frm_dlg_pixi_parent.removeChild(this.sp_frm_dlg_ok_down)
            }
            this.dom_frm_dlg_ok.onmouseup = (event) => {
                this.frm_dlg_pixi_parent.removeChild(this.sp_frm_dlg_ok_down)
                this.sp_frm_dlg_ok_down = null
                this._close_dlg()
                if (!!callback) {
                    callback(btns.includes(SDK.DlgButtons.mbOk) ? SDK.DlgButtons.mbOk : SDK.DlgButtons.mbYes)
                }
            }
        }
    }

    dlg_notice(text, callback) {
        this._close_dlg()

        this.dom_frm_dlg.style.visibility = "visible"
        // 展示背景图
        this.sp_frm_dlg_bg = new PIXI.Sprite(new PIXI.Texture(globalThis.BaseTextureCache['prguse/380']))
        this.sp_frm_dlg_bg.x = (this.view_width - this.sp_frm_dlg_bg.width) / 2
        this.sp_frm_dlg_bg.y = (this.view_height - this.sp_frm_dlg_bg.height) / 2
        this.dom_frm_dlg_window.style.left = `${this.sp_frm_dlg_bg.x}px`
        this.dom_frm_dlg_window.style.top = `${this.sp_frm_dlg_bg.y}px`
        this.dom_frm_dlg_window.style.width = `${this.sp_frm_dlg_bg.width}px`
        this.dom_frm_dlg_window.style.height = `${this.sp_frm_dlg_bg.height}px`
        this.frm_dlg_pixi_parent.addChild(this.sp_frm_dlg_bg)
        
        // 按钮的坐标
        let mb_left = 90
        let mb_top = 305
        // 提示文本的坐标
        const msgx = 23
        const msgy = 20

        if (text) {
            this.dom_frm_dlg_label.innerHTML = SDK.transtring(text)
            this.dom_frm_dlg_label.style.visibility = "visible"
            this.dom_frm_dlg_label.style.left = `${msgx}px`
            this.dom_frm_dlg_label.style.top = `${msgy}px`
        }

        {
            const img_id = 361
            this.sp_frm_dlg_ok = new PIXI.Sprite(new PIXI.Texture(globalThis.BaseTextureCache[`prguse/${img_id}`]))
            const bt_frm_dlg_cancel_down = globalThis.BaseTextureCache[`prguse/${img_id+1}`]
            this.sp_frm_dlg_ok.x = this.sp_frm_dlg_bg.x + mb_left
            this.sp_frm_dlg_ok.y = this.sp_frm_dlg_bg.y + mb_top
            this.dom_frm_dlg_ok.style.left = `${mb_left}px`
            this.dom_frm_dlg_ok.style.top = `${mb_top}px`
            this.dom_frm_dlg_ok.style.width = `${bt_frm_dlg_cancel_down.width}px`
            this.dom_frm_dlg_ok.style.height = `${bt_frm_dlg_cancel_down.height}px`
            this.frm_dlg_pixi_parent.addChild(this.sp_frm_dlg_ok)
            this.dom_frm_dlg_ok.style.visibility = "visible"
            this.dom_frm_dlg_ok.onmousedown = (event) => {
                if (!!!this.sp_frm_dlg_ok_down) {
                    this.sp_frm_dlg_ok_down = new PIXI.Sprite(new PIXI.Texture(bt_frm_dlg_cancel_down))
                    this.sp_frm_dlg_ok_down.x = this.sp_frm_dlg_ok.x
                    this.sp_frm_dlg_ok_down.y = this.sp_frm_dlg_ok.y
                }
                this.frm_dlg_pixi_parent.addChild(this.sp_frm_dlg_ok_down)
            }
            this.dom_frm_dlg_ok.onmouseleave = (event) => {
                this.frm_dlg_pixi_parent.removeChild(this.sp_frm_dlg_ok_down)
            }
            this.dom_frm_dlg_ok.onmouseup = (event) => {
                this.frm_dlg_pixi_parent.removeChild(this.sp_frm_dlg_ok_down)
                this.sp_frm_dlg_ok_down = null
                this._close_dlg()
                if (!!callback) {
                    callback()
                }
            }
        }
    }

    dlg_input(text, callback) {

    }
    // end 对话框

    update() {
        do {
            if (this.need_loading.length < 1) break
            let load_done = true
            for (const [key, value] of this.need_loading) {
                const tex = globalThis.BaseTextureCache[`${key}/${value}`]
                if (!tex) {
                    Images.load(key, value)
                    load_done = false
                    break
                }
            }
            if (!load_done) break
            this.need_loading = new Array
        } while (false)
        if(this.scene == 0) {
            this.login_scene.update()
        } else if (this.scene == 1) {
            this.new_account_scene.update()
        } else if (this.scene == 2) {
            this.chg_pwd_scene.update()
        } else if (this.scene == 3) {
            this.chrsel_scene.update()
        } else if (this.scene == 4) {
            this.play_scene.update()
        }
    }

    change_scene(scene_type) {
        if (this.scene == 0) {
            this.login_scene.leave_scene()
        } else if (this.scene == 1) {
            this.new_account_scene.leave_scene()
        } else if (this.scene == 2) {
            this.chg_pwd_scene.leave_scene()
        } else if (this.scene == 3) {
            this.chrsel_scene.leave_scene()
        } else if (this.scene == 4) {
            this.play_scene.leave_scene()
        }
        if (this.scene > 2 || scene_type > 2) { // 0/1/2场景都是登录网关
            this.ws.close()
            this.ws = null
            this.recv_buf = ''
        }

        this.scene = scene_type

        if(this.scene == 0) {
            this.login_scene.enter_scene()
        } else if (this.scene == 1) {
            this.new_account_scene.enter_scene()
        } else if (this.scene == 2) {
            this.chg_pwd_scene.enter_scene()
        } else if (this.scene == 3) {
            this.chrsel_scene.enter_scene()
        } else if (this.scene == 4) {
            this.play_scene.enter_scene()
        }

        if (!!!this.ws) {
            switch (this.scene) {
                case 0:
                case 1:
                case 2: {
                    this.ws = new WebSocket(this.server_base_url + "/7000")
                    this.ws.onmessage = (event) => {
                        this._on_ws_message(event)
                    }
                    break
                }
                case 3: {
                    this.ws = new WebSocket(this.server_base_url + `/${this.runport}`)
                    this.ws.onmessage = (event) => {
                        this._on_ws_message(event)
                    }
                    this.ws.onopen = (event) => {
                        this.send_query_chr()
                    }
                    break
                }
                case 4: {
                    this.ws = new WebSocket(this.server_base_url + `/${this.gameport}`)
                    this.ws.onmessage = (event) => {
                        this._on_ws_message(event)
                    }
                    this.ws.onopen = (event) => {
                        this.send_run_login()
                    }
                    break
                }
                default:
                    break
            }
        }
    }

    _deal_pkg(data) {
        const head = this.edcode.decode_message(data)
        const body = data.substring(16)
        switch (head.ident) {
            case SDK.Messages.SM_NEWID_SUCCESS:
            case SDK.Messages.SM_NEWID_FAIL:
            {
                this.new_account_scene.on_create_user_response(head)
                break
            }
            case SDK.Messages.SM_PASSWD_FAIL:
            case SDK.Messages.SM_PASSOK_SELECTSERVER: {
                this.login_scene.on_login_response(head)
                break
            }
            case SDK.Messages.SM_CHGPASSWD_SUCCESS:
            case SDK.Messages.SM_CHGPASSWD_FAIL: {
                this.chg_pwd_scene.on_chgpwd_response(head)
                break
            }
            case SDK.Messages.SM_SELECTSERVER_OK: {
                const str = this.gb2312_decoder.decode(this.edcode.decode_string(body)).split('/')
                this.certification = str[2]
                this.runport = str[1]
                this.login_scene.open_door()
                break
            }
            case SDK.Messages.SM_QUERYCHR: {
                this.chrsel_scene.on_query_chr_response(head, body)
                break
            }
            case SDK.Messages.SM_DELCHR_SUCCESS:
            case SDK.Messages.SM_DELCHR_FAIL: {
                this.chrsel_scene.on_del_chr_response(head)
                break
            }
            case SDK.Messages.SM_NEWCHR_SUCCESS:
            case SDK.Messages.SM_NEWCHR_FAIL: {
                this.chrsel_scene.on_new_chr_response(head)
                break
            }
            // 进入游戏成功或失败的消息直接在manager里面处理，这样好记录游戏网关的端口
            case SDK.Messages.SM_STARTFAIL: {
                this.dlg_message('您选择的服务器用户满员。')
                break
            }
            case SDK.Messages.SM_STARTPLAY: {
                const str = this.gb2312_decoder.decode(this.edcode.decode_string(body)).split('/')
                this.gameport = str[1]
                setTimeout(() => {
                    this.change_scene(4)
                }, 100)
                break
            }
            case SDK.Messages.SM_SENDNOTICE: {
                const str = this.gb2312_decoder.decode(this.edcode.decode_string(body))
                this.play_scene.on_notice(str)
                break
            }
            default: { // 其他消息发到游戏场景处理
                if (this.scene == 4)
                    this.play_scene.on_server_msg(head, body)
                break
            }
        }
    }

    _on_ws_message(event) {
        if (this.scene == 4) {
            this.recv_buf += event.data
            if (!this.recv_buf.endsWith("!"))
            {
                return
            }
            const msgs = this.recv_buf.split("#") // 按#分割，得到 ["", "abc!", "123!", "xyz!"] 格式
                .filter(segment => segment) // 过滤空字符串
                .map(segment => segment.replace(/!$/, "")) // 去掉末尾的!
                .filter(segment => true) // 保留空片段（如需过滤空值可改为 segment.trim()）
            this.recv_buf = ''
            msgs.forEach(item => {
                this._deal_pkg(item)
            })
        } else {
            this._deal_pkg(event.data.slice(1, -1))
        }
    }

    send_socket(msg_str) {
        this.ws.send("#" + this.send_idx + msg_str + "!")
        this.send_idx++
		if (this.send_idx >= 10)
		{
			this.send_idx = 1
		}
    }

    // begin 与服务器交互函数
    send_new_account(user_entry_info, user_entry_add_info) {
        const ue_buf = new ArrayBuffer(148)
        const ue = new Uint8Array(ue_buf)
        const id_bytes = this.gb2312_encoder.encode(user_entry_info.id)
        let data_idx = 0
        ue[data_idx] = id_bytes.length
        ue.set(id_bytes, data_idx + 1)
        data_idx += (10 + 1)
        const psw_bytes = this.utf8_encoder.encode(user_entry_info.psw)
        ue[data_idx] = psw_bytes.length
        ue.set(psw_bytes, data_idx + 1)
        data_idx += (10 + 1)
        const name_bytes = this.gb2312_encoder.encode(user_entry_info.name)
        ue[data_idx] = name_bytes.length
        ue.set(name_bytes, data_idx + 1)
        data_idx += (20 + 1)
        const sn_bytes = this.utf8_encoder.encode("650101-1455111")
        ue[data_idx] = sn_bytes.length
        ue.set(sn_bytes, data_idx + 1)
        data_idx += (14 + 1)
        const phone_bytes = this.utf8_encoder.encode(user_entry_info.phone)
        ue[data_idx] = phone_bytes.length
        ue.set(phone_bytes, data_idx + 1)
        data_idx += (14 + 1)
        const q1_bytes = this.gb2312_encoder.encode(user_entry_info.question)
        ue[data_idx] = q1_bytes.length
        ue.set(q1_bytes, data_idx + 1)
        data_idx += (20 + 1)
        const a1_bytes = this.gb2312_encoder.encode(user_entry_info.answer)
        ue[data_idx] = a1_bytes.length
        ue.set(a1_bytes, data_idx + 1)
        data_idx += (12 + 1)
        const email_bytes = this.gb2312_encoder.encode(user_entry_info.email)
        ue[data_idx] = email_bytes.length
        ue.set(email_bytes, data_idx + 1)

        const ua_buf = new ArrayBuffer(101)
        const ua = new Uint8Array(ua_buf)
        data_idx = 0
        const q2_bytes = this.gb2312_encoder.encode(user_entry_add_info.question)
        ua[data_idx] = q2_bytes.length
        ua.set(q2_bytes, data_idx + 1)
        data_idx += (20 + 1)
        const a2_bytes = this.gb2312_encoder.encode(user_entry_add_info.answer)
        ua[data_idx] = a2_bytes.length
        ua.set(a2_bytes, data_idx + 1)
        data_idx += (12 + 1)
        const birth_bytes = this.utf8_encoder.encode(user_entry_add_info.birth)
        ua[data_idx] = birth_bytes.length
        ua.set(birth_bytes, data_idx + 1)
        data_idx += (10 + 1)
        const mobile_phone_bytes = this.utf8_encoder.encode(user_entry_add_info.mobile_phone)
        ua[data_idx] = mobile_phone_bytes.length
        ua.set(mobile_phone_bytes, data_idx + 1)

        const msg = this.edcode.make_default_msg(SDK.Messages.CM_ADDNEWUSER) + 
            this.edcode.encode_buffer(ue) + 
            this.edcode.encode_buffer(ua)
        this.send_socket(msg)
    }
    send_login(id, psw) {
        this.login_id = id
        const msg = this.edcode.make_default_msg(SDK.Messages.CM_IDPASSWORD, SDK.ClientVersion) +
            this.edcode.encode_string(id + "/" + psw)
        this.send_socket(msg)
    }
    send_select_server() {
        const msg = this.edcode.make_default_msg(SDK.Messages.CM_SELECTSERVER) 
            + this.edcode.encode_string(this.server_name)
        this.send_socket(msg)
    }
    send_change_pwd(id, cur_psw, new_psw) {
        const msg = this.edcode.make_default_msg(SDK.Messages.CM_CHANGEPASSWORD)
            + this.edcode.encode_string(`${id}\t${cur_psw}\t${new_psw}`)
        this.send_socket(msg)
    }
    send_query_chr() {
        const msg = this.edcode.make_default_msg(SDK.Messages.CM_QUERYCHR)
            + this.edcode.encode_string(`${this.login_id}/${this.certification}`)
        this.send_socket(msg)
    }
    send_del_chr(name) {
        const msg = this.edcode.make_default_msg(SDK.Messages.CM_DELCHR)
            + this.edcode.encode_string(name)
        this.send_socket(msg)
    }
    send_new_chr(name, hair, job, sex) {
        const msg = this.edcode.make_default_msg(SDK.Messages.CM_NEWCHR)
            + this.edcode.encode_string(`${this.login_id}/${name}/${hair}/${job}/${sex}`)
        this.send_socket(msg)
    }
    send_select_chr(name) {
        this.chr_name = name
        const msg = this.edcode.make_default_msg(SDK.Messages.CM_SELCHR)
            + this.edcode.encode_string(`${this.login_id}/${name}`)
        this.send_socket(msg)
    }
    send_run_login() {
        const msg = this.edcode.encode_string(`**${this.login_id}/${this.chr_name}/${this.certification}/20030422/${(this.certification ^ 0xF2E44FFF) >>> 0}/-1913505763/${(this.certification ^ 0xa4a5b277) >>> 0}/0`)
        this.send_socket(msg)
    }
    send_notice_ok() {
        const msg = this.edcode.make_default_msg(SDK.Messages.CM_LOGINNOTICEOK)
        this.send_socket(msg)
    }
    send_soft_close() {
        const msg = this.edcode.make_default_msg(SDK.Messages.CM_SOFTCLOSE)
        this.send_socket(msg)
    }
    // end 与服务器交互函数
}

export { SceneManager }