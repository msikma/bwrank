// bwrank <https://github.com/msikma/bwrank>
// © MIT license

import pick from 'lodash.pick'
import orderBy from 'lodash.orderby'

/**
 * Restructures the ladder match object.
 */
export function packLadderMatch(match) {
  const players = match.players
    .map(player => pick(player, ['playerIndex', 'team', 'race', 'toon', 'result']))
    .map(player => ({...player, isOpponent: player.toon !== match.requestedToon}))
  const friendlyPlayer = players.find(player => !player.isOpponent)

  return {
    matchTimestamp: match.timestamp,
    matchId: match.id,
    matchName: match.name,
    matchResult: friendlyPlayer.result,
    gameNetTurnRate: match.netTurnRate,
    gameSpeed: match.gameSpeed,
    gameMap: {...match.map},
    players
  }
}

/**
 * Returns a player's profile with a bunch of important information like rank and mmr.
 * 
 * Also includes the latest ladder match for the profile.
 */
export async function getProfileWithRank(rankings, profile, gateways) {
  const gateway = gateways.find(gateway => gateway.id === profile.gatewayId)
  const profileData = {
    toon: profile.toon,
    toonGuid: profile.toonGuid,
    toonGatewayRegion: gateway.region,
    toonGatewayId: profile.gatewayId,
    latestMatches: [],
    lastActivity: null,
    rankTier: null,
    rankMmr: null,
    gameWins: null,
    gameLosses: null,
    gameDisconnects: null,
    leaderboardId: null,
    leaderboardRank: null
  }
  const rankData = rankings.find(rank => rank.gatewayId === profile.gatewayId && rank.toon === profile.toon)

  // If the player is unranked, or if there's no rank data to be found, then return a mostly empty object.
  if (profile.ladderProfileData === 'PlayerIsUnranked' || rankData == null) {
    return {
      ...profileData,
      isActive: false,
      rankTier: 'u'
    }
  }

  // For every active profile (every profile that isn't unranked), fetch one match.
  // This is to see which profile was the most recently used.
  // That profile will then be used to display the most active rank.
  const ladderGames = await profile.ladderGames('1v1', 'current')
  const latestMatches = []
  for await (const match of ladderGames) {
    latestMatches.push(packLadderMatch(match))
  }
  const latestMatchesSorted = orderBy(latestMatches, ['matchTimestamp'], ['desc'])

  return {
    ...profileData,
    isActive: true,
    rankTier: rankData.tier.toLowerCase(),
    rankMmr: rankData.rating,
    gameWins: rankData.wins,
    gameLosses: rankData.losses,
    gameDisconnects: rankData.disconnects,
    latestMatches: latestMatchesSorted,
    lastActivity: latestMatchesSorted[0].matchTimestamp,
    leaderboardId: rankData.leaderboardId,
    leaderboardRank: rankData.rank
  }
}
