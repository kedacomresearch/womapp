<template>
  <div class="page-content">
    <div class="content-nav">
      直播管理 &gt; 创建视频直播
    </div>
    <form @submit.prevent="createSession" @reset.prevent="resetSession">
      <fieldset>
        <legend>直播信息</legend>
        <table class="formtable">
          <tbody>
          <tr>
            <td>类型:</td>
            <td>
              <select v-model="choosenSessionType" id="sessionSelector">
                <option v-for="type, index in meetingType" :value="index">{{type}}</option>
              </select>
            </td>
          </tr>
          <template v-if="choosenSessionType === 0">
            <tr>
              <td>名称:</td>
              <td>
                <input type="text" v-model="typeName" required maxlength="20">
              </td>
            </tr>
            <tr>
              <td>直播源地址:</td>
              <td>
                <input type="text" v-model="sourceUrl" required placeholder="rtsp://*/id=*">
              </td>

            </tr>

            <tr>
              <td>协议类型:</td>
              <td>
                <select v-model="protocol">
                  <option v-for="type, index in protocolType" :value="index">{{type}}</option>
                </select>
              </td>
            </tr>
          </template>

          <template v-if="choosenSessionType === 1">
            <tr>
              <td>名称:</td>
              <td>
                <input id="capacity" type="text" v-model="typeName" required maxlength="20">
              </td>
            </tr>

<!--            <tr>
              <td>备注：</td>
              <td>
                <textarea id="description" v-model="description"  maxlength="200" rows="5" cols="60" required placeholder="200字以内的文字描述"></textarea>
              </td>
            </tr>-->
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
                description: '',
                groupId: 0,
                meetingType: ['Live Stream', 'Rtsp Test Server'],
                protocolType: ['rtspclient','rtspserver'],
                choosenSessionType: undefined,
                sourceUrl: 'rtsp://172.16.66.65/id=1',
                protocol: 0,
                typeName: null
            }
        },
        computed: {

        },
        beforeDestroy () {

        },
        created () {

        },
        methods: {
          createSession: function () {
            axios.post('/proxy/wom/livestream', {
              source : {
                name : this.typeName,
                protocol : this.protocolType[this.protocol],
                url : this.sourceUrl,
                type: this.meetingType[this.choosenSessionType]
              }
            }).then(res => {
              this.$router.push({
                name: 'Query'
              });
            }).catch(err => {
              console.log(err.message);
            })
          },
          createTestServer() {
            axios.post('/proxy/wom/rtsptestserver', {
              name : this.rtsptestservername
            }).then(res => {
              axios.post('/proxy/wom/livestream', {
                source : {
                  name : this.rtsptestservername,
                  protocol : this.protocolType[this.protocol],
                  url : 'rtsp://127.0.0.1/test',
                  type: this.meetingType[this.choosenSessionType]
                }
              }).then(res => {
                this.$router.push({
                  name: 'Query'
                });
              }).catch(err => {
                console.log(err.message);
              })
            }).catch(err => {
              console.log(err.message);
            });
          },
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
