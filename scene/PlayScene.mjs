import { Images } from "../image/Images.mjs"
import * as PIXI from "../pixi.mjs"
import * as SDK from "../SDK.mjs"
import { GB2312Encoder } from "../GB2312Encoder.mjs"
import { EDcode } from "../EDcode.mjs"
import { HumActor } from "../actor/HumActor.mjs"
import { Maps } from "../map/Maps.mjs"
import { GameMap } from "../map/Map.mjs"

class PlayScene {
    constructor(options, manager) {
        this.pixi_parent = options.stage // 生成的贴图元素需要停靠的父级树节点
        this.manager = manager // 场景管理对象
        this.view_width = options.width // 视区宽度
        this.view_height = options.height // 视区高度
        this.first_update = false // 是否初次从其他场景切换过来
        this.key_down_handler = (e) => this._on_key_down(e)
        this.edcode = new EDcode(10000)
        this.gb2312_encoder = new GB2312Encoder
        this.gb2312_decoder = new TextDecoder("gbk")
        this.utf8_encoder = new TextEncoder
        this.self_actor = null
        this.map_no = null
        this.game_map = null
        this.container = new PIXI.Container
        // 大地砖图层
        this.map_bng_container = new PIXI.Container
        this.container.addChild(this.map_bng_container)
        // 小地砖图层
        this.map_mid_container = new PIXI.Container
        this.container.addChild(this.map_mid_container)
        // 对象图层（树木、房屋）
        // 精灵图层（玩家、NPC、怪物、掉落物以及相关特效包括技能等）
        this.map_obj_container = new PIXI.Container
        this.container.addChild(this.map_obj_container)
        this.pixi_parent.addChild(this.container)
        this.game_map_dirty = false
        this.actor_list = []
    }

