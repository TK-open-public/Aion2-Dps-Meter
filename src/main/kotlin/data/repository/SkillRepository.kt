package com.tbread.data.repository

import com.tbread.entity.Skill

class SkillRepository {
    private val storage = HashMap<Long, Skill>()

    fun save(key: Long, value: Skill) {
        storage[key] = value
    }

    fun get(key: Long): Skill? {
        return storage[key]
    }


}