package com.tbread.addon

object PacketAddonManager {
    private val addon: PacketAddon? by lazy { tryLoad() }

    private fun tryLoad(): PacketAddon? = try {
        val cls = Class.forName("com.tbread.addon.PacketAddonImpl")
        cls.getDeclaredConstructor().newInstance() as PacketAddon
    } catch (_: ClassNotFoundException) {
        null
    } catch (e: Exception) {
        println("[PacketAddonManager] load failed: ${e.message}")
        null
    }

    fun parse(packet: ByteArray, arrivedAt: Long) {
        addon?.parse(packet, arrivedAt)
    }

    fun loggingServerTime(arrivedAt: Long, duration: Long, serverTime: Long) {
        addon?.loggingServerTime(arrivedAt, duration, serverTime)
    }
}
