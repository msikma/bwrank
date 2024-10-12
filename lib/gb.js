// bwrank <https://github.com/msikma/bwrank>
// © MIT license

import {SCApi, BroodWarConnection} from 'bw-web-api'
import {GravaticBooster, SCApiWithCaching, ResilientBroodWarConnection, StaticHostnameClientProvider, defaultCacheConfig} from 'gravatic-booster'
import {getStarCraftProcessInfo} from './proc.js'

/**
 * This returns a Gravatic Booster instance with our standard options.
 */
export async function createGravaticBooster() {
  // Since SCApi does not support Darwin, fetch the port manually.
  const {port} = await getStarCraftProcessInfo()

  if (!port) {
    throw new Error('not_running')
  }

  // Instantiate GravaticBooster using a static port.
  return GravaticBooster.create(
    new SCApiWithCaching(
      new SCApi(
        new ResilientBroodWarConnection(
          new BroodWarConnection(
            await new StaticHostnameClientProvider(`http://localhost:${port}`).provide()
          )
        )
      ),
      {
        // Use the default cache config, except for the match history.
        // The match history is problematic, since it does not always give timestamps,
        // so we're disabling it so we can retry it until we get all of the data.
        ...defaultCacheConfig,
        matchHistory: null
      }
    )
  )
}
