package com.tbread.entity

import java.util.UUID

data class TargetInfo(
    private val targetId: Int,
    private var damagedAmount: Long = 0L,
    private var targetDamageStarted: Long,
    private var targetDamageEnded: Long,
    private val processedUuid: MutableSet<UUID> = mutableSetOf(),
) {
    private data class DamageSample(val ts: Long, val damage: Long)

    private val recentDamageSamples = ArrayDeque<DamageSample>()
    private var recentDamageAmount: Long = 0L

    fun processedUuid(): MutableSet<UUID> {
        return processedUuid
    }

    fun damagedAmount(): Long {
        return damagedAmount
    }

    fun targetId(): Int {
        return targetId
    }

    fun processPdp(pdp: ParsedDamagePacket) {
        if (processedUuid.contains(pdp.getUuid())) return
        val damage = pdp.getDamage().toLong()
        damagedAmount += damage
        val ts = pdp.getTimeStamp()
        if (ts < targetDamageStarted) {
            targetDamageStarted = ts
        } else if (ts > targetDamageEnded) {
            targetDamageEnded = ts
        }
        recentDamageSamples.addLast(DamageSample(ts = ts, damage = damage))
        recentDamageAmount += damage
        processedUuid.add(pdp.getUuid())
    }

    fun parseBattleTime(): Long {
        return targetDamageEnded - targetDamageStarted
    }

    fun firstDamageTime(): Long {
        return targetDamageStarted
    }

    fun lastDamageTime(): Long {
        return targetDamageEnded
    }

    fun recentDamage(now: Long, windowMs: Long): Long {
        trimRecent(now, windowMs)
        return recentDamageAmount
    }

    fun recentWindowStart(now: Long, windowMs: Long): Long {
        trimRecent(now, windowMs)
        return recentDamageSamples.firstOrNull()?.ts ?: targetDamageEnded
    }

    private fun trimRecent(now: Long, windowMs: Long) {
        val minTs = now - windowMs
        while (recentDamageSamples.isNotEmpty() && recentDamageSamples.first().ts < minTs) {
            val removed = recentDamageSamples.removeFirst()
            recentDamageAmount -= removed.damage
            if (recentDamageAmount < 0L) {
                recentDamageAmount = 0L
            }
        }
    }
}
