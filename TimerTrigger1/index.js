const azure = require('azure-storage')
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
const tableService = azure.createTableService()
const tablename = "eventstream"

module.exports = async function (context, myTimer) {
    var timeStamp = new Date().toISOString();
    context.log('JavaScript timer trigger function ran!', timeStamp);
    initEvents()
};

function initEvents() {

    var query = new azure.TableQuery()
        .where('PartitionKey eq ?', 'part1')
    tableService.queryEntities(tablename, query, null, function (error, result, response) {
        if (!error) {

            let nextStraemPosition = result.entries[0].NEXTSTREAMPOSITION

            if (nextStraemPosition._ === null) {
                console.log('is null')
                GetEvents(0)
            }
            else {
                console.log(nextStraemPosition._)
                GetEvents(nextStraemPosition._)
            }
        }
    })
}

function GetEvents(steamPosition) {
    let data = serviceAccountClient.events.get({
        stream_position: steamPosition,
        stream_type: 'admin_logs'
    }, function (err, stream) {
        if (err) {
            context.log(err)
        }
    })
        .then(event => {
            console.log("the next stream position is " + event.next_stream_position)
            let nextStreamPosition = event.next_stream_position
            // console.log(event)
            let entity = {
                PartitionKey: 'part1',
                RowKey: 'row1',
                NEXTSTREAMPOSITION: nextStreamPosition
            };
            console.log(event.entries)
            tableService.insertOrReplaceEntity(tablename, entity, function (error, result, response) {
                if (!error) {

                }
            })
            //If event chunk is bigger than 0, out put to logicAPP for sentinel digestion
            if (event.chunk_size !== 0) {
                APIManager.post(logicAppURL, null, event.entries)
            }
        })
}