// MatchEntry { 
//   SummonerName: String
//   OpponentName: String
//   SummonerWon: Boolean
//   DeckCode: String
//   CardList: {
//    CardCode: Int
//    ...
//   }
// }
//
// Given a cardCode and a corpus of match entries,
// find the win percentage of a card for each of its levels of inclusion in a deck.
// "Decks with 3 Ashes win X%, with 2 Ashes win Y%, etc."
//
// Input: CardCode interestedCard, List<MatchEntry> matchHistoryUniverse
// Output: Map<(CardCode, Int), (int, int)>
//    where key (CardCode, Int) is a given card and its count in the deck
//    and value (int, int) is number of wins and number of total played games.
//      Thus a card's win percentage is value.first()*100/value.second()


// MapReduce
// Call map(cardCode, matchEntry) in parallel for every matchEntry
//    map outputs { cardCode: (cardCount, gameWon) } for each matchEntry
//
// collect all results to create the following map:
//    { cardCode: [(cardCount,gameWon), ...] }
//
// Call reduce(cardCode, [(cardCount,gameWon), ...]) in parallel for each key
//    reduce outputs { (CardCode, CardCount): (WonGames, TotalGames) }
//
// Now we can quickly find out the win percentage for a given card and inclusion count!
// output[('Ashe', 3)] returns (3, 4). 75%!
// output[('Ashe', 2)] returns (2, 5). 40%!
// Play more Ashes in your deck! Precomputed for constant time results! Wow, such perform.

/**
 * More perf.
 * 
 * |List<MatchEntry> matchHistoryUniverse| = 1 billion.
 * 
 * map is called in parallel for each key
 *   map's key will be an integer, from 1 to 1000
 *   map's value will be a List<MatchEntry> with size 1 million
 * 
 * 1000 Map processes will emit 420 million records each 
 *    |batchOfMatchEntries| * |StaticData.CardList|
 * 
 * At the end of the Map step we will have 1000 * 420million = 420 billion records
 * Map's output is keyed by CardCode, and we know there are maximum 420 of those.
 * Thus, the 420 billion records would be shuffled to 420 Reduce processes.
 * 
 * Since each reducer is keyed by CardCode, they're going to 
 *    |StaticData.CardList| * |CardCountInDeck| = 420 * 4 = 1680 records
 * 
 * At the end of the Reduce step, 420 reducers will have created 1680 records.
 * One lookup per
 * 
 * 
 * 
 *  
 * ourMap(int k1, List<MatchEntry> batchOfMatchEntries) {
 *   for(matchEntry in batchOfMatchEntries) {
 *     for(CardCode in StaticData.CardList)) {
 *       cardCount = CardCode in this.CardList.keys() ? this.CardList.CardCode : 0;
 *       gameWon = matchEntry.SummonerWon;
 *       count = 1;
 *       emit(cardCode, (cardCount, gameWon, count));
 *     }
 *   }
 * }
 
 * 
 * map()
 */


/**
 * Math
 * |matchHistoryUniverse| ~= 1bn.
 * |StaticData.CardList| = 420
 * Max number a card can be included in a deck = 3, so 4 possible states: 0,1,2,3
 * |CardCountInDeck| = 4
 * 
 * map is called over matchHistoryUniverse in parallel.
 *    We can't have a billion async threads unfortunately.
 * map will emit one entry for each
 * reducers are run in parallel over
 */
function mapReduce(matchHistoryUniverse) {
  matchHistoryUniverse.map(
    function() {
      for(CardCode in StaticList.CardList) {
        var key = CardCode;
        var value = {
          cardCount: CardCode in this.CardList.keys() ? this.CardList.CardCode : 0,
          gameWon: this.SummonerWon,
          count: 1
        };
        emit(key, value);
      }
    }
  ).reduce(
    function(key, values){
      
    }
  );
}
// function mapReduce(matchHistoryUniverse) {
//   matchHistoryUniverse.map(
//     function() {
//       for(CardCode in this.CardList.keys()) {
//         var key = CardCode;
//         var value = {
//           cardCount: this.CardList.CardCode,
//           gameWon: this.SummonerWon
//         };
//         emit(key, value);
//       }
//     }
//   ).reduce(
//     function(key, values){
      
//     }
//   );
// }



function genTable(cardList, matchHistoryUniverse) {
  var results = {};
  for(cardCode in cardList) {
    results[cardCode] = mapReduce(cardCode, matchHistoryUniverse); // Async!
  }
  // wait for them all to finish
  // merge it all into one
  finalAnswer = {};
  for(cardCode in results) {
    finalAnswer.assign(result[cardCode]);
  }
  return finalAnswer;
}

function mapReduce(cardCode, matchHistoryUniverse) {
  cardCodeToCountWonTuple = matchHistoryUniverse
    .map(matchEntry => map(cardCode, matchEntry)) // async!
    .reduce(cardCode, [(matchEntry.CardList.CardCode, matchEntry.SummonerWon)]);
  return reduceResult;
}

function map(cardCode, matchEntry) {
  if (cardCode in matchEntry.CardList) {
    emit({cardCode: (matchEntry.CardList.CardCode, matchEntry.SummonerWon)});
  }
}

// input is CardCode and a List<(cardCount, gameWon)>
function reduce(cardCode, cardCountWinList) {
  // cardCount -> (winCount, lossCount)
  cardCountToStatsMaps = {}; // We assume that naive assignments default to 0

  for((cardCount, gameWon) in cardCountWinList) {
    if(gameWon){ 
      cardCountToStatsMaps[cardCount].wins += 1;
    } else {
      cardCountToStatsMaps[cardCount].losses += 1;
    }
  }

  for(cardCount in cardCountToStatsMaps.keys()) {
    winCount = cardCountToStatsMaps[cardCount].wins;
    lossCount = cardCountToStatsMaps[cardCount].losses;
    totalCount = winCount + lossCount;
  }
}

