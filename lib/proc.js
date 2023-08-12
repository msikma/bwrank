// bwrank <https://github.com/msikma/bwrank>
// © MIT license

import {execToText} from './exec.js'

// String that matches against the StarCraft: Remastered process name.
const processNames = [
  // Darwin/macOS
  'StarCraft.app/Contents/MacOS/StarCraft'
]

/**
 * Runs 'ps aux' and filters the output to find the StarCraft process.
 * 
 * If found, it returns the PID as a number, or null otherwise.
 */
export const getStarCraftPid = async (procMatches = processNames) => {
  const procMatchesLc = procMatches.map(match => match.toLowerCase())
  const proc = (await execToText(['ps', 'aux']))
    .split('\n')
    .slice(1)
    .map(line => line.trim().split(/\s+/).map(segment => segment.trim()))
    .map(segments => ({user: segments[0], pid: segments[1], command: segments.slice(10).join(' ')}))
    .map(process => ({...process, match: procMatchesLc.map(name => process.command.toLowerCase().includes(name)).includes(true)}))
    .find(process => process.match)
  
  if (!proc) return null

  return Number(proc.pid)
}

/**
 * Returns an array of ports used by a given PID.
 */
const getStarCraftOpenPorts = async (pid) => {
  const ports = (await execToText(['lsof', '-aPi', '-p', pid])).trim()
    .split('\n')
    .slice(1)
    .filter(line => line.includes('(LISTEN)'))
    .map(line => line.trim().split(/\s+/).map(segment => segment.trim()))
    .map(segments => ({pid: segments[1], name: segments[8]}))
    .filter(port => port.name.includes('localhost'))
    .flatMap(port => port.name.match(/localhost:([0-9]+)/g).map(match => match.split(':')[1]))
    .map(port => Number(port))
  
  return [...new Set(ports)]
}

/**
 * Finds the StarCraft process ID and then finds the open port we need to use.
 * 
 * If StarCraft is not running, an object will be returned in which pid and port are both null.
 */
export const getStarCraftProcessInfo = async () => {
  const pid = await getStarCraftPid()

  // StarCraft does not seem to be running.
  if (!pid) {
    return {pid: null, port: null}
  }

  // Find the ports being used by the process.
  const ports = await getStarCraftOpenPorts(pid)
  // This will yield two ports, of which the lowest one is the correct one.
  const port = ports.sort()[0]

  return {pid, port}
}
