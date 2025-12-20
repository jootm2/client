import { LoginScene } from "./LoginScene.mjs"
import { NewAccountScene } from "./NewAccount.mjs"

class SceneManager {
    constructor(params) {
        this.login_scene = new LoginScene(params, this)
        this.new_account_scene = new NewAccountScene(params, this)
        this.scene = 0 // 0:登录 1:新用户 2:修改密码 3:选择角色 4:公告 5:游戏
    }

    update() {
        if(this.scene == 0) {
            this.login_scene.update()
        } else if (this.scene == 1) {
            this.new_account_scene.update()
        }
    }

    change_scene(scene_type) {
        if (this.scene == 0) {
            this.login_scene.leave_scene()
        } else if (this.scene == 1) {
            this.new_account_scene.leave_scene()
        }

        this.scene = scene_type

        if(this.scene == 0) {
            this.login_scene.enter_scene()
        } else if (this.scene == 1) {
            this.new_account_scene.enter_scene()
        }
    }
}

export { SceneManager }