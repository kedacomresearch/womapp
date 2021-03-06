import {ab2str, str2ab} from './common'

var clientId = 1;

function ClientRequest(ws, req, cb) {
    this.request_id = clientId++;
    this.cb = cb;
    this.req = req;
    this.ws = ws;
    this.sent = false;
}

ClientRequest.prototype.getRequestId = function(){
    return this.request_id;
};

ClientRequest.prototype.onResponse = function _onMessage(data, res) {
    let str;
    if (typeof data === 'string') {
        str = data;
    } else if (data instanceof ArrayBuffer) {
        let buffer = data;
        str = ab2str(buffer);
    }
    if(this.cb && res) {
        this.cb(res);
        res.emit('data', str);
        res.emit('end');
    }
};

ClientRequest.prototype.write = function _write(data) {
    this.req.addBody(data);
};

ClientRequest.prototype.end = function _end(data) {
    if(this.sent) {
        throw new Error('Request can not be sent again!');
    }
    this.req.addBody(data);
    let request = this.req.constructHttpMessage();
    if (this.ws.readyState === WebSocket.OPEN){
        let buf = str2ab(request);
        let str = ab2str(buf);
        this.ws.send(request);
        this.sent = true;
    }
    else
    {
        throw new Error('Socket not opened');
    }
};

ClientRequest.prototype.getHeaders = function () {
    return this.req.getHeaders();
};

export default ClientRequest;
