
const { QueueClient, QueueServiceClient } = require("@azure/storage-queue");
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const APIManager = require('./api')
const BoxSDK = require('box-node-sdk')
const SDK = new BoxSDK({
    clientID: process.env.clientID,
    clientSecret: process.env.clientSecret,
    appAuth: {
        keyID: process.env.keyID,
        privateKey: process.env.privateKey,
        passphrase: process.env.passphrase
    }
});
const serviceAccountClient = SDK.getAppAuthClient('enterprise', process.env.eid)
const logicAppURL = process.env.LOGICAPPURL
const queueServiceClient = QueueServiceClient.fromConnectionString(connectionString);
const queueClient = queueServiceClient.getQueueClient("nextstreamposition");


module.exports = async function (context, myTimer) {
    var timeStamp = new Date().toISOString();
    context.log('JavaScript timer trigger function ran!', timeStamp);
    initEvents()

}

async function initEvents() {


    var receivedMessages = await queueClient.receiveMessages();
    const firstMessage = receivedMessages.receivedMessageItems[0];
    if(typeof firstMessage === 'undefined')
    {
        GetEvents(0)
    }
    else{
        GetEvents(firstMessage.messageText)
    }
    


}
      

async function GetEvents(steamPosition) {
    let data1 = await serviceAccountClient.events.get({
        stream_position: steamPosition,
        stream_type: 'admin_logs_streaming'
    }, function (err, stream) {
        if (err) {
            context.log(err)
        }
    })
        .then(event => {
            console.log("the next stream position is " + event.next_stream_position)
            return event
            
        })
     await APIManager.post(logicAppURL, null, data1.entries)
     
  
    while(true){
        
        if(data1.chunk_size===0){
            await queueClient.sendMessage(data1.next_stream_position.toString())
            break
        }
        data1 = await serviceAccountClient.events.get({
            stream_position: data1.next_stream_position,
            stream_type: 'admin_logs_streaming'
        }, function (err, stream) {
            if (err) {
                context.log(err)
            }
        })
            .then(event => {
                console.log("the next stream position is " + event.next_stream_position)
                return event
                
            })
         await APIManager.post(logicAppURL, null, data1.entries)
      
    }
}