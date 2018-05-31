<template>
  <div class="page-content">
    <div class="content-nav">
      测试管理 &gt; 查看&创建测试信息
    </div>

    <template v-if="testTypeChosen == 0">
      <form @submit.prevent="createTestServer" @reset.prevent="resetTestServer">
        <fieldset>
          <legend>创建RTSP Test Server</legend>
          <table class="formtable">
            <tbody>

            <tr>
              <td>名称:</td>
              <td>
                <input type="text" v-model="name" required maxlength="20">
              </td>
            </tr>

            <tr>
              <td>测试类型:</td>
              <td>
                <select v-model="testTypeChosen" id="testTypeSelector">
                  <option v-for="type, index in testType" :value="index">{{type}}</option>
                </select>
              </td>
            </tr>




            <tr>
              <td colspan="2" class="command">
                <input type="submit" value="创建" class="clickbutton">
                <!--<input type="reset" value="重置" class="clickbutton">-->
              </td>
            </tr>
            </tbody>
          </table>
        </fieldset>
      </form>
    </template>

    <table class="listtable">
      <caption>RrspTestServer:</caption>
      <tbody>
      <tr class="listheader">
        <th>路径</th>
        <th>名称</th>
        <th>操作</th>
      </tr>
      <tr v-for="(info, index) in rtspTestServerInfo">
        <td>{{info.path}}</td>
        <td>{{info.name}}</td>
        <td>
          <!--<router-link :to="{ name: info.type, params: { groupId: info.groupId }}">进入会话</router-link>-->
          <button @click="createRtspAnalyzer(info.path)">创建RtspAnalyzer</button>
          &nbsp;
          &nbsp;
          <button @click="removeRtspAnalyzer(index)">删除</button>
        </td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
  import axios from 'axios'
  export default {
    name: 'rtsp-test-server',
    data () {
      return {
        name: undefined,
        rtspTestServerInfo: [],
        audienceInfo: [],
        audienceId: 0,
        rtspTestServer: null,
        testType: ['RtspTestServer'],
        testTypeChosen: 0
      }
    },
    beforeRouteEnter(to, from, next) {
      next();
    },
    created () {
      this.getRtspTestServerInfo();
    },
    methods: {
      getRtspTestServerInfo() {
          console.log('getRtspTestServerInfo');
        axios.get('/wom/rtsptestserver')
          .then(res => {
            if(res.data) {
              this.rtspTestServer = 1;
              console.log(res.data);
              this.rtspTestServerInfo.push({
                name : res.data.name,
                path : res.data.path
              });
            } else {
              this.rtspTestServer = 0;
            }
          })
          .catch(err => {
            throw err;
          });
      },
      createRtspAnalyzer(id) {
        this.$router.push({
          name: 'creatertspanalyzer'
        })
      },
      deleteRtspAnalyzer(audienceId, liveStreamId, index) {
        axios.delete(`/wom/livestream.audience?livestreamId=${liveStreamId}&audienceId=${audienceId}`)
          .then(res => {
            this.audienceInfo.splice(index,1);
          })
          .catch(err => {
            throw err;
          });
      },
      createTestServer() {
        axios.post('/wom/rtsptestserver', {
            name : this.name
        }).then(res => {
          if(res.data.OK === 'success') {
            this.getRtspTestServerInfo();
          }
        }).catch(err => {
          throw err;
        });
      },
      removeTestServer(id, index) {
        axios.delete(`/wom/rtsptestserver`)
          .then(res => {
              console.dir(res);
              if(res.status === 200) {
                this.rtspTestServerInfo.splice(index,1);
              }
          })
          .catch(err => {
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
