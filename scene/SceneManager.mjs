import { LoginScene } from "./LoginScene.mjs"
import { NewAccountScene } from "./NewAccount.mjs"
import { GB2312Encoder } from "../GB2312Encoder.mjs"
import { EDcode } from "../EDcode.mjs"
import * as SDK from "../SDK.mjs"

class SceneManager {
    constructor(params) {
        this.login_scene = new LoginScene(params, this)
        this.new_account_scene = new NewAccountScene(params, this)
        this.scene = 0 // 0:登录 1:新用户 2:修改密码 3:选择角色 4:公告 5:游戏
        this.ws = new WebSocket(params.server_base_url + "/7000")
        this.ws.onmessage = (event) => {
            this.on_ws_message(event)
        }
        this.send_idx = 1
        this.edcode = new EDcode(10000)
        this.gb2312_encoder = new GB2312Encoder()
        this.utf8_encoder = new TextEncoder()
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

    on_ws_message(event) {
        const data = event.data.slice(1, -1)
        const head = this.edcode.decode_message(data)
        switch (head.ident) {
            case SDK.Messages.SM_NEWID_SUCCESS:
            case SDK.Messages.SM_NEWID_FAIL:
            {
                this.new_account_scene.on_create_user_response(head)
                break
            }
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
}

export { SceneManager }