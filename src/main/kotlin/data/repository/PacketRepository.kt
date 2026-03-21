package com.tbread.data.repository

import com.tbread.entity.ParsedDamagePacket
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CopyOnWriteArrayList

class PacketRepository {
    private val storage = ConcurrentHashMap<Int, CopyOnWriteArrayList<ParsedDamagePacket>>()
    private var currentTarget = 0
    private var currentBattleStart = 0L
    private var currentBattleEnd = 0L

    fun save(pdp: ParsedDamagePacket) {
        storage.computeIfAbsent(pdp.getTargetId()) { CopyOnWriteArrayList() }
            .add(pdp)
    }

    fun get(id: Int): CopyOnWriteArrayList<ParsedDamagePacket>? {
        return storage[id]
    }

    fun getAll(): ConcurrentHashMap<Int, CopyOnWriteArrayList<ParsedDamagePacket>> {
        return storage
    }

    fun exist(id: Int): Boolean {
        return storage.containsKey(id)
    }

    fun flush() {
        storage.clear()
    }

    fun currentTarget(): Int {
        return currentTarget
    }

    fun currentTarget(targetId: Int): Int {
        val pastTarget = currentTarget
        currentTarget = targetId
        return pastTarget
    }

    fun flushBattleTime() {
        currentBattleStart = 0
        currentBattleEnd = 0
    }

    fun currentBattleStart(): Long {
        return currentBattleStart
    }

    fun currentBattleEnd(): Long {
        return currentBattleEnd
    }

    fun saveCurrentBattleStart() {
        currentBattleStart = System.currentTimeMillis()
    }

    fun saveCurrentBattleEnd(time: Long = System.currentTimeMillis()) {
        currentBattleEnd = time
    }
}