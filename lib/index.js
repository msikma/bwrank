// bwrank <https://github.com/msikma/bwrank>
// © MIT license

import orderBy from 'lodash.orderby'
import {createGravaticBooster} from './gb.js'
import {getProfileWithRank} from './data.js'

/**
 * Collection of abstractions around Gravatic Booster.
 */
async function BwRank() {
  const gb = await createGravaticBooster()

  /**
   * Returns all of the account's toons and ranks.
   * 
   * Requires a known toon and region.
   */
  const getPlayerProfiles = async (toon, region) => {
    const gateways = gb.gateways()
    const leaderboard = await getCurrentGlobalLeaderboard()
    const player = await gb.fullAccountMinusGameHistory(toon, {region})
    const rankings = await player.profiles[0].accountRankings(leaderboard.id)

    // Basic information about the profile.
    const playerData = {
      auroraId: player.auroraId,
      battleTag: player.battleTag,
      countryCode: player.countryCode,
      profiles: [],
      activeProfile: null
    }

    // Fetch rank data for every profile.
    const profiles = await Promise.all(player.profiles.map(profile => getProfileWithRank(rankings.rankings, profile, gateways)))
    const activeProfiles = profiles.filter(profile => profile.isActive)
    const inactiveProfiles = profiles.filter(profile => !profile.isActive)
    playerData.profiles = [...orderBy(activeProfiles, ['lastActivity'], ['desc']), ...inactiveProfiles]
    playerData.activeProfile = activeProfiles.length > 0 ? 0 : null  // Since we always sort by activity. Null if we have no active profiles at all.

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
    getPlayerProfiles
  }
}

export default BwRank
