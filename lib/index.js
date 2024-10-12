// bwrank <https://github.com/msikma/bwrank>
// © MIT license

import orderBy from 'lodash.orderby'
import {createGravaticBooster} from './gb.js'
import {getProfileWithRank, packPlayerData} from './data.js'

/**
 * Collection of abstractions around Gravatic Booster.
 */
async function BwRank() {
  const gb = await createGravaticBooster()

  /**
   * Returns gateways, leaderboard, and player (by toon).
   */
  const _getPlayerPrerequisites = async (toon, region) => {
    const gateways = gb.gateways()
    const leaderboard = await getCurrentGlobalLeaderboard()
    const player = await gb.fullAccountMinusGameHistory(toon, {region})

    const requestedGateway = gateways.find(gateway => gateway.region === region)

    return {gateways, requestedGateway, leaderboard, player}
  }

  /**
   * Returns the player's profiles with rank, and optionally matches.
   */
  const _getPlayerProfilesWithRank = async (rankings, gateways, profiles, {getMatches = false} = {}) => {
    const playerProfiles = await Promise.all(profiles.map(profile => getProfileWithRank(rankings.rankings, profile, gateways, {getMatches})))
    const activeProfiles = playerProfiles.filter(profile => profile.isActive)
    const inactiveProfiles = playerProfiles.filter(profile => !profile.isActive)

    return [
      [...orderBy(activeProfiles, ['lastActivity'], ['desc']), ...inactiveProfiles],
      activeProfiles.length > 0 ? 0 : null
    ]
  }

  /**
   * Returns all of the account's toons and ranks.
   * 
   * Requires a known toon and region.
   */
  const getPlayerToon = async (toon, region) => {
    const {gateways, requestedGateway, leaderboard, player} = await _getPlayerPrerequisites(toon, region)

    const profile = player.profiles.find(profile => profile.gatewayId === requestedGateway.id && profile.toon === toon)
    const rankings = await profile.accountRankings(leaderboard.id)
    const playerData = packPlayerData(player)
    const [profiles, activeProfile] = await _getPlayerProfilesWithRank(rankings, gateways, [profile], {getMatches: false})
    playerData.profiles = profiles
    playerData.activeProfile = activeProfile

    return playerData
  }

  /**
   * Returns all of the account's toons and ranks.
   * 
   * Requires a known toon and region.
   */
  const getPlayerProfiles = async (toon, region) => {
    const {gateways, leaderboard, player} = await _getPlayerPrerequisites(toon, region)

    const rankings = await player.profiles[0].accountRankings(leaderboard.id)
    const playerData = packPlayerData(player)
    const [profiles, activeProfile] = await _getPlayerProfilesWithRank(rankings, gateways, player.profiles, {getMatches: true})
    playerData.profiles = profiles
    playerData.activeProfile = activeProfile

    return playerData
  }

  /**
   * Returns data for the current global leaderboard.
   */
  const getCurrentGlobalLeaderboard = async () => {
    const season = await gb.currentSeason()
    const leaderboards = await gb.leaderboards()
    return leaderboards.find(leaderboard => leaderboard.seasonId === season && leaderboard.gateway.region === 'global')
  }

  return {
    gb,
    getCurrentGlobalLeaderboard,
    getPlayerToon,
    getPlayerProfiles
  }
}

export default BwRank
