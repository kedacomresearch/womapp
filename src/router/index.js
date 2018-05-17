import Vue from 'vue'
import Router from 'vue-router'
import Main from '@/views/Main'
import CreateMeetingContent from '@/components/CreateMeetingContent'
import AddLiveStreamAudience from '@/components/AddLiveStreamAudience'
import QueryMeetingContent from '@/components/QueryMeetingContent'
import PageFooter from '@/components/PageFooter'
/*import MultiPeer from '@/views/MultiPeer'
import PeerToPeer from '@/views/PeerToPeer'*/
import single from '@/views/single'
//import PttView from '@/views/PttView'


Vue.use(Router);

export default new Router({
  routes: [
    {
        path: '/',
        redirect: '/createmeeting'
    },
    {
      path: '/createmeeting',
      name: 'Main',
      components: {
          default: Main,
          content: CreateMeetingContent,
          footer: PageFooter
      }
    },
    {
        path: '/querymeeting',
        name: 'Query',
        components: {
            default: Main,
            content: QueryMeetingContent,
            footer: PageFooter
        }
    },
    {
      path: '/addaudience/:id',
      name: 'addaudience',
      components: {
        default: Main,
        content: AddLiveStreamAudience,
        footer: PageFooter
      }
    },
    {
      path: '/wom/livestream/:id',
      name: 'Webrtc',
      components: {
        default: single
      }
    }
    /*,
    {
        path: '/meeting/peertopeer/:groupId',
        name: 'peertopeer',
        components: {
            default: PeerToPeer
        }
    },
    {
        path: '/meeting/multi/:groupId',
        name: 'multi',
        components: {
            default: Main,
            content: PttView
        }
    },
    {
        path: '/meeting/single/:groupId',
        name: 'single',
        components: {
            default: single
        }
    }*/
  ]
})
