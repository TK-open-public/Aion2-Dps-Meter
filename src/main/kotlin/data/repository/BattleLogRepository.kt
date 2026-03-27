package com.tbread.data.repository

import com.tbread.entity.DpsLog

class BattleLogRepository {
    private val maxSize = 20
    private val storage = ArrayDeque<DpsLog>()

    fun save(data: DpsLog) {
        if (storage.size >= maxSize) {
            storage.removeFirst()
        }
        storage.addLast(data)
    }

    fun get(idx: Int): DpsLog? {
        return storage.elementAtOrNull(idx)
    }

    fun getAll(): List<DpsLog> {
        return storage.toList()
    }

    fun flush(){
        storage.clear()
    }
}