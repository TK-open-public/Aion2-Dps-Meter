package com.tbread.data.repository

class SkillRepository {
    private val storage = HashMap<Long, String>()

    fun save(key: Long, value: String): String? {
        return storage.put(key, value)
    }

    fun get(key: Long): String? {
        return storage[key]
    }


}