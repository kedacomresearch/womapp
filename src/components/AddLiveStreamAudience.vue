<template>
  <div class="page-content">
    <div class="content-nav">
      直播管理 &gt; 添加直播观众
    </div>
    <form @submit.prevent="createSession" @reset.prevent="resetSession">
      <fieldset>
        <legend>观众信息</legend>
        <table class="formtable">
          <tbody>
          <tr>
            <td>名称:</td>
            <td>
              <input type="text" v-model="name" required maxlength="20">
            </td>
          </tr>

          <tr>
            <td>协议类型:</td>
            <td>
              <select v-model="protocol" id="protocolSelector">
                <option v-for="type, index in protocolType" :value="index">{{type}}</option>
              </select>
            </td>
          </tr>

          <template v-if="protocol != 1">
            <tr>
              <td>挂载地址:</td>
              <td>
                <input type="text" v-model="mountPath" required>
              </td>
            </tr>
          </template>

          <template v-if="protocol == 1">
            <tr>
              <td>呼叫类型:</td>
              <td>
                <select v-model="call" id="callerSelector">
                  <option v-for="type, index in callType" :value="index">{{type}}</option>
                </select>
              </td>
            </tr>
            <tr>
              <td>发送：</td>
              <td>
                <input type="checkbox" id="audioToSend" value="audio" v-model="checkedMediaToSend">
                <label for="audioToSend">音频</label>
                <input type="checkbox" id="videoToSend" value="video" v-model="checkedMediaToSend">
                <label for="videoToSend">视频</label>
              </td>
            </tr>

            <tr>
              <td>接收：</td>
              <td>
                <input type="checkbox" id="audioToReceive" value="audio" v-model="checkedMediaToReceive">
                <label for="audioToReceive">音频</label>
                <input type="checkbox" id="videoToReceive" value="video" v-model="checkedMediaToReceive">
                <label for="videoToReceive">视频</label>
              </td>
            </tr>
          </template>

          <template v-if="protocol != 0">
            <tr>
              <td>信令服务器:</td>
              <td>
                <input type="text" v-model="signalingBridge" required>
              </td>
            </tr>
          </template>


          <tr>
            <td colspan="2" class="command">
              <input type="submit" value="创建" class="clickbutton">
              <input type="reset" value="重置" class="clickbutton">
            </td>
          </tr>
          </tbody>
        </table>
      </fieldset>
    </form>
  </div>
</template>

<script>
    import axios from 'axios'
    export default  {
        name: 'create-meeting-content',
        data () {
            return {
                id: null,
                protocolType: ['rtspserver', 'webrtc', 'rtspanalyzer'],
                callType: ['主叫', '被叫'],
                call: 1,
                checkedMediaToSend: [],
                checkedMediaToReceive: [],
                mountPath: '',
                protocol: 0,
                name: null,
                signalingBridge: 'http://localhost:3030/livestream.spectrum'
            }
        },
        computed: {

        },
        beforeDestroy () {

        },
        created () {
            console.log(this.$route.params);
            this.id = this.$route.params.id;
        },
        methods: {

          createSession: function () {
            let audience;

            if(this.protocol === 0) {
                audience = {
                  name: this.name,
                  protocol : this.protocolType[this.protocol],
                  path : `/${this.mountPath}`
                };
            } else if(this.protocol === 1) {
              audience = {
                name: this.name,
                protocol : this.protocolType[this.protocol],
                signalingBridge : this.signalingBridge
              };
            } else if(this.protocol === 2) {
              audience = {
                name: this.name,
                protocol : this.protocolType[this.protocol],
                signalingBridge : this.signalingBridge,
                path : `/${this.mountPath}`
              };
            }

            //webrtc
            if(this.protocol === 1) {
                localStorage.signalingBridge = this.signalingBridge;
                localStorage.caller = (this.call === 0);
                localStorage.audioToSend = this.checkedMediaToSend.includes('audio');
                localStorage.videoToSend = this.checkedMediaToSend.includes('video');
                localStorage.audioToReceive = this.checkedMediaToReceive.includes('audio');
                localStorage.videoToReceive = this.checkedMediaToReceive.includes('video');

                this.$router.push({
                  name: 'Webrtc',
                  params: {
                      id: this.id
                  }
                });
                return;
            }

            let self = this;

            axios.post('/proxy/wom/livestream.audience', {
                id: this.id,
                audience : audience
            }).then(res => {
                let audienceId = res.data.id;


              //rtspanalyzer
              if(this.protocol === 2) {
                localStorage.signalingBridge = this.signalingBridge;

                this.$router.push({
                  name: 'rtspanalyzer',
                  params: {
                    id: audienceId
                  }
                });
                return;
              }

                self.$router.push({
                  name: 'Query'
                });
            }).catch(err => {
                throw err;
            })
          }
        }
    }
</script>

<style scoped>
/*    .page-content{
        width:830px;
        float:right;
    }
    .page-content .content-nav{
        padding:0 0 10px 0;
    }*/
</style>
