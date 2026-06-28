import * as SDK from "../SDK.mjs"
import * as PIXI from "../pixi.mjs"
import { Images } from "../image/Images.mjs"
import * as ActorUtils from "./ActorUtils.mjs"

class HumActor {

    // 人物对象
    constructor(id, x, y, dir, featrue) {
        this.id = id
        this.x = x
        this.y = y
        this.dir = dir
        this.action = SDK.HumActions.Stand
        //this.hair = SDK.HAIRfeature(featrue)
        this.dress = SDK.DRESSfeature(featrue)
        this.sex = this.dress % 2
        this.weapon = SDK.WEAPONfeature(featrue)
        this.dirty = true // 是否需要重绘
        this.dress_sprite = null
        this.dress_time = 0
        this.dress_idx = 0
        this.weapon_sprite = null
        this.weapon_idx = 0
    }

    update(rectPixel, rectGame, cx, cy, pixi_parent) {
        if (!this.dirty) {
            if (this.dress_time < Date.now()) {
                this.dirty = true
                this.dress_idx++
                this.weapon_idx++
                this.dress_time = Date.now() + ActorUtils.GetHumActionImgDuration(this.action)
            }
        }

        if (this.dirty) {
            const dress_img_idx = ActorUtils.GetHumDressImgIdx(this.dress, this.action, this.dir, this.dress_idx)
            {
                const tex = globalThis.BaseTextureCache[`hum/${dress_img_idx}`]
                const offset = globalThis.BaseTextureOffsetCache[`hum/${dress_img_idx}`]
                if (!!tex) {
                    this.dress_sprite = new PIXI.Sprite(new PIXI.Texture(tex))
                    this.dress_sprite.x = rectPixel.x + (cx - rectGame.x) * 48 + offset.offsetX
                    this.dress_sprite.y = rectPixel.y + (cy - rectGame.y) * 32 + offset.offsetY
                } else {
                    Images.load('hum', dress_img_idx)
                }
            }
            const weapon_img_idx = ActorUtils.GetHumWeaponImgIdx(this.weapon, this.action, this.dir, this.weapon_idx)
            if (weapon_img_idx > 1199) {
                const tex = globalThis.BaseTextureCache[`weapon/${weapon_img_idx}`]
                const offset = globalThis.BaseTextureOffsetCache[`weapon/${weapon_img_idx}`]
                if (!!tex) {
                    this.weapon_sprite = new PIXI.Sprite(new PIXI.Texture(tex))
                    this.weapon_sprite.x = rectPixel.x + (cx - rectGame.x) * 48 + offset.offsetX
                    this.weapon_sprite.y = rectPixel.y + (cy - rectGame.y) * 32 + offset.offsetY
                } else {
                    Images.load('weapon', weapon_img_idx)
                }
            }

            this.dirty = false
        }
        if (!!this.weapon_sprite && !ActorUtils.IsWeaponHoverDress(this.action, this.sex)) {
            pixi_parent.addChild(this.weapon_sprite)
        }
        if (!!this.dress_sprite) {
            pixi_parent.addChild(this.dress_sprite)
        }
        if (!!this.weapon_sprite && ActorUtils.IsWeaponHoverDress(this.action, this.sex)) {
            pixi_parent.addChild(this.weapon_sprite)
        }
    }
}

export { HumActor }