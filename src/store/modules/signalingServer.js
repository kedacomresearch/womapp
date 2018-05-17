import axios  from 'axios'

const state = {
    signalingServer: []
};

// 创建一个对象存储一系列我们接下来要写的 mutation 函数
const mutations = {
    setSignalingServer (state, payload) {
        console.log("payload.signalingServer:\r\n");
        console.log(payload.signalingServer);
        state.signalingServer = payload.signalingServer;
    }
};

// 创建一个对象存储一系列我们接下来要写的 actions 函数
const actions = {
    getSignalingServer ({ commit }, payload) {
        return new Promise((resolve, reject) => {
            axios.get('/webMedia/signalingServer/')
                .then(res => {
                    commit({
                        type: 'setSignalingServer',
                        signalingServer: res.data.signalingServer
                    });
                    resolve(res)
                }, err => {
                    reject(err)
                });
        })
    }
};

const getters = {
    getSignalingServer: (state, getters) => {
        return state.signalingServer
    }
};

export default {
    state,
    mutations,
    actions,
    getters
}
