import { Images } from "../image/Images.mjs"
import * as PIXI from "../pixi.mjs"
import * as SDK from "../SDK.mjs"
import { MapActor } from "../actor/MapActor.mjs"
import { GB2312Encoder } from "../GB2312Encoder.mjs"
import { EDcode } from "../EDcode.mjs"

class PlayScene {
    constructor(options, manager) {
        this.pixi_parent = options.stage // 生成的贴图元素需要停靠的父级树节点
        this.manager = manager // 场景管理对象
        this.view_width = options.width // 视区宽度
        this.view_height = options.height // 视区高度
        this.sprite_container = new PIXI.Container // 精灵容器
        this.map_actor = new MapActor(options, this.sprite_container) // 地图绘制
        this.first_update = false // 是否初次从其他场景切换过来
        this.key_down_handler = (e) => this._on_key_down(e)
        this.edcode = new EDcode(10000)
        this.gb2312_encoder = new GB2312Encoder
        this.gb2312_decoder = new TextDecoder("gbk")
        this.utf8_encoder = new TextEncoder
    }

    update() {


        if (this.first_update) {
            this.map_actor.update()
        }
    }

    on_server_msg(head, body) {
        switch (head.ident) {
            case SDK.Messages.SM_NEWMAP: {
                const x = head.wparam
                const y = head.atag
                const darkness = head.nseries
                const mapNo = this.gb2312_decoder.decode(this.edcode.decode_string(body))
                this.map_actor.enter(mapNo)
                this.map_actor.setCenter(x, y)
                break
            }
        }
    }

    _on_key_down(e) {
        // Alt + X
        if (e.altKey && e.key === 'x') {
            e.preventDefault();
            this.manager.dlg_message('你是否退出 ?', [SDK.DlgButtons.mbOk, SDK.DlgButtons.mbCancel], (mb) => {
                if (mb == SDK.DlgButtons.mbOk) {
                    this.manager.send_soft_close()
                    this.manager.change_scene(3)
                }
            })
        }

        // Alt + Q
        if (e.altKey && e.key === 'q') {
            e.preventDefault();
            this.manager.dlg_message('你真的要退出游戏吗?', [SDK.DlgButtons.mbOk, SDK.DlgButtons.mbCancel], (mb) => {
                if (mb == SDK.DlgButtons.mbOk)
                    this.manager.change_scene(0)
            })
        }
    }

    // 进入当前场景
    enter_scene() {
        this.first_update = true
        document.addEventListener('keydown', this.key_down_handler)
    }

    // 离开当前场景
    leave_scene() {
        document.removeEventListener('keydown', this.key_down_handler)
        this.pixi_parent.removeChildren()
    }

    on_notice(msg) {
        this.manager.dlg_notice(msg, () => {
            this.manager.send_notice_ok()
        })
    }
}

export { PlayScene }