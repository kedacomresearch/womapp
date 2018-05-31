<template>
    <div id = "callPage" class = "call-page">
        <!--<video id = "remoteVideo" autoplay playsinline></video>-->

      <!-- Plotly chart will be drawn inside this DIV -->
      <ve-histogram :data="chartData" :tooltip-visible="tooltip"  :width="width" :height="height"></ve-histogram>
    </div>
</template>

<script>
    import axios from 'axios'
    import trace from '@/js/logging'
    //import 'webrtc-adapter'
    import io from 'socket.io-client'

    export default {
      name: 'meeting-view',
      data() {
        this.chartSettings = {
        }
        return {
          tooltip: false,
          width: '1200px',
          height: '1000px',
          socket: null,
          audienceId: null,
          liveStreamId: null,
          chartData: {
            columns: [],
            rows: [
            ]
          }
        }
      },
      mounted() {

      },
      created() {
        this.audienceId = this.$route.params.id;

        this.createSocketIo();
      },
      methods: {
        createSocketIo() {
          this.socket = io(`${localStorage.signalingBridge}?audienceId=${this.audienceId}`);

          this.socket.on('connect_timeout', (timeout) => {
            this.socket.open();
          });

          this.socket.on('connect_error', (error ) => {
            throw error;
          });

          this.socket.on('connect', () => {
            console.info('=========on socket connected==========');
          });

          this.socket.on('disconnect', (reason) => {
              console.log('disconnected!');
          });

          function toObjectArr(arr) {
            let array = [];
            let rv = {};
            for (let i = 0; i < arr.length; ++i) {
              if (arr[i] !== undefined) rv[i] = arr[i];
            }
            array.push(rv);
            return array;
          }

          //subscribe sdp
          this.socket.on('spectrum', (spectrum) => {
            console.log('on spectrum');
            this.chartData.columns = [...spectrum.keys()];
            this.chartData.rows = toObjectArr(spectrum);
          });

          this.socket.on('connected', () => {
            console.info('on session connected!');
          });
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
        /*position: relative;*/
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
