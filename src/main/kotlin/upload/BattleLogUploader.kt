package com.tbread.upload

import com.tbread.entity.DpsLog

interface BattleLogUploader {
    fun upload(log: DpsLog): Boolean
}
