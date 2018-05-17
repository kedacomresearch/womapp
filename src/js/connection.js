import Vue from 'vue'
import HttpWsConnection from '@/js/httpws/httpWsConnection'

var info = new Array();

info.push({name: 'peertopeer', desc:'gstreamer', groupId: 1});
info.push({name: 'remotepeer', desc:'gstreamer', groupId: 1});
info.push({name: 'multipeer', desc:'gstreamer', groupId: 1});

if(typeof(WebSocket) == "undefined") {
    alert("your browser not support WebSocket");
}

const hostname = '172.16.66.57';
const port = 8080;
/*const hostname = 'localhost';
const port = 8181;*/

const options = {
    hostname: hostname,
    port: port,
    path: '/endpoint10000'
};

let wsConnection = new HttpWsConnection(options);

wsConnection.onConnected = function () {
    console.log('endpoint10000 connected to signalling server!');
};


export {info, hostname, port};


