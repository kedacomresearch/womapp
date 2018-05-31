<template>
  <div class="page-content">
    <div class="content-nav">
      直播管理 &gt; 查看直播信息
    </div>
    <table class="listtable">
      <caption>LiveStream:</caption>
      <tbody>
      <tr class="listheader">
        <th>会话类型</th>
        <th>名称</th>
        <th>操作</th>
      </tr>
      <tr v-for="(info, index) in livestreamInfo">
        <td>{{info.type}}</td>
        <td>{{info.name}}</td>
        <td>
          <!--<router-link :to="{ name: info.type, params: { groupId: info.groupId }}">进入会话</router-link>-->
          <template v-if="info.type === 'Rtsp Test Server'">
            <button @click="addAudience(info.id)">添加Rtsp Analyzer</button>
          </template>
          <template v-if="info.type === 'Live Stream'">
            <button @click="addAudience(info.id)">添加观众</button>
            <button @click="removeLiveStream(info.id, index)">删除</button>
          </template>
          &nbsp;

        </td>
      </tr>
      </tbody>
    </table>

    <table class="listtable">
      <caption>Audience:</caption>
      <tbody>
      <tr class="listheader">
        <th>名称</th>
        <th>观看地址</th>
        <th>操作</th>
      </tr>
      <tr v-for="(info, index) in audienceInfo">
        <td>{{info.name}}</td>
        <td>{{info.path}}</td>
        <td>
          <!--<router-link :to="{ name: info.type, params: { groupId: info.groupId }}">进入会话</router-link>-->
          <!--<button @click="addAudience(info.id)">观看</button>-->
          &nbsp;
          &nbsp;
          <button @click="deleteAudience(info.id, info.livestreamId, index)">删除</button>
        </td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
    import axios from 'axios'
    export default {
        name: 'query-meeting-content',
        data () {
            return {
                livestreamInfo: [],
                audienceInfo: [],
                audienceId: 0
            }
        },
        beforeRouteEnter(to, from, next) {
          next();
        },
        created () {
            axios.get('/proxy/wom/livestream')
              .then(res => {
                  this.livestreamInfo.length = 0;
                  let livestream = JSON.parse(res.data);
                  for(let id in livestream) {
                    this.livestreamInfo.push({
                      type: livestream[id].type,
                      name: livestream[id].name,
                      id: id
                    })
                  }
              })
              .catch(err => {
                  throw err;
              });

          axios.get('/proxy/wom/livestream.audience')
            .then(res => {
              this.audienceInfo.length = 0;
              let audience = JSON.parse(res.data);
              for(let id in audience) {
                this.audienceInfo.push({
                  name: audience[id].name,
                  id: id,
                  path: audience[id].path,
                  livestreamId: audience[id].livestreamId
                })
              }
            })
            .catch(err => {
              throw err;
            });
        },
        methods: {
          addAudience(id) {
            this.$router.push({
              name: 'addaudience',
              params: {
                id: id
              }
            })
          },
          deleteAudience(audienceId, liveStreamId, index) {
              axios.delete(`/proxy/wom/livestream.audience?livestreamId=${liveStreamId}&audienceId=${audienceId}`)
                .then(res => {
                  this.audienceInfo.splice(index,1);
                })
                .catch(err => {
                    throw err;
                });
          },
          removeLiveStream(id, index) {
            axios.delete(`/proxy/wom/livestream?id=${id}`)
              .then(res => {
                  this.livestreamInfo.splice(index,1);
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
