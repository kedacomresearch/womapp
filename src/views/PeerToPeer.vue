<template>
    <div id = "callPage" class = "call-page">
        <h1>一对一视频</h1>
        <video id = "localVideo" autoplay controls></video>

        <video id = "remoteVideo" autoplay controls></video>

        <div class = "row text-center">
            <div class = "col-md-12">
                <button id = "callBtn" class = "btn-success btn" @click="createOffer">Call</button>
                <button id = "hangUpBtn" class = "btn-danger btn" @click="handUp">Hang Up</button>
            </div>
        </div>

    </div>
</template>

<script>
    import HttpWsConnection from '@/js/httpws/httpWsConnection'
    import axios from 'axios'
    import {wsConnection,info, hostname, port} from '@/js/connection'
    import trace from '@/js/logging'
    export default {
        name: 'meeting-view',
        data() {
            return {
                groub_id: 0,
                peer_connection: null,
                endpoint_id: null,
                endpoint: null,
                localStream: null,
                localVideo: null,
                remoteVideo: null
            }
        },
        components: {},
        mounted() {
            this.localVideo = document.getElementById('localVideo');
            this.remoteVideo = document.getElementById('remoteVideo');
            this.localVideo.addEventListener('loadedmetadata', function() {
                trace('Local video videoWidth: ' + this.videoWidth +
                    'px,  videoHeight: ' + this.videoHeight + 'px');
            });
            this.remoteVideo.addEventListener('loadedmetadata', function() {
                trace('Remote video videoWidth: ' + this.videoWidth +
                    'px,  videoHeight: ' + this.videoHeight + 'px');
            });

            document.getElementById('callBtn').disabled = true;
        },
        created() {

            this.endpoint_id = Math.floor(Math.random()*1000);
            console.log('creatd endpoint_id: ' + this.endpoint_id);
            this.group_id = this.$route.params.groupId;
            this.createEndpoint();

        },
        beforeCreate() {
            console.log('beforeCreate groupid: '+ this.$route.params.groupId);
        },
        methods: {
            createEndpoint() {
                console.log("hostname:" + hostname);
                const options = {
                    hostname: hostname,
                    port: port,
                    path: `/${this.endpoint_id}`
                };

                this.endpoint = new HttpWsConnection(options);
                let self = this;
                this.endpoint.onConnected = function () {
                    trace(`${self.endpoint_id} connected to the signalling server!`);
                    self.endpoint.addServiceListener(self.serviceListenerCallback);
                    self.joinGroup();
                };
            },
            serviceListenerCallback(req, res) {
                console.log('serviceListenerCallback:\r\n' + req._bodyText);
                let data;
                try {
                    data = JSON.parse(req._bodyText);
                } catch(err) {
                    console.log(err.message)
                }
                if(data.state) {
                    console.log(data.state);
                    document.getElementById('callBtn').disabled = false;
                } else {
                    switch(data.type) {
                        case "offer":
                            this.handleOffer(data.offer);
                            break;
                        case "answer":
                            this.handleAnswer(data.answer);
                            break;
                        case "candidate":
                            this.handleCandidate(data.candidate);
                            break;
                        case "leave":
                            this.handleLeave();
                            break;
                        default:
                            break;
                    }
                }
            },
            joinGroup () {
                const options = {
                    method: 'post',
                    path: `/signalling-bridge/join/${this.group_id}/${this.group_id}`
                };
                let self = this;
                let request_client = this.endpoint.createClientRequest(options, res => {
                    if(res.ok) {
                        trace('Join group ok');
                        self.handleJoin();
                    } else {
                        trace('Join group error');
                    }
                });
                request_client.write(JSON.stringify({"prefix":"/pipeline/1","type":`Endpoint${this.endpoint_id}`}));
                request_client.end();
            },
            handleJoin() {
                //getting local video stream
                let self = this;
                let mediaObj = {"video": true};

                navigator.mediaDevices.getUserMedia(mediaObj).then(mediaHandler.bind(self)).catch(errorHandler);

                function mediaHandler(myStream) {
                    trace('Received local stream');
                    //displaying local video stream on the page
                    this.localVideo.srcObject = myStream;
                    this.localStream = myStream;

                    this.peer_connection = new RTCPeerConnection();


                    let self = this;
                    //setup stream listening
                    this.peer_connection.addStream(myStream);
/*                    let tracksNum = this.localStream.getTracks().length;
                    trace('trackNum: ' + tracksNum);
                    for(let i = 0; i < tracksNum; ++i) {
                        this.peer_connection.addTrack( this.localStream.getTracks()[i], this.localStream);
                    }*/
/*                    this.localStream.getTracks().forEach(
                        function(track) {
                            self.peer_connection.addTrack(
                                track,
                                self.localStream
                            );
                        });*/




                    //when a remote user adds a stream to the peer connection, we display it
                    this.peer_connection.onaddstream = (e) => {
                        document.querySelector('#remoteVideo').src = window.URL.createObjectURL(e.stream);
                    };
/*                    this.peer_connection.ontrack = (e) => {
                        if (self.remoteVideo.srcObject !== e.streams[0]) {
                            self.remoteVideo.srcObject = e.streams[0];
                            trace('received remote stream');
                        }
                    };*/

                    // Setup ice handling
                    this.peer_connection.onicecandidate = function (event) {
                        if (event.candidate) {
                            let msgObj = {
                                type: "candidate",
                                candidate: event.candidate
                            };
                            self.request(msgObj);
                        }

                    };

                    this.peer_connection.oniceconnectionstatechange = function (event) {
                        if(this.peer_connection) {
                            trace('ICE state: ' + this.peer_connection.iceConnectionState);
                            console.log('ICE state change event: ', event);
                        }
                    }.bind(this);
                }
                function errorHandler(err) {
                    trace(err);
                }
            },
            handleOffer(offer) {
                let self = this;
                trace('setRemoteDescription start');
                self.peer_connection.setRemoteDescription(offer).then(
                    () => {
                        trace('setRemoteDescription complete');
                        trace('createAnswer start');
                        self.peer_connection.createAnswer().then(
                            onCreateAnswerSuccess,
                            () => {
                                trace('Failed to create session description: ' + error.toString());
                            }
                        );
                    },
                    error => {
                        trace('Failed to set session description: ' + error.toString());
                    }
                );

                function onCreateAnswerSuccess(answer) {
                    self.peer_connection.setLocalDescription(answer);
                    trace('answer sdp: ' + answer.sdp);
                    let msgObj = {
                        type: "answer",
                        answer: answer
                    };

                    self.request(msgObj);
                }
            },
            //when we got an answer from a remote user
            handleAnswer(answer) {
                this.peer_connection.setRemoteDescription(answer);
            },
            //when we got an ice candidate from a remote user
            handleCandidate(candidate) {
                this.peer_connection.addIceCandidate(candidate);
            },
            createOffer() {
                let offerOptions = {
                    offerToReceiveAudio: 0,
                    offerToReceiveVideo: 0
                };
                let self = this;

                trace('createOffer start');
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
                    self.peer_connection.setLocalDescription(desc).then(
                        function() {
                            trace('setLocalDescription complete\n');
                            trace('offer sdp: ' + desc.sdp);

                            let msgObj = {
                                type: "offer",
                                offer: desc
                            };

                            self.request(msgObj);
                        },
                        error => {
                            trace('Failed to set session description: ' + error.toString());
                        }
                    );
                }
            },
            handUp() {
                const options = {
                    method: 'delete',
                    path: `/signalling-bridge/join/${this.group_id}/${this.group_id}`
                };
                let request_client = this.endpoint.createClientRequest(options, res => {
                    if(res.ok) {
                        console.log('handUp:' + res.statusText);
                    } else {
                        console.log('handUp:' + res.statusText);
                    }
                });
                request_client.end();
                this.handleLeave();
            },
            handleLeave() {
                document.querySelector('#remoteVideo').src = null;

                this.peer_connection.close();
                this.peer_connection = null;
            },
            request(msgObj) {
                const options = {
                    method: 'post',
                    path: `/signalling-bridge/media-description/${this.group_id}/${this.group_id}`
                };
                let request_client = this.endpoint.createClientRequest(options, res => {
                    if(res.ok) {
                        trace(`send ${msgObj.type} ok`);
                    } else {
                        trace(`send ${msgObj.type} error`);
                    }
                });
                request_client.write(JSON.stringify(msgObj));
                request_client.end();
            }
        }
    }
</script>

<style scoped>
    body {
        background: #eee;
        padding: 5% 0;
    }

    .call-page {
        position: relative;
        display: block;
        margin: 0 auto;
        width: 800px;
        height: 480px;
    }

    video {
        margin: 0 0 20px 0;
        width: calc(50% - 12px);
        background: black;
        border: 1px solid gray;
        float : left;
    }
    video#localVideo {
        margin: 0 20px 20px 0;
    }

    @media screen and (min-width: 730px) {
        video {
            height: 231px;
            width: calc(50% - 12px);
        }
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
    h1 {
        border-bottom: 1px solid #ccc;
        font-family: 'Roboto', sans-serif;
        font-weight: 500;
        margin: 0 0 0.8em 0;
        padding: 0 0 0.2em 0;
    }
</style>
