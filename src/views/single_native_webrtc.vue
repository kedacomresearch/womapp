<template>
    <div id = "callPage" class = "call-page">
        <video id = "remoteVideo" autoplay playsinline></video>

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
    import io from 'socket.io-client'
    export default {
      name: 'meeting-view',
      data() {
        return {
          streamId: 0,
          peer_connection: null,
          remoteVideo: null,
          remoteAudio: null,
          socket: null,
          session_id: '1234',
          audienceId: null,
          liveStreamId: null,
          canCreateOffer: false,
          createAnswer: false
        }
      },
      beforeRouteEnter (to, from, next) {
/*        trace('beforeRouteEnter', 'single');
        trace(from, 'from');
        trace(to, 'to');*/

        next();
      },
      beforeRouteLeave (to, from, next) {
/*
        trace('beforeRouteLeave', 'single');
        trace(from, 'from');
        trace(to, 'to');
*/

        this.handUp(next);
      },
      mounted() {
        this.remoteVideo = document.getElementById('remoteVideo');

        this.remoteVideo.addEventListener('loadedmetadata', () => {
          console.log('loadedmetadata:');
          console.info(new Date());
        });

        this.remoteVideo.addEventListener('loadstart', () => {
          console.log('loadstart:');
          console.info(new Date());
        });

      },
      created() {
        this.liveStreamId = this.$route.params.id;

        this.createSocketIo();
      },
      methods: {
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
        createSocketIo() {
          this.socket = io(`${localStorage.signalingBridge}?room=${this.session_id}`);

          this.socket.on('disconnect', () => {
            this.handUp();
          });

          this.socket.on('reconnect_failed', () => {
            this.handUp();
          });

          this.socket.on('connect_timeout', (timeout) => {
            this.socket.open();
          });

          this.socket.on('connect_error', (error ) => {
            this.handUp();
            throw error;
          });

          this.socket.on('connect', () => {
            console.info('=========on socket connected==========');

            //this.createPeerConnection();

            this.addAudience();
          });

          this.socket.on('disconnect', (reason) => {
              console.log('disconnected!');
              console.log(reason);
              this.handUp();
          });

          //subscribe sdp
          this.socket.on('sdp', (data) => {
            this.onSocketMessage({
              topic: 'sdp',
              data: data
            });
          });

          this.socket.on('connected', () => {
            console.info('on session connected!');
            let timeout = setInterval(() => {
              if(this.canCreateOffer) {
                this.createOffer();
                clearInterval(timeout);
              }
            }, 2000);
          });


        },
        onSocketMessage(msgObj) {
          console.log(typeof msgObj.data);
          if(!this.peer_connection) {
              this.createPeerConnection();
          }

          let topic, data;

          topic = msgObj.topic;
          data = JSON.parse(msgObj.data);

          if(topic === 'sdp' && data !== undefined) {
            switch(data.type) {
              case "offer":
                this.handleOffer(data);
                break;
              case "answer":
                this.handleAnswer(data);
                break;
              default:
                break;
            }
            if(data.candidate) {
              this.handleCandidate(data);
            }
          }
        },
        createPeerConnection() {

          this.peer_connection = new RTCPeerConnection();

          let self = this,
            localStream;


          if(localStorage.videoToSend === 'true' || localStorage.audioToSend === 'true') {
            console.log('Requesting local stream');
            navigator.mediaDevices.getUserMedia({
              audio: true,
              video: true
            })
              .then(gotStream)
              .catch(function(e) {
                console.log('getUserMedia() error: ' + e.name);
              });
          } else {
              if(localStorage.caller === 'true') {
                canCreateOffer = true;
              }
          }


          function gotStream(stream) {
            trace('Received local stream');
            localStream = stream;

            console.log('Adding local stream');
            self.peer_connection.addStream(stream);

            self.createAnswer = true;
/*            localStream.getTracks().forEach(
              function(track) {
                self.peer_connection.addTrack(
                  track,
                  localStream
                );
              }
            );*/
            if(localStorage.caller === 'true') {
              canCreateOffer = true;
            }
          }

/*          //when a remote user adds a stream to the peer connection, we display it
          this.peer_connection.onaddstream = (e) => {
              trace('onaddstream');
              console.log(e);
              document.querySelector('#remoteVideo').srcObject = e.stream;
           };*/


          //when a remote user adds a stream to the peer connection, we display it
           this.peer_connection.onaddstream = (e) => {
               document.querySelector('#remoteVideo').srcObject = e.stream;
           };

/*          this.peer_connection.ontrack = (e) => {
            trace('ontrack');
/!*            if(e.track.kind === 'audio') {
              if (self.remoteAudio.srcObject !== e.streams[0]) {
                self.remoteAudio.srcObject = e.streams[0];
                trace('received remote audio stream');
              }
            }*!/
/!*            if(e.track.kind === 'video') {
              if (self.remoteVideo.srcObject !== e.streams[0]) {
                self.remoteVideo.srcObject = e.streams[0];
                trace('received remote video stream');
              }
            }*!/
            if (self.remoteVideo.srcObject !== e.streams[0]) {
              self.remoteVideo.srcObject = e.streams[0];
              trace('received remote video stream');
            }

          };*/

          // Setup ice handling
          this.peer_connection.onicecandidate = function (event) {
            if (event.candidate) {
              let now = new Date();
              console.log((now.getSeconds() + ':' + now.getMilliseconds()));
              console.log('sending candidate: ' + JSON.stringify(event.candidate));
              self.socket.emit('sdp', {
                publisher: 'answer',
                data: event.candidate
              });
            }
          };

          this.peer_connection.oniceconnectionstatechange = function (event) {
            if(this.peer_connection) {
              let now = new Date();
              console.log((now.getSeconds() + ':' + now.getMilliseconds()));
              console.log('ICE state: ' + this.peer_connection.iceConnectionState);
            }
          }.bind(this);
        },
        handleOffer(offer) {
          let now = new Date();
          console.log((now.getSeconds() + ':' + now.getMilliseconds()));
          console.log('Received ' + JSON.stringify(offer));

          let self = this;

          this.peer_connection.setRemoteDescription(offer).then(
            () => {
              trace('setRemoteDescription complete');
              let timeout = setInterval(() => {
                  if(this.createAnswer) {
                    self.peer_connection.createAnswer().then(
                      onCreateAnswerSuccess,
                      () => {
                        trace('Failed to create session description: ' + error.toString());
                      }
                    );
                    clearInterval(timeout);
                  }
              }, 1000);

            },
            error => {
              trace('Failed to set session description: ' + error.toString());
            }
          );

          function onCreateAnswerSuccess(answer) {
            let now = new Date();
            console.log((now.getSeconds() + ':' + now.getMilliseconds()));
            console.log('Sending ' + JSON.stringify(answer));
            self.peer_connection.setLocalDescription(answer);
            self.socket.emit('sdp', {
              publisher: 'answer',
              data: answer
            });
          }
        },
        //when we got an answer from a remote user
        handleAnswer(answer) {
          this.peer_connection.setRemoteDescription(answer);
        },
        //when we got an ice candidate from a remote user
        handleCandidate(ice) {
          let now = new Date();
          console.log((now.getSeconds() + ':' + now.getMilliseconds()));
          console.log('Received ' + JSON.stringify(ice));
          let candidate = new RTCIceCandidate(ice);
          this.peer_connection.addIceCandidate(candidate).catch(e => trace(e));
        },
        createOffer() {
          let offerOptions = {
            offerToReceiveAudio: localStorage.audioToReceive === 'true' ? 1 : 0,
            offerToReceiveVideo: localStorage.videoToReceive === 'true' ? 1 : 0
          };

          let self = this;

          trace('createOffer start', offerOptions);
          self.peer_connection.createOffer(
            offerOptions
          ).then(
            onCreateOfferSuccess,
            error => {
              trace('Failed to create session description: ' + error.toString());
            }
          );

          function onCreateOfferSuccess(desc) {
            trace('setLocalDescription start');
            //self.callBtn.disabled = true;
            self.peer_connection.setLocalDescription(desc).then(
              function() {
                trace('setLocalDescription complete\n');

                self.socket.emit('sdp', {
                  publisher: 'answer',
                  data: desc
                });
              },
              error => {
                trace('Failed to set session description: ' + error.toString());
              }
            );
          }
        },
        forceChosenAudioCodec(sdp) {
          let audiocodec = localStorage.getItem('audioCodec');
          console.log(`audiocodec: ${audiocodec}`);

          return this.maybePreferCodec(sdp, 'audio', 'send', audiocodec);
        },
        maybePreferCodec(sdp, type, dir, codec) {
          let str = type + ' ' + dir + ' codec';
          if (codec === '') {
            trace('No preference on ' + str + '.');
            return sdp;
          }

          trace('Prefer ' + str + ': ' + codec);

          let sdpLines = sdp.split('\r\n');

          // Search for m line.
          let mLineIndex = this.findLine(sdpLines, 'm=', type);
          if (mLineIndex === null) {
            return sdp;
          }

          // If the codec is available, set it as the default in m line.
          let codecIndex = this.findLine(sdpLines, 'a=rtpmap', codec);
          console.log('codecIndex', codecIndex);
          if (codecIndex) {
            let payload = this.getCodecPayloadType(sdpLines[codecIndex]);
            if (payload) {
              sdpLines[mLineIndex] = this.setDefaultCodec(sdpLines[mLineIndex], payload);
            }
          }

          sdp = sdpLines.join('\r\n');
          return sdp;
        },
        findLine(sdpLines, prefix, substr) {
          return this.findLineInRange(sdpLines, 0, -1, prefix, substr);
        },
        // Find the line in sdpLines[startLine...endLine - 1] that starts with |prefix|
        // and, if specified, contains |substr| (case-insensitive search).
        findLineInRange(sdpLines, startLine, endLine, prefix, substr) {
          let realEndLine = endLine !== -1 ? endLine : sdpLines.length;
          for (let i = startLine; i < realEndLine; ++i) {
            if (sdpLines[i].indexOf(prefix) === 0) {
              if (!substr ||
                sdpLines[i].toLowerCase().indexOf(substr.toLowerCase()) !== -1) {
                return i;
              }
            }
          }
          return null;
        },
        // Gets the codec payload type from an a=rtpmap:X line.
        getCodecPayloadType(sdpLine) {
          let pattern = new RegExp('a=rtpmap:(\\d+) \\w+\\/\\d+');
          let result = sdpLine.match(pattern);
          return (result && result.length === 2) ? result[1] : null;
        },
        // Returns a new m= line with the specified codec as the first one.
        setDefaultCodec(mLine, payload) {
          let elements = mLine.split(' ');

          // Just copy the first three parameters; codec order starts on fourth.
          let newLine = elements.slice(0, 3);

          // Put target payload first and copy in the rest.
          newLine.push(payload);
          for (let i = 3; i < elements.length; i++) {
            if (elements[i] !== payload) {
              newLine.push(elements[i]);
            }
          }
          return newLine.join(' ');
        },
        handUp(next) {
          document.querySelector('#remoteVideo').srcObject = null;


          if(this.peer_connection) {
            this.peer_connection.close();
            this.peer_connection = null;
          }

          if(this.socket) {
            this.socket.close();
            this.socket = null;
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
