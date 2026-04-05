package com.tbread.addon

interface PacketAddon {
    fun parse(packet: ByteArray, arrivedAt: Long)
    fun loggingServerTime(arrivedAt: Long, duration: Long, serverTime: Long)
}
