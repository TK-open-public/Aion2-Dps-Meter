package com.tbread.data.repository

import com.tbread.entity.Buff

class BuffRepository {
    private val storage = HashMap<Int, Buff>()

    fun save(value: Buff) {
        storage[value.code] = value
    }

    fun get(code: Int): Buff? {
        return storage[code]
    }



}