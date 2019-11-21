//export our mongo Atlas key so we can connect to the DB
//DB connection string gets passed to Mongoose to connect to our Mongo DB
//API key can be appended to LoR REST calls as a query param ie: ?api_key = {key} OR
//as a header ie: "X-Riot-Token": {key}
//Riot API key is not needed.
module.exports = {
    altasURI: 'mongodb+srv://radmire:bSR06CiGspuyE2F1@lor-mhp-5riqw.azure.mongodb.net/test?retryWrites=true&w=majority',
    scaleGridURI: 'mongodb://admin:ku6ED5v6wRPz1sg1@SG-mhplus-27998.servers.mongodirector.com:27017/universe'
    //riotAPI: 'RGAPI-93e0d111-6c27-4b19-9fe7-33007720d1a6'
}