const azure = require('azure-storage')
const tableService = azure.createTableService()
const BoxSDK = require('box-node-sdk')
const JWT = process.env.JWT
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
const logicAppURL = "https://prod-22.japaneast.logic.azure.com:443/workflows/5480738687b04983a96f14567271c1ca/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Zaxg5luPEEXlaupbSw9-Pf1-EXnyXpeBZI4qlNnx_hY"
const APIManager = require('./api')

const tablename = "eventstream"
module.exports = async function (context, req) {

    let data = initEvents()

    context.log('JavaScript HTTP trigger function processed a request.')


    // let data = await getEvents(0)
    //     context.log(data)

    //    if (req.query.name || (req.body && req.body.name)) {
    context.res = {
        // status: 200, /* Defaults to 200 */
        // body: data.next_stream_position
        body: data
    };
};

function initEvents() {

    var query = new azure.TableQuery()
        .where('PartitionKey eq ?', 'part1');
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
        return "done"
    });
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
            });
            if (event.chunk_size !== 0) {
                APIManager.post(logicAppURL, null, event.entries)
            }
            // requestCall.post()
        })
}