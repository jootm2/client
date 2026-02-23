import { LoginScene } from "./Login.mjs"
import { NewAccountScene } from "./NewAccount.mjs"
import { ChgpwdScene } from "./Chgpwd.mjs"

class SceneManager {
    constructor(params) {
        this.login_scene = new LoginScene(params, this)
        this.new_account_scene = new NewAccountScene(params, this)
        this.chgpwd_scene = new ChgpwdScene(params, this)
        this.scene = 0 // 0:登录 1:新用户 2:修改密码 3:选择角色 4:公告 5:游戏
    }

    update() {
        if(this.scene == 0) {
            this.login_scene.update()
        } else if (this.scene == 1) {
            this.new_account_scene.update()
        } else if (this.scene == 2) {
            this.chgpwd_scene.update()
        }
    }

    change_scene(scene_type) {
        if (this.scene == 0) {
            this.login_scene.leave_scene()
        } else if (this.scene == 1) {
            this.new_account_scene.leave_scene()
        } else if (this.scene == 2) {
            this.chgpwd_scene.leave_scene()
        }

        this.scene = scene_type

        if(this.scene == 0) {
            this.login_scene.enter_scene()
        } else if (this.scene == 1) {
            this.new_account_scene.enter_scene()
        } else if (this.scene == 2) {
            this.chgpwd_scene.enter_scene()
        }
    }
}

export { SceneManager }