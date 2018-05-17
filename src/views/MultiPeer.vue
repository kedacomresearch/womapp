<template>
    <div id = "callPage" class = "call-page">
        <video id = "localVideo" autoplay></video>
        <video id = "remoteVideo" autoplay></video>

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
    export default {
        name: 'meeting-view',
        data() {
            return {
                groub_id: 0,
                peer_connection: null,
                endpoint_id: null,
                endpoint: null,
                stream: null,
            }
        },
        components: {},
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
                console.log('hostname: ' + hostname);
                const options = {
                    hostname: hostname,
                    port: port,
                    path: `/${this.endpoint_id}`
                };

                this.endpoint = new HttpWsConnection(options);
                let self = this;
                this.endpoint.onConnected = function () {
                    console.log(`${self.endpoint_id} connected to the signalling server!`);
                    self.endpoint.addServiceListener(self.serviceListenerCallback);
                    self.joinGroup();
                    self.createMPEndpoint();
                };
            },
            createMPEndpoint() {
                axios.post(`/mpendpoint/${this.group_id}/${this.endpoint_id}`)
                    .then(function (response) {
                        console.log(response);
                    })
                    .catch(function (error) {
                        console.log(error);
                    });
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
                } else {
                    switch(data.type) {
                        //when somebody wants to call us
                        case "offer":
                            this.handleOffer(data);
                            break;
                        case "answer":
                            this.handleAnswer(data);
                            break;
                        //when a remote peer sends an ice candidate to us
                        case "candidate":
                            this.handleCandidate(data);
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
                    path: `/signalling-bridge/join/${this.group_id}/${this.endpoint_id}`
                };
                let self = this;
                let request_client = this.endpoint.createClientRequest(options, res => {
                        if(res.ok) {
                        self.handleJoin();
                    } else {
                        console.log(res.statusText);
                    }
                });
                request_client.write(JSON.stringify({"prefix":"/pipeline/1","type":`Endpoint`}));
                request_client.end();
            },
            handleJoin() {
                console.log('handleJoin');
                //getting local video stream
                let self = this;
                let mediaObj = {"video": true, "audio": true};
                if (navigator.getUserMedia) { // WebRTC 1.0 standard compliant browser
                    mediaObj = {"video": true};
                    navigator.webkitGetUserMedia(mediaObj, mediaHandler.bind(self), errorHandler);
                } else if (navigator.mediaDevices.getUserMedia) { // early firefox webrtc implementation
                    mediaObj = {"video": true};
                    navigator.mediaDevices.getUserMedia(mediaObj).then(mediaHandler.bind(self)).catch(errorHandler)
                } else if (navigator.webkitGetUserMedia) { // early webkit webrtc implementation
                    mediaObj = {"video": true};
                    navigator.webkitGetUserMedia(mediaObj, mediaHandler.bind(self), errorHandler);
                } else {
                    console.log("This browser does not support WebRTC - visit WebRTC.org for more info");
                }

                function mediaHandler(myStream) {
                    this.stream = myStream;
                    //displaying local video stream on the page
                    document.querySelector('#localVideo').src = window.URL.createObjectURL(myStream);

                    //using Google public stun server
                    let configuration = {
                        "iceServers": [{"url": "stun:stun2.1.google.com:19302"}]
                    };

                    this.peer_connection = new RTCPeerConnection();

                    //setup stream listening
                    this.peer_connection.addStream(myStream);

                    //when a remote user adds a stream to the peer connection, we display it
                    this.peer_connection.onaddstream = (e) => {
                        document.querySelector('#remoteVideo').src = window.URL.createObjectURL(e.stream);
                    };
                    let self = this;
                    // Setup ice handling
                    this.peer_connection.onicecandidate = function (event) {
                        if (event.candidate) {
                            const options = {
                                method: 'post',
                                path: `/signalling-bridge/media-description/${self.group_id}/${self.endpoint_id}`
                            };
                            let request_client = self.endpoint.createClientRequest(options, res => {
                                if(res.ok) {
                                    console.log('onicecandidate ok:' + res.statusText);
                                } else {
                                    console.log('onicecandidate error:' + res.statusText);
                                }
                            });
                            request_client.write(JSON.stringify({
                                type: "candidate",
                                candidate: event.candidate
                            }));
                            request_client.end();
                        }

                    };
                }
                function errorHandler(err) {
                    console.log(err);
                }

            },
            handleOffer(offer) {
                this.peer_connection.setRemoteDescription(new RTCSessionDescription(offer));

                let self = this;
                //create an answer to an offer
                this.peer_connection.createAnswer(function (answer) {
                    self.peer_connection.setLocalDescription(answer);
                    const options = {
                        method: 'post',
                        path: `/signalling-bridge/media-description/${self.group_id}/${self.endpoint_id}`
                    };
                    let request_client = self.endpoint.createClientRequest(options, res => {
                        if(res.ok) {
                            console.log('handleOffer:' + res.statusText);
                        } else {
                            console.log('handleOffer:' + res.statusText);
                        }
                    });
                    request_client.write(JSON.stringify({
                        type: "answer",
                        answer: answer
                    }));
                    request_client.end();

                }, function (error) {
                    console.log("Error when creating an answer");
                });
            },
            //when we got an answer from a remote user
            handleAnswer(answer) {
                this.peer_connection.setRemoteDescription(new RTCSessionDescription(answer));
            },
            //when we got an ice candidate from a remote user
            handleCandidate(candidate) {
                this.peer_connection.addIceCandidate(new RTCIceCandidate(candidate));
            },
            createOffer() {
                let self = this;
                // create an offer
                var offerOptions = {
                    offerToReceiveAudio: 0,
                    offerToReceiveVideo: 1
                };
                this.peer_connection.createOffer(function (offer) {
                    self.peer_connection.setLocalDescription(offer).then( ()=> {
                        const options = {
                            method: 'post',
                            path: `/signalling-bridge/media-description/${self.group_id}/${self.endpoint_id}`
                        };
                        let request_client = self.endpoint.createClientRequest(options, res => {
                            if(res.ok) {
                                console.log('createOffer:' + res.statusText);
                            } else {
                                console.log('createOffer:' + res.statusText);
                            }
                        });
                        request_client.write(JSON.stringify({
                            type: "offer",
                            offer: offer
                        }));
                        request_client.end();
                    });

                }, function (error) {
                    console.log("Error when creating an offer");
                }, offerOptions);
            },
            handUp() {
                const options = {
                    method: 'delete',
                    path: `/signalling-bridge/join/${this.group_id}/${this.endpoint_id}`
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
                this.peer_connection.onicecandidate = null;
                this.peer_connection.onaddstream = null;
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

    #localVideo {
        width: 150px;
        height: 150px;
        position: absolute;
        top: 15px;
        right: 15px;
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
