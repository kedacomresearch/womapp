<template>
    <div id = "callPage" class = "call-page">
        <video id = "mediaplayer" controls autoplay></video>

        <div class = "row text-center">
            <div class = "col-md-12">
<!--                <label>
                    <input type="checkbox" v-model="videoCheck" value="video"/>
                    接收视频</label><br>
                <label>
                    <input type="checkbox" v-model="audioCheck" value="audio"/>
                    接收音频</label><br>-->
<!--                <button id = "callBtn" class = "btn-success btn" @click="">Call</button>
                <button id = "hangUpBtn" class = "btn-danger btn" @click="">Hang Up</button>-->
            </div>
        </div>

    </div>
</template>

<script>
    import axios from 'axios'
    // To import only MediaElement class
    import 'mediaelement/standalone';
    export default {
        name: 'meeting-view',
        data() {
            return {
                session_id: null,
                audienceId: null,
                liveStreamId: null,
                player: null
            }
        },
        computed: {
        },
        created() {
            this.liveStreamId = this.$route.params.id;
        },
        mounted() {
          this.session_id = this.getRoomId();
          this.createPlayer();
        },
        beforeCreate() {
            console.log('beforeCreate liveStreamId: '+ this.$route.params.id);
        },
        beforeDestroy () {
            if(this.player && typeof this.player.destroy === 'function') {
              console.log('destroy player!');
              this.player.destroy();
            }
        },
        methods: {
          getRoomId() {
            return Math.floor(Math.random() * (9000 - 10) + 10).toString();
          },
          addAudience() {
            if(!localStorage.signalingBridge) {
                throw Error('localStorage.signalingBridge is supposed!');
            }

            let audience = {
              name: `audience${this.session_id}`,
              protocol : 'webrtc',
              signal_bridge : localStorage.signalingBridge,
              connection_id: this.session_id
            };

            console.log(audience);
            console.dir(localStorage);
            axios.post('/wom/livestream.audience', {
              id: this.liveStreamId,
              audience : audience
            }).then(res => {
              let audienceId = res.data.id;
              console.log('audienceId: ' + audienceId);

            }).catch(err => {
              throw err;
            })
          },
          createPlayer() {
            // 这里的channel为启动webrtc信令服务器时指定的channel名称
            let channel = 'livestream';

            let mediaFilse = [{
              type: 'video/webrtc',
              src: `http://localhost:3030/${channel}.webrtc?room=${this.session_id}`
            }];

            let options = {
              success: (mediaElement, originalNode) => {
                mediaElement.addEventListener('loadedmetadata', () => {
                  console.log('loadedmetadata:');
                  console.info(new Date());
                });

                mediaElement.addEventListener('loadstart', () => {
                  console.log('loadstart:');
                  console.info(new Date());
                });
                mediaElement.setSrc(`http://localhost:3030/${channel}.webrtc?room=${this.session_id}`);

                this.addAudience();
              },
              caller: localStorage.caller ? localStorage.caller : false,
              mediaToReveive: {
                video: localStorage.videoToReceive ? localStorage.videoToReceive : false,
                audio: localStorage.audioToReceive ? localStorage.audioToReceive : false
              },
              mediaToSend: {
                video: localStorage.videoToSend ? localStorage.videoToSend : false,
                audio: localStorage.audioToSend ? localStorage.audioToSend : false
              }
            };
            if(MediaElement) {
              this.player = new MediaElement('mediaplayer', options);
            }
            }
        }
    }
</script>

<style scoped>
    body {
        background: #eee;
        padding: 5% 0;
    }

    video {
        background: black;
        border: 1px solid gray;
    }

    .call-page {
        position: relative;
        display: block;
        margin: 0 auto;
        width: 500px;
        height: 500px;
    }

    #remoteVideo {
        width: 500px;
        height: 500px;
    }

    .btn-success {
        color: #fff;
        background-color: #5cb85c;
        border-color: #4cae4c;
    }
    .btn-success:focus,
    .btn-success.focus {
        color: #fff;
        background-color: #449d44;
        border-color: #255625;
    }
    .btn-success:hover {
        color: #fff;
        background-color: #449d44;
        border-color: #398439;
    }

    .btn-danger {
        color: #fff;
        background-color: #d9534f;
        border-color: #d43f3a;
    }
    .btn-danger:focus,
    .btn-danger.focus {
        color: #fff;
        background-color: #c9302c;
        border-color: #761c19;
    }
    .btn-danger:hover {
        color: #fff;
        background-color: #c9302c;
        border-color: #ac2925;
    }
</style>
