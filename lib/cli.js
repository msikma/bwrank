// bwrank <https://github.com/msikma/bwrank>
// © MIT license

import {ArgumentParser} from 'argparse'

export async function parseCli() {
  const parser = new ArgumentParser({
    description: `Fetches a StarCraft player's ladder rank from the BW internal API`
  })

  parser.add_argument('--player-profiles', {help: 'Fetches a player\'s profiles by a known toon', metavar: ['TOON', 'REGION'], nargs: 2})
  parser.add_argument('--toon', {help: 'Fetches a single known player toon', metavar: ['TOON', 'REGION'], nargs: 2})
  
  const args = {...parser.parse_args()}

  const BwRank = (await import('./index.js')).default
  const bwRank = await BwRank()

  if (args.player_profiles) {
    const res = await bwRank.getPlayerProfiles(...args.player_profiles)
    console.log(JSON.stringify(res, null, 2))
  }
  else if (args.toon) {
    const res = await bwRank.getPlayerToon(...args.toon)
    console.log(JSON.stringify(res, null, 2))
  }
}
