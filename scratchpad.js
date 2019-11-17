import { emit } from "cluster";
import { emitKeypressEvents } from "readline";

// MatchEntry { 
//   SummonerName: String
//   OpponentName: String
//   SummonerWon: Boolean
//   DeckCode: String
//   CardList: {
//    CardCode: String
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
    emit({
      (cardCode, cardCount): (winCount, totalCount)
    });
  }
}