package com.tbread.data.repository

class SummonRepository {
    private val storage = HashMap<Int, Int>()

    fun save(key: Int, value: Int): Int? {
        return storage.put(key, value)
    }

    fun get(id: Int): Int? {
        return storage[id]
    }

    fun getAll():HashMap<Int,Int>{
        return storage
    }

    fun exist(id: Int): Boolean {
        return storage.containsKey(id)
    }

    fun flush() {
        storage.clear()
    }
}