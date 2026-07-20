import { NextResponse } from 'next/server'
import si from 'systeminformation'
import os from 'os'

export async function GET() {
  try {
    const mem = await si.mem()
    const cpu = await si.currentLoad()
    const fs = await si.fsSize()
    const net = await si.networkStats()

    const totalStorage = fs.reduce((acc, drive) => acc + drive.size, 0)
    const usedStorage = fs.reduce((acc, drive) => acc + drive.used, 0)

    const rxSec = net.reduce((acc, n) => acc + (n.rx_sec || 0), 0) // bytes/sec received
    const txSec = net.reduce((acc, n) => acc + (n.tx_sec || 0), 0) // bytes/sec transferred

    return NextResponse.json({
      cpu: {
        load: cpu.currentLoad,
        cores: os.cpus().length,
      },
      memory: {
        total: mem.total,
        used: mem.active, // active memory is a better representation than just used
        free: mem.available,
      },
      storage: {
        total: totalStorage,
        used: usedStorage,
        free: totalStorage - usedStorage,
      },
      network: {
        rx_sec: rxSec,
        tx_sec: txSec,
      },
      timestamp: Date.now()
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
