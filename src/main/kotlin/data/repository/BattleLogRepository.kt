package com.tbread.data.repository

import com.tbread.entity.DpsReport

class BattleLogRepository {
    private val storage = mutableListOf<DpsReport>()

    fun save(data: DpsReport) {
        storage.add(data)
    }

    fun get(idx: Int): DpsReport? {
        return storage[idx]
    }

    fun getAll(): List<DpsReport> {
        return storage
    }
}