    update() {
        let roleX = -1
        let roleY = -1
        if (this.self_actor) {
            roleX = this.self_actor.x
            roleY = this.self_actor.y
        }
        
        //if (this.game_map_dirty) return
        this.map_bng_container.removeChildren()
        this.map_mid_container.removeChildren()
        this.map_obj_container.removeChildren()
        this.container.x = 0
        this.container.y = 0

        // 先看看地图是否已加载
        if (this.game_map == null) {
            if (this.map_no != null) {
                let _map = Maps.get(this.map_no)
                if (_map) {
                    this.game_map = _map
                }
            }
        }
        if (this.game_map == null) return
        // 如果没有玩家，以地图中心为中央显示
        if (roleX == -1) {
            roleX = Math.round((this.game_map.width + 1) / 2)
            roleY = Math.round((this.game_map.height + 1) / 2)
        }

        const rectPixel = new PIXI.Rectangle // 绘制区域（像素）
        const rectGame = new PIXI.Rectangle // 绘制区域（地图坐标）
        SDK.CalcMapDrawRect(rectPixel, rectGame, this.view_width, this.view_height, this.game_map.width, this.game_map.height, roleX, roleY)

        // 查看是否所有纹理都加载完成
        let textureLoadCompleted = true
        // 绘制（构建节点列表）
        let drawingX = rectPixel.x
        let drawingY = rectPixel.y
        for (let w = 0; w < rectGame.width; ++w) {
            drawingY = rectPixel.y
            for (let h = 0; h < rectGame.height; ++h) {
                const tileTextureName = this.game_map.tilesTextureName[rectGame.x + w][rectGame.y + h]
                if (null != tileTextureName) {
                    const tex = globalThis.BaseTextureCache[tileTextureName]
                    if (!tex) {
                        textureLoadCompleted = false
                        const tmpStrArr = tileTextureName.split('/')
                        Images.load(tmpStrArr[0], tmpStrArr[1])
                    } else {
                        // 添加大地砖节点到游戏区域
                        const sprite = new PIXI.Sprite(new PIXI.Texture(tex))
                        sprite.x = drawingX
                        sprite.y = drawingY
                        this.map_bng_container.addChild(sprite)
                    }
                }
                drawingY += 32
            }
            drawingX += 48
        }
        
        drawingX = rectPixel.x
        for (let w = 0; w < rectGame.width; ++w) {
            drawingY = rectPixel.y
            for (let h = 0; h < rectGame.height; ++h) {
                const smTileTextureName = this.game_map.smTilesTextureName[rectGame.x + w][rectGame.y + h]
                if (null != smTileTextureName) {
                    const tex = globalThis.BaseTextureCache[smTileTextureName]
                    if (!tex) {
                        textureLoadCompleted = false
                        const tmpStrArr = smTileTextureName.split('/')
                        Images.load(tmpStrArr[0], tmpStrArr[1])
                    } else {
                        // 添加小地砖节点到游戏区域
                        const sprite = new PIXI.Sprite(new PIXI.Texture(tex))
                        sprite.x = drawingX
                        sprite.y = drawingY
                        this.map_mid_container.addChild(sprite)
                    }
                }
                drawingY += 32
            }
            drawingX += 48
        }

        for (let w = 0; w < rectGame.width; ++w) {
            for (let h = 0; h < rectGame.height; ++h) {
                const objTextureName = this.game_map.objsTextureName[rectGame.x + w][rectGame.y + h]
                if (null != objTextureName) {
                    const tex = globalThis.BaseTextureCache[objTextureName]
                    if (!tex) {
                        textureLoadCompleted = false
                        const tmpStrArr = objTextureName.split('/')
                        Images.load(tmpStrArr[0], tmpStrArr[1])
                    } else {
                        // 添加对象图纹理到地图对象中
                        this.game_map.addObjTextureRegion(rectGame.x + w, rectGame.y + h, new PIXI.Texture(tex))
                        // 清理纹理编号以免下次重新添加
                        this.game_map.objsTextureName[rectGame.x + w][rectGame.y + h] = null
                    }
                }
            }
        }

        for (let gamey = rectGame.y; gamey <= this.game_map.height; ++gamey) {
            // 同一行先绘制精灵（玩家怪物）和地面物品（掉落物）
            // 这样才符合人在树前挡树，在树后被树挡。2.5D思维
            for (let i = 0; i < this.actor_list.length; ++i) {
                const actor = this.actor_list[i]
                if (actor.y == gamey) {
                    actor.update(rectPixel, rectGame, roleX, roleY, this.map_obj_container)
                }
            }

            // 绘制树木，建筑物等
            const rgs = this.game_map.getObjsTextureRegion(gamey)
            rgs?.forEach((k, objRegion, s) => {
                var xy = this.game_map.getObjTextureRegion(objRegion)
                if (xy[0] < rectGame.x || xy[0] > rectGame.x + rectGame.width - 1) return
                if (xy[1] < rectGame.y || xy[1] > rectGame.y + rectGame.height - 1) return
                drawingX = rectPixel.x + (xy[0] - rectGame.x) * 48
                drawingY = rectPixel.y + (xy[1] - rectGame.y) * 32
                const sprite = new PIXI.Sprite(objRegion)
                sprite.x = drawingX
                sprite.y = drawingY + 32 - objRegion.height
                this.map_obj_container.addChild(sprite)
            });
        }

        // 所有纹理都加载完了，就修改标志
        if (textureLoadCompleted) this.game_map_dirty = false
    }

    on_server_msg(head, body) {
        switch (head.ident) {
            case SDK.Messages.SM_NEWMAP: {
                const x = head.wparam
                const y = head.atag
                const darkness = head.nseries
                const mapNo = this.gb2312_decoder.decode(this.edcode.decode_string(body))
                if (mapNo == this.map_no) break
                this.map_no = mapNo
                this.game_map = null
                this.game_map_dirty = true
                break
            }
            case SDK.Messages.SM_LOGON: {
                const wl = this.edcode.decode_body_wl(body)
                this.self_actor = new HumActor(head.recog, head.wparam, head.atag, SDK.Lowbyte(head.nseries), wl.param1)
                this.actor_list.push(this.self_actor)
                break
            }
        }
    }

    _on_key_down(e) {
        // Alt + X
        if (e.altKey && (e.key === 'x' || e.code === 'KeyX')) {
            e.preventDefault();
            this.manager.dlg_message('你是否退出 ?', [SDK.DlgButtons.mbOk, SDK.DlgButtons.mbCancel], (mb) => {
                if (mb == SDK.DlgButtons.mbOk) {
                    this.manager.send_soft_close()
                    this.manager.change_scene(3)
                }
            })
        }

        // Alt + Q
        if (e.altKey && (e.key === 'q' || e.code === 'KeyQ')) {
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
        this.container.removeChildren()
        this.map_no = null
        this.self_actor = null
    }

    on_notice(msg) {
        this.manager.dlg_notice(msg, () => {
            this.manager.send_notice_ok()
        })
    }
}

export { PlayScene }