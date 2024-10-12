// bwrank <https://github.com/msikma/bwrank>
// © MIT license

import {ArgumentParser} from 'argparse'

export async function parseCli() {
  const parser = new ArgumentParser({
    description: `Fetches a StarCraft player's ladder rank from the BW internal API`
  })

  parser.add_argument('--get-player-profiles', {help: 'Fetches a player\'s profiles by a known toon', metavar: ['TOON', 'REGION'], nargs: 2})
  
  const args = {...parser.parse_args()}

  const BwRank = (await import('./index.js')).default
  const bwRank = await BwRank()

  if (args.get_player_profiles) {
    const res = await bwRank.getPlayerProfiles(...args.get_player_profiles)
    console.log(JSON.stringify(res, null, 2))
  }
}
