<template>
    <div id = "callPage" class = "call-page">
      <video id="stream" autoplay playsinline>Your browser doesn't support video</video>

        <div class = "row text-center">
            <div class = "col-md-12">
<!--                <label>
                    <input type="checkbox" v-model="videoCheck" value="video"/>
                    接收视频</label><br>
                <label>
                    <input type="checkbox" v-model="audioCheck" value="audio"/>
                    接收音频</label><br>
                <button id = "callBtn" class = "btn-success btn" @click="createOffer">Call</button>-->
                <button id = "hangUpBtn" class = "btn-danger btn" @click="handUp">Hang Up</button>
            </div>
        </div>

    </div>
</template>

<script>
    import axios from 'axios'
    import trace from '@/js/logging'
    //import 'webrtc-adapter'
    //import io from 'socket.io-client'
    export default {
      name: 'meeting-view',
      data() {
        return {
          streamId: 0,
          peer_connection: null,
          remoteVideo: null,
          socket: null,
          session_id: '1234',
          audienceId: null,
          liveStreamId: null,
          ws_server: undefined,
          ws_port: '8443',
          default_peer_id: undefined,
          default_constraints: {video: true, audio: true},
          ws_conn: null,
          local_stream_promise: null
        }
      },
      beforeRouteEnter (to, from, next) {
        next();
      },
      beforeRouteLeave (to, from, next) {
        this.handUp(next);
      },
      mounted() {
      },
      created() {
        this.liveStreamId = this.$route.params.id;
        this.websocketServerConnect();
      },
      methods: {
        addAudience() {
          if(!localStorage.signalingBridge) {
            throw Error('localStorage.signalingBridge is supposed!');
          }

          let audience = {
            name: `audience${this.session_id}`,
            protocol : 'webrtc',
            signal_bridge : 'ws://localhost:8443',
            connection_id: this.session_id
          };

          axios.post('/wom/livestream.audience', {
            id: this.liveStreamId,
            audience : audience
          }).then(res => {
            let audienceId = res.data.id;
            console.log('audienceId: ' + audienceId);

          }).catch(err => {
            this.handUp();
            throw err;
          })
        },
        getOurId() {
          return Math.floor(Math.random() * (9000 - 10) + 10).toString();
        },
        resetState() {
          // This will call onServerClose()
          if(this.ws_conn) {
            this.ws_conn.close();
          }
        },
        handleIncomingError(error) {
          this.setError("ERROR: " + error);
          this.resetState();
        },
        getVideoElement() {
          return document.getElementById("stream");
        },
        setStatus(text) {
          console.log(text);
        },
        setError(text) {
          console.error(text);
        },
        resetVideo() {
          // Release the webcam and mic
          if (this.local_stream_promise)
            this.local_stream_promise.then(stream => { });

          // Reset the video element and stop showing the last received frame
          let videoElement = this.getVideoElement();
          videoElement.pause();
          videoElement.src = "";
          videoElement.load();
        },
        onIncomingSDP(sdp) {
          this.peer_connection.setRemoteDescription(sdp).then(() => {
            this.setStatus("Remote SDP set");
            if (sdp.type !== "offer")
              return;
            this.setStatus("Got SDP offer");
            this.local_stream_promise.then((stream) => {
              this.setStatus("Got local stream, creating answer");
              this.peer_connection.createAnswer()
                .then(this.onLocalDescription).catch(this.setError);
            }).catch(this.setError);
          }).catch(this.setError);
        },
        onLocalDescription(desc) {
          console.log("Got local description: " + JSON.stringify(desc));
          this.peer_connection.setLocalDescription(desc).then(() => {
            this.setStatus("Sending SDP answer");
            let sdp = {'sdp': this.peer_connection.localDescription}
            this.ws_conn.send(JSON.stringify(sdp));
          });
        },
        onIncomingICE(ice) {
          let candidate = new RTCIceCandidate(ice);
          this.peer_connection.addIceCandidate(candidate).catch(this.setError);
        },
        onServerMessage(event) {
          console.log((new Date()).toLocaleTimeString());
          console.log("Received " + event.data);
          switch (event.data) {
            case "HELLO":
              this.setStatus("Registered with server, waiting for call");
              return;
            default:
              if (event.data.startsWith("ERROR")) {
                this.handleIncomingError(event.data);
                return;
              }
              // Handle incoming JSON SDP and ICE messages
              let msg;
              try {
                msg = JSON.parse(event.data);
              } catch (e) {
                if (e instanceof SyntaxError) {
                  this.handleIncomingError("Error parsing incoming JSON: " + event.data);
                } else {
                  this.handleIncomingError("Unknown error parsing response: " + event.data);
                }
                return;
              }

              // Incoming JSON signals the beginning of a call
              if (!this.peer_connection)
                this.createCall(msg);

              if (msg.sdp) {
                this.onIncomingSDP(msg.sdp);
              } else if (msg.ice) {
                this.onIncomingICE(msg.ice);
              } else {
                this.handleIncomingError("Unknown incoming JSON: " + msg);
              }
          }
        },
        onServerClose(event) {
          this.setStatus('Disconnected from server');
          this.resetVideo();

          if (this.peer_connection) {
            this.peer_connection.close();
            this.peer_connection = null;
          }

          // Reset after a second
          //window.setTimeout(websocketServerConnect, 1000);
        },
        onServerError(event) {
          this.setError("Unable to connect to server, did you add an exception for the certificate?");
          // Retry after 3 seconds
          window.setTimeout(websocketServerConnect, 3000);
        },
        getLocalStream() {
          // Add local stream
          if (navigator.mediaDevices.getUserMedia) {
            return navigator.mediaDevices.getUserMedia(this.default_constraints);
          } else {
            this.errorUserMediaHandler();
          }
        },
        websocketServerConnect() {
          let peer_id = 1234;
          this.ws_port = this.ws_port || '8443';
          if (window.location.protocol.startsWith ("file")) {
            this.ws_server = this.ws_server || "127.0.0.1";
          } else if (window.location.protocol.startsWith ("http")) {
            this.ws_server = this.ws_server || window.location.hostname;
          } else {
            throw new Error ("Don't know how to connect to the signalling server with uri" + window.location);
          }
          let ws_url = 'ws://' + this.ws_server + ':' + this.ws_port;
          this.setStatus("Connecting to server " + ws_url);
          this.ws_conn = new WebSocket(ws_url);
          /* When connected, immediately register with the server */
          this.ws_conn.addEventListener('open', (event) => {

            this.ws_conn.send('HELLO ' + peer_id);
            this.setStatus("Registering with server");
            //this.addAudience();
          });
          this.ws_conn.addEventListener('error', this.onServerError.bind(this));
          this.ws_conn.addEventListener('message', this.onServerMessage.bind(this));
          this.ws_conn.addEventListener('close', this.onServerClose.bind(this));
        },
        onRemoteStreamAdded(event) {
          let videoTracks = event.stream.getVideoTracks();
          let audioTracks = event.stream.getAudioTracks();

          if (videoTracks.length > 0) {
            console.log('Incoming stream: ' + videoTracks.length + ' video tracks and ' + audioTracks.length + ' audio tracks');
            this.getVideoElement().srcObject = event.stream;

            this.getVideoElement().addEventListener('loadstart', () => {
              console.log((new Date()).toLocaleTimeString());
              console.log('load start: ' + new Date());
            });

            this.getVideoElement().addEventListener('loadedmetadata', () => {
              console.log((new Date()).toLocaleTimeString());
              console.log('loadedmetadata: ' + new Date());
            });
          } else {
            this.handleIncomingError('Stream with unknown tracks added, resetting');
          }
        },
        errorUserMediaHandler() {
          this.setError("Browser doesn't support getUserMedia!");
        },
        createCall(msg) {
          // Reset connection attempts because we connected successfully

          console.log('Creating RTCPeerConnection');

          this.peer_connection = new RTCPeerConnection();
          this.peer_connection.onaddstream = this.onRemoteStreamAdded;
          /* Send our video/audio to the other peer */
          this.local_stream_promise = this.getLocalStream().then((stream) => {
            console.log('Adding local stream');
            this.peer_connection.addStream(stream);
            return stream;
          }).catch(this.setError);

          if (!msg.sdp) {
            console.log("WARNING: First message wasn't an SDP message!?");
          }

          this.peer_connection.onicecandidate = (event) => {
            // We have a candidate, send it to the remote party with the
            // same uuid
            if (event.candidate === null) {
              console.log("ICE Candidate was null, done");
              return;
            }
            console.log('Sending candidate: ' + JSON.stringify(event.candidate));
            this.ws_conn.send(JSON.stringify({'ice': event.candidate}));
          };

          this.setStatus("Created peer connection for call, waiting for SDP");
        },

        handUp(next) {
          if(this.peer_connection) {
            this.peer_connection.close();
            this.peer_connection = null;
          }
          this.resetVideo();
          if(this.ws_conn) {
              this.ws_conn.close();
              this.ws_conn = null;
          }

          if(next && typeof next === 'function') {
            next();
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
