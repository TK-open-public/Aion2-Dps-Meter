package com.tbread.data.repository

import com.tbread.entity.UseBuff

class UseBuffRepository {
    private val storage = HashMap<Int, MutableList<UseBuff>>()

    fun save(id: Int, useBuff: UseBuff) {
        storage.getOrPut(id) { mutableListOf() }.add(useBuff)
    }

    fun findOverlapping(id: Int, timestamp1: Long, timestamp2: Long): List<UseBuff> {
        return storage[id]?.filter { buff ->
            buff.buffStart <= timestamp2 && buff.buffEnd >= timestamp1
        } ?: emptyList()
    }


}