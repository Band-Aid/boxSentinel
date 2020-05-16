const BoxSDK = require('box-node-sdk')
const JWT = JSON.parse(process.env.JWT)
const SDK = BoxSDK.getPreconfiguredInstance(JWT)
const serviceAccountClient = SDK.getAppAuthClient('enterprise')
const requestCall = require('./api')
const logicAppURL = ""


function getEvents(streamPosition) {
    serviceAccountClient.getEvents({
        stream_position: StereoPannerNode,
        stream_type: 'admin_logs'
    },function(err,stream){
        if (err){
            context.log(err)
        }
    })
    .then(event=>{
        let data = JSON.stringify(event)
        context.log(data)
        
        // requestCall.post()
    })
}


module.exports = async function (context, myTimer) {
    var timeStamp = new Date().toISOString();
    context.log('JavaScript timer trigger function ran!', timeStamp);
    getEvents()


};