<template>
    <div class="page-content">
        <form @submit.prevent="addMember">
            <fieldset>
                <legend>多点视频会话</legend>
                <table class="formtable" >
                    <tbody>
                    <tr>
                        <td>成员类型选择:</td>
                        <td>
                            <select v-model="type" required>
                                <option v-for="type in types">{{type}}</option>
                            </select>
                        </td>
                        <template v-if="type == 'webrtc'">
                            <td>成员名称:</td>
                            <td>
                                <input type="text" required v-model="memberName"/>
                            </td>
                        </template>
                        <template v-else-if="type == 'ipc'">
                            <td>RTSP:</td>
                            <td>
                                <input type="text" required v-model="memberName"/>
                            </td>
                        </template>
                        <td>
                            <input type="submit" value="添加" class="clickbutton">
                        </td>
                    </tr>
                    <tr v-for="member in groupMember">
                        <td>成员类型:</td>
                        <td>{{member.type}}</td>
                        <td v-if="member.type == 'ipc'">RTSP:</td>
                        <td v-else-if="member.type == 'webrtc'">成员名称:</td>
                        <td>{{member.memberName}}</td>
                        <td v-if="member.type == 'webrtc'"><a href="#">发送会话请求</a></td>
                    </tr>
                    </tbody>
                </table>
            </fieldset>
        </form>
    </div>
</template>

<script>
    import axios from 'axios'
    import trace from "../js/logging"
    export default {
        name: 'ptt-view',
        data () {
            return {
                type: undefined,
                types: ['ipc','webrtc'],
                groupId: undefined,
                memberName: undefined,
                groupMember: []
            }
        },
        created () {
            let self = this;
            this.groupId = this.$route.params.groupId;
            trace('groupId:' + this.groupId);
            axios.get(`/webmedia/ptt/group/member/${this.groupId}`)
                .then( response => {
                    self.groupMember = response.data.groupMember;
                })
                .catch( error => {
                    console.log(error);
                });
        },
        methods: {
            addMember() {
                let self = this;
                trace(this.type);
                trace(this.memberName);
                axios.put(`/webmedia/ptt/group/member/${self.groupId}`, {
                    type: this.type,
                    memberName: this.memberName
                })
                    .then( response => {
                        trace(response);
                        self.groupMember.push({
                            type: self.type,
                            memberName: self.memberName
                        });
                        self.type = undefined;
                        self.memberName = undefined;
                    })
                    .catch( error => {
                        console.log(error);
                    });
            }
        }
    }
</script>

<style>

</style>
